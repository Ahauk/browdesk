import { useState, useEffect, useCallback } from "react";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { db } from "@/db/client";
import { followUps } from "@/db/schema";
import type { FollowUp } from "@/types/models";

export function useFollowUps(clientId?: string) {
  const [data, setData] = useState<FollowUp[]>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const query = db.select().from(followUps);
      const result = clientId
        ? await query
            .where(eq(followUps.clientId, clientId))
            .orderBy(desc(followUps.dueDate))
        : await query.orderBy(desc(followUps.dueDate));
      const all = result as FollowUp[];
      setData(all);
      setPendingFollowUps(all.filter((f) => f.status === "pending"));
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const createFollowUp = useCallback(
    async (
      input: Omit<FollowUp, "id" | "createdAt" | "updatedAt" | "syncedAt">
    ): Promise<FollowUp | null> => {
      try {
        const now = new Date().toISOString();
        const newFollowUp: FollowUp = {
          ...input,
          id: uuid(),
          createdAt: now,
          updatedAt: now,
        };
        await db.insert(followUps).values(newFollowUp);
        await fetchFollowUps();
        return newFollowUp;
      } catch (error) {
        console.error("Error creating follow-up:", error);
        return null;
      }
    },
    [fetchFollowUps]
  );

  const markCompleted = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await db
          .update(followUps)
          .set({ status: "completed", updatedAt: now, syncedAt: undefined })
          .where(eq(followUps.id, id));
        await fetchFollowUps();
        return true;
      } catch (error) {
        console.error("Error completing follow-up:", error);
        return false;
      }
    },
    [fetchFollowUps]
  );

  const pendingCount = pendingFollowUps.length;

  return {
    followUps: data,
    pendingFollowUps,
    pendingCount,
    loading,
    refresh: fetchFollowUps,
    createFollowUp,
    markCompleted,
  };
}
