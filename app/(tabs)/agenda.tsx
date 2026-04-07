import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, Badge } from "@/components/ui";
import { MiniCalendar } from "@/components/ui/MiniCalendar";
import { useAppointments } from "@/hooks/useAppointments";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useClients } from "@/hooks/useClients";
import { fullName, formatDate, formatTime } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import { colors, spacing, radius } from "@/theme";
import dayjs from "dayjs";
import "dayjs/locale/es";
import type { Client, Appointment } from "@/types/models";

dayjs.locale("es");

/* ───────────────── Status helpers ───────────────── */
const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: colors.accent,
  completed: colors.success,
  cancelled: colors.textSecondary,
};

/* ═══════════════════════ Main Screen ═══════════════════════ */
export default function AgendaScreen() {
  const router = useRouter();
  const {
    appointments,
    refresh: refreshAppointments,
    updateAppointmentStatus,
    deleteAppointment,
  } = useAppointments();
  const { pendingFollowUps, markCompleted, refresh: refreshFollowUps } =
    useFollowUps();
  const { getClient } = useClients();

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [clientMap, setClientMap] = useState<Record<string, Client>>({});
  const [showFollowUps, setShowFollowUps] = useState(false);

  // Load client names for all referenced client IDs
  const loadClients = useCallback(async () => {
    const allClientIds = new Set<string>();
    appointments.forEach((a) => allClientIds.add(a.clientId));
    pendingFollowUps.forEach((f) => allClientIds.add(f.clientId));

    const map: Record<string, Client> = {};
    for (const id of allClientIds) {
      if (clientMap[id]) {
        map[id] = clientMap[id];
        continue;
      }
      const client = await getClient(id);
      if (client) map[id] = client;
    }
    setClientMap(map);
  }, [appointments, pendingFollowUps]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useFocusEffect(
    useCallback(() => {
      refreshAppointments();
      refreshFollowUps();
    }, [])
  );

  // Dates with appointments (for calendar dots)
  const markedDates = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => {
      if (a.status === "scheduled") set.add(a.date);
    });
    return set;
  }, [appointments]);

  // Appointments for selected day
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDate]);

  const getClientName = (clientId: string) => {
    const client = clientMap[clientId];
    return client ? fullName(client.firstName, client.lastName) : "...";
  };

  const getTypeLabels = (apt: Appointment): string => {
    // Try procedureTypes (JSON array) first, fall back to procedureType
    if (apt.procedureTypes) {
      try {
        const types: string[] = JSON.parse(apt.procedureTypes);
        return types
          .map((t) => PROCEDURE_TYPES.find((pt) => pt.key === t)?.label || t)
          .join(", ");
      } catch {}
    }
    if (apt.procedureType) {
      return PROCEDURE_TYPES.find((t) => t.key === apt.procedureType)?.label || "Cita";
    }
    return "Cita";
  };

  // Actions
  const handleComplete = (apt: Appointment) => {
    Alert.alert("Completar cita", `¿Marcar como completada?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Completar",
        onPress: () => updateAppointmentStatus(apt.id, "completed"),
      },
    ]);
  };

  const handleCancel = (apt: Appointment) => {
    Alert.alert("Cancelar cita", `¿Cancelar esta cita?`, [
      { text: "No", style: "cancel" },
      {
        text: "Sí, cancelar",
        style: "destructive",
        onPress: () => updateAppointmentStatus(apt.id, "cancelled"),
      },
    ]);
  };

  const handleDelete = (apt: Appointment) => {
    Alert.alert(
      "Eliminar cita",
      "¿Estás segura? Esta acción no se puede deshacer.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteAppointment(apt.id),
        },
      ]
    );
  };

  const handleCompleteFollowUp = (id: string) => {
    Alert.alert("Completar seguimiento", "¿Marcar como completado?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Completar", onPress: () => markCompleted(id) },
    ]);
  };

  const isToday = selectedDate === dayjs().format("YYYY-MM-DD");
  const selectedLabel = isToday
    ? "Hoy"
    : dayjs(selectedDate).format("dddd D [de] MMMM");

  // Timeline: 10am to 7pm = 9 hours = 540 minutes
  const TIMELINE_START = 10; // 10:00
  const TIMELINE_END = 19; // 19:00
  const TIMELINE_MINUTES = (TIMELINE_END - TIMELINE_START) * 60; // 540

  const scheduledMinutes = useMemo(() => {
    return dayAppointments
      .filter((a) => a.status === "scheduled")
      .reduce((sum, a) => sum + (a.duration || 60), 0);
  }, [dayAppointments]);

  const timelineBlocks = useMemo(() => {
    return dayAppointments
      .filter((a) => a.status === "scheduled")
      .map((a) => {
        const start = dayjs(a.time, "HH:mm");
        const startMin = (start.hour() - TIMELINE_START) * 60 + start.minute();
        const dur = a.duration || 60;
        return {
          left: Math.max(0, startMin / TIMELINE_MINUTES),
          width: Math.min(dur / TIMELINE_MINUTES, (TIMELINE_MINUTES - Math.max(0, startMin)) / TIMELINE_MINUTES),
        };
      })
      .filter((b) => b.left < 1 && b.width > 0);
  }, [dayAppointments]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agenda</Text>
        <Pressable
          onPress={() => {
            setSelectedDate(dayjs().format("YYYY-MM-DD"));
          }}
          style={styles.todayBtn}
        >
          <Text style={styles.todayBtnText}>Hoy</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <View style={styles.calendarSection}>
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            markedDates={markedDates}
          />
        </View>

        {/* Day header */}
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{selectedLabel}</Text>
          <Text style={styles.dayHeaderCount}>
            {dayAppointments.filter((a) => a.status === "scheduled").length}{" "}
            cita{dayAppointments.filter((a) => a.status === "scheduled").length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Timeline bar */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineLabels}>
            <Text style={styles.timelineLabel}>10am</Text>
            <Text style={styles.timelineLabel}>1pm</Text>
            <Text style={styles.timelineLabel}>4pm</Text>
            <Text style={styles.timelineLabel}>7pm</Text>
          </View>
          <View style={styles.timelineBar}>
            {timelineBlocks.map((block, i) => (
              <View
                key={i}
                style={[
                  styles.timelineBlock,
                  {
                    left: `${block.left * 100}%`,
                    width: `${block.width * 100}%`,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.timelineInfo}>
            <Text style={styles.timelineInfoText}>
              {Math.floor(scheduledMinutes / 60)}h{scheduledMinutes % 60 > 0 ? ` ${scheduledMinutes % 60}m` : ""} ocupadas
            </Text>
            <Text style={styles.timelineInfoText}>
              {Math.floor((TIMELINE_MINUTES - scheduledMinutes) / 60)}h{(TIMELINE_MINUTES - scheduledMinutes) % 60 > 0 ? ` ${(TIMELINE_MINUTES - scheduledMinutes) % 60}m` : ""} disponibles
            </Text>
          </View>
        </View>

        {/* Appointments for selected day */}
        <View style={styles.section}>
          {dayAppointments.length > 0 ? (
            <View style={styles.appointmentsCard}>
              {dayAppointments.map((apt, index) => {
                const client = clientMap[apt.clientId];
                const isScheduled = apt.status === "scheduled";
                return (
                  <View key={apt.id}>
                    <View style={styles.aptRow}>
                      {/* Time */}
                      <View style={styles.aptTimeCol}>
                        <Text style={[styles.aptTimeStart, !isScheduled && styles.aptTimeDone]}>
                          {formatTime(apt.time)}
                        </Text>
                        {apt.endTime && (
                          <>
                            <Text style={styles.aptTimeSep}>a</Text>
                            <Text style={[styles.aptTimeEnd, !isScheduled && styles.aptTimeDone]}>
                              {formatTime(apt.endTime)}
                            </Text>
                          </>
                        )}
                      </View>

                      {/* Info */}
                      <View style={styles.aptInfo}>
                        <View style={styles.aptInfoTop}>
                          <Avatar
                            firstName={client?.firstName || "?"}
                            lastName={client?.lastName || ""}
                            size="sm"
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.aptName,
                                !isScheduled && styles.aptNameDone,
                              ]}
                              numberOfLines={1}
                            >
                              {getClientName(apt.clientId)}
                            </Text>
                            <Text style={styles.aptType}>
                              {getTypeLabels(apt)}
                              {apt.notes ? ` · ${apt.notes}` : ""}
                            </Text>
                          </View>
                        </View>

                        {/* Actions */}
                        {isScheduled ? (
                          <View style={styles.aptActions}>
                            <Pressable
                              onPress={() => handleComplete(apt)}
                              style={styles.actionBtn}
                              hitSlop={8}
                            >
                              <Ionicons
                                name="checkmark-circle-outline"
                                size={22}
                                color={colors.success}
                              />
                            </Pressable>
                            <Pressable
                              onPress={() => handleCancel(apt)}
                              style={styles.actionBtn}
                              hitSlop={8}
                            >
                              <Ionicons
                                name="close-circle-outline"
                                size={22}
                                color={colors.textSecondary}
                              />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDelete(apt)}
                              style={styles.actionBtn}
                              hitSlop={8}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color={colors.danger}
                              />
                            </Pressable>
                          </View>
                        ) : (
                          <View style={styles.aptStatusBadge}>
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor:
                                    STATUS_COLORS[apt.status] ||
                                    colors.textSecondary,
                                },
                              ]}
                            />
                            <Text style={styles.aptStatusText}>
                              {STATUS_LABELS[apt.status] || apt.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {index < dayAppointments.length - 1 && (
                      <View style={styles.aptDivider} />
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons
                name="calendar-outline"
                size={36}
                color={colors.divider}
              />
              <Text style={styles.emptyText}>Sin citas este día</Text>
            </View>
          )}
        </View>

        {/* Follow-ups */}
        {pendingFollowUps.length > 0 && (
          <View style={styles.section}>
            <Pressable
              onPress={() => setShowFollowUps((v) => !v)}
              style={styles.followUpHeader}
            >
              <View style={styles.followUpHeaderLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={colors.accent}
                />
                <Text style={styles.followUpTitle}>
                  Seguimientos pendientes
                </Text>
                <View style={styles.followUpBadge}>
                  <Text style={styles.followUpBadgeText}>
                    {pendingFollowUps.length}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={showFollowUps ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>

            {showFollowUps && (
              <View style={styles.followUpList}>
                {pendingFollowUps.map((fu) => (
                  <View key={fu.id} style={styles.followUpRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.followUpName}>
                        {getClientName(fu.clientId)}
                      </Text>
                      <Text style={styles.followUpDetail}>
                        {fu.notes || "Seguimiento"} · {formatDate(fu.dueDate)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleCompleteFollowUp(fu.id)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={24}
                        color={colors.success}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB — New appointment */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/appointments/new",
            params: { date: selectedDate },
          })
        }
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  todayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  todayBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },

  // Calendar
  calendarSection: {
    paddingHorizontal: spacing["2xl"],
    marginBottom: spacing.lg,
  },

  // Day header
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    marginBottom: 12,
  },
  dayHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textTransform: "capitalize",
  },
  dayHeaderCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Section
  section: {
    paddingHorizontal: spacing["2xl"],
    marginBottom: spacing.lg,
  },

  // Timeline
  timelineSection: {
    paddingHorizontal: spacing["2xl"],
    marginBottom: spacing.lg,
  },
  timelineLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  timelineLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  timelineBar: {
    height: 12,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 6,
    overflow: "hidden",
    position: "relative",
  },
  timelineBlock: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  timelineInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  timelineInfoText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "500",
  },

  // Appointments card
  appointmentsCard: {
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
  aptRow: {
    flexDirection: "row",
    paddingVertical: 14,
    gap: 12,
  },
  aptTimeCol: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  aptTimeStart: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  aptTimeSep: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "500",
    marginVertical: 1,
  },
  aptTimeEnd: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  aptTimeDone: {
    color: colors.textSecondary,
  },
  aptInfo: {
    flex: 1,
    gap: 8,
  },
  aptInfoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aptName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  aptNameDone: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  aptType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  aptActions: {
    flexDirection: "row",
    gap: 16,
  },
  actionBtn: {
    padding: 2,
  },
  aptStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  aptStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  aptDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  // Follow-ups
  followUpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  followUpHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  followUpTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  followUpBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  followUpBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  followUpList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginTop: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 4,
  },
  followUpRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  followUpName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  followUpDetail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Empty
  emptyCard: {
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

  // FAB
  fab: {
    position: "absolute",
    bottom: 96,
    right: spacing["2xl"],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
