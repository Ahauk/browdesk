import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DB_NAME = "browdesk.db";

const expoDb = openDatabaseSync(DB_NAME, { enableChangeListener: true });

export const db = drizzle(expoDb, { schema });

export async function initializeDatabase(): Promise<void> {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      age INTEGER,
      address TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      emergency_relation TEXT,
      referral_source TEXT,
      fitzpatrick_type INTEGER,
      medical_conditions TEXT,
      clinical_answers TEXT,
      allergies_detail TEXT,
      medications_detail TEXT,
      notes TEXT,
      avatar_uri TEXT,
      allergies TEXT,
      conditions TEXT,
      diabetes INTEGER NOT NULL DEFAULT 0,
      pregnancy INTEGER NOT NULL DEFAULT 0,
      hypertension INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS procedures (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      client_id TEXT NOT NULL REFERENCES clients(id),
      type TEXT NOT NULL,
      technique TEXT NOT NULL,
      zone_details TEXT,
      cost REAL NOT NULL,
      guarantee INTEGER,
      guarantee_days INTEGER,
      notes TEXT,
      date TEXT NOT NULL,
      follow_up_date TEXT,
      before_photo_id TEXT,
      after_photo_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      procedure_id TEXT,
      client_id TEXT NOT NULL REFERENCES clients(id),
      type TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      remote_url TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      client_id TEXT NOT NULL REFERENCES clients(id),
      procedure_type TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      procedure_id TEXT REFERENCES procedures(id),
      appointment_id TEXT REFERENCES appointments(id),
      client_id TEXT NOT NULL REFERENCES clients(id),
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS inspirations (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      category TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      caption TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      category_key TEXT NOT NULL,
      pricing_type TEXT NOT NULL,
      price REAL,
      package_price REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      label TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      studio_name TEXT,
      logo_uri TEXT,
      email TEXT,
      avatar_uri TEXT,
      biometric_enabled INTEGER NOT NULL DEFAULT 1,
      pin_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Add new columns to existing tables (safe ALTER — ignores if already exists)
  const newClientColumns = [
    "age INTEGER",
    "address TEXT",
    "emergency_contact TEXT",
    "emergency_phone TEXT",
    "emergency_relation TEXT",
    "referral_source TEXT",
    "fitzpatrick_type INTEGER",
    "medical_conditions TEXT",
    "clinical_answers TEXT",
    "allergies_detail TEXT",
    "medications_detail TEXT",
  ];
  for (const col of newClientColumns) {
    try {
      expoDb.execSync(`ALTER TABLE clients ADD COLUMN ${col}`);
    } catch {
      // Column already exists
    }
  }

  const newAppointmentColumns = [
    "procedure_types TEXT",
    "end_time TEXT",
    "duration INTEGER",
  ];
  for (const col of newAppointmentColumns) {
    try {
      expoDb.execSync(`ALTER TABLE appointments ADD COLUMN ${col}`);
    } catch {
      // Column already exists
    }
  }

  // Rebuild follow_ups table: make procedure_id nullable, add appointment_id
  try {
    expoDb.execSync(`ALTER TABLE follow_ups ADD COLUMN appointment_id TEXT`);
  } catch {
    // Column already exists
  }
  try {
    // Rebuild to remove NOT NULL from procedure_id (SQLite limitation)
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS follow_ups_new (
        id TEXT PRIMARY KEY,
        procedure_id TEXT REFERENCES procedures(id),
        appointment_id TEXT REFERENCES appointments(id),
        client_id TEXT NOT NULL REFERENCES clients(id),
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT
      );
      INSERT OR IGNORE INTO follow_ups_new
        SELECT id, procedure_id, appointment_id, client_id, due_date, status, notes, created_at, updated_at, synced_at
        FROM follow_ups;
      DROP TABLE follow_ups;
      ALTER TABLE follow_ups_new RENAME TO follow_ups;
    `);
  } catch {
    // Migration already applied or table already correct
  }

  // Calendar sync columns
  const calendarColumns = [
    { table: "appointments", col: "calendar_event_id TEXT" },
    { table: "user_profile", col: "calendar_sync_enabled INTEGER NOT NULL DEFAULT 0" },
  ];
  for (const { table, col } of calendarColumns) {
    try {
      expoDb.execSync(`ALTER TABLE ${table} ADD COLUMN ${col}`);
    } catch {
      // Column already exists
    }
  }

  const newProcColumns = [
    "zone_details TEXT",
    "guarantee INTEGER",
    "guarantee_days INTEGER",
    "tones TEXT",
    "needles TEXT",
    "before_photo_id TEXT",
    "after_photo_id TEXT",
  ];
  for (const col of newProcColumns) {
    try {
      expoDb.execSync(`ALTER TABLE procedures ADD COLUMN ${col}`);
    } catch {
      // Column already exists
    }
  }

  // ── Multi-tenant: user_id on every table (Supabase auth.uid()) ──
  const userScopedTables = [
    "clients",
    "procedures",
    "photos",
    "appointments",
    "follow_ups",
    "inspirations",
    "user_profile",
  ];
  for (const table of userScopedTables) {
    try {
      expoDb.execSync(`ALTER TABLE ${table} ADD COLUMN user_id TEXT`);
    } catch {
      // Column already exists
    }
  }

  // ── White-label branding on the profile ──
  const profileBrandingColumns = [
    "studio_name TEXT",
    "logo_uri TEXT",
    "treatment TEXT",
  ];
  for (const col of profileBrandingColumns) {
    try {
      expoDb.execSync(`ALTER TABLE user_profile ADD COLUMN ${col}`);
    } catch {
      // Column already exists
    }
  }
}

/**
 * Assign a cloud user_id to every local row that doesn't have one yet.
 * Runs once on first sign-in so pre-existing (single-user) data becomes
 * owned by the authenticated account and passes Supabase RLS on sync.
 */
export function backfillUserId(userId: string): void {
  const tables = [
    "clients",
    "procedures",
    "photos",
    "appointments",
    "follow_ups",
    "inspirations",
    "services",
    "service_categories",
    "user_profile",
  ];
  for (const table of tables) {
    try {
      expoDb.runSync(
        `UPDATE ${table} SET user_id = ? WHERE user_id IS NULL`,
        userId
      );
    } catch (error) {
      console.error(`backfillUserId failed for ${table}:`, error);
    }
  }
}

/**
 * Wipe all local data. Called on sign-out so a different professional
 * signing in on the same device starts with a clean slate (one account
 * per device). Rows are re-hydrated from Supabase by the pull sync.
 */
export function wipeLocalData(): void {
  const tables = [
    "follow_ups",
    "appointments",
    "photos",
    "procedures",
    "clients",
    "inspirations",
    "services",
    "service_categories",
    "user_profile",
  ];
  for (const table of tables) {
    try {
      expoDb.runSync(`DELETE FROM ${table}`);
    } catch (error) {
      console.error(`wipeLocalData failed for ${table}:`, error);
    }
  }
}
