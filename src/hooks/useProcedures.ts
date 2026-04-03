import { useState, useEffect, useCallback } from "react";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "@/db/client";
import { procedures } from "@/db/schema";
import type { Procedure } from "@/types/models";

export function useProcedures(clientId?: string) {
  const [data, setData] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProcedures = useCallback(async () => {
    try {
      setLoading(true);
      const query = db.select().from(procedures);
      const result = clientId
        ? await query
            .where(eq(procedures.clientId, clientId))
            .orderBy(desc(procedures.date))
        : await query.orderBy(desc(procedures.date));
      setData(result as Procedure[]);
    } catch (error) {
      console.error("Error fetching procedures:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const createProcedure = useCallback(
    async (
      input: Omit<Procedure, "id" | "createdAt" | "updatedAt" | "syncedAt">
    ): Promise<Procedure | null> => {
      try {
        const now = new Date().toISOString();
        const newProcedure: Procedure = {
          ...input,
          id: randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        await db.insert(procedures).values(newProcedure);
        await fetchProcedures();
        return newProcedure;
      } catch (error) {
        console.error("Error creating procedure:", error);
        return null;
      }
    },
    [fetchProcedures]
  );

  const getRecentProcedures = useCallback(
    async (limit: number = 5): Promise<Procedure[]> => {
      try {
        const result = await db
          .select()
          .from(procedures)
          .orderBy(desc(procedures.date))
          .limit(limit);
        return result as Procedure[];
      } catch (error) {
        console.error("Error getting recent procedures:", error);
        return [];
      }
    },
    []
  );

  return {
    procedures: data,
    loading,
    refresh: fetchProcedures,
    createProcedure,
    getRecentProcedures,
  };
}
