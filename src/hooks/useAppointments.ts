import { useState, useEffect, useCallback } from "react";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { db } from "@/db/client";
import { appointments } from "@/db/schema";
import type { Appointment } from "@/types/models";

export function useAppointments() {
  const [data, setData] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const result = await db
        .select()
        .from(appointments)
        .orderBy(desc(appointments.date));
      const all = result as Appointment[];
      setData(all);

      const today = dayjs().format("YYYY-MM-DD");
      setTodayAppointments(
        all.filter(
          (a) => a.date === today && a.status === "scheduled"
        )
      );
      setUpcomingAppointments(
        all.filter(
          (a) => a.date > today && a.status === "scheduled"
        )
      );
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const createAppointment = useCallback(
    async (
      input: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "syncedAt">
    ): Promise<Appointment | null> => {
      try {
        const now = new Date().toISOString();
        const newAppointment: Appointment = {
          ...input,
          id: uuid(),
          createdAt: now,
          updatedAt: now,
        };
        await db.insert(appointments).values(newAppointment);
        await fetchAppointments();
        return newAppointment;
      } catch (error) {
        console.error("Error creating appointment:", error);
        return null;
      }
    },
    [fetchAppointments]
  );

  const updateAppointmentStatus = useCallback(
    async (id: string, status: Appointment["status"]): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await db
          .update(appointments)
          .set({ status, updatedAt: now, syncedAt: undefined })
          .where(eq(appointments.id, id));
        await fetchAppointments();
        return true;
      } catch (error) {
        console.error("Error updating appointment:", error);
        return false;
      }
    },
    [fetchAppointments]
  );

  const todayCount = todayAppointments.length;

  return {
    appointments: data,
    todayAppointments,
    upcomingAppointments,
    todayCount,
    loading,
    refresh: fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
  };
}
