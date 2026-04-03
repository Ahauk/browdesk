import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card } from "@/components/ui";
import { useClients } from "@/hooks/useClients";
import { useProcedures } from "@/hooks/useProcedures";
import { useFollowUps } from "@/hooks/useFollowUps";
import { getPhotosForClient } from "@/services/photo.service";
import { formatDate } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import { colors, spacing, radius } from "@/theme";
import type { Client, Photo } from "@/types/models";

type DetailTab = "resumen" | "procedimientos" | "fotos" | "notas";

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active ? styles.tabButtonActive : styles.tabButtonInactive]}
    >
      <Text
        style={[styles.tabButtonText, active ? styles.tabButtonTextActive : styles.tabButtonTextInactive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("resumen");
  const [client, setClient] = useState<Client | null>(null);
  const [clientPhotos, setClientPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const { getClient } = useClients();
  const { procedures } = useProcedures(id);
  const { followUps } = useFollowUps(id);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const c = await getClient(id);
      setClient(c);
      const photos = await getPhotosForClient(id);
      setClientPhotos(photos);
      setLoading(false);
    }
    load();
  }, [id]);

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "procedimientos", label: "Procedimientos" },
    { key: "fotos", label: "Fotos" },
    { key: "notas", label: "Notas" },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.grayText}>Clienta no encontrada</Text>
      </SafeAreaView>
    );
  }

  const lastProcedure = procedures[0];
  const pendingFollowUp = followUps.find((f) => f.status === "pending");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Back button */}
      <View style={styles.backButtonContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{"< Atras"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex1}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Client header */}
        <View style={styles.clientHeader}>
          <Avatar
            firstName={client.firstName}
            lastName={client.lastName}
            uri={client.avatarUri}
            size="lg"
          />
          <Text style={styles.clientName}>
            {client.firstName} {client.lastName}
          </Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              label={tab.label}
              active={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === "resumen" && (
            <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
              <View style={styles.summaryList}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Alergias</Text>
                  <Text style={styles.summaryValue}>
                    {client.allergies || "Ninguna"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Diabetes</Text>
                  <Text style={styles.summaryValue}>
                    {client.diabetes ? "Si" : "No"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Embarazo</Text>
                  <Text style={styles.summaryValue}>
                    {client.pregnancy ? "Si" : "No"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Hipertension</Text>
                  <Text style={styles.summaryValue}>
                    {client.hypertension ? "Si" : "No"}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ultima visita</Text>
                  <Text style={styles.summaryValue}>
                    {lastProcedure
                      ? formatDate(lastProcedure.date)
                      : "Sin visitas"}
                  </Text>
                </View>
                {pendingFollowUp && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Seguimiento</Text>
                    <Text style={styles.followUpDate}>
                      {formatDate(pendingFollowUp.dueDate)}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {activeTab === "procedimientos" && (
            <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
              {procedures.length > 0 ? (
                <View style={styles.procList}>
                  {procedures.map((proc) => {
                    const typeLabel =
                      PROCEDURE_TYPES.find((t) => t.key === proc.type)
                        ?.label || proc.type;
                    return (
                      <Pressable
                        key={proc.id}
                        style={styles.procItem}
                      >
                        <View>
                          <Text style={styles.procTitle}>
                            {formatDate(proc.date)} / {typeLabel}
                          </Text>
                          <Text style={styles.procSubtitle}>
                            {proc.technique} - ${proc.cost}
                          </Text>
                        </View>
                        <Text style={styles.grayText}>{">"}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.emptyText}>Sin procedimientos</Text>
              )}
            </Card>
          )}

          {activeTab === "fotos" && (
            <View>
              {clientPhotos.length > 0 ? (
                <View style={styles.photoGrid}>
                  {clientPhotos.map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.localUri }}
                      style={styles.photoItem}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyPhotos}>
                  <Text style={styles.emptyPhotoText}>Sin fotos aun</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "notas" && (
            <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
              <Text style={styles.notesText}>
                {client.notes || "Sin notas adicionales"}
              </Text>
            </Card>
          )}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: {
    flex: 1,
  },
  backButtonContainer: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.sm,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: colors.accent,
    fontSize: 15,
  },
  clientHeader: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    gap: 12,
  },
  clientName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  clientPhone: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing["2xl"],
  },
  tabButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
  },
  tabButtonActive: {
    backgroundColor: colors.accent,
  },
  tabButtonInactive: {
    backgroundColor: colors.transparent,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  tabButtonTextInactive: {
    color: colors.textSecondary,
  },
  tabContent: {
    paddingHorizontal: spacing["2xl"],
  },
  summaryList: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 13,
  },
  followUpDate: {
    color: colors.accent,
    fontSize: 13,
  },
  procList: {
    gap: 12,
  },
  procItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.accentLight,
  },
  procTitle: {
    color: colors.text,
    fontSize: 13,
  },
  procSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  grayText: {
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingVertical: 16,
    textAlign: "center",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoItem: {
    width: "48%",
    height: 160,
    borderRadius: radius.lg,
  },
  emptyPhotos: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyPhotoText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  notesText: {
    color: colors.text,
    fontSize: 13,
  },
});
