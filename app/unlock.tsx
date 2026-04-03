import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  authenticateWithBiometric,
  isBiometricAvailable,
  verifyPin,
  savePin,
  hasPin,
  setSession,
} from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { BrandLogo } from "@/components/ui";
import { colors, spacing, radius } from "@/theme";

// In dev mode, skip auth (biometrics don't work in Expo Go)
const isDev = __DEV__;

type Screen = "loading" | "biometric" | "pin" | "setup-pin";

function FaceIdIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3H5C3.89543 3 3 3.89543 3 5V7"
        stroke={colors.brand.gold}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
        stroke={colors.brand.gold}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M7 21H5C3.89543 21 3 20.1046 3 19V17"
        stroke={colors.brand.gold}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M17 21H19C20.1046 21 21 20.1046 21 19V17"
        stroke={colors.brand.gold}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M9 9.5V10"
        stroke={colors.brand.gold}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M15 9.5V10"
        stroke={colors.brand.gold}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 9.5V12.5H11"
        stroke={colors.brand.gold}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 15C9 15 10 16.5 12 16.5C14 16.5 15 15 15 15"
        stroke={colors.brand.gold}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function UnlockScreen() {
  const router = useRouter();
  const { setAuthenticated } = useAuthStore();
  const [screen, setScreen] = useState<Screen>("loading");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");

  const unlock = useCallback(async () => {
    await setSession(true);
    setAuthenticated(true);
    router.replace("/(tabs)");
  }, []);

  const handleBiometricAuth = useCallback(async () => {
    // Skip auth entirely in Expo Go (dev mode)
    if (isDev) {
      await unlock();
      return;
    }

    try {
      const available = await isBiometricAvailable();
      if (!available) {
        const pinExists = await hasPin();
        setScreen(pinExists ? "pin" : "setup-pin");
        return;
      }

      const success = await authenticateWithBiometric();
      if (success) {
        await unlock();
      } else {
        // Face ID failed/cancelled — fall back to PIN
        const pinExists = await hasPin();
        setScreen(pinExists ? "pin" : "setup-pin");
      }
    } catch {
      const pinExists = await hasPin();
      setScreen(pinExists ? "pin" : "setup-pin");
    }
  }, [unlock]);

  // Auto-trigger Face ID on mount
  useEffect(() => {
    handleBiometricAuth();
  }, []);

  const handlePinDigit = useCallback(
    async (digit: string) => {
      if (screen === "pin") {
        const newPin = pin + digit;
        setPin(newPin);
        setError("");

        if (newPin.length === 4) {
          const valid = await verifyPin(newPin);
          if (valid) {
            await unlock();
          } else {
            setError("Código incorrecto");
            setPin("");
          }
        }
      } else if (screen === "setup-pin") {
        if (setupStep === 1) {
          const newPin = pin + digit;
          setPin(newPin);
          setError("");
          if (newPin.length === 4) {
            setSetupStep(2);
            setConfirmPin("");
          }
        } else {
          const newConfirm = confirmPin + digit;
          setConfirmPin(newConfirm);
          setError("");
          if (newConfirm.length === 4) {
            if (newConfirm === pin) {
              await savePin(pin);
              await unlock();
            } else {
              setError("Los códigos no coinciden");
              setPin("");
              setConfirmPin("");
              setSetupStep(1);
            }
          }
        }
      }
    },
    [pin, confirmPin, screen, setupStep, unlock]
  );

  const handleDelete = useCallback(() => {
    setError("");
    if (screen === "setup-pin" && setupStep === 2) {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  }, [screen, setupStep]);

  // Loading state — blank screen while Face ID triggers
  if (screen === "loading") {
    return <View style={styles.container} />;
  }

  const currentPin =
    screen === "setup-pin" && setupStep === 2 ? confirmPin : pin;

  const title =
    screen === "setup-pin"
      ? setupStep === 1
        ? "Crea tu código de acceso"
        : "Confirma tu código"
      : "Ingresa tu código";

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <BrandLogo size="sm" />
      </View>

      {/* Title */}
      <View style={styles.contentSection}>
        <Text style={styles.titleText}>{title}</Text>

        {/* PIN dots */}
        <View style={styles.pinDotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                i < currentPin.length
                  ? styles.pinDotFilled
                  : styles.pinDotEmpty,
              ]}
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {screen === "setup-pin" && setupStep === 1 && (
          <Text style={styles.hintText}>
            Este código protege tus datos si Face ID no está disponible
          </Text>
        )}

        {/* Number pad */}
        <View style={styles.numPad}>
          {[
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["", "0", "del"],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numRow}>
              {row.map((digit) => {
                if (digit === "") {
                  return <View key="empty" style={styles.numButton} />;
                }
                if (digit === "del") {
                  return (
                    <Pressable
                      key="del"
                      onPress={handleDelete}
                      style={styles.numButton}
                    >
                      <Text style={styles.deleteText}>Borrar</Text>
                    </Pressable>
                  );
                }
                return (
                  <Pressable
                    key={digit}
                    onPress={() => handlePinDigit(digit)}
                    style={({ pressed }) => [
                      styles.numButton,
                      styles.numButtonBorder,
                      pressed && styles.numButtonPressed,
                    ]}
                  >
                    <Text style={styles.digitText}>{digit}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Face ID retry — only show if we're on PIN screen (not setup) */}
        {screen === "pin" && (
          <Pressable onPress={handleBiometricAuth} style={styles.faceIdLink}>
            <FaceIdIcon />
            <Text style={styles.faceIdText}>Usar Face ID</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand.black,
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
  },
  contentSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "300",
    color: colors.white,
    marginBottom: 24,
  },
  pinDotsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  pinDot: {
    height: 16,
    width: 16,
    borderRadius: 9999,
  },
  pinDotFilled: {
    backgroundColor: colors.brand.gold,
  },
  pinDotEmpty: {
    borderWidth: 1,
    borderColor: colors.brand.gray,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    marginBottom: 8,
  },
  hintText: {
    color: colors.brand.gray,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 8,
  },
  numPad: {
    gap: 16,
    marginTop: 16,
  },
  numRow: {
    flexDirection: "row",
    gap: 24,
    justifyContent: "center",
  },
  numButton: {
    height: 64,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  numButtonBorder: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.brand.dark,
  },
  numButtonPressed: {
    backgroundColor: colors.brand.dark,
  },
  digitText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "300",
  },
  deleteText: {
    color: colors.brand.gold,
    fontSize: 13,
  },
  faceIdLink: {
    alignItems: "center",
    gap: 8,
    marginTop: 24,
  },
  faceIdText: {
    color: colors.brand.gold,
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
