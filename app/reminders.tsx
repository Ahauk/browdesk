import { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Avatar } from "@/components/ui";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { fullName, formatTime } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import { colors, spacing, radius } from "@/theme";
import dayjs from "dayjs";
import "dayjs/locale/es";
import type { Client, Appointment } from "@/types/models";

dayjs.locale("es");

export default function RemindersScreen() {
  const router = useRouter();
  const { appointments } = useAppointments();
  const { getClient } = useClients();

  const [clientMap, setClientMap] = useState<Record<string, Client>>({});
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");
  const tomorrowLabel = dayjs(tomorrow).format("dddd D [de] MMMM");

  const tomorrowAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === tomorrow && a.status === "scheduled")
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, tomorrow]);

  // Load client data
  useEffect(() => {
    async function loadClients() {
      const map: Record<string, Client> = {};
      for (const apt of tomorrowAppointments) {
        if (!clientMap[apt.clientId]) {
          const client = await getClient(apt.clientId);
          if (client) map[apt.clientId] = client;
        } else {
          map[apt.clientId] = clientMap[apt.clientId];
        }
      }
      setClientMap(map);
    }
    loadClients();
  }, [tomorrowAppointments]);

  const getTypeLabels = (apt: Appointment): string => {
    if (apt.procedureTypes) {
      try {
        const types: string[] = JSON.parse(apt.procedureTypes);
        return types
          .map((t) => PROCEDURE_TYPES.find((pt) => pt.key === t)?.label || t)
          .join(", ");
      } catch {}
    }
    if (apt.procedureType) {
      return (
        PROCEDURE_TYPES.find((t) => t.key === apt.procedureType)?.label ||
        "Cita"
      );
    }
    return "Cita";
  };

  const buildMessage = (apt: Appointment, client: Client): string => {
    const dayLabel = dayjs(apt.date).format("dddd D [de] MMMM");
    const timeLabel = formatTime(apt.time);
    const typeLabel = getTypeLabels(apt);
    return (
      `Hola ${client.firstName}! Te recuerdo que mañana ${dayLabel} ` +
      `tienes tu cita de ${typeLabel} a las ${timeLabel}. ` +
      `Te espero! -- Carolina Vazquez`
    );
  };

  const sendWhatsApp = async (apt: Appointment) => {
    const client = clientMap[apt.clientId];
    if (!client) return;

    // Clean phone: remove spaces, dashes, parentheses
    let phone = client.phone.replace(/[\s\-\(\)]/g, "");
    // Ensure country code (default Mexico +52)
    if (!phone.startsWith("+")) {
      phone = phone.startsWith("52") ? `+${phone}` : `+52${phone}`;
    }

    const message = encodeURIComponent(buildMessage(apt, client));
    const url = `https://wa.me/${phone.replace("+", "")}?text=${message}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        setSentMap((prev) => ({ ...prev, [apt.id]: true }));
      } else {
        Alert.alert(
          "WhatsApp no disponible",
          "No se pudo abrir WhatsApp. Verifica que esté instalado."
        );
      }
    } catch {
      Alert.alert("Error", "No se pudo abrir WhatsApp.");
    }
  };

  const sentCount = Object.values(sentMap).filter(Boolean).length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Recordatorios</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons
            name="chatbubbles-outline"
            size={24}
            color={colors.primary}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>
              Citas de mañana — {tomorrowLabel}
            </Text>
            <Text style={styles.infoSub}>
              {tomorrowAppointments.length === 0
                ? "No hay citas programadas para mañana"
                : `${tomorrowAppointments.length} cita${tomorrowAppointments.length !== 1 ? "s" : ""} · ${sentCount} recordatorio${sentCount !== 1 ? "s" : ""} enviado${sentCount !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>

        {/* Appointments list */}
        {tomorrowAppointments.length > 0 ? (
          <View style={styles.section}>
            {tomorrowAppointments.map((apt) => {
              const client = clientMap[apt.clientId];
              const isSent = sentMap[apt.id];

              return (
                <View key={apt.id} style={styles.aptCard}>
                  <View style={styles.aptRow}>
                    <Avatar
                      firstName={client?.firstName || "?"}
                      lastName={client?.lastName || ""}
                      size="md"
                    />
                    <View style={styles.aptInfo}>
                      <Text style={styles.aptName}>
                        {client
                          ? fullName(client.firstName, client.lastName)
                          : "..."}
                      </Text>
                      <Text style={styles.aptDetail}>
                        {getTypeLabels(apt)} · {formatTime(apt.time)}
                        {apt.endTime ? ` a ${formatTime(apt.endTime)}` : ""}
                      </Text>
                      {client?.phone && (
                        <Text style={styles.aptPhone}>{client.phone}</Text>
                      )}
                    </View>
                  </View>

                  {/* Message preview */}
                  {client && (
                    <View style={styles.messagePreview}>
                      <Text style={styles.messageText} numberOfLines={3}>
                        {buildMessage(apt, client)}
                      </Text>
                    </View>
                  )}

                  {/* WhatsApp button */}
                  <Pressable
                    onPress={() => sendWhatsApp(apt)}
                    style={[
                      styles.whatsappBtn,
                      isSent && styles.whatsappBtnSent,
                    ]}
                  >
                    <Ionicons
                      name={isSent ? "checkmark-circle" : "logo-whatsapp"}
                      size={20}
                      color={colors.white}
                    />
                    <Text style={styles.whatsappBtnText}>
                      {isSent ? "Enviado" : "Enviar por WhatsApp"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={colors.divider}
            />
            <Text style={styles.emptyText}>
              No hay citas programadas para mañana
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
  },

  // Info card
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: spacing["2xl"],
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    textTransform: "capitalize",
  },
  infoSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Section
  section: {
    paddingHorizontal: spacing["2xl"],
    gap: 12,
  },

  // Appointment card
  aptCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  aptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aptInfo: {
    flex: 1,
  },
  aptName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  aptDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aptPhone: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // Message preview
  messagePreview: {
    marginTop: 12,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: 12,
  },
  messageText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // WhatsApp button
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
    backgroundColor: "#25D366",
    borderRadius: radius.full,
    paddingVertical: 12,
  },
  whatsappBtnSent: {
    backgroundColor: colors.success,
  },
  whatsappBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
    marginHorizontal: spacing["2xl"],
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
});
