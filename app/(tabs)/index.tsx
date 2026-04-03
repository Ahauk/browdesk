import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar } from "@/components/ui";
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
    <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }} onPress={onPress}>
      <View style={styles.statRow}>
        <View>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </Card>
  );
}

function RecentProcedureItem({
  clientName,
  procedure,
  onPress,
}: {
  clientName: string;
  procedure: Procedure;
  onPress?: () => void;
}) {
  const typeLabel =
    PROCEDURE_TYPES.find((t) => t.key === procedure.type)?.label ||
    procedure.type;

  return (
    <Pressable onPress={onPress} style={styles.recentItem}>
      <View style={styles.recentItemLeft}>
        <Avatar
          firstName={clientName.split(" ")[0]}
          lastName={clientName.split(" ")[1] || ""}
          size="sm"
        />
        <View>
          <Text style={styles.recentClientName}>{clientName}</Text>
          <Text style={styles.recentProcType}>
            {typeLabel} - {procedure.technique}
          </Text>
        </View>
      </View>
      <Text style={styles.chevron}>{">"}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { count: clientCount } = useClients();
  const { todayCount } = useAppointments();
  const { pendingCount } = useFollowUps();
  const { getRecentProcedures } = useProcedures();
  const { sync } = useSync();
  const { getClient } = useClients();

  const [recentProcedures, setRecentProcedures] = useState<
    { procedure: Procedure; clientName: string }[]
  >([]);

  useEffect(() => {
    async function loadRecent() {
      const procedures = await getRecentProcedures(5);
      const withNames = await Promise.all(
        procedures.map(async (proc) => {
          const client = await getClient(proc.clientId);
          return {
            procedure: proc,
            clientName: client
              ? fullName(client.firstName, client.lastName)
              : "Sin nombre",
          };
        })
      );
      setRecentProcedures(withNames);
    }
    loadRecent();
  }, []);

  // Background sync on load
  useEffect(() => {
    sync();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hola, Carolina 👋</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <StatCard
            title="Clientas"
            value={clientCount}
            subtitle="registradas"
            onPress={() => router.push("/(tabs)/clients")}
          />
          <StatCard
            title="Citas hoy"
            value={todayCount}
            subtitle="hoy"
            onPress={() => router.push("/(tabs)/agenda")}
          />
          <StatCard
            title="Seguimientos"
            value={pendingCount}
            subtitle="pendientes"
          />
        </View>

        {/* Recent Procedures */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Ultimas visitas</Text>
          <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
            {recentProcedures.length > 0 ? (
              recentProcedures.map((item) => (
                <RecentProcedureItem
                  key={item.procedure.id}
                  clientName={item.clientName}
                  procedure={item.procedure}
                  onPress={() =>
                    router.push(
                      `/(tabs)/clients/${item.procedure.clientId}`
                    )
                  }
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Sin procedimientos aun</Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex1: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "bold",
  },
  statsSection: {
    paddingHorizontal: spacing["2xl"],
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  statSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  statValue: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: "bold",
  },
  recentSection: {
    paddingHorizontal: spacing["2xl"],
    marginTop: spacing["2xl"],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.accentLight,
  },
  recentItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  recentClientName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },
  recentProcType: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 17,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingVertical: 16,
    textAlign: "center",
  },
});
