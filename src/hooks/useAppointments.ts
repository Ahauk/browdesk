import { useState, useEffect, useCallback } from "react";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { db } from "@/db/client";
import { appointments } from "@/db/schema";
import { scheduleAppointmentReminder } from "@/services/notification.service";
import type { Appointment } from "@/types/models";

dayjs.extend(customParseFormat);

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
          id: randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        await db.insert(appointments).values(newAppointment);

        // Schedule notification 1 hour before
        try {
          const aptDateTime = dayjs(`${input.date} ${input.time}`, "YYYY-MM-DD HH:mm");
          const reminderDate = aptDateTime.subtract(1, "hour").toDate();
          if (reminderDate > new Date()) {
            await scheduleAppointmentReminder(
              "Cita en 1 hora",
              `${input.time} — ${input.procedureType || "Cita"}`,
              reminderDate
            );
          }
        } catch {
          // Notification failure shouldn't block appointment creation
        }

        await fetchAppointments();
        return newAppointment;
      } catch (error) {
        console.error("Error creating appointment:", error);
        return null;
      }
    },
    [fetchAppointments]
  );

  const updateAppointment = useCallback(
    async (
      id: string,
      input: Partial<Omit<Appointment, "id" | "createdAt" | "syncedAt">>
    ): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        await db
          .update(appointments)
          .set({ ...input, updatedAt: now, syncedAt: undefined })
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

  const deleteAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await db.delete(appointments).where(eq(appointments.id, id));
        await fetchAppointments();
        return true;
      } catch (error) {
        console.error("Error deleting appointment:", error);
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
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  };
}
