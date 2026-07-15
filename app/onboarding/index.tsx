import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { Button, Input } from "@/components/ui";
import { AnimatedSplash } from "@/components/AnimatedSplash";
import { PinSetup } from "@/components/PinSetup";
import {
  savePin,
  isBiometricAvailable,
  authenticateWithBiometric,
} from "@/services/auth.service";
import { pickAndSaveLogo } from "@/services/photo.service";
import { useAuthStore } from "@/stores/auth.store";
import { db } from "@/db/client";
import { userProfile } from "@/db/schema";
import { monogramFromName } from "@/utils/branding";
import type { Treatment } from "@/types/models";
import { colors, spacing, radius } from "@/theme";

const PROFILE_ID = "main";

type Step = "intro" | "form" | "preview" | "security";

const TREATMENT_OPTIONS: { value: Treatment; label: string }[] = [
  { value: "feminine", label: "Bienvenida" },
  { value: "masculine", label: "Bienvenido" },
  { value: "neutral", label: "Neutral" },
];

const LOGO_TIPS = [
  "Tu logo aparecerá sobre un fondo NEGRO elegante, así que idealmente usa un PNG con fondo transparente.",
  "Si tu logo es claro o dorado, se verá espectacular; evita fondos blancos o de colores que formen un cuadro.",
  "Que sea cuadrado y esté centrado (se mostrará dentro de un círculo).",
  "Usa buena resolución (mínimo 500×500 px) para que no se vea pixelado.",
  "Evita capturas de pantalla o imágenes con texto pequeño.",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { cloudUserId, setAuthenticated } = useAuthStore();
  const [step, setStep] = useState<Step>("intro");
  const [studioName, setStudioName] = useState("");
  const [name, setName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [treatment, setTreatment] = useState<Treatment>("neutral");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePickLogo = useCallback(async () => {
    const uri = await pickAndSaveLogo();
    if (uri) setLogoUri(uri);
  }, []);

  // Persist the profile so the animated preview (and the rest of the app) can
  // read the real brand. Called before showing the preview.
  const saveProfile = useCallback(async (): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const [existing] = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, PROFILE_ID))
        .limit(1);

      const values = {
        studioName: studioName.trim(),
        name: name.trim() || studioName.trim(),
        logoUri: logoUri ?? undefined,
        treatment,
        userId: cloudUserId ?? undefined,
        updatedAt: now,
      };

      if (existing) {
        await db
          .update(userProfile)
          .set(values)
          .where(eq(userProfile.id, PROFILE_ID));
      } else {
        await db.insert(userProfile).values({
          id: PROFILE_ID,
          biometricEnabled: true,
          calendarSyncEnabled: false,
          createdAt: now,
          ...values,
        });
      }
      return true;
    } catch (e) {
      console.error("Onboarding save failed:", e);
      return false;
    }
  }, [studioName, name, logoUri, treatment, cloudUserId]);

  const goToPreview = useCallback(async () => {
    setError("");
    if (!studioName.trim()) {
      setError("Escribe el nombre de tu estudio.");
      return;
    }
    setSaving(true);
    const ok = await saveProfile();
    setSaving(false);
    if (ok) setStep("preview");
    else setError("No se pudo guardar. Inténtalo de nuevo.");
  }, [studioName, saveProfile]);

  const finishOnboarding = useCallback(() => {
    setAuthenticated(true);
    router.replace("/(tabs)");
  }, [setAuthenticated, router]);

  // After confirming the PIN, offer Face ID if the device supports it.
  const handlePinComplete = useCallback(
    async (pin: string) => {
      await savePin(pin);
      let biometricOk = false;
      try {
        if (await isBiometricAvailable()) {
          biometricOk = true;
        }
      } catch {
        biometricOk = false;
      }

      if (!biometricOk) {
        finishOnboarding();
        return;
      }

      Alert.alert(
        "Activar Face ID",
        "¿Quieres desbloquear la app con Face ID? Tu PIN quedará como respaldo.",
        [
          { text: "Ahora no", style: "cancel", onPress: finishOnboarding },
          {
            text: "Activar",
            onPress: async () => {
              try {
                await authenticateWithBiometric();
              } catch {
                // Ignore — PIN is already set as fallback.
              }
              finishOnboarding();
            },
          },
        ]
      );
    },
    [finishOnboarding]
  );

  const displayName = studioName.trim() || "Tu Estudio";

  /* ─────────────── Step: intro ─────────────── */
  if (step === "intro") {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Ionicons
            name="sparkles-outline"
            size={44}
            color={colors.splash.gold}
            style={styles.introIcon}
          />
          <Text style={styles.heading}>Haz tuya la app</Text>
          <Text style={styles.subheading}>
            Tu logo y el nombre de tu estudio aparecerán en la pantalla de
            inicio y en los recordatorios que envíes a tus clientas.
          </Text>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Para que tu logo se vea bien:</Text>
            {LOGO_TIPS.map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.splash.gold}
                />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <View style={styles.submit}>
            <Button title="Continuar" onPress={() => setStep("form")} />
          </View>
        </ScrollView>
        <StatusBar style="light" />
      </View>
    );
  }

  /* ─────────────── Step: preview (real animated splash) ─────────────── */
  if (step === "preview") {
    return (
      <View style={styles.container}>
        <AnimatedSplash />
        <SafeAreaView style={styles.previewOverlay} pointerEvents="box-none">
          <Text style={styles.previewLabel}>Así se verá tu app al abrirla</Text>
          <View style={styles.previewActions}>
            <Button title="Se ve bien, continuar" onPress={() => setStep("security")} />
            <Button
              title="Ajustar"
              variant="ghost"
              onPress={() => setStep("form")}
            />
          </View>
        </SafeAreaView>
        <StatusBar style="light" />
      </View>
    );
  }

  /* ─────────────── Step: security (PIN + Face ID) ─────────────── */
  if (step === "security") {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={colors.splash.gold}
            style={styles.introIcon}
          />
          <Text style={styles.heading}>Protege tu app</Text>
          <Text style={styles.subheading}>
            Crea un código para que solo tú puedas abrir la app. Guardas datos
            de tus clientas, así que esto los mantiene seguros.
          </Text>

          <PinSetup onComplete={handlePinComplete} />

          <Pressable style={styles.skip} onPress={finishOnboarding}>
            <Text style={styles.skipText}>Omitir por ahora</Text>
          </Pressable>
        </ScrollView>
        <StatusBar style="light" />
      </View>
    );
  }

  /* ─────────────── Step: form ─────────────── */
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Configura tu estudio</Text>
        <Text style={styles.subheading}>
          Personaliza cómo se verá la app con tu marca
        </Text>

        <Pressable style={styles.logoPicker} onPress={handlePickLogo}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoCircle}>
              <Text style={styles.logoMonogram}>
                {monogramFromName(displayName)}
              </Text>
            </View>
          )}
          <Text style={styles.logoHint}>
            {logoUri ? "Cambiar logo" : "Subir mi logo"}
          </Text>
          <Text style={styles.logoSubhint}>
            {logoUri
              ? "Se muestra dentro de un círculo sobre fondo negro"
              : "Generamos un monograma con tus iniciales. Sube tu logo si prefieres."}
          </Text>
        </Pressable>

        <View style={styles.form}>
          <Input
            label="Nombre del estudio"
            placeholder="Ej. Estudio Bella Cejas"
            value={studioName}
            onChangeText={setStudioName}
            variant="dark"
          />
          <Input
            label="Tu nombre (opcional)"
            placeholder="Ej. Ana López"
            value={name}
            onChangeText={setName}
            variant="dark"
          />

          <View style={styles.treatmentField}>
            <Text style={styles.treatmentLabel}>
              ¿Cómo prefieres que te saludemos?
            </Text>
            <View style={styles.treatmentRow}>
              {TREATMENT_OPTIONS.map((opt) => {
                const selected = treatment === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setTreatment(opt.value)}
                    style={[
                      styles.treatmentPill,
                      selected && styles.treatmentPillSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.treatmentPillText,
                        selected && styles.treatmentPillTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.submit}>
            <Button title="Continuar" onPress={goToPreview} />
          </View>
        </View>
      </ScrollView>
      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.splash.black,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["4xl"],
  },
  heading: {
    fontSize: 26,
    fontWeight: "300",
    color: colors.white,
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    color: colors.brand.gray,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing["3xl"],
    lineHeight: 20,
  },

  // Intro
  introIcon: {
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  tipsCard: {
    backgroundColor: colors.brand.dark,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing["3xl"],
  },
  tipsTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  tipText: {
    flex: 1,
    color: colors.brand.gray,
    fontSize: 13,
    lineHeight: 19,
  },

  // Logo picker
  logoPicker: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing["3xl"],
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.splash.gold,
    backgroundColor: colors.splash.dark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  logoMonogram: {
    fontSize: 46,
    fontWeight: "300",
    color: colors.splash.gold,
  },
  logoHint: {
    fontSize: 13,
    color: colors.splash.gold,
  },
  logoSubhint: {
    fontSize: 11,
    color: colors.brand.gray,
  },

  // Form
  form: {
    gap: spacing.lg,
  },
  treatmentField: {
    gap: spacing.sm,
  },
  treatmentLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.white,
  },
  treatmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  treatmentPill: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.splash.dark,
    backgroundColor: colors.brand.dark,
    alignItems: "center",
  },
  treatmentPillSelected: {
    borderColor: colors.splash.gold,
    backgroundColor: "rgba(196,168,124,0.15)",
  },
  treatmentPillText: {
    fontSize: 13,
    color: colors.brand.gray,
  },
  treatmentPillTextSelected: {
    color: colors.splash.gold,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF6B6B",
    fontSize: 13,
    textAlign: "center",
  },
  submit: {
    marginTop: spacing.sm,
  },

  // Preview (overlay on top of the animated splash)
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: spacing["3xl"],
  },
  previewLabel: {
    fontSize: 13,
    color: colors.brand.gray,
    textAlign: "center",
  },
  previewActions: {
    gap: spacing.sm,
  },

  // Security
  skip: {
    alignItems: "center",
    marginTop: spacing["2xl"],
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: colors.brand.gray,
    fontSize: 14,
  },
});
