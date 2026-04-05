import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, Card } from "@/components/ui";
import { ZoneIcon } from "@/components/ui/ZoneIcon";
import { useClients } from "@/hooks/useClients";
import { useProcedures } from "@/hooks/useProcedures";
import { useFollowUps } from "@/hooks/useFollowUps";
import { getPhotosForClient } from "@/services/photo.service";
import { formatDate } from "@/utils/format";
import { PROCEDURE_TYPES, MEDICAL_CONDITIONS, CLINICAL_QUESTIONS, FITZPATRICK_TYPES } from "@/constants";
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
  const { procedures, refresh: refreshProcedures } = useProcedures(id);
  const { followUps } = useFollowUps(id);

  const loadData = useCallback(async () => {
    if (!id) return;
    const c = await getClient(id);
    setClient(c);
    const photos = await getPhotosForClient(id);
    setClientPhotos(photos);
    setLoading(false);
  }, [id]);

  // Refresh all data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      refreshProcedures();
    }, [loadData, refreshProcedures])
  );

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

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/procedures/new",
                params: {
                  clientId: client.id,
                  clientName: `${client.firstName} ${client.lastName}`,
                },
              })
            }
            style={styles.procedureButton}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.white} />
            <Text style={styles.procedureButtonText}>Registrar procedimiento</Text>
          </Pressable>
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
          {activeTab === "resumen" && (() => {
            const conditions: string[] = client.medicalConditions
              ? JSON.parse(client.medicalConditions)
              : [];
            const conditionLabels = conditions
              .map((key) => MEDICAL_CONDITIONS.find((c) => c.key === key)?.label)
              .filter(Boolean);
            const clinicalAnswers: Record<string, boolean> = client.clinicalAnswers
              ? JSON.parse(client.clinicalAnswers)
              : {};
            const activeQuestions = CLINICAL_QUESTIONS
              .filter((q) => clinicalAnswers[q.key] === true)
              .map((q) => q.label);
            const fitz = client.fitzpatrickType
              ? FITZPATRICK_TYPES.find((f) => f.type === client.fitzpatrickType)
              : null;

            return (
              <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
                <View style={styles.summaryList}>
                  {/* Edad */}
                  {client.age && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Edad</Text>
                      <Text style={styles.summaryValue}>{client.age} años</Text>
                    </View>
                  )}

                  {/* Dirección */}
                  {client.address && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Dirección</Text>
                      <Text style={styles.summaryValue}>{client.address}</Text>
                    </View>
                  )}

                  {/* Contacto de emergencia */}
                  {client.emergencyContact && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Emergencia</Text>
                      <Text style={styles.summaryValue}>
                        {client.emergencyContact}
                        {client.emergencyRelation ? ` (${client.emergencyRelation})` : ""}
                      </Text>
                    </View>
                  )}

                  {/* Fototipo */}
                  {fitz && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Fototipo</Text>
                      <Text style={styles.summaryValue}>{fitz.label}</Text>
                    </View>
                  )}

                  {/* Condiciones médicas */}
                  {conditionLabels.length > 0 && (
                    <View style={{ gap: 4, paddingTop: 4 }}>
                      <Text style={styles.summaryLabel}>Condiciones médicas</Text>
                      {conditionLabels.map((label) => (
                        <Text key={label} style={[styles.summaryValue, { fontSize: 13 }]}>
                          • {label}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Preguntas clínicas activas */}
                  {activeQuestions.length > 0 && (
                    <View style={{ gap: 4, paddingTop: 4 }}>
                      <Text style={styles.summaryLabel}>Antecedentes clínicos</Text>
                      {activeQuestions.map((label) => (
                        <Text key={label} style={[styles.summaryValue, { fontSize: 13 }]}>
                          • {label}
                        </Text>
                      ))}
                    </View>
                  )}

                  {/* Alergias detalle */}
                  {client.allergiesDetail && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Alergias</Text>
                      <Text style={styles.summaryValue}>{client.allergiesDetail}</Text>
                    </View>
                  )}

                  {/* Medicamentos */}
                  {client.medicationsDetail && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Medicamentos</Text>
                      <Text style={styles.summaryValue}>{client.medicationsDetail}</Text>
                    </View>
                  )}

                  {/* Fecha de registro */}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Fecha de registro</Text>
                    <Text style={styles.summaryValue}>
                      {formatDate(client.createdAt)}
                    </Text>
                  </View>

                  {/* Última visita */}
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Última visita</Text>
                    <Text style={styles.summaryValue}>
                      {lastProcedure
                        ? formatDate(lastProcedure.date)
                        : formatDate(client.createdAt)}
                    </Text>
                  </View>

                  {/* Seguimiento */}
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
            );
          })()}

          {activeTab === "procedimientos" && (() => {
            const zoneIcon: Record<string, string> = {
              eyes: "eye-outline",
              brows: "brush-outline",
              lips: "lips",
              other: "ellipsis-horizontal-outline",
            };

            // Group procedures by date
            const grouped = new Map<string, typeof procedures>();
            for (const proc of procedures) {
              const key = proc.date;
              if (!grouped.has(key)) grouped.set(key, []);
              grouped.get(key)!.push(proc);
            }

            if (procedures.length === 0) {
              return (
                <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
                  <Text style={styles.emptyText}>Sin procedimientos</Text>
                </Card>
              );
            }

            return (
              <View style={{ gap: 20 }}>
                {Array.from(grouped.entries()).map(([date, procs]) => {
                  const totalCost = procs.reduce((sum, p) => sum + p.cost, 0);
                  return (
                    <View key={date}>
                      {/* Visit date header */}
                      <View style={styles.visitHeader}>
                        <View style={styles.visitHeaderLeft}>
                          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                          <Text style={styles.visitDateText}>
                            Visita — {formatDate(date)}
                          </Text>
                        </View>
                        <Text style={styles.visitTotalText}>
                          ${totalCost.toLocaleString()} MXN
                        </Text>
                      </View>

                      {/* Procedures in this visit */}
                      <View style={{ gap: 8 }}>
                        {procs.map((proc) => {
                          const typeLabel =
                            PROCEDURE_TYPES.find((t) => t.key === proc.type)
                              ?.label || proc.type;
                          return (
                            <Pressable
                              key={proc.id}
                              onPress={() => router.push(`/procedures/${proc.id}`)}
                            >
                              <Card variant="light" style={{ backgroundColor: colors.surfaceSoft }}>
                                <View style={styles.procCardHeader}>
                                  <View style={styles.procCardLeft}>
                                    <ZoneIcon
                                      icon={zoneIcon[proc.type] || "ellipsis-horizontal-outline"}
                                      size={20}
                                      color={colors.primary}
                                    />
                                    <View>
                                      <Text style={styles.procTitle}>{typeLabel}</Text>
                                      <Text style={styles.procSubtitle}>
                                        {proc.technique || "—"}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={styles.procPrice}>
                                    ${proc.cost.toLocaleString()}
                                  </Text>
                                </View>
                                <View style={styles.procCardFooter}>
                                  <Text style={styles.procDetailLink}>Ver detalle</Text>
                                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                                </View>
                              </Card>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}

          {activeTab === "fotos" && (() => {
            const beforePhotos = clientPhotos.filter((p) => p.type === "before");
            const afterPhotos = clientPhotos.filter((p) => p.type === "after");

            if (clientPhotos.length === 0) {
              return (
                <View style={styles.emptyPhotos}>
                  <Text style={styles.emptyPhotoText}>Sin fotos aún</Text>
                </View>
              );
            }

            return (
              <View style={{ gap: 20 }}>
                {beforePhotos.length > 0 && (
                  <View>
                    <Text style={styles.photoSectionTitle}>Fotos antes</Text>
                    <View style={styles.photoGrid}>
                      {beforePhotos.map((photo) => (
                        <Image
                          key={photo.id}
                          source={{ uri: photo.localUri }}
                          style={styles.photoItem}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  </View>
                )}

                {afterPhotos.length > 0 && (
                  <View>
                    <Text style={styles.photoSectionTitle}>Fotos después</Text>
                    <View style={styles.photoGrid}>
                      {afterPhotos.map((photo) => (
                        <Image
                          key={photo.id}
                          source={{ uri: photo.localUri }}
                          style={styles.photoItem}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Side by side if both exist */}
                {beforePhotos.length > 0 && afterPhotos.length > 0 && (
                  <View>
                    <Text style={styles.photoSectionTitle}>Comparativo</Text>
                    <View style={styles.comparisonRow}>
                      <View style={styles.comparisonSide}>
                        <Image
                          source={{ uri: beforePhotos[0].localUri }}
                          style={styles.comparisonPhoto}
                          resizeMode="cover"
                        />
                        <Text style={styles.comparisonLabel}>Antes</Text>
                      </View>
                      <View style={styles.comparisonSide}>
                        <Image
                          source={{ uri: afterPhotos[0].localUri }}
                          style={styles.comparisonPhoto}
                          resizeMode="cover"
                        />
                        <Text style={styles.comparisonLabel}>Después</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}

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
  procedureButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 12,
  },
  procedureButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
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
  procCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  procCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  procTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  procSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  procPrice: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
  procDate: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  procCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  procDetailLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  visitHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  visitHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  visitDateText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  visitTotalText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
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
  photoSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  comparisonRow: {
    flexDirection: "row",
    gap: 12,
  },
  comparisonSide: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
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
