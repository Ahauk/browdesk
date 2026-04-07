import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  StyleSheet,
  Dimensions,
  FlatList,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useInspirations } from "@/hooks/useInspirations";
import { pickPhoto, takePhoto } from "@/services/photo.service";
import { BrowIcon } from "@/components/ui/BrowIcon";
import { LipsIcon } from "@/components/ui/LipsIcon";
import { colors, spacing, radius } from "@/theme";
import type { InspirationCategory, Inspiration } from "@/types/models";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 4;
const COLS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - spacing["2xl"] * 2 - GRID_GAP * (COLS - 1)) / COLS;

const CATEGORIES: { key: InspirationCategory; label: string; icon: string }[] = [
  { key: "brows", label: "Cejas", icon: "brows" },
  { key: "lips", label: "Labios", icon: "lips" },
  { key: "eyes", label: "Ojos", icon: "eye-outline" },
];

function CategoryIcon({
  icon,
  size,
  color,
}: {
  icon: string;
  size: number;
  color: string;
}) {
  if (icon === "brows") return <BrowIcon size={size} color={color} />;
  if (icon === "lips") return <LipsIcon size={size} color={color} />;
  return <Ionicons name={icon as any} size={size} color={color} />;
}

export default function InspirationScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] =
    useState<InspirationCategory>("brows");
  const {
    inspirations,
    loading,
    refresh,
    addInspiration,
    deleteInspiration,
  } = useInspirations(activeCategory);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleAdd = () => {
    Alert.alert("Agregar foto", "¿De dónde quieres agregar?", [
      {
        text: "Cámara",
        onPress: async () => {
          const uri = await takePhoto();
          if (uri) await addInspiration(uri, activeCategory);
        },
      },
      {
        text: "Galería",
        onPress: async () => {
          const uri = await pickPhoto();
          if (uri) await addInspiration(uri, activeCategory);
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleDelete = (item: Inspiration) => {
    Alert.alert("Eliminar", "¿Eliminar esta foto de inspiración?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteInspiration(item.id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Inspiration }) => (
    <Pressable
      onLongPress={() => handleDelete(item)}
      style={styles.gridItem}
    >
      <Image source={{ uri: item.localUri }} style={styles.gridImage} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Inspiración</Text>
        <Pressable onPress={handleAdd} hitSlop={12}>
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </Pressable>
      </View>

      {/* Category tabs */}
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              style={[
                styles.categoryTab,
                isActive && styles.categoryTabActive,
              ]}
            >
              <CategoryIcon
                icon={cat.icon}
                size={18}
                color={isActive ? colors.white : colors.textSecondary}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  isActive && styles.categoryLabelActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Gallery grid */}
      {inspirations.length > 0 ? (
        <FlatList
          data={inspirations}
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          renderItem={renderItem}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <CategoryIcon
            icon={CATEGORIES.find((c) => c.key === activeCategory)?.icon || ""}
            size={48}
            color={colors.divider}
          />
          <Text style={styles.emptyTitle}>Sin fotos aún</Text>
          <Text style={styles.emptyHint}>
            Agrega fotos de referencia para mostrar a tus clientas
          </Text>
          <Pressable onPress={handleAdd} style={styles.emptyAddBtn}>
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={styles.emptyAddText}>Agregar foto</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },

  // Category tabs
  categoryRow: {
    flexDirection: "row",
    paddingHorizontal: spacing["2xl"],
    gap: 10,
    marginBottom: spacing.lg,
  },
  categoryTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  categoryLabelActive: {
    color: colors.white,
  },

  // Grid
  gridContent: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: 40,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.full,
    marginTop: 8,
  },
  emptyAddText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});
