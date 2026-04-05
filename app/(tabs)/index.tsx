import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar } from "@/components/ui";
import { SparkleText } from "@/components/ui/SparkleText";
import { useClients } from "@/hooks/useClients";
import { useAppointments } from "@/hooks/useAppointments";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useProcedures } from "@/hooks/useProcedures";
import { useSync } from "@/hooks/useSync";
import { fullName } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import { colors, spacing, radius } from "@/theme";
import type { Procedure } from "@/types/models";

function StatCard({
  title,
  value,
  subtitle,
  onPress,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statCard,
        pressed && { opacity: 0.9 },
      ]}
    >
      <View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </Pressable>
  );
}

function RecentItem({
  clientName,
  detail,
  onPress,
}: {
  clientName: string;
  detail: string;
  onPress?: () => void;
}) {
  const services = detail.split(" • ");
  return (
    <Pressable onPress={onPress} style={styles.recentItem}>
      <View style={styles.recentItemLeft}>
        <Avatar
          firstName={clientName.split(" ")[0]}
          lastName={clientName.split(" ")[1] || ""}
          size="md"
        />
        <View style={styles.recentTextWrap}>
          <Text style={styles.recentClientName}>{clientName}</Text>
          {services.map((s, i) => (
            <Text key={i} style={styles.recentService}>
              {s}
            </Text>
          ))}
        </View>
      </View>
      <Text style={styles.chevron}>{"›"}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { count: clientCount, refresh: refreshClients, getClient } = useClients();
  const { todayCount, refresh: refreshAppointments } = useAppointments();
  const { pendingCount, refresh: refreshFollowUps } = useFollowUps();
  const { getRecentProcedures } = useProcedures();
  const { sync } = useSync();

  const [recentVisits, setRecentVisits] = useState<
    {
      clientId: string;
      clientName: string;
      services: string[];
      date: string;
    }[]
  >([]);

  const loadRecent = useCallback(async () => {
    const procs = await getRecentProcedures(20);
    // Group by clientId + date
    const grouped = new Map<
      string,
      { clientId: string; clientName: string; services: string[]; date: string }
    >();

    for (const proc of procs) {
      const client = await getClient(proc.clientId);
      if (!client) continue;

      const key = `${proc.clientId}_${proc.date}`;
      const typeLabel =
        PROCEDURE_TYPES.find((t) => t.key === proc.type)?.label || proc.type;
      const service = proc.technique
        ? `${typeLabel} · ${proc.technique}`
        : typeLabel;

      if (grouped.has(key)) {
        grouped.get(key)!.services.push(service);
      } else {
        grouped.set(key, {
          clientId: proc.clientId,
          clientName: fullName(client.firstName, client.lastName),
          services: [service],
          date: proc.date,
        });
      }
    }

    setRecentVisits(Array.from(grouped.values()).slice(0, 5));
  }, []);

  // Refresh all data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshClients();
      refreshAppointments();
      refreshFollowUps();
      loadRecent();
      sync().catch(() => {});
    }, [loadRecent])
  );

  return (
    <View style={styles.screen}>
      {/* Header with accent bg */}
      <View style={styles.headerBg}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <SparkleText text="Carolina Vazquez Studio" fontSize={13} />
            <Text style={styles.greeting}>Hola, Carolina</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsSection}>
          <StatCard
            title="Clientas"
            value={clientCount}
            subtitle="Registradas"
            onPress={() => router.push("/(tabs)/clients")}
          />
          <StatCard
            title="Citas hoy"
            value={todayCount}
            subtitle="Programadas"
            onPress={() => router.push("/(tabs)/agenda")}
          />
          <StatCard
            title="Seguimientos"
            value={pendingCount}
            subtitle="Pendientes"
            onPress={() => router.push("/(tabs)/agenda")}
          />
        </View>

        {/* Recent visits */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Últimas visitas</Text>
          {recentVisits.length > 0 ? (
            recentVisits.map((visit) => (
              <RecentItem
                key={`${visit.clientId}_${visit.date}`}
                clientName={visit.clientName}
                detail={visit.services.join(" • ")}
                onPress={() => router.push(`/clients/${visit.clientId}`)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>Sin visitas recientes</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Header — warm accent color
  headerBg: {
    backgroundColor: colors.accentLight,
    paddingBottom: spacing["3xl"],
    borderBottomLeftRadius: radius["2xl"],
    borderBottomRightRadius: radius["2xl"],
  },
  headerContent: {
    alignItems: "center",
    paddingTop: spacing.lg,
    gap: 8,
  },
  greeting: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "bold",
  },
  // Content
  content: {
    flex: 1,
    marginTop: -spacing.md,
  },
  statsSection: {
    paddingHorizontal: spacing["2xl"],
    gap: 10,
  },
  // Compact stat cards matching mockup
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: 22,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  statSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  statValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
  },
  // Recent section
  recentSection: {
    paddingHorizontal: spacing["2xl"],
    marginTop: spacing["2xl"],
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  recentItemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  recentTextWrap: {
    flex: 1,
    gap: 2,
  },
  recentClientName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  recentService: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 20,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingVertical: 16,
    textAlign: "center",
  },
});
