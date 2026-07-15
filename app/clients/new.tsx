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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, PhoneInput } from "@/components/ui";
import { ZoneIcon } from "@/components/ui/ZoneIcon";
import {
  MEDICAL_CONDITIONS,
  CLINICAL_QUESTIONS,
  FITZPATRICK_TYPES,
  REFERRAL_SOURCES,
} from "@/constants";
import { useClients } from "@/hooks/useClients";
import { useProcedures } from "@/hooks/useProcedures";
import { useServices } from "@/hooks/useServices";
import { parseMoney, formatMoney } from "@/utils/money";
import { pickPhoto, takePhoto, savePhoto } from "@/services/photo.service";
import { colors, spacing, radius } from "@/theme";
import type { FitzpatrickType, ServiceItem, ProcedureType } from "@/types/models";

// Map a service category to the procedure's high-level type.
function categoryToProcedureType(categoryKey: string): ProcedureType {
  switch (categoryKey) {
    case "cejas":
      return "brows";
    case "labios":
      return "lips";
    case "ojos":
      return "eyes";
    default:
      return "other";
  }
}

// Effective price of a service given the laser package toggle.
function servicePrice(svc: ServiceItem, isPackage: boolean): number {
  if (svc.pricingType === "variable") return 0;
  if (svc.pricingType === "laser") {
    return isPackage ? svc.packagePrice ?? 0 : svc.price ?? 0;
  }
  return svc.price ?? 0;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_STEPS = 6;

const STEP_TITLES: Record<Step, string> = {
  1: "Datos personales",
  2: "Fototipo Fitzpatrick",
  3: "Servicio a realizar",
  4: "Historia clínica",
  5: "Foto antes",
  6: "Confirmar",
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
  const { createProcedure } = useProcedures();
  const { services, allCategories, categoryInfo } = useServices();
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

  // ── Step 3: Servicio a realizar (catálogo del usuario) ──
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set()
  );
  // laser service id → is 10-session package
  const [servicePackage, setServicePackage] = useState<Record<string, boolean>>(
    {}
  );
  // variable service id → quoted price (typed at registration)
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const guarantee = true;
  const guaranteeDays = "15";
  const [hasPriorWork, setHasPriorWork] = useState(false);
  const [priorWorkDetail, setPriorWorkDetail] = useState("");

  // ── Step 4: Historia clinica ──
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
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);

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

  // ── Zone toggles (only show/hide, never delete selections) ──
  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Effective amount for a service, using the typed quote for variable ones.
  const serviceAmount = (svc: ServiceItem): number => {
    if (svc.pricingType === "variable") {
      return parseMoney(quotePrices[svc.id] ?? "");
    }
    return servicePrice(svc, servicePackage[svc.id] ?? false);
  };

  // Category keys with services, ordered (predefined first, then any extras).
  const usedCategoryKeys = Array.from(
    new Set(services.map((s) => s.categoryKey))
  );
  const orderedCategoryKeys = [
    ...allCategories.map((c) => c.key).filter((k) => usedCategoryKeys.includes(k)),
    ...usedCategoryKeys.filter((k) => !allCategories.some((c) => c.key === k)),
  ];

  const selectedServices = services.filter((s) => selectedServiceIds.has(s.id));
  const grandTotal = selectedServices.reduce(
    (sum, s) => sum + serviceAmount(s),
    0
  );
  // A variable service with no quote typed yet still needs "+ cotización".
  const hasPendingQuote = selectedServices.some(
    (s) => s.pricingType === "variable" && !(serviceAmount(s) > 0)
  );

  // ── Clinical answer toggle ──
  const toggleClinicalAnswer = (key: string) => {
    setClinicalAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Photo actions ──
  const addBeforePhoto = async (mode: "camera" | "gallery") => {
    if (beforePhotos.length >= 3) return;
    const uri = mode === "camera" ? await takePhoto() : await pickPhoto();
    if (uri) setBeforePhotos((prev) => [...prev, uri]);
  };

  const removeBeforePhoto = (index: number) => {
    setBeforePhotos((prev) => prev.filter((_, i) => i !== index));
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

      if (!result) {
        Alert.alert("Error", "No se pudo guardar la clienta");
        return;
      }

      // Save before photos linked to client
      if (beforePhotos.length > 0) {
        for (const uri of beforePhotos) {
          await savePhoto(uri, result.id, "", "before");
        }
      }

      // Create one procedure per selected service.
      const today = new Date().toISOString().split("T")[0];
      for (const svc of selectedServices) {
        const isPackage = servicePackage[svc.id] ?? false;
        await createProcedure({
          clientId: result.id,
          type: categoryToProcedureType(svc.categoryKey),
          technique: svc.name,
          zoneDetails: JSON.stringify({
            categoryKey: svc.categoryKey,
            serviceId: svc.id,
            package: isPackage,
          }),
          cost: serviceAmount(svc),
          guarantee: true,
          guaranteeDays: 15,
          date: today,
        });
      }

      Alert.alert(
        "Clienta guardada",
        `${firstName} ${lastName} se registró exitosamente`,
        [{ text: "OK", onPress: () => router.back() }]
      );
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

            <SectionHeader title="Como nos conociste?" />
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
                label="Quien te recomendo?"
                placeholder="Nombre de quien la refirio"
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

        {/* ════════ STEP 3: Servicio a realizar ════════ */}
        {step === 3 && (
          <View style={styles.formGroup}>
            <SectionHeader title="Selecciona el servicio" />

            {services.length === 0 ? (
              <View style={styles.noServicesBox}>
                <Ionicons
                  name="pricetags-outline"
                  size={40}
                  color={colors.textLight}
                />
                <Text style={styles.noServicesTitle}>
                  Aún no tienes servicios
                </Text>
                <Text style={styles.noServicesText}>
                  Configura los servicios que ofreces (con sus precios) para
                  poder seleccionarlos aquí.
                </Text>
                <Button
                  title="Configurar servicios"
                  variant="outline"
                  onPress={() => router.push("/services")}
                />
              </View>
            ) : (
              <>
                {orderedCategoryKeys.map((catKey) => {
                  const cat = categoryInfo(catKey);
                  return (
                    <View key={catKey} style={styles.catBlock}>
                      <View style={styles.catHeader}>
                        <ZoneIcon
                          icon={cat.icon}
                          size={18}
                          color={colors.primary}
                        />
                        <Text style={styles.catTitle}>{cat.label}</Text>
                      </View>
                      {services
                        .filter((s) => s.categoryKey === catKey)
                        .map((svc) => {
                          const sel = selectedServiceIds.has(svc.id);
                          const isPackage = servicePackage[svc.id] ?? false;
                          return (
                            <View key={svc.id}>
                              <Pressable
                                onPress={() => toggleService(svc.id)}
                                style={[
                                  styles.svcRow,
                                  sel && styles.svcRowSelected,
                                ]}
                              >
                                <Ionicons
                                  name={sel ? "checkbox" : "square-outline"}
                                  size={22}
                                  color={
                                    sel ? colors.primary : colors.textSecondary
                                  }
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[
                                      styles.svcName,
                                      sel && styles.svcNameSelected,
                                    ]}
                                  >
                                    {svc.name}
                                  </Text>
                                  <Text style={styles.svcPrice}>
                                    {svc.pricingType === "variable"
                                      ? "A cotizar"
                                      : svc.pricingType === "laser"
                                        ? `Sesión $${(svc.price ?? 0).toLocaleString()} · Paquete $${(svc.packagePrice ?? 0).toLocaleString()}`
                                        : `$${(svc.price ?? 0).toLocaleString()}`}
                                  </Text>
                                </View>
                              </Pressable>
                              {sel && svc.pricingType === "laser" && (
                                <View style={styles.laserToggleRow}>
                                  <Text style={styles.toggleLabel}>
                                    ¿Paquete 10 sesiones?
                                  </Text>
                                  <Switch
                                    value={isPackage}
                                    onValueChange={(v) =>
                                      setServicePackage((p) => ({
                                        ...p,
                                        [svc.id]: v,
                                      }))
                                    }
                                    trackColor={{
                                      false: colors.divider,
                                      true: colors.accent,
                                    }}
                                    thumbColor={colors.white}
                                  />
                                </View>
                              )}
                              {sel && svc.pricingType === "variable" && (
                                <View style={styles.quoteRow}>
                                  <Input
                                    label="Precio cotizado"
                                    placeholder="$0"
                                    value={quotePrices[svc.id] ?? ""}
                                    onChangeText={(t) =>
                                      setQuotePrices((p) => ({
                                        ...p,
                                        [svc.id]: formatMoney(t),
                                      }))
                                    }
                                    keyboardType="numeric"
                                  />
                                </View>
                              )}
                            </View>
                          );
                        })}
                    </View>
                  );
                })}

                {selectedServices.length > 0 && (
                  <View style={styles.grandTotalBox}>
                    <View style={styles.grandTotalRow}>
                      <Text style={styles.grandTotalTotalLabel}>Total</Text>
                      <Text style={styles.grandTotalTotalPrice}>
                        ${grandTotal.toLocaleString()} MXN
                        {hasPendingQuote ? " + cotización" : ""}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Trabajo previo */}
            <SectionHeader title="Trabajo previo" />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                Trae un trabajo previo en la zona?
              </Text>
              <Switch
                value={hasPriorWork}
                onValueChange={setHasPriorWork}
                trackColor={{ false: colors.divider, true: colors.accent }}
                thumbColor={colors.white}
              />
            </View>
            {hasPriorWork && (
              <Input
                label="Detalle del trabajo previo"
                placeholder="Especificar donde y que tipo de trabajo"
                value={priorWorkDetail}
                onChangeText={setPriorWorkDetail}
                variant="light"
                multiline
                numberOfLines={3}
                maxLength={300}
              />
            )}

          </View>
        )}

        {/* ════════ STEP 4: Historia clinica ════════ */}
        {step === 4 && (
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

        {/* ════════ STEP 5: Foto antes del procedimiento ════════ */}
        {step === 5 && (
          <View style={styles.formGroup}>
            <Text style={styles.fitzInstructions}>
              Toma o selecciona fotos antes del procedimiento (minimo 1, maximo 3)
            </Text>

            {/* Photo action buttons */}
            {beforePhotos.length < 3 && (
              <View style={styles.photoButtonsRow}>
                <View style={styles.photoButtonWrapper}>
                  <Button
                    title="Camara"
                    onPress={() => addBeforePhoto("camera")}
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
                    onPress={() => addBeforePhoto("gallery")}
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
            {beforePhotos.length > 0 ? (
              <View style={styles.beforePhotoGrid}>
                {beforePhotos.map((uri, index) => (
                  <View key={index} style={styles.beforePhotoThumb}>
                    <Image source={{ uri }} style={styles.beforePhotoImage} />
                    <Pressable
                      onPress={() => removeBeforePhoto(index)}
                      style={styles.beforePhotoDelete}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.danger} />
                    </Pressable>
                    <View style={styles.beforePhotoBadge}>
                      <Text style={styles.beforePhotoBadgeText}>{index + 1}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={48} color={colors.textLight} />
                <Text style={styles.photoPlaceholderText}>Sin fotos aun</Text>
              </View>
            )}

            <Text style={styles.photoCountText}>
              {beforePhotos.length}/3 fotos
            </Text>
          </View>
        )}

        {/* ════════ STEP 6: Confirmar ════════ */}
        {step === 6 && (
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
                <Text style={styles.summaryLabel}>Teléfono</Text>
                <Text style={styles.summaryValue}>{phone}</Text>
              </View>

              {age.trim() ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Edad</Text>
                  <Text style={styles.summaryValue}>{age} años</Text>
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
                    const cond = MEDICAL_CONDITIONS.find((c) => c.key === key);
                    return (
                      <Text key={key} style={[styles.summaryValue, { fontSize: 13 }]}>
                        • {cond?.label || key}
                      </Text>
                    );
                  })}
                </View>
              )}

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fotos antes</Text>
                <Text style={styles.summaryValue}>
                  {beforePhotos.length} foto{beforePhotos.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </View>

            {/* Servicios seleccionados */}
            {selectedServices.length > 0 && (
              <View style={[styles.summaryCard, { marginTop: 12 }]}>
                <Text style={styles.summaryTitle}>Servicios</Text>
                {selectedServices.map((svc) => {
                  const isPackage = servicePackage[svc.id] ?? false;
                  const amount = serviceAmount(svc);
                  const cat = categoryInfo(svc.categoryKey);
                  return (
                    <View key={svc.id} style={styles.summaryRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                        <ZoneIcon
                          icon={cat.icon}
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={[styles.summaryLabel, { fontWeight: "600" }]}>
                          {svc.name}
                          {svc.pricingType === "laser"
                            ? isPackage
                              ? " (paquete)"
                              : " (sesión)"
                            : ""}
                        </Text>
                      </View>
                      <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15 }}>
                        {svc.pricingType === "variable" && amount === 0
                          ? "Por cotizar"
                          : `$${amount.toLocaleString()}`}
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.grandTotalDivider} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontWeight: "bold", fontSize: 15 }]}>Total</Text>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>
                    ${grandTotal.toLocaleString()} MXN
                    {hasPendingQuote ? " + cotización" : ""}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottomButton}>
        {step < TOTAL_STEPS ? (
          <Button
            title="Siguiente"
            onPress={handleNext}
            disabled={
              (step === 2 && fitzpatrickType === null) ||
              (step === 3 && selectedServiceIds.size === 0) ||
              (step === 5 && beforePhotos.length === 0)
            }
          />
        ) : (
          <Button
            title="Guardar clienta"
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
  beforePhotoGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  beforePhotoThumb: {
    position: "relative",
    flex: 1,
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
  beforePhotoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  beforePhotoBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
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

  // ── Zones ──
  zoneBlock: {
    marginBottom: 12,
  },
  zoneToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  zoneToggleActive: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  zoneToggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  zoneToggleTextActive: {
    color: colors.white,
  },
  zoneOptionsGrid: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.divider,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    padding: spacing.md,
    gap: 8,
  },
  zoneOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  zoneOptionSelected: {},
  zoneOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  zoneOptionTextSelected: {
    color: colors.text,
    fontWeight: "500",
  },

  // ── Grand Total ──
  // ── Catalog-based service selection ──
  noServicesBox: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing["3xl"],
    paddingHorizontal: spacing.lg,
  },
  noServicesTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  noServicesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  catBlock: { marginBottom: spacing.lg },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  catTitle: { fontSize: 15, fontWeight: "600", color: colors.primary },
  svcRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  svcRowSelected: { borderColor: colors.primary },
  svcName: { fontSize: 15, color: colors.text },
  svcNameSelected: { fontWeight: "600" },
  svcPrice: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  quoteRow: { marginBottom: spacing.sm, paddingHorizontal: spacing.xs },

  grandTotalBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  grandTotalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 12,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    color: colors.text,
  },
  grandTotalItemPrice: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  grandTotalDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  grandTotalTotalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  grandTotalTotalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  grandTotalStrikePrice: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  grandTotalSavings: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  grandTotalSavingsText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: "600",
  },
  guaranteeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  guaranteeText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
    flex: 1,
  },

  // ── Pricing ──
  optionPriceHint: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  priceBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceOriginal: {
    fontSize: 16,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
  },
  priceTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },
  discountText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
  },
  variablePriceBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accentLight + "40",
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: 8,
  },
  variablePriceText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  laserToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  // ── Bottom ──
  bottomButton: {
    paddingHorizontal: spacing["2xl"],
    paddingBottom: 32,
  },
});
