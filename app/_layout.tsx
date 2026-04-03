import "../global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { initializeDatabase } from "@/db/client";
import { useAppStore } from "@/stores/app.store";

export default function RootLayout() {
  const { isDbReady, setDbReady } = useAppStore();

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        setDbReady(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
      }
    }
    init();
  }, []);

  if (!isDbReady) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-black">
        <ActivityIndicator color="#C4A87C" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#1A1A1A" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="unlock" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="procedures/new"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
