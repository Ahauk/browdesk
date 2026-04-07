import { useState, useEffect, useCallback } from "react";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import {
  documentDirectory,
  copyAsync,
  makeDirectoryAsync,
  getInfoAsync,
  deleteAsync,
} from "expo-file-system/legacy";
import { db } from "@/db/client";
import { inspirations } from "@/db/schema";
import type { Inspiration, InspirationCategory } from "@/types/models";

const INSPO_DIR = `${documentDirectory}inspirations/`;

async function ensureDir() {
  const info = await getInfoAsync(INSPO_DIR);
  if (!info.exists) {
    await makeDirectoryAsync(INSPO_DIR, { intermediates: true });
  }
}

export function useInspirations(category?: InspirationCategory) {
  const [data, setData] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInspirations = useCallback(async () => {
    try {
      setLoading(true);
      const query = db.select().from(inspirations);
      const result = category
        ? await query
            .where(eq(inspirations.category, category))
            .orderBy(desc(inspirations.createdAt))
        : await query.orderBy(desc(inspirations.createdAt));
      setData(result as Inspiration[]);
    } catch (error) {
      console.error("Error fetching inspirations:", error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchInspirations();
  }, [fetchInspirations]);

  const addInspiration = useCallback(
    async (
      sourceUri: string,
      cat: InspirationCategory,
      caption?: string
    ): Promise<Inspiration | null> => {
      try {
        await ensureDir();
        const id = randomUUID();
        const ext = sourceUri.split(".").pop() || "jpg";
        const localUri = `${INSPO_DIR}${id}.${ext}`;
        await copyAsync({ from: sourceUri, to: localUri });

        const now = new Date().toISOString();
        const item: Inspiration = {
          id,
          category: cat,
          localUri,
          caption: caption || undefined,
          createdAt: now,
        };
        await db.insert(inspirations).values(item);
        await fetchInspirations();
        return item;
      } catch (error) {
        console.error("Error adding inspiration:", error);
        return null;
      }
    },
    [fetchInspirations]
  );

  const deleteInspiration = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const [item] = await db
          .select()
          .from(inspirations)
          .where(eq(inspirations.id, id))
          .limit(1);

        if (item) {
          const fileInfo = await getInfoAsync(item.localUri);
          if (fileInfo.exists) {
            await deleteAsync(item.localUri);
          }
          await db.delete(inspirations).where(eq(inspirations.id, id));
        }
        await fetchInspirations();
        return true;
      } catch (error) {
        console.error("Error deleting inspiration:", error);
        return false;
      }
    },
    [fetchInspirations]
  );

  return {
    inspirations: data,
    loading,
    refresh: fetchInspirations,
    addInspiration,
    deleteInspiration,
  };
}
