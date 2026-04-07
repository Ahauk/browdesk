import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, Avatar, PhoneInput } from "@/components/ui";
import { MiniCalendar } from "@/components/ui/MiniCalendar";
import { useAppointments } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { fullName } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import { colors, spacing, radius } from "@/theme";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type { Client, ProcedureType } from "@/types/models";

dayjs.extend(customParseFormat);

/* ───────────────── Duration options ───────────────── */
const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "1:30 hrs", value: 90 },
  { label: "2 horas", value: 120 },
  { label: "2:30 hrs", value: 150 },
  { label: "3 horas", value: 180 },
];

/* ───────────────── Time slots (10am - 7pm) ───────────────── */
const TIME_SLOTS: string[] = [];
for (let h = 10; h <= 19; h++) {
  for (const m of ["00", "30"]) {
    if (h === 19 && m === "30") continue; // stop at 19:00
    TIME_SLOTS.push(`${h.toString().padStart(2, "0")}:${m}`);
  }
}

function formatTimeLabel(time: string): string {
  const d = dayjs(time, "HH:mm");
  return d.format("h:mm A");
}

/* ═══════════════════════ Main Screen ═══════════════════════ */
export default function NewAppointmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const { appointments, createAppointment } = useAppointments();
  const { clients, searchClients, createClient } = useClients();

  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProspect, setIsProspect] = useState(false);
  const [prospectFirstName, setProspectFirstName] = useState("");
  const [prospectLastName, setProspectLastName] = useState("");
  const [prospectPhone, setProspectPhone] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    params.date || dayjs().format("YYYY-MM-DD")
  );
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(60); // default 1 hour
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");

  // Compute end time from start + duration
  const endTime = useMemo(() => {
    if (!selectedTime) return "";
    return dayjs(selectedTime, "HH:mm").add(duration, "minute").format("HH:mm");
  }, [selectedTime, duration]);

  // Find busy time ranges for the selected date (only scheduled appointments)
  const busyRanges = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDate && a.status === "scheduled")
      .map((a) => ({
        start: a.time,
        end: a.endTime || dayjs(a.time, "HH:mm").add(a.duration || 60, "minute").format("HH:mm"),
      }));
  }, [appointments, selectedDate]);

  // Check if a time slot would conflict with existing appointments
  const isTimeConflicting = useCallback(
    (time: string): boolean => {
      const slotStart = dayjs(time, "HH:mm");
      const slotEnd = slotStart.add(duration, "minute");

      return busyRanges.some((range) => {
        const busyStart = dayjs(range.start, "HH:mm");
        const busyEnd = dayjs(range.end, "HH:mm");
        // Overlap: slotStart < busyEnd AND slotEnd > busyStart
        return slotStart.isBefore(busyEnd) && slotEnd.isAfter(busyStart);
      });
    },
    [busyRanges, duration]
  );

  // Client search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      searchClients(query);
    },
    [searchClients]
  );

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery("");
  };

  const clearClient = () => {
    setSelectedClient(null);
  };

  // Procedure type toggle (multi-select)
  const toggleType = (key: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Save
  const handleSave = async () => {
    if (!selectedClient && !isProspect) {
      Alert.alert("Error", "Selecciona una clienta o crea un prospecto");
      return;
    }
    if (isProspect && (!prospectFirstName.trim() || !prospectLastName.trim() || !prospectPhone.trim())) {
      Alert.alert("Error", "Completa nombre, apellido y teléfono");
      return;
    }
    if (!selectedTime) {
      Alert.alert("Error", "Selecciona una hora");
      return;
    }

    // Conflict check
    if (isTimeConflicting(selectedTime)) {
      Alert.alert(
        "Conflicto de horario",
        "Ya hay una cita en ese horario. ¿Deseas agendar de todas formas?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Agendar igual", onPress: () => doSave() },
        ]
      );
      return;
    }

    doSave();
  };

  const doSave = async () => {
    setSaving(true);
    try {
      let clientId = selectedClient?.id;

      // Create prospect client if needed
      if (isProspect && !clientId) {
        const newClient = await createClient({
          firstName: prospectFirstName.trim(),
          lastName: prospectLastName.trim(),
          phone: prospectPhone.trim(),
        });
        if (!newClient) {
          Alert.alert("Error", "No se pudo crear el prospecto");
          return;
        }
        clientId = newClient.id;
      }

      if (!clientId) {
        Alert.alert("Error", "No se pudo identificar la clienta");
        return;
      }

      const typesArray = Array.from(selectedTypes);
      const result = await createAppointment({
        clientId,
        procedureType: (typesArray[0] as ProcedureType) || undefined,
        procedureTypes:
          typesArray.length > 0 ? JSON.stringify(typesArray) : undefined,
        date: selectedDate,
        time: selectedTime,
        endTime,
        duration,
        notes: notes.trim() || undefined,
        status: "scheduled",
      });

      if (result) {
        Alert.alert("Cita creada", "La cita se agendó exitosamente", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", "No se pudo crear la cita");
      }
    } catch {
      Alert.alert("Error", "Ocurrió un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Nueva cita</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Clienta ── */}
          <View style={styles.clientHeaderRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Clienta *</Text>
            <Pressable
              onPress={() => {
                setIsProspect(!isProspect);
                setSelectedClient(null);
                setSearchQuery("");
              }}
              style={[
                styles.prospectToggle,
                isProspect && styles.prospectToggleActive,
              ]}
            >
              <Ionicons
                name={isProspect ? "person-add" : "person-add-outline"}
                size={16}
                color={isProspect ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.prospectToggleText,
                  isProspect && styles.prospectToggleTextActive,
                ]}
              >
                Nueva
              </Text>
            </Pressable>
          </View>

          {isProspect ? (
            <View style={styles.prospectForm}>
              <Text style={styles.prospectHint}>
                Se creará como clienta nueva al agendar
              </Text>
              <Input
                label="Nombre *"
                placeholder="Nombre"
                value={prospectFirstName}
                onChangeText={setProspectFirstName}
                variant="light"
                maxLength={30}
              />
              <Input
                label="Apellido *"
                placeholder="Apellido"
                value={prospectLastName}
                onChangeText={setProspectLastName}
                variant="light"
                maxLength={30}
              />
              <PhoneInput
                label="Teléfono *"
                value={prospectPhone}
                onChangeText={(raw) => setProspectPhone(raw)}
              />
            </View>
          ) : selectedClient ? (
            <View style={styles.selectedClientCard}>
              <Avatar
                firstName={selectedClient.firstName}
                lastName={selectedClient.lastName}
                uri={selectedClient.avatarUri}
                size="md"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedClientName}>
                  {fullName(selectedClient.firstName, selectedClient.lastName)}
                </Text>
                <Text style={styles.selectedClientPhone}>
                  {selectedClient.phone}
                </Text>
              </View>
              <Pressable onPress={clearClient} hitSlop={8}>
                <Ionicons
                  name="close-circle"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          ) : (
            <>
              <Input
                placeholder="Buscar por nombre o teléfono..."
                value={searchQuery}
                onChangeText={handleSearch}
                variant="light"
              />
              {clients.length > 0 && (
                <View style={styles.clientList}>
                  {clients.slice(0, 5).map((client) => (
                    <Pressable
                      key={client.id}
                      onPress={() => selectClient(client)}
                      style={styles.clientOption}
                    >
                      <Avatar
                        firstName={client.firstName}
                        lastName={client.lastName}
                        uri={client.avatarUri}
                        size="sm"
                      />
                      <View>
                        <Text style={styles.clientOptionName}>
                          {fullName(client.firstName, client.lastName)}
                        </Text>
                        <Text style={styles.clientOptionPhone}>
                          {client.phone}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── Fecha ── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Fecha *</Text>
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* ── Duración ── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Duración *
          </Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d) => {
              const isSelected = duration === d.value;
              return (
                <Pressable
                  key={d.value}
                  onPress={() => setDuration(d.value)}
                  style={[
                    styles.durationChip,
                    isSelected && styles.durationChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      isSelected && styles.durationChipTextSelected,
                    ]}
                  >
                    {d.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Hora ── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Hora *</Text>
          {selectedTime ? (
            <View style={styles.timeRangeDisplay}>
              <Ionicons
                name="time-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.timeRangeText}>
                {formatTimeLabel(selectedTime)} — {formatTimeLabel(endTime)}
              </Text>
              <Pressable
                onPress={() => setSelectedTime("")}
                hitSlop={8}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map((time) => {
              const isSelected = time === selectedTime;
              const isBusy = isTimeConflicting(time);
              return (
                <Pressable
                  key={time}
                  onPress={() => {
                    if (!isBusy) setSelectedTime(time);
                  }}
                  style={[
                    styles.timeChip,
                    isSelected && styles.timeChipSelected,
                    isBusy && !isSelected && styles.timeChipBusy,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      isSelected && styles.timeChipTextSelected,
                      isBusy && !isSelected && styles.timeChipTextBusy,
                    ]}
                  >
                    {formatTimeLabel(time)}
                  </Text>
                  {isBusy && !isSelected && (
                    <View style={styles.busyDot} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* ── Procedimientos ── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Procedimientos
          </Text>
          <View style={styles.typeRow}>
            {PROCEDURE_TYPES.map((type) => {
              const isSelected = selectedTypes.has(type.key);
              return (
                <Pressable
                  key={type.key}
                  onPress={() => toggleType(type.key)}
                  style={[
                    styles.typeChip,
                    isSelected && styles.typeChipSelected,
                  ]}
                >
                  <Ionicons
                    name={isSelected ? "checkbox" : "square-outline"}
                    size={18}
                    color={isSelected ? colors.white : colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.typeChipText,
                      isSelected && styles.typeChipTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* ── Notas ── */}
          <View style={{ marginTop: 24 }}>
            <Input
              label="Notas"
              placeholder="Observaciones o recordatorios..."
              value={notes}
              onChangeText={setNotes}
              variant="light"
              multiline
              numberOfLines={3}
              maxLength={300}
            />
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={styles.bottomButton}>
          <Button
            title="Agendar cita"
            onPress={handleSave}
            loading={saving}
            disabled={(!selectedClient && !isProspect) || (isProspect && (!prospectFirstName.trim() || !prospectLastName.trim() || !prospectPhone.trim())) || !selectedTime}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
  scrollContent: { paddingHorizontal: spacing["2xl"], paddingBottom: 120 },

  // Sections
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
  },

  // Client header with prospect toggle
  clientHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  prospectToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  prospectToggleActive: {
    backgroundColor: colors.primary,
  },
  prospectToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  prospectToggleTextActive: {
    color: colors.white,
  },
  prospectForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  prospectHint: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "500",
    textAlign: "center",
  },

  // Client selection
  selectedClientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  selectedClientName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  selectedClientPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clientList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginTop: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  clientOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  clientOptionName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  clientOptionPhone: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Duration
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  durationChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationChipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "500",
  },
  durationChipTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },

  // Time range display
  timeRangeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
  },
  timeRangeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },

  // Time grid
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: "center",
  },
  timeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipBusy: {
    backgroundColor: colors.surfaceSoft,
    borderColor: colors.divider,
    opacity: 0.6,
  },
  timeChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  timeChipTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
  timeChipTextBusy: {
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  busyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.danger,
    marginTop: 2,
  },

  // Procedure types
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  typeChipTextSelected: {
    color: colors.white,
  },

  // Bottom
  bottomButton: { paddingHorizontal: spacing["2xl"], paddingBottom: 32 },
});
