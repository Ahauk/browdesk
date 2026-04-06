import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
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
import { Button, Input, PhoneInput } from "@/components/ui";
import {
  MEDICAL_CONDITIONS,
  CLINICAL_QUESTIONS,
  FITZPATRICK_TYPES,
  REFERRAL_SOURCES,
} from "@/constants";
import { useClients } from "@/hooks/useClients";
import {
  pickPhoto,
  takePhoto,
  savePhoto,
  deletePhoto,
  getPhotosForClient,
} from "@/services/photo.service";
import { colors, spacing, radius } from "@/theme";
import type { FitzpatrickType, Photo } from "@/types/models";

type Step = 1 | 2 | 3 | 4 | 5;

const TOTAL_STEPS = 5;

const STEP_TITLES: Record<Step, string> = {
  1: "Datos personales",
  2: "Fototipo Fitzpatrick",
  3: "Historia clínica",
  4: "Foto antes",
  5: "Confirmar",
};

/* ───────────────────── Step Indicator ───────────────────── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i + 1 <= current ? styles.stepDotActive : styles.stepDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

/* ───────────────────── Section Header ───────────────────── */
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

/* ═══════════════════════ Main Screen ═══════════════════════ */
export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getClient, updateClient } = useClients();

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Step 1: Datos personales ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [referralName, setReferralName] = useState("");

  // ── Step 2: Fitzpatrick ──
  const [fitzpatrickType, setFitzpatrickType] =
    useState<FitzpatrickType | null>(null);

  // ── Step 3: Historia clínica ──
  const [selectedConditions, setSelectedConditions] = useState<Set<string>>(
    new Set()
  );
  const [clinicalAnswers, setClinicalAnswers] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    CLINICAL_QUESTIONS.forEach((q) => {
      initial[q.key] = false;
    });
    return initial;
  });
  const [allergiesDetail, setAllergiesDetail] = useState("");
  const [medicationsDetail, setMedicationsDetail] = useState("");

  // ── Step 4: Fotos ──
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<Set<string>>(
    new Set()
  );
  const [newPhotos, setNewPhotos] = useState<string[]>([]);

  // ── Load client data ──
  useEffect(() => {
    if (!id) return;

    (async () => {
      const client = await getClient(id);
      if (!client) {
        Alert.alert("Error", "Clienta no encontrada", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      // Step 1
      setFirstName(client.firstName);
      setLastName(client.lastName);
      setAge(client.age ? String(client.age) : "");
      setPhone(client.phone);
      setAddress(client.address ?? "");
      setEmergencyContact(client.emergencyContact ?? "");
      setEmergencyPhone(client.emergencyPhone ?? "");
      setEmergencyRelation(client.emergencyRelation ?? "");
      setReferralSource(client.referralSource ?? "");

      // Step 2
      setFitzpatrickType(client.fitzpatrickType ?? null);

      // Step 3
      if (client.medicalConditions) {
        try {
          const conditions: string[] = JSON.parse(client.medicalConditions);
          setSelectedConditions(new Set(conditions));
        } catch {}
      }
      if (client.clinicalAnswers) {
        try {
          const answers: Record<string, boolean> = JSON.parse(
            client.clinicalAnswers
          );
          setClinicalAnswers((prev) => ({ ...prev, ...answers }));
        } catch {}
      }
      setAllergiesDetail(client.allergiesDetail ?? "");
      setMedicationsDetail(client.medicationsDetail ?? "");

      // Step 4: Load existing before photos
      const photos = await getPhotosForClient(id);
      setExistingPhotos(photos.filter((p) => p.type === "before"));

      setLoading(false);
    })();
  }, [id]);

  // ── Validation ──
  const firstNameError =
    submitted && !firstName.trim() ? "Campo requerido" : undefined;
  const lastNameError =
    submitted && !lastName.trim() ? "Campo requerido" : undefined;
  const phoneError =
    submitted && !phone.trim() ? "Campo requerido" : undefined;

  // ── Navigation ──
  const handleNext = () => {
    if (step === 1) {
      setSubmitted(true);
      if (!firstName.trim() || !lastName.trim() || !phone.trim()) return;
    }
    setSubmitted(false);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS) as Step);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => (s - 1) as Step);
    } else {
      router.back();
    }
  };

  // ── Conditions toggle ──
  const toggleCondition = (key: string) => {
    setSelectedConditions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ── Clinical answer toggle ──
  const toggleClinicalAnswer = (key: string) => {
    setClinicalAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Photo actions ──
  const visibleExisting = existingPhotos.filter(
    (p) => !removedPhotoIds.has(p.id)
  );
  const totalPhotos = visibleExisting.length + newPhotos.length;

  const addPhoto = async (mode: "camera" | "gallery") => {
    if (totalPhotos >= 3) return;
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
      const success = await updateClient(id!, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        age: age.trim() ? parseInt(age.trim(), 10) : undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        emergencyRelation: emergencyRelation.trim() || undefined,
        referralSource: referralSource || undefined,
        fitzpatrickType: fitzpatrickType ?? undefined,
        medicalConditions:
          selectedConditions.size > 0
            ? JSON.stringify(Array.from(selectedConditions))
            : undefined,
        clinicalAnswers: JSON.stringify(clinicalAnswers),
        allergiesDetail: allergiesDetail.trim() || undefined,
        medicationsDetail: medicationsDetail.trim() || undefined,
      });

      if (!success) {
        Alert.alert("Error", "No se pudo actualizar la clienta");
        return;
      }

      // Delete removed photos
      for (const photoId of removedPhotoIds) {
        await deletePhoto(photoId);
      }

      // Save new photos
      for (const uri of newPhotos) {
        await savePhoto(uri, id!, "", "before");
      }

      Alert.alert(
        "Clienta actualizada",
        `${firstName} ${lastName} se actualizó exitosamente`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Error", "Ocurrió un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // ── Fitzpatrick helper ──
  const selectedFitz = FITZPATRICK_TYPES.find(
    (f) => f.type === fitzpatrickType
  );

  const conditionsCount = selectedConditions.size;

  /* ═══════════════════════ Loading ═══════════════════════ */
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  /* ═══════════════════════ Render ═══════════════════════ */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{STEP_TITLES[step]}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <StepIndicator current={step} total={TOTAL_STEPS} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ════════ STEP 1: Datos personales ════════ */}
          {step === 1 && (
            <View style={styles.formGroup}>
              <Input
                label="Nombre *"
                placeholder="Nombre"
                value={firstName}
                onChangeText={setFirstName}
                variant="light"
                maxLength={30}
                error={firstNameError}
              />
              <Input
                label="Apellido *"
                placeholder="Apellido"
                value={lastName}
                onChangeText={setLastName}
                variant="light"
                maxLength={30}
                error={lastNameError}
              />
              <Input
                label="Edad"
                placeholder="Edad"
                value={age}
                onChangeText={setAge}
                variant="light"
                keyboardType="numeric"
                maxLength={3}
              />
              <PhoneInput
                label="Teléfono *"
                value={phone}
                onChangeText={(raw) => setPhone(raw)}
                error={phoneError}
              />
              <Input
                label="Dirección"
                placeholder="Dirección"
                value={address}
                onChangeText={setAddress}
                variant="light"
                maxLength={200}
              />

              <SectionHeader title="Contacto de emergencia" />
              <Input
                label="Nombre contacto"
                placeholder="Nombre del contacto"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                variant="light"
                maxLength={60}
              />
              <PhoneInput
                label="Teléfono emergencia"
                value={emergencyPhone}
                onChangeText={(raw) => setEmergencyPhone(raw)}
              />
              <Input
                label="Parentesco"
                placeholder="Ej. Madre, Esposo, Amiga"
                value={emergencyRelation}
                onChangeText={setEmergencyRelation}
                variant="light"
                maxLength={30}
              />

              <SectionHeader title="¿Cómo nos conociste?" />
              <View style={styles.chipGrid}>
                {REFERRAL_SOURCES.map((source) => {
                  const isSelected = referralSource === source.key;
                  return (
                    <Pressable
                      key={source.key}
                      onPress={() => {
                        if (isSelected) {
                          setReferralSource("");
                          setReferralName("");
                        } else {
                          setReferralSource(source.key);
                          if (source.key !== "recomendacion") setReferralName("");
                        }
                      }}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected
                            ? styles.chipTextSelected
                            : styles.chipTextUnselected,
                        ]}
                      >
                        {source.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {referralSource === "recomendacion" && (
                <Input
                  label="¿Quién te recomendó?"
                  placeholder="Nombre de quien la refirió"
                  value={referralName}
                  onChangeText={setReferralName}
                  variant="light"
                  maxLength={60}
                />
              )}
            </View>
          )}

          {/* ════════ STEP 2: Fototipo Fitzpatrick ════════ */}
          {step === 2 && (
            <View style={styles.formGroup}>
              <Text style={styles.fitzInstructions}>
                Selecciona el fototipo de piel de la clienta
              </Text>

              <View style={styles.fitzRow}>
                {FITZPATRICK_TYPES.map((fitz) => {
                  const isSelected = fitzpatrickType === fitz.type;
                  return (
                    <Pressable
                      key={fitz.type}
                      onPress={() =>
                        setFitzpatrickType(
                          fitzpatrickType === fitz.type
                            ? null
                            : (fitz.type as FitzpatrickType)
                        )
                      }
                      style={styles.fitzItem}
                    >
                      <View
                        style={[
                          styles.fitzCircle,
                          { backgroundColor: fitz.color },
                          isSelected && styles.fitzCircleSelected,
                        ]}
                      />
                      <Text
                        style={[
                          styles.fitzTypeLabel,
                          isSelected && styles.fitzTypeLabelSelected,
                        ]}
                      >
                        {fitz.type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedFitz && (
                <View style={styles.fitzDetailCard}>
                  <Text style={styles.fitzDetailTitle}>{selectedFitz.label}</Text>
                  <Text style={styles.fitzDetailDesc}>
                    {selectedFitz.description}
                  </Text>
                  <View style={styles.fitzDivider} />
                  <Text style={styles.fitzDetailReactionLabel}>
                    Reacción al sol
                  </Text>
                  <Text style={styles.fitzDetailReaction}>
                    {selectedFitz.reaction}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ════════ STEP 3: Historia clínica ════════ */}
          {step === 3 && (
            <View style={styles.formGroup}>
              {/* Section 1: Condiciones médicas */}
              <SectionHeader title="Condiciones médicas" />
              <View style={styles.chipGrid}>
                {MEDICAL_CONDITIONS.map((condition) => {
                  const isSelected = selectedConditions.has(condition.key);
                  return (
                    <Pressable
                      key={condition.key}
                      onPress={() => toggleCondition(condition.key)}
                      style={[
                        styles.chip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected
                            ? styles.chipTextSelected
                            : styles.chipTextUnselected,
                        ]}
                      >
                        {condition.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Section 2: Preguntas clínicas */}
              <SectionHeader title="Preguntas clínicas" />
              <View style={styles.questionsContainer}>
                {CLINICAL_QUESTIONS.map((question) => (
                  <View key={question.key} style={styles.toggleRow}>
                    <Text style={styles.toggleLabel} numberOfLines={2}>
                      {question.label}
                    </Text>
                    <Switch
                      value={clinicalAnswers[question.key] ?? false}
                      onValueChange={() => toggleClinicalAnswer(question.key)}
                      trackColor={{
                        false: colors.divider,
                        true: colors.accent,
                      }}
                      thumbColor={colors.white}
                    />
                  </View>
                ))}
              </View>

              {/* Section 3: Free text fields */}
              <SectionHeader title="Detalles adicionales" />
              {selectedConditions.has("alergias") && (
                <Input
                  label="Alergias (detalle)"
                  placeholder="Describir alergias"
                  value={allergiesDetail}
                  onChangeText={setAllergiesDetail}
                  variant="light"
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                />
              )}
              <Input
                label="Medicamentos actuales"
                placeholder="Describir medicamentos que toma actualmente"
                value={medicationsDetail}
                onChangeText={setMedicationsDetail}
                variant="light"
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          )}

          {/* ════════ STEP 4: Fotos antes ════════ */}
          {step === 4 && (
            <View style={styles.formGroup}>
              <Text style={styles.fitzInstructions}>
                Fotos antes del procedimiento (máximo 3)
              </Text>

              {/* Photo action buttons */}
              {totalPhotos < 3 && (
                <View style={styles.photoButtonsRow}>
                  <View style={styles.photoButtonWrapper}>
                    <Button
                      title="Cámara"
                      onPress={() => addPhoto("camera")}
                      variant="primary"
                      size="md"
                      icon={
                        <Ionicons
                          name="camera-outline"
                          size={18}
                          color={colors.white}
                        />
                      }
                    />
                  </View>
                  <View style={styles.photoButtonWrapper}>
                    <Button
                      title="Galería"
                      onPress={() => addPhoto("gallery")}
                      variant="outline"
                      size="md"
                      icon={
                        <Ionicons
                          name="images-outline"
                          size={18}
                          color={colors.primary}
                        />
                      }
                    />
                  </View>
                </View>
              )}

              {/* Photo thumbnails */}
              {totalPhotos > 0 ? (
                <View style={styles.beforePhotoGrid}>
                  {/* Existing photos */}
                  {visibleExisting.map((photo) => (
                    <View key={photo.id} style={styles.beforePhotoThumb}>
                      <Image
                        source={{ uri: photo.localUri }}
                        style={styles.beforePhotoImage}
                      />
                      <Pressable
                        onPress={() => removeExistingPhoto(photo.id)}
                        style={styles.beforePhotoDelete}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={colors.danger}
                        />
                      </Pressable>
                      <View style={styles.existingBadge}>
                        <Text style={styles.beforePhotoBadgeText}>✓</Text>
                      </View>
                    </View>
                  ))}
                  {/* New photos */}
                  {newPhotos.map((uri, index) => (
                    <View key={`new-${index}`} style={styles.beforePhotoThumb}>
                      <Image
                        source={{ uri }}
                        style={styles.beforePhotoImage}
                      />
                      <Pressable
                        onPress={() => removeNewPhoto(index)}
                        style={styles.beforePhotoDelete}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color={colors.danger}
                        />
                      </Pressable>
                      <View style={styles.newBadge}>
                        <Ionicons name="add" size={14} color={colors.white} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={48}
                    color={colors.textLight}
                  />
                  <Text style={styles.photoPlaceholderText}>Sin fotos aún</Text>
                </View>
              )}

              <Text style={styles.photoCountText}>
                {totalPhotos}/3 fotos
              </Text>
            </View>
          )}

          {/* ════════ STEP 5: Confirmar ════════ */}
          {step === 5 && (
            <View style={styles.formGroup}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Resumen de cambios</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Nombre</Text>
                  <Text style={styles.summaryValue}>
                    {firstName} {lastName}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Teléfono</Text>
                  <Text style={styles.summaryValue}>{phone}</Text>
                </View>

                {age.trim() ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Edad</Text>
                    <Text style={styles.summaryValue}>{age} años</Text>
                  </View>
                ) : null}

                {address.trim() ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Dirección</Text>
                    <Text style={styles.summaryValue}>{address}</Text>
                  </View>
                ) : null}

                {emergencyContact.trim() ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Emergencia</Text>
                    <Text style={styles.summaryValue}>
                      {emergencyContact}
                      {emergencyRelation ? ` (${emergencyRelation})` : ""}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fototipo</Text>
                  <Text style={styles.summaryValue}>
                    {selectedFitz
                      ? `${selectedFitz.label} - ${selectedFitz.description}`
                      : "No seleccionado"}
                  </Text>
                </View>

                {conditionsCount > 0 && (
                  <View style={{ gap: 4 }}>
                    <Text style={styles.summaryLabel}>Condiciones</Text>
                    {Array.from(selectedConditions).map((key) => {
                      const cond = MEDICAL_CONDITIONS.find(
                        (c) => c.key === key
                      );
                      return (
                        <Text
                          key={key}
                          style={[styles.summaryValue, { fontSize: 13 }]}
                        >
                          • {cond?.label || key}
                        </Text>
                      );
                    })}
                  </View>
                )}

                {allergiesDetail.trim() ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Alergias</Text>
                    <Text style={styles.summaryValue}>{allergiesDetail}</Text>
                  </View>
                ) : null}

                {medicationsDetail.trim() ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Medicamentos</Text>
                    <Text style={styles.summaryValue}>
                      {medicationsDetail}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fotos antes</Text>
                  <Text style={styles.summaryValue}>
                    {totalPhotos} foto{totalPhotos !== 1 ? "s" : ""}
                    {removedPhotoIds.size > 0 &&
                      ` (${removedPhotoIds.size} eliminada${removedPhotoIds.size > 1 ? "s" : ""})`}
                    {newPhotos.length > 0 &&
                      ` (${newPhotos.length} nueva${newPhotos.length > 1 ? "s" : ""})`}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom button */}
        <View style={styles.bottomButton}>
          {step < TOTAL_STEPS ? (
            <Button
              title="Siguiente"
              onPress={handleNext}
              disabled={step === 2 && fitzpatrickType === null}
            />
          ) : (
            <Button
              title="Guardar cambios"
              onPress={handleSave}
              loading={saving}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ═══════════════════════ Styles ═══════════════════════ */
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

  // ── Header ──
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 24,
  },

  // ── Step indicator ──
  stepRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing["2xl"],
  },
  stepDot: {
    height: 6,
    borderRadius: 9999,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 32,
  },
  stepDotInactive: {
    backgroundColor: colors.accentLight,
    width: 16,
  },

  // ── Scroll / form ──
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing["2xl"],
  },
  scrollContent: {
    paddingBottom: 120,
  },
  formGroup: {
    gap: 16,
  },

  // ── Section header ──
  sectionTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: spacing.lg,
  },

  // ── Chips ──
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.divider,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: colors.white,
  },
  chipTextUnselected: {
    color: colors.text,
  },

  // ── Toggle rows ──
  questionsContainer: {
    gap: 2,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
    marginRight: spacing.md,
  },

  // ── Fitzpatrick ──
  fitzInstructions: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  fitzRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  fitzItem: {
    alignItems: "center",
    gap: 6,
  },
  fitzCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.divider,
  },
  fitzCircleSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  fitzTypeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  fitzTypeLabelSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  fitzDetailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: 6,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fitzDetailTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  fitzDetailDesc: {
    color: colors.text,
    fontSize: 14,
  },
  fitzDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xs,
  },
  fitzDetailReactionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fitzDetailReaction: {
    color: colors.text,
    fontSize: 14,
  },

  // ── Photos ──
  photoPlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  photoPlaceholderText: {
    color: colors.textLight,
    fontSize: 15,
    fontWeight: "500",
  },
  photoButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoButtonWrapper: {
    flex: 1,
  },
  beforePhotoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  beforePhotoThumb: {
    position: "relative",
    width: "30%",
    flexGrow: 1,
  },
  beforePhotoImage: {
    width: "100%",
    height: 140,
    borderRadius: radius.md,
  },
  beforePhotoDelete: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  beforePhotoBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  existingBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: colors.success,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  newBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  photoCountText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
  },

  // ── Summary ──
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 14,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },

  // ── Bottom ──
  bottomButton: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: 32,
  },
});
