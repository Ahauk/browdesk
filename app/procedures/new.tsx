import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Badge } from "@/components/ui";
import { PROCEDURE_TYPES } from "@/constants";
import { useProcedures } from "@/hooks/useProcedures";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useClients } from "@/hooks/useClients";
import { pickPhoto, savePhoto } from "@/services/photo.service";
import {
  scheduleFollowUpReminder,
} from "@/services/notification.service";
import { fullName } from "@/utils/format";
import { colors, spacing, radius } from "@/theme";
import type { ProcedureType } from "@/types/models";
import dayjs from "dayjs";

export default function NewProcedureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string }>();
  const { createProcedure } = useProcedures();
  const { createFollowUp } = useFollowUps();
  const { clients } = useClients();

  const [selectedClientId, setSelectedClientId] = useState(
    params.clientId || ""
  );
  const [selectedType, setSelectedType] = useState<ProcedureType>("brows");
  const [technique, setTechnique] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handlePickPhoto = async (type: "before" | "after") => {
    const uri = await pickPhoto();
    if (uri) {
      if (type === "before") setBeforePhoto(uri);
      else setAfterPhoto(uri);
    }
  };

  const handleSave = async () => {
    if (!selectedClientId || !technique.trim() || !cost.trim()) return;

    setSaving(true);
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const followUpDate = dayjs().add(30, "day").format("YYYY-MM-DD");

      const procedure = await createProcedure({
        clientId: selectedClientId,
        type: selectedType,
        technique: technique.trim(),
        cost: parseFloat(cost),
        notes: notes.trim() || undefined,
        date: today,
        followUpDate,
      });

      if (!procedure) {
        Alert.alert("Error", "No se pudo guardar el procedimiento");
        return;
      }

      // Save photos if selected
      if (beforePhoto) {
        await savePhoto(beforePhoto, selectedClientId, procedure.id, "before");
      }
      if (afterPhoto) {
        await savePhoto(afterPhoto, selectedClientId, procedure.id, "after");
      }

      // Create follow-up
      await createFollowUp({
        procedureId: procedure.id,
        clientId: selectedClientId,
        dueDate: followUpDate,
        status: "pending",
        notes: `Seguimiento de ${technique}`,
      });

      // Schedule notification
      const client = selectedClient;
      if (client) {
        const reminderDate = dayjs(followUpDate)
          .subtract(1, "day")
          .hour(9)
          .toDate();
        const typeLabel =
          PROCEDURE_TYPES.find((t) => t.key === selectedType)?.label ||
          selectedType;
        await scheduleFollowUpReminder(
          fullName(client.firstName, client.lastName),
          typeLabel,
          reminderDate
        );
      }

      router.back();
    } catch {
      Alert.alert("Error", "Ocurrio un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>{"< Atras"}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Nuevo procedimiento</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Client selector */}
        {!params.clientId && (
          <View style={styles.sectionSpaced}>
            <Text style={styles.sectionLabel}>Clienta</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {clients.map((client) => (
                  <Pressable
                    key={client.id}
                    onPress={() => setSelectedClientId(client.id)}
                    style={[
                      styles.chip,
                      selectedClientId === client.id
                        ? styles.chipSelected
                        : styles.chipUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedClientId === client.id
                          ? styles.chipTextSelected
                          : styles.chipTextUnselected,
                      ]}
                    >
                      {client.firstName} {client.lastName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Procedure type */}
        <View style={styles.sectionSpaced}>
          <Text style={styles.sectionLabel}>Tipo</Text>
          <View style={styles.typeGrid}>
            {PROCEDURE_TYPES.map((type) => (
              <Pressable
                key={type.key}
                onPress={() => setSelectedType(type.key as ProcedureType)}
              >
                <Badge
                  label={type.label}
                  variant="gold"
                  selected={selectedType === type.key}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Technique */}
        <View style={styles.inputSection}>
          <Input
            label="Tecnica"
            placeholder="Ej: Microblading"
            value={technique}
            onChangeText={setTechnique}
            variant="light"
          />
        </View>

        {/* Cost */}
        <View style={styles.inputSection}>
          <Input
            label="Costo"
            placeholder="$0.00"
            value={cost}
            onChangeText={setCost}
            variant="light"
            keyboardType="numeric"
          />
        </View>

        {/* Notes */}
        <View style={styles.sectionSpaced}>
          <Input
            label="Notas"
            placeholder="Notas adicionales"
            value={notes}
            onChangeText={setNotes}
            variant="light"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Photos */}
        <View style={styles.sectionSpaced}>
          <Text style={styles.sectionLabel}>Fotos</Text>
          <View style={styles.photoRow}>
            <Pressable
              onPress={() => handlePickPhoto("before")}
              style={styles.photoBox}
            >
              {beforePhoto ? (
                <Image
                  source={{ uri: beforePhoto }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Text style={styles.photoPlus}>+</Text>
                  <Text style={styles.photoLabel}>Antes</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => handlePickPhoto("after")}
              style={styles.photoBox}
            >
              {afterPhoto ? (
                <Image
                  source={{ uri: afterPhoto }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Text style={styles.photoPlus}>+</Text>
                  <Text style={styles.photoLabel}>Despues</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={styles.bottomButton}>
        <Button
          title="Guardar"
          onPress={handleSave}
          disabled={!selectedClientId || !technique.trim() || !cost.trim()}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.ivory,
  },
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backText: {
    color: colors.brand.rose,
    fontSize: 15,
  },
  headerTitle: {
    color: colors.brand.textPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 48,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing["2xl"],
  },
  sectionSpaced: {
    marginBottom: spacing["2xl"],
  },
  sectionLabel: {
    color: colors.brand.textPrimary,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
  },
  chipSelected: {
    backgroundColor: colors.brand.rose,
  },
  chipUnselected: {
    borderWidth: 1,
    borderColor: colors.brand.roseLight,
  },
  chipText: {
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
  chipTextUnselected: {
    color: colors.brand.textPrimary,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoBox: {
    flex: 1,
    height: 112,
    backgroundColor: colors.brand.cream,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoPlus: {
    color: colors.brand.rose,
    fontSize: 24,
    marginBottom: 4,
  },
  photoLabel: {
    color: colors.brand.textSecondary,
    fontSize: 11,
  },
  bottomButton: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: 32,
  },
});
