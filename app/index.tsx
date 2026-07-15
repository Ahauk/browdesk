import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { getSession } from "@/services/session.service";
import { useAuthStore } from "@/stores/auth.store";
import { colors } from "@/theme";

export default function SplashScreen() {
  const router = useRouter();
  const { setCloudSession } = useAuthStore();

  useEffect(() => {
    // Decide the destination while the splash animates: signed-in accounts go
    // to the local lock screen; everyone else goes to auth.
    const routePromise = getSession().then((session) => {
      setCloudSession(session);
      return session ? "/unlock" : "/auth";
    });

    const timeout = setTimeout(async () => {
      const destination = await routePromise.catch(() => "/auth" as const);
      router.replace(destination);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <AnimatedSplash />
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splash.black,
  },
});
