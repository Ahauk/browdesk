import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "@/components/ui";
import { useProcedures } from "@/hooks/useProcedures";
import { pickPhoto, takePhoto, savePhoto } from "@/services/photo.service";
import { PIGMENT_COLORS, NEEDLE_TYPES, NEEDLE_GAUGES } from "@/constants/procedure";
import { colors, spacing, radius } from "@/theme";
import type { ToneEntry, NeedleEntry } from "@/types/models";

export default function NewProcedureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    clientId: string;
    clientName?: string;
    serviceType?: string;
    technique?: string;
    cost?: string;
  }>();

  const { createProcedure } = useProcedures();

  // Tones
  const [tones, setTones] = useState<ToneEntry[]>([]);
  const [showToneSelector, setShowToneSelector] = useState(false);

  // Needles
  const [needles, setNeedles] = useState<NeedleEntry[]>([]);
  const [showNeedleForm, setShowNeedleForm] = useState(false);
  const [needleType, setNeedleType] = useState("");
  const [needleGauge, setNeedleGauge] = useState("");
  const [needleCount, setNeedleCount] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  // After photos
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);

  // ── Tone helpers ──
  const addTone = (colorKey: string) => {
    const existing = tones.find((t) => t.color === colorKey);
    if (existing) {
      setTones((prev) =>
        prev.map((t) =>
          t.color === colorKey ? { ...t, drops: t.drops + 1 } : t
        )
      );
    } else {
      setTones((prev) => [...prev, { color: colorKey, drops: 1 }]);
    }
  };

  const updateToneDrops = (colorKey: string, drops: number) => {
    if (drops <= 0) {
      setTones((prev) => prev.filter((t) => t.color !== colorKey));
    } else {
      setTones((prev) =>
        prev.map((t) => (t.color === colorKey ? { ...t, drops } : t))
      );
    }
  };

  const removeTone = (colorKey: string) => {
    setTones((prev) => prev.filter((t) => t.color !== colorKey));
  };

  // ── Needle helpers ──
  const addNeedle = () => {
    if (!needleType || !needleGauge || !needleCount) return;
    setNeedles((prev) => [
      ...prev,
      { type: needleType, gauge: needleGauge, count: parseInt(needleCount, 10) },
    ]);
    setNeedleType("");
    setNeedleGauge("");
    setNeedleCount("");
    setShowNeedleForm(false);
  };

  const removeNeedle = (index: number) => {
    setNeedles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Photo helpers ──
  const handleAddPhoto = async (mode: "camera" | "gallery") => {
    if (afterPhotos.length >= 5) {
      Alert.alert("Limite", "Maximo 5 fotos despues del procedimiento");
      return;
    }
    const uri = mode === "camera" ? await takePhoto() : await pickPhoto();
    if (uri) setAfterPhotos((prev) => [...prev, uri]);
  };

  const removePhoto = (index: number) => {
    setAfterPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const procedure = await createProcedure({
        clientId: params.clientId,
        type: (params.serviceType as any) || "brows",
        technique: params.technique || "",
        cost: parseFloat(params.cost || "0"),
        tones: tones.length > 0 ? JSON.stringify(tones) : undefined,
        needles: needles.length > 0 ? JSON.stringify(needles) : undefined,
        notes: notes.trim() || undefined,
        date: new Date().toISOString().split("T")[0],
      });

      if (procedure) {
        // Save after photos
        for (const uri of afterPhotos) {
          await savePhoto(uri, params.clientId, procedure.id, "after");
        }
        Alert.alert(
          "Procedimiento guardado",
          "El registro se guardo exitosamente",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert("Error", "No se pudo guardar el procedimiento");
      }
    } catch {
      Alert.alert("Error", "Ocurrio un error al guardar");
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
          <Text style={styles.headerTitle}>Registrar procedimiento</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Client info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Clienta</Text>
            <Text style={styles.infoValue}>{params.clientName || "—"}</Text>
            {params.technique && (
              <>
                <Text style={[styles.infoLabel, { marginTop: 8 }]}>Servicio</Text>
                <Text style={styles.infoValue}>{params.technique}</Text>
              </>
            )}
            {params.cost && (
              <>
                <Text style={[styles.infoLabel, { marginTop: 8 }]}>Costo</Text>
                <Text style={styles.infoValue}>${parseFloat(params.cost).toLocaleString()} MXN</Text>
              </>
            )}
          </View>

          {/* ── Tonos utilizados ── */}
          <Text style={styles.sectionTitle}>Tonos utilizados</Text>

          {/* Current tones */}
          {tones.length > 0 && (
            <View style={styles.tonesListCard}>
              {tones.map((tone) => {
                const colorInfo = PIGMENT_COLORS.find((c) => c.key === tone.color);
                return (
                  <View key={tone.color} style={styles.toneRow}>
                    <View style={[styles.toneColorDot, { backgroundColor: colorInfo?.hex || "#999" }]} />
                    <Text style={styles.toneName}>{colorInfo?.label || tone.color}</Text>
                    <View style={styles.toneDropsControl}>
                      <Pressable
                        onPress={() => updateToneDrops(tone.color, tone.drops - 1)}
                        style={styles.toneBtn}
                      >
                        <Text style={styles.toneBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.toneDrops}>{tone.drops} gotas</Text>
                      <Pressable
                        onPress={() => updateToneDrops(tone.color, tone.drops + 1)}
                        style={styles.toneBtn}
                      >
                        <Text style={styles.toneBtnText}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable onPress={() => removeTone(tone.color)} hitSlop={8}>
                      <Ionicons name="close-circle" size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {/* Add tone button / selector */}
          {showToneSelector ? (
            <View style={styles.colorGrid}>
              {PIGMENT_COLORS.map((color) => (
                <Pressable
                  key={color.key}
                  onPress={() => {
                    addTone(color.key);
                    setShowToneSelector(false);
                  }}
                  style={styles.colorOption}
                >
                  <View style={[styles.colorCircle, { backgroundColor: color.hex }]} />
                  <Text style={styles.colorLabel}>{color.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              onPress={() => setShowToneSelector(true)}
              style={styles.addButton}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addButtonText}>Agregar tono</Text>
            </Pressable>
          )}

          {/* ── Agujas utilizadas ── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Agujas utilizadas</Text>

          {needles.length > 0 && (
            <View style={styles.tonesListCard}>
              {needles.map((needle, index) => (
                <View key={index} style={styles.toneRow}>
                  <Ionicons name="hardware-chip-outline" size={18} color={colors.primary} />
                  <Text style={styles.toneName}>
                    {needle.type} · Calibre {needle.gauge} · {needle.count} agujas
                  </Text>
                  <Pressable onPress={() => removeNeedle(index)} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={colors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {showNeedleForm ? (
            <View style={styles.needleForm}>
              <Text style={styles.needleFormLabel}>Tipo</Text>
              <View style={styles.chipRow}>
                {NEEDLE_TYPES.map((nt) => (
                  <Pressable
                    key={nt.key}
                    onPress={() => setNeedleType(nt.key)}
                    style={[
                      styles.chip,
                      needleType === nt.key && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        needleType === nt.key && styles.chipTextSelected,
                      ]}
                    >
                      {nt.key}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.needleFormLabel}>Calibre</Text>
              <View style={styles.chipRow}>
                {NEEDLE_GAUGES.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setNeedleGauge(g)}
                    style={[
                      styles.chip,
                      needleGauge === g && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        needleGauge === g && styles.chipTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Cantidad de agujas"
                placeholder="Ej. 12"
                value={needleCount}
                onChangeText={setNeedleCount}
                variant="light"
                keyboardType="numeric"
                maxLength={3}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button title="Agregar" onPress={addNeedle} size="sm" />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancelar"
                    onPress={() => setShowNeedleForm(false)}
                    variant="outline"
                    size="sm"
                  />
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowNeedleForm(true)}
              style={styles.addButton}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addButtonText}>Agregar aguja</Text>
            </Pressable>
          )}

          {/* ── Notas ── */}
          <View style={{ marginTop: 24 }}>
            <Input
              label="Notas del procedimiento"
              placeholder="Observaciones, recomendaciones, etc."
              value={notes}
              onChangeText={setNotes}
              variant="light"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          {/* ── Fotos después ── */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Fotos despues del procedimiento
          </Text>
          <Text style={styles.photoHint}>
            Hasta 5 fotos del resultado final
          </Text>

          <View style={styles.photoGrid}>
            {afterPhotos.map((uri, index) => (
              <View key={index} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoThumbImage} />
                <Pressable
                  onPress={() => removePhoto(index)}
                  style={styles.photoRemoveBtn}
                >
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </Pressable>
              </View>
            ))}
            {afterPhotos.length < 5 && (
              <View style={styles.photoAddButtons}>
                <Pressable
                  onPress={() => handleAddPhoto("camera")}
                  style={styles.photoAddBtn}
                >
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.photoAddText}>Camara</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAddPhoto("gallery")}
                  style={styles.photoAddBtn}
                >
                  <Ionicons name="images-outline" size={24} color={colors.primary} />
                  <Text style={styles.photoAddText}>Galeria</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={styles.bottomButton}>
          <Button
            title="Guardar procedimiento"
            onPress={handleSave}
            loading={saving}
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

  // Info card
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: 20,
  },
  infoLabel: { fontSize: 11, color: colors.textSecondary },
  infoValue: { fontSize: 15, fontWeight: "600", color: colors.text, marginTop: 2 },

  // Sections
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },

  // Tones
  tonesListCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 10,
    marginBottom: 12,
  },
  toneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toneColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  toneName: { flex: 1, fontSize: 14, color: colors.text },
  toneDropsControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toneBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  toneBtnText: { fontSize: 16, fontWeight: "600", color: colors.primary },
  toneDrops: { fontSize: 13, color: colors.textSecondary, minWidth: 50, textAlign: "center" },

  // Color grid
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: 12,
  },
  colorOption: { alignItems: "center", width: 70, gap: 4 },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  colorLabel: { fontSize: 10, color: colors.textSecondary, textAlign: "center" },

  // Add button
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  addButtonText: { fontSize: 14, color: colors.primary, fontWeight: "500" },

  // Needle form
  needleForm: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 12,
    marginBottom: 12,
  },
  needleFormLabel: { fontSize: 13, fontWeight: "500", color: colors.text },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextSelected: { color: colors.white, fontWeight: "600" },

  // Photos
  photoHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoThumb: { position: "relative" },
  photoThumbImage: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
  },
  photoRemoveBtn: { position: "absolute", top: -6, right: -6 },
  photoAddButtons: { flexDirection: "row", gap: 10 },
  photoAddBtn: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  photoAddText: { fontSize: 11, color: colors.primary },

  // Bottom
  bottomButton: { paddingHorizontal: spacing["2xl"], paddingBottom: 32 },
});
