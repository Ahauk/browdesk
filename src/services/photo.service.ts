import * as ImagePicker from "expo-image-picker";
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  deleteAsync,
} from "expo-file-system/legacy";
import { v4 as uuid } from "uuid";
import { db } from "@/db/client";
import { photos } from "@/db/schema";
import type { Photo, PhotoType } from "@/types/models";

const PHOTOS_DIR = `${documentDirectory}photos/`;

async function ensurePhotosDir() {
  const dirInfo = await getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function pickPhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function savePhoto(
  sourceUri: string,
  clientId: string,
  procedureId: string,
  type: PhotoType
): Promise<Photo | null> {
  try {
    await ensurePhotosDir();

    const photoId = uuid();
    const extension = sourceUri.split(".").pop() || "jpg";
    const localUri = `${PHOTOS_DIR}${photoId}.${extension}`;

    await copyAsync({ from: sourceUri, to: localUri });

    const now = new Date().toISOString();
    const photo: Photo = {
      id: photoId,
      procedureId,
      clientId,
      type,
      localUri,
      createdAt: now,
    };

    await db.insert(photos).values(photo);
    return photo;
  } catch (error) {
    console.error("Error saving photo:", error);
    return null;
  }
}

export async function getPhotosForProcedure(
  procedureId: string
): Promise<Photo[]> {
  try {
    const { eq } = await import("drizzle-orm");
    const result = await db
      .select()
      .from(photos)
      .where(eq(photos.procedureId, procedureId));
    return result as Photo[];
  } catch (error) {
    console.error("Error getting photos:", error);
    return [];
  }
}

export async function getPhotosForClient(clientId: string): Promise<Photo[]> {
  try {
    const { eq } = await import("drizzle-orm");
    const result = await db
      .select()
      .from(photos)
      .where(eq(photos.clientId, clientId));
    return result as Photo[];
  } catch (error) {
    console.error("Error getting client photos:", error);
    return [];
  }
}

export async function deletePhoto(photoId: string): Promise<boolean> {
  try {
    const { eq } = await import("drizzle-orm");
    const [photo] = await db
      .select()
      .from(photos)
      .where(eq(photos.id, photoId))
      .limit(1);

    if (photo) {
      const fileInfo = await getInfoAsync(photo.localUri);
      if (fileInfo.exists) {
        await deleteAsync(photo.localUri);
      }
      await db.delete(photos).where(eq(photos.id, photoId));
    }

    return true;
  } catch (error) {
    console.error("Error deleting photo:", error);
    return false;
  }
}
