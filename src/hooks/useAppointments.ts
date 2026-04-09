import { useState, useEffect, useCallback } from "react";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { db } from "@/db/client";
import { appointments, userProfile } from "@/db/schema";
import { scheduleAppointmentReminder } from "@/services/notification.service";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getOrCreateBrowDeskCalendar,
  hasCalendarPermissions,
} from "@/services/calendar.service";
import type { Appointment } from "@/types/models";

dayjs.extend(customParseFormat);

async function isCalendarSyncEnabled(): Promise<boolean> {
  try {
    const result = await db
      .select({ enabled: userProfile.calendarSyncEnabled })
      .from(userProfile)
      .limit(1);
    return result[0]?.enabled === true;
  } catch {
    return false;
  }
}

export interface AppointmentMeta {
  clientName?: string;
  procedureLabels?: string;
}

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
      input: Omit<Appointment, "id" | "createdAt" | "updatedAt" | "syncedAt">,
      meta?: AppointmentMeta
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

        // Sync to device calendar
        try {
          if (
            meta?.clientName &&
            (await isCalendarSyncEnabled()) &&
            (await hasCalendarPermissions())
          ) {
            const calendarId = await getOrCreateBrowDeskCalendar();
            if (calendarId) {
              const eventId = await createCalendarEvent(calendarId, {
                clientName: meta.clientName,
                procedureTypes: meta.procedureLabels || "Cita",
                date: input.date,
                time: input.time,
                endTime: input.endTime,
                duration: input.duration,
                notes: input.notes,
              });
              if (eventId) {
                await db
                  .update(appointments)
                  .set({ calendarEventId: eventId })
                  .where(eq(appointments.id, newAppointment.id));
                newAppointment.calendarEventId = eventId;
              }
            }
          }
        } catch {
          // Calendar sync failure shouldn't block appointment creation
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
        // Delete calendar event for cancelled appointments
        if (status === "cancelled") {
          try {
            if (await isCalendarSyncEnabled()) {
              const [apt] = await db
                .select({ calendarEventId: appointments.calendarEventId })
                .from(appointments)
                .where(eq(appointments.id, id))
                .limit(1);
              if (apt?.calendarEventId) {
                await deleteCalendarEvent(apt.calendarEventId);
              }
            }
          } catch {
            // Non-blocking
          }
        }

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
        // Delete calendar event first
        try {
          if (await isCalendarSyncEnabled()) {
            const [apt] = await db
              .select({ calendarEventId: appointments.calendarEventId })
              .from(appointments)
              .where(eq(appointments.id, id))
              .limit(1);
            if (apt?.calendarEventId) {
              await deleteCalendarEvent(apt.calendarEventId);
            }
          }
        } catch {
          // Non-blocking
        }

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
