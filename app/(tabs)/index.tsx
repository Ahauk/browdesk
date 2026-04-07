import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
} from "react-native";
import { setStatusBarStyle } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Card, Avatar } from "@/components/ui";
import { SparkleText } from "@/components/ui/SparkleText";
import { useClients } from "@/hooks/useClients";
import { useAppointments } from "@/hooks/useAppointments";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useProcedures } from "@/hooks/useProcedures";
import { useSync } from "@/hooks/useSync";
import { fullName, formatDate } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import { colors, spacing, radius } from "@/theme";

/* ───────────────── Stat Card (compact) ───────────────── */
function StatCard({
  title,
  value,
  icon,
  onPress,
}: {
  title: string;
  value: string | number;
  icon: string;
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
      <Ionicons
        name={icon as any}
        size={18}
        color={colors.accent}
        style={styles.statIcon}
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Pressable>
  );
}

/* ───────────────── Client Avatar Pill ───────────────── */
function ClientPill({
  firstName,
  lastName,
  avatarUri,
  onPress,
}: {
  firstName: string;
  lastName: string;
  avatarUri?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.clientPill}>
      <Avatar
        firstName={firstName}
        lastName={lastName}
        uri={avatarUri}
        size="ml"
      />
      <Text style={styles.clientPillName} numberOfLines={1}>
        {firstName}
      </Text>
    </Pressable>
  );
}

/* ───────────────── Visit Row ───────────────── */
function VisitRow({
  clientName,
  services,
  date,
  onPress,
}: {
  clientName: string;
  services: string[];
  date: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.visitRow}>
      <View style={styles.visitLeft}>
        <Avatar
          firstName={clientName.split(" ")[0]}
          lastName={clientName.split(" ")[1] || ""}
          size="sm"
        />
        <View style={styles.visitTextWrap}>
          <Text style={styles.visitClientName} numberOfLines={1}>
            {clientName}
          </Text>
          <Text style={styles.visitService} numberOfLines={1}>
            {services.join(" · ")}
          </Text>
        </View>
      </View>
      <Text style={styles.visitDate}>{formatDate(date)}</Text>
    </Pressable>
  );
}

/* ═══════════════════════ Home Screen ═══════════════════════ */
export default function HomeScreen() {
  const router = useRouter();
  const {
    clients,
    count: clientCount,
    refresh: refreshClients,
    getClient,
  } = useClients();
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
    const procs = await getRecentProcedures(15);
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

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      refreshClients();
      refreshAppointments();
      refreshFollowUps();
      loadRecent();
      sync().catch(() => {});
    }, [loadRecent])
  );

  // Recent clients (up to 8)
  const recentClients = clients.slice(0, 8);

  return (
    <View style={styles.screen}>
      {/* Header */}
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
        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <StatCard
            title="Clientas"
            value={clientCount}
            icon="people-outline"
            onPress={() => router.push("/(tabs)/clients")}
          />
          <StatCard
            title="Citas hoy"
            value={todayCount}
            icon="calendar-outline"
            onPress={() => router.push("/(tabs)/agenda")}
          />
          <StatCard
            title="Seguimientos"
            value={pendingCount}
            icon="notifications-outline"
            onPress={() => router.push("/(tabs)/agenda")}
          />
        </View>

        {/* ── Clientas recientes (horizontal avatars) ── */}
        {recentClients.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Clientas recientes</Text>
              <Pressable onPress={() => router.push("/(tabs)/clients")}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </Pressable>
            </View>
            <FlatList
              data={recentClients}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clientsScroll}
              renderItem={({ item }) => (
                <ClientPill
                  firstName={item.firstName}
                  lastName={item.lastName}
                  avatarUri={item.avatarUri}
                  onPress={() => router.push(`/clients/${item.id}`)}
                />
              )}
            />
          </View>
        )}

        {/* ── Últimas visitas ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Últimas visitas</Text>
            {recentVisits.length > 0 && (
              <Pressable onPress={() => router.push("/(tabs)/clients")}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </Pressable>
            )}
          </View>
          {recentVisits.length > 0 ? (
            <View style={styles.visitsCard}>
              {recentVisits.map((visit, index) => (
                <View key={`${visit.clientId}_${visit.date}`}>
                  <VisitRow
                    clientName={visit.clientName}
                    services={visit.services}
                    date={visit.date}
                    onPress={() => router.push(`/clients/${visit.clientId}`)}
                  />
                  {index < recentVisits.length - 1 && (
                    <View style={styles.visitDivider} />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="clipboard-outline"
                size={32}
                color={colors.divider}
              />
              <Text style={styles.emptyText}>Sin visitas recientes</Text>
            </View>
          )}
        </View>

        {/* ── Inspiración shortcut ── */}
        <Pressable
          onPress={() => router.push("/inspiration")}
          style={styles.inspirationCard}
        >
          <Ionicons name="images-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.inspirationTitle}>Catálogo de inspiración</Text>
            <Text style={styles.inspirationHint}>
              Fotos de referencia para tus clientas
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Header ──
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

  // ── Content ──
  content: {
    flex: 1,
    marginTop: -spacing.md,
  },

  // ── Stats row (3 cards horizontal) ──
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing["2xl"],
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: 22,
    paddingHorizontal: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    gap: 6,
  },
  statIcon: {
    marginBottom: 2,
  },
  statValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
  },
  statTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // ── Section ──
  section: {
    marginTop: spacing["2xl"],
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  seeAllText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Client pills (horizontal scroll) ──
  clientsScroll: {
    paddingHorizontal: spacing["2xl"],
    gap: 16,
  },
  clientPill: {
    alignItems: "center",
    gap: 8,
    width: 72,
  },
  clientPillName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },

  // ── Visits card ──
  visitsCard: {
    marginHorizontal: spacing["2xl"],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  visitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  visitLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  visitTextWrap: {
    flex: 1,
    gap: 2,
  },
  visitClientName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  visitService: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  visitDate: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
  visitDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // ── Inspiration card ──
  inspirationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: spacing["2xl"],
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inspirationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  inspirationHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ── Empty state ──
  emptyCard: {
    marginHorizontal: spacing["2xl"],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
