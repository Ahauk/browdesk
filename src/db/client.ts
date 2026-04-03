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
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      notes TEXT,
      allergies TEXT,
      conditions TEXT,
      diabetes INTEGER NOT NULL DEFAULT 0,
      pregnancy INTEGER NOT NULL DEFAULT 0,
      hypertension INTEGER NOT NULL DEFAULT 0,
      avatar_uri TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS procedures (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      type TEXT NOT NULL,
      technique TEXT NOT NULL,
      cost REAL NOT NULL,
      notes TEXT,
      date TEXT NOT NULL,
      follow_up_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      procedure_id TEXT NOT NULL REFERENCES procedures(id),
      client_id TEXT NOT NULL REFERENCES clients(id),
      type TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      remote_url TEXT,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
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
      procedure_id TEXT NOT NULL REFERENCES procedures(id),
      client_id TEXT NOT NULL REFERENCES clients(id),
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      avatar_uri TEXT,
      biometric_enabled INTEGER NOT NULL DEFAULT 1,
      pin_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}
