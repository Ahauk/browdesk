import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { eq } from "drizzle-orm";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, BrandLogo } from "@/components/ui";
import { passwordChecks, isPasswordStrong } from "@/utils/password";
import { signIn, signUp, sendPasswordReset } from "@/services/session.service";
import { useAuthStore } from "@/stores/auth.store";
import { db, backfillUserId, wipeLocalData } from "@/db/client";
import { userProfile } from "@/db/schema";
import { colors, spacing } from "@/theme";

type Mode = "login" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen() {
  const router = useRouter();
  const { setCloudSession, setAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwFocused, setPwFocused] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = useCallback((): string | null => {
    if (!EMAIL_RE.test(email.trim())) return "Ingresa un correo válido.";
    if (mode === "signup") {
      if (!isPasswordStrong(password))
        return "Tu contraseña no cumple los requisitos.";
      if (password !== confirm) return "Las contraseñas no coinciden.";
    } else if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    return null;
  }, [email, password, confirm, mode]);

  const handleSubmit = useCallback(async () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Sign-up may require email confirmation (no session returned).
    if (!result.session) {
      Alert.alert(
        "Confirma tu correo",
        "Te enviamos un enlace de confirmación. Ábrelo y luego inicia sesión.",
        [{ text: "Entendido", onPress: () => setMode("login") }]
      );
      return;
    }

    const userId = result.session.user.id;
    setCloudSession(result.session);

    if (mode === "signup") {
      // Brand-new account → clean slate, then configure the studio.
      wipeLocalData();
      router.replace("/onboarding");
      return;
    }

    // Login: bind any local data on this device to the account (passes RLS).
    backfillUserId(userId);

    // Onboarding only if the studio isn't configured yet.
    const [profile] = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.id, "main"))
      .limit(1);

    if (!profile?.studioName) {
      router.replace("/onboarding");
    } else {
      setAuthenticated(true);
      router.replace("/(tabs)");
    }
  }, [mode, email, password, validate, setCloudSession, setAuthenticated, router]);

  const handleForgotPassword = useCallback(async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError("Escribe tu correo arriba y toca de nuevo para recuperarlo.");
      return;
    }
    const result = await sendPasswordReset(email);
    if (result.ok) {
      Alert.alert(
        "Revisa tu correo",
        "Te enviamos un enlace para restablecer tu contraseña."
      );
    } else {
      setError(result.error);
    }
  }, [email]);

  const toggleMode = useCallback(() => {
    setError("");
    setPassword("");
    setConfirm("");
    setMode((m) => (m === "login" ? "signup" : "login"));
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <BrandLogo size="md" />
        </View>

        <Text style={styles.heading}>
          {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
        </Text>
        <Text style={styles.subheading}>
          {mode === "login"
            ? "Accede a tu estudio"
            : "Empieza a gestionar tu estudio en la nube"}
        </Text>

        <View style={styles.form}>
          <Input
            label="Correo"
            placeholder="tu@correo.com"
            value={email}
            onChangeText={setEmail}
            variant="dark"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Contraseña"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            variant="dark"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            textContentType={mode === "signup" ? "newPassword" : "password"}
            onFocus={() => setPwFocused(true)}
            onBlur={() => setPwFocused(false)}
          />

          {/* Requirements checklist: only while typing the password */}
          {mode === "signup" && pwFocused && password.length > 0 && (
            <View style={styles.checklist}>
              {passwordChecks(password).map((c) => (
                <View key={c.label} style={styles.checkRow}>
                  <Ionicons
                    name={c.met ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={c.met ? colors.success : colors.brand.gray}
                  />
                  <Text style={[styles.checkText, c.met && styles.checkTextMet]}>
                    {c.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {mode === "signup" && (
            <Input
              label="Confirmar contraseña"
              placeholder="••••••••"
              value={confirm}
              onChangeText={setConfirm}
              variant="dark"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
            />
          )}

          {/* Match indicator belongs to the confirm field */}
          {mode === "signup" && confirm.length > 0 && (
            <View style={styles.checkRow}>
              <Ionicons
                name={
                  password === confirm
                    ? "checkmark-circle"
                    : "close-circle-outline"
                }
                size={16}
                color={password === confirm ? colors.success : colors.danger}
              />
              <Text
                style={[
                  styles.checkText,
                  password === confirm && styles.checkTextMet,
                ]}
              >
                {password === confirm
                  ? "Las contraseñas coinciden"
                  : "Las contraseñas no coinciden"}
              </Text>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.submit}>
            <Button
              title={mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              onPress={handleSubmit}
              loading={loading}
              disabled={
                mode === "signup" &&
                (!isPasswordStrong(password) || password !== confirm)
              }
            />
          </View>

          {mode === "login" && (
            <Pressable onPress={handleForgotPassword} style={styles.forgot}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={toggleMode} style={styles.switchMode}>
          <Text style={styles.switchModeText}>
            {mode === "login"
              ? "¿No tienes cuenta? "
              : "¿Ya tienes cuenta? "}
            <Text style={styles.switchModeLink}>
              {mode === "login" ? "Regístrate" : "Inicia sesión"}
            </Text>
          </Text>
        </Pressable>
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
  logoSection: {
    alignItems: "center",
    marginBottom: spacing["3xl"],
  },
  heading: {
    fontSize: 24,
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
  },
  form: {
    gap: spacing.lg,
  },
  checklist: {
    gap: 6,
    paddingHorizontal: spacing.xs,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkText: {
    fontSize: 13,
    color: colors.brand.gray,
  },
  checkTextMet: {
    color: colors.white,
  },
  errorText: {
    color: "#EF6B6B",
    fontSize: 13,
    textAlign: "center",
  },
  submit: {
    marginTop: spacing.sm,
  },
  forgot: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  forgotText: {
    color: colors.splash.gold,
    fontSize: 13,
  },
  switchMode: {
    alignItems: "center",
    marginTop: spacing["3xl"],
  },
  switchModeText: {
    color: colors.brand.gray,
    fontSize: 14,
  },
  switchModeLink: {
    color: colors.splash.gold,
    fontWeight: "600",
  },
});
