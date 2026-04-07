import {
  documentDirectory,
  writeAsStringAsync,
  EncodingType,
} from "expo-file-system/legacy";
import { shareAsync } from "expo-sharing";
import { db } from "@/db/client";
import { clients, procedures, photos, appointments, followUps } from "@/db/schema";

const BACKUP_DIR = `${documentDirectory}backups/`;

export async function exportBackup(): Promise<boolean> {
  try {
    // Fetch all data
    const [
      allClients,
      allProcedures,
      allPhotos,
      allAppointments,
      allFollowUps,
    ] = await Promise.all([
      db.select().from(clients),
      db.select().from(procedures),
      db.select().from(photos),
      db.select().from(appointments),
      db.select().from(followUps),
    ]);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        clients: allClients,
        procedures: allProcedures,
        photos: allPhotos,
        appointments: allAppointments,
        followUps: allFollowUps,
      },
      counts: {
        clients: allClients.length,
        procedures: allProcedures.length,
        photos: allPhotos.length,
        appointments: allAppointments.length,
        followUps: allFollowUps.length,
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const date = new Date().toISOString().split("T")[0];
    const filePath = `${documentDirectory}browdesk-backup-${date}.json`;

    await writeAsStringAsync(filePath, json, {
      encoding: EncodingType.UTF8,
    });

    await shareAsync(filePath, {
      mimeType: "application/json",
      dialogTitle: "Exportar respaldo BrowDesk",
      UTI: "public.json",
    });

    return true;
  } catch (error) {
    console.error("Error exporting backup:", error);
    return false;
  }
}
