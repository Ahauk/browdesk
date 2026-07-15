import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { setStatusBarStyle } from "expo-status-bar";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "@/components/ui";
import { ZoneIcon } from "@/components/ui/ZoneIcon";
import { useServices, type ServiceInput } from "@/hooks/useServices";
import {
  ICON_CHOICES,
  DEFAULT_CUSTOM_CATEGORY_ICON,
} from "@/constants/serviceCategories";
import { formatMoney, parseMoney } from "@/utils/money";
import type { PricingType, ServiceItem } from "@/types/models";
import { colors, spacing, radius } from "@/theme";

const PRICING_OPTIONS: { value: PricingType; label: string; desc: string }[] = [
  { value: "fixed", label: "Precio fijo", desc: "Un solo precio para el servicio." },
  {
    value: "laser",
    label: "Por sesión / paquete",
    desc: "Precio por sesión y por paquete de 10 (láser).",
  },
  {
    value: "variable",
    label: "Variable",
    desc: "Se cotiza al momento de registrar.",
  },
];

export default function ServicesScreen() {
  const router = useRouter();
  const {
    services,
    allCategories,
    categoryInfo,
    addService,
    updateService,
    deleteService,
    addCategory,
    refresh,
  } = useServices();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark");
      refresh();
    }, [refresh])
  );

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"service" | "newCategory">("service");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("fixed");
  const [price, setPrice] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [error, setError] = useState("");

  // New custom category (sub-view inside the same modal)
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState(DEFAULT_CUSTOM_CATEGORY_ICON);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setName("");
    setCategoryKey(allCategories[0]?.key ?? "cejas");
    setPricingType("fixed");
    setPrice("");
    setPackagePrice("");
    setError("");
    setFormMode("service");
    setFormOpen(true);
  }, [allCategories]);

  const openEdit = useCallback((svc: ServiceItem) => {
    setEditingId(svc.id);
    setName(svc.name);
    setCategoryKey(svc.categoryKey);
    setPricingType(svc.pricingType);
    setPrice(svc.price != null ? formatMoney(String(svc.price)) : "");
    setPackagePrice(
      svc.packagePrice != null ? formatMoney(String(svc.packagePrice)) : ""
    );
    setError("");
    setFormMode("service");
    setFormOpen(true);
  }, []);

  const openNewCategory = useCallback(() => {
    setCatName("");
    setCatIcon(DEFAULT_CUSTOM_CATEGORY_ICON);
    setFormMode("newCategory");
  }, []);

  const handleCreateCategory = useCallback(async () => {
    if (!catName.trim()) return;
    const created = await addCategory(catName.trim(), catIcon);
    if (created) {
      // Preselect the new category id so the service lands in it.
      if (typeof created === "string") setCategoryKey(created);
      setFormMode("service");
    }
  }, [catName, catIcon, addCategory]);

  const handleSave = useCallback(async () => {
    setError("");
    if (!name.trim()) {
      setError("Escribe el nombre del servicio.");
      return;
    }
    if (pricingType === "fixed" && !price.trim()) {
      setError("Ingresa el precio.");
      return;
    }
    if (pricingType === "laser" && (!price.trim() || !packagePrice.trim())) {
      setError("Ingresa precio por sesión y por paquete.");
      return;
    }

    const input: ServiceInput = {
      name,
      categoryKey,
      pricingType,
      price: pricingType === "variable" ? undefined : parseMoney(price),
      packagePrice:
        pricingType === "laser" ? parseMoney(packagePrice) : undefined,
    };

    const ok = editingId
      ? await updateService(editingId, input)
      : await addService(input);
    if (ok) setFormOpen(false);
    else setError("No se pudo guardar. Inténtalo de nuevo.");
  }, [
    name,
    categoryKey,
    pricingType,
    price,
    packagePrice,
    editingId,
    addService,
    updateService,
  ]);

  const confirmDelete = useCallback(
    (svc: ServiceItem) => {
      Alert.alert("Eliminar servicio", `¿Eliminar "${svc.name}"?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteService(svc.id),
        },
      ]);
    },
    [deleteService]
  );

  const priceLabel = useCallback((svc: ServiceItem): string => {
    if (svc.pricingType === "variable") return "A cotizar";
    if (svc.pricingType === "laser")
      return `Sesión $${(svc.price ?? 0).toLocaleString()} · Paquete $${(
        svc.packagePrice ?? 0
      ).toLocaleString()}`;
    return `$${(svc.price ?? 0).toLocaleString()}`;
  }, []);

  // Category keys that have services, ordered by allCategories then any extras
  // (e.g. a service left in a now-removed category still shows via fallback).
  const usedKeys = Array.from(new Set(services.map((s) => s.categoryKey)));
  const orderedKeys = [
    ...allCategories.map((c) => c.key).filter((k) => usedKeys.includes(k)),
    ...usedKeys.filter((k) => !allCategories.some((c) => c.key === k)),
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Servicios y precios</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {services.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="pricetags-outline"
              size={48}
              color={colors.textLight}
            />
            <Text style={styles.emptyTitle}>Aún no tienes servicios</Text>
            <Text style={styles.emptyText}>
              Agrega los servicios que ofreces con sus precios. Aparecerán al
              registrar una clienta.
            </Text>
          </View>
        ) : (
          orderedKeys.map((key) => {
            const cat = categoryInfo(key);
            return (
            <View key={key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <ZoneIcon icon={cat.icon} size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>{cat.label}</Text>
              </View>
              {services
                .filter((s) => s.categoryKey === key)
                .map((svc) => (
                  <Pressable
                    key={svc.id}
                    style={styles.serviceRow}
                    onPress={() => openEdit(svc)}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceName}>{svc.name}</Text>
                      <Text style={styles.servicePrice}>{priceLabel(svc)}</Text>
                    </View>
                    <Pressable
                      onPress={() => confirmDelete(svc)}
                      hitSlop={10}
                      style={styles.deleteBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.danger}
                      />
                    </Pressable>
                  </Pressable>
                ))}
            </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.fabWrap}>
        <Button title="＋ Agregar servicio" onPress={openAdd} />
      </View>

      {/* Single modal: service form OR new-category sub-view (no nesting) */}
      <Modal
        visible={formOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFormOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            {formMode === "service" ? (
              <>
                <Text style={styles.modalTitle}>
                  {editingId ? "Editar servicio" : "Nuevo servicio"}
                </Text>
                <ScrollView keyboardShouldPersistTaps="handled">
                  <Input
                    label="Nombre del servicio"
                    placeholder="Ej. Microblading"
                    value={name}
                    onChangeText={setName}
                  />

                  <Text style={styles.fieldLabel}>Categoría</Text>
                  <View style={styles.chipsRow}>
                    {allCategories.map((cat) => {
                      const sel = categoryKey === cat.key;
                      return (
                        <Pressable
                          key={cat.key}
                          onPress={() => setCategoryKey(cat.key)}
                          style={[styles.chip, sel && styles.chipSelected]}
                        >
                          <ZoneIcon
                            icon={cat.icon}
                            size={14}
                            color={sel ? colors.white : colors.textSecondary}
                          />
                          <Text
                            style={[
                              styles.chipText,
                              sel && styles.chipTextSelected,
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={openNewCategory}
                      style={[styles.chip, styles.chipAdd]}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                      <Text style={styles.chipAddText}>Nueva</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.fieldLabel}>Tipo de precio</Text>
                  <View style={styles.pricingList}>
                    {PRICING_OPTIONS.map((opt) => {
                      const sel = pricingType === opt.value;
                      return (
                        <Pressable
                          key={opt.value}
                          onPress={() => setPricingType(opt.value)}
                          style={[
                            styles.pricingCard,
                            sel && styles.pricingCardSel,
                          ]}
                        >
                          <Ionicons
                            name={sel ? "radio-button-on" : "radio-button-off"}
                            size={20}
                            color={sel ? colors.primary : colors.textSecondary}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.pricingLabel,
                                sel && styles.pricingLabelSel,
                              ]}
                            >
                              {opt.label}
                            </Text>
                            <Text style={styles.pricingDesc}>{opt.desc}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  {pricingType === "fixed" && (
                    <Input
                      label="Precio"
                      placeholder="$0"
                      value={price}
                      onChangeText={(t) => setPrice(formatMoney(t))}
                      keyboardType="numeric"
                    />
                  )}
                  {pricingType === "laser" && (
                    <>
                      <Input
                        label="Precio por sesión"
                        placeholder="$0"
                        value={price}
                        onChangeText={(t) => setPrice(formatMoney(t))}
                        keyboardType="numeric"
                      />
                      <Input
                        label="Precio paquete (10 sesiones)"
                        placeholder="$0"
                        value={packagePrice}
                        onChangeText={(t) => setPackagePrice(formatMoney(t))}
                        keyboardType="numeric"
                      />
                    </>
                  )}
                  {pricingType === "variable" && (
                    <Text style={styles.variableNote}>
                      El precio se cotiza de forma personalizada al registrar.
                    </Text>
                  )}

                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}

                  <View style={styles.modalActions}>
                    <Button title="Guardar" onPress={handleSave} />
                    <Button
                      title="Cancelar"
                      variant="ghost"
                      onPress={() => setFormOpen(false)}
                    />
                  </View>
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Nueva categoría</Text>
                <ScrollView keyboardShouldPersistTaps="handled">
                  <Input
                    label="Nombre"
                    placeholder="Ej. Tatuajes, Faciales"
                    value={catName}
                    onChangeText={setCatName}
                  />
                  <Text style={styles.fieldLabel}>Ícono</Text>
                  <View style={styles.iconGrid}>
                    {ICON_CHOICES.map((ic) => {
                      const sel = catIcon === ic;
                      return (
                        <Pressable
                          key={ic}
                          onPress={() => setCatIcon(ic)}
                          style={[styles.iconCell, sel && styles.iconCellSel]}
                        >
                          <ZoneIcon
                            icon={ic}
                            size={24}
                            color={sel ? colors.white : colors.textSecondary}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={styles.modalActions}>
                    <Button
                      title="Crear categoría"
                      onPress={handleCreateCategory}
                    />
                    <Button
                      title="Volver"
                      variant="ghost"
                      onPress={() => setFormMode("service")}
                    />
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: 120 },

  empty: { alignItems: "center", gap: spacing.md, paddingVertical: spacing["4xl"] },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },

  section: { marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: colors.primary },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  serviceInfo: { flex: 1, gap: 2 },
  serviceName: { fontSize: 15, color: colors.text, fontWeight: "500" },
  servicePrice: { fontSize: 13, color: colors.textSecondary },
  deleteBtn: { padding: spacing.xs },

  fabWrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    maxHeight: "88%",
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.divider,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary },
  chipTextSelected: { color: colors.white, fontWeight: "600" },
  chipAdd: { borderStyle: "dashed", borderColor: colors.primary },
  chipAddText: { fontSize: 13, color: colors.primary, fontWeight: "600" },

  pricingList: { gap: spacing.sm },
  pricingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  pricingCardSel: {
    borderColor: colors.primary,
    backgroundColor: "rgba(139,107,79,0.06)",
  },
  pricingLabel: { fontSize: 14, color: colors.text, fontWeight: "500" },
  pricingLabelSel: { color: colors.primary },
  pricingDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  iconCell: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCellSel: { backgroundColor: colors.primary, borderColor: colors.primary },

  variableNote: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.md,
  },
  modalActions: { marginTop: spacing.xl, gap: spacing.sm },
});
