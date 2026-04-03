import { useState, useEffect, useCallback } from "react";
import { eq, like, or, desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { db } from "@/db/client";
import { clients } from "@/db/schema";
import type { Client } from "@/types/models";

export function useClients() {
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const result = await db
        .select()
        .from(clients)
        .orderBy(desc(clients.updatedAt));
      setData(result as Client[]);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const searchClients = useCallback(async (query: string) => {
    if (!query.trim()) {
      return fetchClients();
    }
    try {
      const pattern = `%${query}%`;
      const result = await db
        .select()
        .from(clients)
        .where(
          or(
            like(clients.firstName, pattern),
            like(clients.lastName, pattern),
            like(clients.phone, pattern)
          )
        )
        .orderBy(desc(clients.updatedAt));
      setData(result as Client[]);
    } catch (error) {
      console.error("Error searching clients:", error);
    }
  }, [fetchClients]);

  const getClient = useCallback(async (id: string): Promise<Client | null> => {
    try {
      const result = await db
        .select()
        .from(clients)
        .where(eq(clients.id, id))
        .limit(1);
      return (result[0] as Client) || null;
    } catch (error) {
      console.error("Error getting client:", error);
      return null;
    }
  }, []);

  const createClient = useCallback(
    async (
      input: Omit<Client, "id" | "createdAt" | "updatedAt" | "syncedAt">
    ): Promise<Client | null> => {
      try {
        const now = new Date().toISOString();
        const newClient = {
          id: randomUUID(),
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          email: input.email ?? null,
          notes: input.notes ?? null,
          allergies: input.allergies ?? null,
          conditions: input.conditions ?? null,
          diabetes: input.diabetes ?? false,
          pregnancy: input.pregnancy ?? false,
          hypertension: input.hypertension ?? false,
          avatarUri: input.avatarUri ?? null,
          createdAt: now,
          updatedAt: now,
          syncedAt: null,
        };
        await db.insert(clients).values(newClient);
        await fetchClients();
        return { ...newClient, syncedAt: undefined } as unknown as Client;
      } catch (error) {
        console.error("Error creating client:", error);
        return null;
      }
    },
    [fetchClients]
  );

  const updateClient = useCallback(
    async (
      id: string,
      input: Partial<Omit<Client, "id" | "createdAt" | "syncedAt">>
    ): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await db
          .update(clients)
          .set({ ...input, updatedAt: now, syncedAt: undefined })
          .where(eq(clients.id, id));
        await fetchClients();
        return true;
      } catch (error) {
        console.error("Error updating client:", error);
        return false;
      }
    },
    [fetchClients]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await db.delete(clients).where(eq(clients.id, id));
        await fetchClients();
        return true;
      } catch (error) {
        console.error("Error deleting client:", error);
        return false;
      }
    },
    [fetchClients]
  );

  const count = data.length;

  return {
    clients: data,
    loading,
    count,
    refresh: fetchClients,
    searchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
  };
}
