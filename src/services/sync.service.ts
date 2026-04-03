import { eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  clients,
  procedures,
  photos,
  appointments,
  followUps,
} from "@/db/schema";
import { supabase, isSupabaseConfigured } from "./supabase";

type SyncResult = {
  success: boolean;
  synced: number;
  errors: number;
};

// Fields that exist only locally and should NOT be sent to Supabase
const LOCAL_ONLY_FIELDS = new Set(["syncedAt", "synced_at"]);

// Convert camelCase JS keys to snake_case for Supabase, removing local-only fields
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (LOCAL_ONLY_FIELDS.has(key)) continue;
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (LOCAL_ONLY_FIELDS.has(snakeKey)) continue;
    result[snakeKey] = value;
  }
  return result;
}

async function syncTable(
  localTable: typeof clients | typeof procedures | typeof appointments | typeof followUps,
  remoteTableName: string
): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  const unsynced = await db
    .select()
    .from(localTable)
    .where(isNull(localTable.syncedAt));

  for (const record of unsynced) {
    try {
      const snakeRecord = toSnakeCase(record as Record<string, unknown>);
      const { error } = await supabase
        .from(remoteTableName)
        .upsert(snakeRecord, { onConflict: "id" });

      if (error) {
        console.error(`Sync error for ${remoteTableName}:`, error);
        errors++;
        continue;
      }

      const now = new Date().toISOString();
      await db
        .update(localTable)
        .set({ syncedAt: now })
        .where(eq((localTable as typeof clients).id, (record as { id: string }).id));

      synced++;
    } catch (error) {
      console.error(`Sync exception for ${remoteTableName}:`, error);
      errors++;
    }
  }

  return { synced, errors };
}

export async function syncAll(): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, synced: 0, errors: 0 };
  }

  let totalSynced = 0;
  let totalErrors = 0;

  const tables = [
    { local: clients, remote: "clients" },
    { local: procedures, remote: "procedures" },
    { local: appointments, remote: "appointments" },
    { local: followUps, remote: "follow_ups" },
  ] as const;

  for (const { local, remote } of tables) {
    const result = await syncTable(local as typeof clients, remote);
    totalSynced += result.synced;
    totalErrors += result.errors;
  }

  // Sync photos metadata
  try {
    const unsyncedPhotos = await db
      .select()
      .from(photos)
      .where(isNull(photos.syncedAt));

    for (const photo of unsyncedPhotos) {
      const { error } = await supabase
        .from("photos")
        .upsert(toSnakeCase(photo as Record<string, unknown>), { onConflict: "id" });

      if (!error) {
        const now = new Date().toISOString();
        await db
          .update(photos)
          .set({ syncedAt: now })
          .where(eq(photos.id, photo.id));
        totalSynced++;
      } else {
        totalErrors++;
      }
    }
  } catch (error) {
    console.error("Photo sync error:", error);
    totalErrors++;
  }

  return {
    success: totalErrors === 0,
    synced: totalSynced,
    errors: totalErrors,
  };
}

export async function syncPhotosToStorage(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  let uploaded = 0;

  try {
    const unsyncedPhotos = await db
      .select()
      .from(photos)
      .where(isNull(photos.remoteUrl));

    for (const photo of unsyncedPhotos) {
      try {
        const response = await fetch(photo.localUri);
        const blob = await response.blob();
        const path = `${photo.clientId}/${photo.procedureId}/${photo.id}.jpg`;

        const { error } = await supabase.storage
          .from("photos")
          .upload(path, blob, { contentType: "image/jpeg" });

        if (!error) {
          const { data } = supabase.storage
            .from("photos")
            .getPublicUrl(path);

          await db
            .update(photos)
            .set({ remoteUrl: data.publicUrl })
            .where(eq(photos.id, photo.id));

          uploaded++;
        }
      } catch (error) {
        console.error("Photo upload error:", error);
      }
    }
  } catch (error) {
    console.error("Photo storage sync error:", error);
  }

  return uploaded;
}
