import { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { procedures, photos } from "@/db/schema";
import { Button, Input, CartridgeIcon, InkBottlesIcon } from "@/components/ui";
import { useProcedures } from "@/hooks/useProcedures";
import {
  pickPhoto,
  takePhoto,
  savePhoto,
  deletePhoto,
} from "@/services/photo.service";
import { PROCEDURE_TYPES } from "@/constants";
import {
  PIGMENT_COLORS,
  NEEDLE_TYPES,
  NEEDLE_GAUGES,
} from "@/constants/procedure";
import { colors, spacing, radius } from "@/theme";
import type { Procedure, Photo, ToneEntry, NeedleEntry } from "@/types/models";

export default function EditProcedureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { updateProcedure } = useProcedures();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [procedure, setProcedure] = useState<Procedure | null>(null);

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

  // Photos
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<Set<string>>(
    new Set()
  );
  const [newPhotos, setNewPhotos] = useState<string[]>([]);

  // ── Load procedure data ──
  useEffect(() => {
    if (!id) return;
    (async () => {
      const [proc] = await db
        .select()
        .from(procedures)
        .where(eq(procedures.id, id))
        .limit(1);

      if (!proc) {
        Alert.alert("Error", "Procedimiento no encontrado", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      const p = proc as Procedure;
      setProcedure(p);

      // Tones
      if (p.tones) {
        try {
          setTones(JSON.parse(p.tones));
        } catch {}
      }

      // Needles
      if (p.needles) {
        try {
          setNeedles(JSON.parse(p.needles));
        } catch {}
      }

      // Notes
      setNotes(p.notes ?? "");

      // After photos
      const photoResults = await db
        .select()
        .from(photos)
        .where(eq(photos.procedureId, id));
      setExistingPhotos(
        (photoResults as Photo[]).filter((ph) => ph.type === "after")
      );

      setLoading(false);
    })();
  }, [id]);

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
      {
        type: needleType,
        gauge: needleGauge,
        count: parseInt(needleCount, 10),
      },
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
  const visibleExisting = existingPhotos.filter(
    (p) => !removedPhotoIds.has(p.id)
  );
  const totalPhotos = visibleExisting.length + newPhotos.length;

  const handleAddPhoto = async (mode: "camera" | "gallery") => {
    if (totalPhotos >= 5) {
      Alert.alert("Límite", "Máximo 5 fotos después del procedimiento");
      return;
    }
    const uri = mode === "camera" ? await takePhoto() : await pickPhoto();
    if (uri) setNewPhotos((prev) => [...prev, uri]);
  };

  const removeExistingPhoto = (photoId: string) => {
    setRemovedPhotoIds((prev) => new Set(prev).add(photoId));
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateProcedure(id!, {
        tones: tones.length > 0 ? JSON.stringify(tones) : undefined,
        needles: needles.length > 0 ? JSON.stringify(needles) : undefined,
        notes: notes.trim() || undefined,
      });

      if (!success) {
        Alert.alert("Error", "No se pudo actualizar el procedimiento");
        return;
      }

      // Delete removed photos
      for (const photoId of removedPhotoIds) {
        await deletePhoto(photoId);
      }

      // Save new photos
      if (procedure) {
        for (const uri of newPhotos) {
          await savePhoto(uri, procedure.clientId, procedure.id, "after");
        }
      }

      Alert.alert(
        "Procedimiento actualizado",
        "Los cambios se guardaron exitosamente",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Error", "Ocurrió un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  /* ═══════════════════════ Loading ═══════════════════════ */
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (!procedure) return null;

  const typeLabel =
    PROCEDURE_TYPES.find((t) => t.key === procedure.type)?.label ||
    procedure.type;

  /* ═══════════════════════ Render ═══════════════════════ */
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
          <Text style={styles.headerTitle}>Editar procedimiento</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Procedure info (read-only) */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Zona</Text>
            <Text style={styles.infoValue}>{typeLabel}</Text>
            {procedure.technique && (
              <>
                <Text style={[styles.infoLabel, { marginTop: 8 }]}>
                  Técnica
                </Text>
                <Text style={styles.infoValue}>{procedure.technique}</Text>
              </>
            )}
            <Text style={[styles.infoLabel, { marginTop: 8 }]}>Costo</Text>
            <Text style={styles.infoValue}>
              ${procedure.cost.toLocaleString()} MXN
            </Text>
          </View>

          {/* ── Tonos utilizados ── */}
          <View style={styles.sectionHeader}>
            <InkBottlesIcon size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Tonos utilizados</Text>
          </View>

          {tones.length > 0 && (
            <View style={styles.tonesListCard}>
              {tones.map((tone) => {
                const colorInfo = PIGMENT_COLORS.find(
                  (c) => c.key === tone.color
                );
                return (
                  <View key={tone.color} style={styles.toneRow}>
                    <View
                      style={[
                        styles.toneColorDot,
                        { backgroundColor: colorInfo?.hex || "#999" },
                      ]}
                    />
                    <Text style={styles.toneName}>
                      {colorInfo?.label || tone.color}
                    </Text>
                    <View style={styles.toneDropsControl}>
                      <Pressable
                        onPress={() =>
                          updateToneDrops(tone.color, tone.drops - 1)
                        }
                        style={styles.toneBtn}
                      >
                        <Text style={styles.toneBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.toneDrops}>{tone.drops} gotas</Text>
                      <Pressable
                        onPress={() =>
                          updateToneDrops(tone.color, tone.drops + 1)
                        }
                        style={styles.toneBtn}
                      >
                        <Text style={styles.toneBtnText}>+</Text>
                      </Pressable>
                    </View>
                    <Pressable onPress={() => removeTone(tone.color)} hitSlop={8}>
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

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
                  <View
                    style={[styles.colorCircle, { backgroundColor: color.hex }]}
                  />
                  <Text style={styles.colorLabel}>{color.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              onPress={() => setShowToneSelector(true)}
              style={styles.addButton}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.addButtonText}>Agregar tono</Text>
            </Pressable>
          )}

          {/* ── Agujas utilizadas ── */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <CartridgeIcon size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Agujas utilizadas</Text>
          </View>

          {needles.length > 0 && (
            <View style={styles.tonesListCard}>
              {needles.map((needle, index) => (
                <View key={index} style={styles.toneRow}>
                  <Ionicons
                    name="hardware-chip-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.toneName}>
                    {needle.type} · Calibre {needle.gauge} · {needle.count}{" "}
                    agujas
                  </Text>
                  <Pressable onPress={() => removeNeedle(index)} hitSlop={8}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.danger}
                    />
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
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={colors.primary}
              />
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
            Fotos después del procedimiento
          </Text>
          <Text style={styles.photoHint}>Hasta 5 fotos del resultado final</Text>

          <View style={styles.photoGrid}>
            {/* Existing photos */}
            {visibleExisting.map((photo) => (
              <View key={photo.id} style={styles.photoThumb}>
                <Image
                  source={{ uri: photo.localUri }}
                  style={styles.photoThumbImage}
                />
                <Pressable
                  onPress={() => removeExistingPhoto(photo.id)}
                  style={styles.photoRemoveBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={colors.danger}
                  />
                </Pressable>
              </View>
            ))}
            {/* New photos */}
            {newPhotos.map((uri, index) => (
              <View key={`new-${index}`} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoThumbImage} />
                <Pressable
                  onPress={() => removeNewPhoto(index)}
                  style={styles.photoRemoveBtn}
                >
                  <Ionicons
                    name="close-circle"
                    size={22}
                    color={colors.danger}
                  />
                </Pressable>
                <View style={styles.newBadge}>
                  <Ionicons name="add" size={12} color={colors.white} />
                </View>
              </View>
            ))}
            {totalPhotos < 5 && (
              <View style={styles.photoAddButtons}>
                <Pressable
                  onPress={() => handleAddPhoto("camera")}
                  style={styles.photoAddBtn}
                >
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.photoAddText}>Cámara</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleAddPhoto("gallery")}
                  style={styles.photoAddBtn}
                >
                  <Ionicons
                    name="images-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.photoAddText}>Galería</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save button */}
        <View style={styles.bottomButton}>
          <Button
            title="Guardar cambios"
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
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
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
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
  toneDrops: {
    fontSize: 13,
    color: colors.textSecondary,
    minWidth: 50,
    textAlign: "center",
  },

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
  colorLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: "center",
  },

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
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
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
  newBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: colors.accent,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
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
