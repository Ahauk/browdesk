import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { initializeDatabase } from "@/db/client";
import { runSupabaseMigrations } from "@/services/supabase-migrations";
import { scheduleDailyReminderNotification } from "@/services/notification.service";
import { db } from "@/db/client";
import { appointments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import dayjs from "dayjs";
import { useAppStore } from "@/stores/app.store";
import { colors } from "@/theme";

export default function RootLayout() {
  const { isDbReady, setDbReady } = useAppStore();

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        setDbReady(true);
        // Run Supabase migrations in background (non-blocking)
        runSupabaseMigrations().catch(() => {});
        // Schedule daily 10am notification for tomorrow's appointments
        try {
          const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
          const result = await db
            .select()
            .from(appointments)
            .where(
              and(
                eq(appointments.date, tomorrow),
                eq(appointments.status, "scheduled")
              )
            );
          scheduleDailyReminderNotification(result.length).catch(() => {});
        } catch {
          // Non-blocking
        }
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    }
    init();
  }, []);

  if (!isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.brand.rose} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen
          name="index"
          options={{ contentStyle: { backgroundColor: colors.brand.black } }}
        />
        <Stack.Screen
          name="unlock"
          options={{ contentStyle: { backgroundColor: colors.brand.black } }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{ contentStyle: { backgroundColor: colors.brand.ivory } }}
        />
        <Stack.Screen
          name="clients/new"
          options={{
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.brand.ivory },
          }}
        />
        <Stack.Screen
          name="clients/[id]"
          options={{
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.brand.ivory },
          }}
        />
        <Stack.Screen
          name="procedures/new"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="procedures/[id]"
          options={{
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="inspiration/index"
          options={{
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen
          name="reminders"
          options={{
            animation: "slide_from_right",
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.black,
  },
});
