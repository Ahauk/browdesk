import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleAppointmentReminder(
  title: string,
  body: string,
  date: Date
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
    },
  });
  return id;
}

export async function scheduleFollowUpReminder(
  clientName: string,
  procedureType: string,
  date: Date
): Promise<string> {
  return scheduleAppointmentReminder(
    "Seguimiento pendiente",
    `${clientName} - ${procedureType}`,
    date
  );
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

const DAILY_REMINDER_ID = "daily-appointment-reminder";

/**
 * Schedule (or reschedule) a daily notification at 10am
 * reminding Carolina to send WhatsApp reminders for tomorrow's appointments.
 * Call on every app startup with the current count.
 */
export async function scheduleDailyReminderNotification(
  tomorrowCount: number
): Promise<void> {
  // Cancel existing daily reminder
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(
    () => {}
  );

  if (tomorrowCount === 0) return;

  const citaText =
    tomorrowCount === 1 ? "1 cita" : `${tomorrowCount} citas`;

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: "Recordatorio de citas",
      body: `Mañana tienes ${citaText}. Envía recordatorios a tus clientas.`,
      sound: true,
      data: { screen: "reminders" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    },
  });
}
