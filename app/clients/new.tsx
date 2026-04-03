import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input } from "@/components/ui";
import {
  MEDICAL_CONDITIONS,
  CLINICAL_QUESTIONS,
  FITZPATRICK_TYPES,
  REFERRAL_SOURCES,
} from "@/constants";
import { useClients } from "@/hooks/useClients";
import { pickPhoto, takePhoto, savePhoto } from "@/services/photo.service";
import { colors, spacing, radius } from "@/theme";
import type { FitzpatrickType } from "@/types/models";

type Step = 1 | 2 | 3 | 4 | 5;

const TOTAL_STEPS = 5;

const STEP_TITLES: Record<Step, string> = {
  1: "Datos personales",
  2: "Fototipo Fitzpatrick",
  3: "Historia clinica",
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
export default function NewClientScreen() {
  const router = useRouter();
  const { createClient } = useClients();
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

  // ── Step 2: Fitzpatrick ──
  const [fitzpatrickType, setFitzpatrickType] =
    useState<FitzpatrickType | null>(null);

  // ── Step 3: Historia clinica ──
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

  // ── Step 4: Foto ──
  const [photoUri, setPhotoUri] = useState<string | null>(null);

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
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ── Clinical answer toggle ──
  const toggleClinicalAnswer = (key: string) => {
    setClinicalAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Photo actions ──
  const handleTakePhoto = async () => {
    const uri = await takePhoto();
    if (uri) setPhotoUri(uri);
  };

  const handlePickPhoto = async () => {
    const uri = await pickPhoto();
    if (uri) setPhotoUri(uri);
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await createClient({
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

      if (result && photoUri) {
        await savePhoto(photoUri, result.id, "", "before");
      }

      if (result) {
        router.back();
      } else {
        Alert.alert("Error", "No se pudo guardar la clienta");
      }
    } catch {
      Alert.alert("Error", "Ocurrio un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  // ── Fitzpatrick helper ──
  const selectedFitz = FITZPATRICK_TYPES.find(
    (f) => f.type === fitzpatrickType
  );

  // ── Derived data for summary ──
  const conditionsCount = selectedConditions.size;

  /* ═══════════════════════ Render ═══════════════════════ */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
            <Input
              label="Telefono *"
              placeholder="+52 664 123 4567"
              value={phone}
              onChangeText={setPhone}
              variant="light"
              keyboardType="phone-pad"
              maxLength={15}
              error={phoneError}
            />
            <Input
              label="Direccion"
              placeholder="Direccion"
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
            <Input
              label="Telefono emergencia"
              placeholder="+52 664 000 0000"
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              variant="light"
              keyboardType="phone-pad"
              maxLength={15}
            />
            <Input
              label="Parentesco"
              placeholder="Ej. Madre, Esposo, Amiga"
              value={emergencyRelation}
              onChangeText={setEmergencyRelation}
              variant="light"
              maxLength={30}
            />

            <SectionHeader title="Como nos conociste?" />
            <View style={styles.chipGrid}>
              {REFERRAL_SOURCES.map((source) => {
                const isSelected = referralSource === source.key;
                return (
                  <Pressable
                    key={source.key}
                    onPress={() => setReferralSource(source.key)}
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
                      setFitzpatrickType(fitz.type as FitzpatrickType)
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
                  Reaccion al sol
                </Text>
                <Text style={styles.fitzDetailReaction}>
                  {selectedFitz.reaction}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ════════ STEP 3: Historia clinica ════════ */}
        {step === 3 && (
          <View style={styles.formGroup}>
            {/* Section 1: Condiciones medicas */}
            <SectionHeader title="Condiciones medicas" />
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

            {/* Section 2: Preguntas clinicas */}
            <SectionHeader title="Preguntas clinicas" />
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
            <Input
              label="Alergias (detalle)"
              placeholder="Describir alergias si aplica"
              value={allergiesDetail}
              onChangeText={setAllergiesDetail}
              variant="light"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
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

        {/* ════════ STEP 4: Foto antes del procedimiento ════════ */}
        {step === 4 && (
          <View style={styles.formGroup}>
            <Text style={styles.fitzInstructions}>
              Toma o selecciona una foto antes del procedimiento
            </Text>

            <Pressable
              onPress={handleTakePhoto}
              style={styles.photoArea}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={48}
                    color={colors.textLight}
                  />
                  <Text style={styles.photoPlaceholderText}>Tomar foto</Text>
                </View>
              )}
            </Pressable>

            <View style={styles.photoButtonsRow}>
              <View style={styles.photoButtonWrapper}>
                <Button
                  title="Camara"
                  onPress={handleTakePhoto}
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
                  title="Galeria"
                  onPress={handlePickPhoto}
                  variant="outline"
                  size="md"
                  icon={
                    <Ionicons
                      name="images-outline"
                      size={18}
                      color={colors.accent}
                    />
                  }
                />
              </View>
            </View>

            {photoUri && (
              <Pressable
                onPress={() => setPhotoUri(null)}
                style={styles.removePhotoBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={colors.danger}
                />
                <Text style={styles.removePhotoText}>Eliminar foto</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ════════ STEP 5: Confirmar ════════ */}
        {step === 5 && (
          <View style={styles.formGroup}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nombre</Text>
                <Text style={styles.summaryValue}>
                  {firstName} {lastName}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Telefono</Text>
                <Text style={styles.summaryValue}>{phone}</Text>
              </View>

              {age.trim() ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Edad</Text>
                  <Text style={styles.summaryValue}>{age} anios</Text>
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

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Condiciones marcadas</Text>
                <Text style={styles.summaryValue}>{conditionsCount}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Foto tomada</Text>
                <Text style={styles.summaryValue}>
                  {photoUri ? "Si" : "No"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottomButton}>
        {step < TOTAL_STEPS ? (
          <Button title="Siguiente" onPress={handleNext} />
        ) : (
          <Button
            title="Guardar clienta"
            onPress={handleSave}
            loading={saving}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* ═══════════════════════ Styles ═══════════════════════ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
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

  // ── Chips (conditions & referral) ──
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

  // ── Toggle rows (clinical questions) ──
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

  // ── Photo ──
  photoArea: {
    height: 200,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
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
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm,
  },
  removePhotoText: {
    color: colors.danger,
    fontSize: 13,
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
