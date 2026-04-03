import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { procedures, photos } from "@/db/schema";
import { deletePhoto } from "@/services/photo.service";
import { formatDate } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import { PIGMENT_COLORS, NEEDLE_TYPES } from "@/constants/procedure";
import { colors, spacing, radius } from "@/theme";
import type { Procedure, Photo, ToneEntry, NeedleEntry } from "@/types/models";

export default function ProcedureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [procPhotos, setProcPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [proc] = await db
        .select()
        .from(procedures)
        .where(eq(procedures.id, id))
        .limit(1);
      setProcedure((proc as Procedure) || null);

      const photoResults = await db
        .select()
        .from(photos)
        .where(eq(photos.procedureId, id));
      setProcPhotos(photoResults as Photo[]);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      "Eliminar foto",
      "Estas segura que deseas eliminar esta foto? Esta accion no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            await deletePhoto(photoId);
            setProcPhotos((prev) => prev.filter((p) => p.id !== photoId));
          },
        },
      ]
    );
  };

  if (loading || !procedure) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>
          {loading ? "Cargando..." : "Procedimiento no encontrado"}
        </Text>
      </SafeAreaView>
    );
  }

  const typeLabel =
    PROCEDURE_TYPES.find((t) => t.key === procedure.type)?.label ||
    procedure.type;

  const tones: ToneEntry[] = procedure.tones
    ? JSON.parse(procedure.tones)
    : [];
  const needlesList: NeedleEntry[] = procedure.needles
    ? JSON.parse(procedure.needles)
    : [];

  const beforePhotos = procPhotos.filter((p) => p.type === "before");
  const afterPhotos = procPhotos.filter((p) => p.type === "after");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Detalle del procedimiento</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General info */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>{formatDate(procedure.date)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Zona</Text>
            <Text style={styles.value}>{typeLabel}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Tecnica</Text>
            <Text style={styles.value}>{procedure.technique || "—"}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.label}>Costo</Text>
            <Text style={[styles.value, { color: colors.primary, fontWeight: "700" }]}>
              ${procedure.cost.toLocaleString()} MXN
            </Text>
          </View>
        </View>

        {/* Tones */}
        {tones.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Tonos utilizados</Text>
            <View style={styles.card}>
              {tones.map((tone) => {
                const colorInfo = PIGMENT_COLORS.find(
                  (c) => c.key === tone.color
                );
                return (
                  <View key={tone.color} style={styles.toneRow}>
                    <View
                      style={[
                        styles.toneDot,
                        { backgroundColor: colorInfo?.hex || "#999" },
                      ]}
                    />
                    <Text style={styles.toneLabel}>
                      {colorInfo?.label || tone.color}
                    </Text>
                    <Text style={styles.toneDrops}>{tone.drops} gotas</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Needles */}
        {needlesList.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Agujas utilizadas</Text>
            <View style={styles.card}>
              {needlesList.map((needle, i) => {
                const typeInfo = NEEDLE_TYPES.find(
                  (t) => t.key === needle.type
                );
                return (
                  <View key={i} style={styles.needleRow}>
                    <Ionicons
                      name="hardware-chip-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.needleText}>
                      {typeInfo?.label || needle.type} · Calibre {needle.gauge} ·{" "}
                      {needle.count} agujas
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Notes */}
        {procedure.notes && (
          <>
            <Text style={styles.sectionTitle}>Notas</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{procedure.notes}</Text>
            </View>
          </>
        )}

        {/* Before / After photos */}
        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>Fotos</Text>

            {beforePhotos.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.photoGroupLabel}>Antes</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingTop: 10, paddingRight: 10 }}
                >
                  {beforePhotos.map((photo) => (
                    <View key={photo.id} style={styles.photoWrap}>
                      <Image
                        source={{ uri: photo.localUri }}
                        style={styles.photo}
                      />
                      <Pressable
                        onPress={() => handleDeletePhoto(photo.id)}
                        style={styles.photoDeleteBtn}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {afterPhotos.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.photoGroupLabel}>Despues</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingTop: 10, paddingRight: 10 }}
                >
                  {afterPhotos.map((photo) => (
                    <View key={photo.id} style={styles.photoWrap}>
                      <Image
                        source={{ uri: photo.localUri }}
                        style={styles.photo}
                      />
                      <Pressable
                        onPress={() => handleDeletePhoto(photo.id)}
                        style={styles.photoDeleteBtn}
                      >
                        <Ionicons name="close-circle" size={24} color={colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Side by side comparison */}
            {beforePhotos.length > 0 && afterPhotos.length > 0 && (
              <View>
                <Text style={styles.photoGroupLabel}>Comparativo</Text>
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonSide}>
                    <Image
                      source={{ uri: beforePhotos[0].localUri }}
                      style={styles.comparisonPhoto}
                    />
                    <Text style={styles.comparisonLabel}>Antes</Text>
                  </View>
                  <View style={styles.comparisonSide}>
                    <Image
                      source={{ uri: afterPhotos[0].localUri }}
                      style={styles.comparisonPhoto}
                    />
                    <Text style={styles.comparisonLabel}>Despues</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
  scrollContent: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: 40,
  },

  // Cards
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 12,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 13, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: "500", color: colors.text },

  // Sections
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
    marginTop: 8,
  },

  // Tones
  toneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toneDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  toneLabel: { flex: 1, fontSize: 14, color: colors.text },
  toneDrops: { fontSize: 13, color: colors.textSecondary },

  // Needles
  needleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  needleText: { fontSize: 14, color: colors.text },

  // Notes
  notesText: { fontSize: 14, color: colors.text, lineHeight: 20 },

  // Photos
  photoGroupLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  photoWrap: {
    position: "relative",
  },
  photo: {
    width: 160,
    height: 200,
    borderRadius: radius.md,
  },
  photoDeleteBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },

  // Comparison
  comparisonRow: {
    flexDirection: "row",
    gap: 12,
  },
  comparisonSide: { flex: 1, alignItems: "center", gap: 6 },
  comparisonPhoto: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});
