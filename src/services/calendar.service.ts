import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const BROWDESK_CALENDAR_TITLE = "BrowDesk";
const BROWDESK_CALENDAR_COLOR = "#8B6B4F";

/* ── Permissions ── */

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

export async function hasCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === "granted";
}

/* ── Calendar management ── */

export async function getOrCreateBrowDeskCalendar(): Promise<string | null> {
  try {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );

    const existing = calendars.find(
      (c) => c.title === BROWDESK_CALENDAR_TITLE && c.allowsModifications
    );
    if (existing) return existing.id;

    // Find a valid source for creating the calendar
    const defaultSource =
      Platform.OS === "ios"
        ? calendars.find((c) => c.source?.isLocalAccount)?.source ||
          calendars.find((c) => c.allowsModifications)?.source
        : undefined;

    const newCalendarId = await Calendar.createCalendarAsync({
      title: BROWDESK_CALENDAR_TITLE,
      color: BROWDESK_CALENDAR_COLOR,
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultSource?.id,
      source:
        Platform.OS === "android"
          ? {
              isLocalAccount: true,
              name: BROWDESK_CALENDAR_TITLE,
              type: Calendar.CalendarType.LOCAL,
            }
          : undefined,
      name: BROWDESK_CALENDAR_TITLE,
      ownerAccount: "personal",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return newCalendarId;
  } catch (error) {
    console.error("Error getting/creating BrowDesk calendar:", error);
    return null;
  }
}

/* ── Event CRUD ── */

export interface CalendarEventInput {
  clientName: string;
  procedureTypes: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  endTime?: string; // HH:mm
  duration?: number; // minutes
  notes?: string;
}

function buildEventDetails(input: CalendarEventInput) {
  const title = `Cita — ${input.clientName} — ${input.procedureTypes}`;
  const startDate = dayjs(
    `${input.date} ${input.time}`,
    "YYYY-MM-DD HH:mm"
  ).toDate();

  let endDate: Date;
  if (input.endTime) {
    endDate = dayjs(
      `${input.date} ${input.endTime}`,
      "YYYY-MM-DD HH:mm"
    ).toDate();
  } else {
    endDate = dayjs(startDate)
      .add(input.duration || 60, "minute")
      .toDate();
  }

  return { title, startDate, endDate, notes: input.notes || "" };
}

export async function createCalendarEvent(
  calendarId: string,
  input: CalendarEventInput
): Promise<string | null> {
  try {
    const { title, startDate, endDate, notes } = buildEventDetails(input);
    const eventId = await Calendar.createEventAsync(calendarId, {
      title,
      startDate,
      endDate,
      notes,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    return eventId;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return false;
  }
}
