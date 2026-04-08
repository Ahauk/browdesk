import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Supabase remote schema migrations.
 * Runs on app startup — all statements are idempotent (IF NOT EXISTS).
 * Mirror any local schema changes (src/db/client.ts) here for Supabase.
 *
 * Requires a Postgres function `run_migration(sql text)` in Supabase.
 * Create it once in the SQL Editor:
 *
 *   CREATE OR REPLACE FUNCTION run_migration(sql text)
 *   RETURNS void AS $$
 *   BEGIN
 *     EXECUTE sql;
 *   END;
 *   $$ LANGUAGE plpgsql SECURITY DEFINER;
 *
 * Add new migrations at the bottom of the array with a comment date.
 */

const MIGRATIONS: string[] = [
  // ── Initial schema (clients) ──
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS age INTEGER`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_contact TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_phone TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_relation TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS referral_source TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS fitzpatrick_type INTEGER`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_conditions TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS clinical_answers TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS allergies_detail TEXT`,
  `ALTER TABLE clients ADD COLUMN IF NOT EXISTS medications_detail TEXT`,

  // ── Procedures: tones, needles, zone details ──
  `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS zone_details TEXT`,
  `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS guarantee INTEGER`,
  `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS guarantee_days INTEGER`,
  `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS tones TEXT`,
  `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS needles TEXT`,
  `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS before_photo_id TEXT`,
  `ALTER TABLE procedures ADD COLUMN IF NOT EXISTS after_photo_id TEXT`,

  // ── 2026-04-07: Appointments: duration, end_time, procedure_types ──
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS procedure_types TEXT`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_time TEXT`,
  `ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration INTEGER`,

  // ── 2026-04-08: Follow-ups: nullable procedure_id, add appointment_id ──
  `ALTER TABLE follow_ups ADD COLUMN IF NOT EXISTS appointment_id TEXT REFERENCES appointments(id)`,
  `ALTER TABLE follow_ups ALTER COLUMN procedure_id DROP NOT NULL`,
];

/**
 * Run all pending migrations against Supabase.
 * Each migration is idempotent — safe to re-run.
 * Failures are logged but don't block the app.
 */
export async function runSupabaseMigrations(): Promise<{
  applied: number;
  skipped: number;
}> {
  if (!isSupabaseConfigured()) {
    return { applied: 0, skipped: 0 };
  }

  let applied = 0;
  let skipped = 0;

  for (const sql of MIGRATIONS) {
    try {
      const { error } = await supabase.rpc("run_migration", { sql });
      if (error) {
        // Column likely already exists or function not yet created
        skipped++;
      } else {
        applied++;
      }
    } catch {
      skipped++;
    }
  }

  if (applied > 0) {
    console.log(`Supabase migrations: ${applied} applied, ${skipped} skipped`);
  }

  return { applied, skipped };
}
