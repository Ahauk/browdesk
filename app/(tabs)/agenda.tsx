import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge } from "@/components/ui";
import { useAppointments } from "@/hooks/useAppointments";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useClients } from "@/hooks/useClients";
import { fullName, formatDate } from "@/utils/format";
import { colors, spacing, radius } from "@/theme";
import dayjs from "dayjs";
import "dayjs/locale/es";
import type { Client } from "@/types/models";

dayjs.locale("es");

export default function AgendaScreen() {
  const today = dayjs().format("D MMMM");
  const { todayAppointments, upcomingAppointments } = useAppointments();
  const { pendingFollowUps } = useFollowUps();
  const { getClient } = useClients();

  const [clientMap, setClientMap] = useState<Record<string, Client>>({});

  // Load client names for all referenced client IDs
  useEffect(() => {
    async function loadClients() {
      const allClientIds = new Set<string>();
      todayAppointments.forEach((a) => allClientIds.add(a.clientId));
      upcomingAppointments.forEach((a) => allClientIds.add(a.clientId));
      pendingFollowUps.forEach((f) => allClientIds.add(f.clientId));

      const map: Record<string, Client> = {};
      for (const id of allClientIds) {
        const client = await getClient(id);
        if (client) map[id] = client;
      }
      setClientMap(map);
    }
    loadClients();
  }, [todayAppointments, upcomingAppointments, pendingFollowUps]);

  const getClientName = (clientId: string) => {
    const client = clientMap[clientId];
    return client ? fullName(client.firstName, client.lastName) : "...";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Agenda</Text>
          <Text style={styles.headerDate}>{today}</Text>
        </View>

        {/* Today's appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoy</Text>
          <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt) => (
                <Pressable key={apt.id} style={styles.appointmentRow}>
                  <Text style={styles.appointmentTime}>{apt.time}</Text>
                  <Avatar
                    firstName={clientMap[apt.clientId]?.firstName || "?"}
                    lastName={clientMap[apt.clientId]?.lastName || ""}
                    size="sm"
                  />
                  <View style={styles.flex1}>
                    <Text style={styles.appointmentName}>
                      {getClientName(apt.clientId)}
                    </Text>
                    <Text style={styles.appointmentType}>
                      {apt.procedureType || "Cita"}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>Sin citas para hoy</Text>
            )}
          </Card>
        </View>

        {/* Upcoming */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas citas</Text>
          <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.slice(0, 5).map((apt) => (
                <Pressable key={apt.id} style={styles.upcomingRow}>
                  <View style={styles.upcomingLeft}>
                    <Text style={styles.upcomingDate}>
                      {formatDate(apt.date)}
                    </Text>
                    <View>
                      <Text style={styles.upcomingName}>
                        {getClientName(apt.clientId)}
                      </Text>
                      <Text style={styles.upcomingType}>
                        {apt.procedureType || "Cita"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.chevron}>{">"}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>Sin citas próximas</Text>
            )}
          </Card>
        </View>

        {/* Follow-ups */}
        <View style={styles.sectionLast}>
          <Text style={styles.sectionTitle}>Seguimientos</Text>
          <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
            {pendingFollowUps.length > 0 ? (
              pendingFollowUps.map((fu) => (
                <Pressable key={fu.id} style={styles.upcomingRow}>
                  <View>
                    <Text style={styles.upcomingName}>
                      {getClientName(fu.clientId)}
                    </Text>
                    <Text style={styles.upcomingType}>
                      {fu.notes || "Seguimiento"} - {formatDate(fu.dueDate)}
                    </Text>
                  </View>
                  <Badge label="Pendiente" variant="gold" />
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Sin seguimientos pendientes
              </Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  headerDate: {
    color: colors.textSecondary,
    fontSize: 13,
    textTransform: "capitalize",
  },
  section: {
    paddingHorizontal: spacing["2xl"],
    marginBottom: spacing["2xl"],
  },
  sectionLast: {
    paddingHorizontal: spacing["2xl"],
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.accentLight,
  },
  appointmentTime: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "500",
    width: 56,
  },
  appointmentName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },
  appointmentType: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.accentLight,
  },
  upcomingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  upcomingDate: {
    color: colors.accent,
    fontSize: 13,
    width: 64,
  },
  upcomingName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },
  upcomingType: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  chevron: {
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingVertical: 16,
    textAlign: "center",
  },
});
