import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  authenticateWithBiometric,
  isBiometricAvailable,
  verifyPin,
  setSession,
} from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { BRAND_MONOGRAM } from "@/constants";

function FaceIdIcon() {
  return (
    <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3H5C3.89543 3 3 3.89543 3 5V7"
        stroke="#C4A87C"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
        stroke="#C4A87C"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M7 21H5C3.89543 21 3 20.1046 3 19V17"
        stroke="#C4A87C"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M17 21H19C20.1046 21 21 20.1046 21 19V17"
        stroke="#C4A87C"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M9 9.5V10"
        stroke="#C4A87C"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M15 9.5V10"
        stroke="#C4A87C"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 9.5V12.5H11"
        stroke="#C4A87C"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 15C9 15 10 16.5 12 16.5C14 16.5 15 15 15 15"
        stroke="#C4A87C"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function UnlockScreen() {
  const router = useRouter();
  const { setAuthenticated } = useAuthStore();
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleBiometricAuth = useCallback(async () => {
    try {
      const available = await isBiometricAvailable();
      if (!available) {
        setShowPin(true);
        return;
      }

      const success = await authenticateWithBiometric();
      if (success) {
        await setSession(true);
        setAuthenticated(true);
        router.replace("/(tabs)");
      }
    } catch {
      setShowPin(true);
    }
  }, []);

  useEffect(() => {
    handleBiometricAuth();
  }, []);

  const handlePinDigit = useCallback(
    async (digit: string) => {
      const newPin = pin + digit;
      setPin(newPin);
      setError("");

      if (newPin.length === 4) {
        const valid = await verifyPin(newPin);
        if (valid) {
          await setSession(true);
          setAuthenticated(true);
          router.replace("/(tabs)");
        } else {
          setError("Codigo incorrecto");
          setPin("");
        }
      }
    },
    [pin]
  );

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  }, []);

  return (
    <View className="flex-1 bg-brand-black">
      {/* Header monogram */}
      <View className="items-center pt-20">
        <Text
          className="text-brand-gold"
          style={{ fontSize: 32, fontFamily: "serif", fontWeight: "300" }}
        >
          {BRAND_MONOGRAM}
        </Text>
      </View>

      {!showPin ? (
        /* Biometric view */
        <View className="flex-1 items-center justify-center gap-8">
          <Text className="text-xl font-light text-white">
            Desbloquear aplicacion
          </Text>

          <Pressable
            onPress={handleBiometricAuth}
            className="items-center gap-4"
          >
            <FaceIdIcon />
            <Text className="text-brand-gray text-sm">
              Usa tu rostro para continuar
            </Text>
          </Pressable>

          <Pressable onPress={() => setShowPin(true)} className="mt-8">
            <Text className="text-brand-gold text-base underline">
              O usar codigo
            </Text>
          </Pressable>
        </View>
      ) : (
        /* PIN view */
        <View className="flex-1 items-center justify-center gap-8">
          <Text className="text-xl font-light text-white">
            Ingresa tu codigo
          </Text>

          {/* PIN dots */}
          <View className="flex-row gap-4">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className={`h-4 w-4 rounded-full ${
                  i < pin.length ? "bg-brand-gold" : "border border-brand-gray"
                }`}
              />
            ))}
          </View>

          {error ? (
            <Text className="text-red-400 text-sm">{error}</Text>
          ) : null}

          {/* Number pad */}
          <View className="gap-4 mt-4">
            {[
              ["1", "2", "3"],
              ["4", "5", "6"],
              ["7", "8", "9"],
              ["", "0", "del"],
            ].map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-6 justify-center">
                {row.map((digit) => {
                  if (digit === "") {
                    return <View key="empty" className="h-16 w-16" />;
                  }
                  if (digit === "del") {
                    return (
                      <Pressable
                        key="del"
                        onPress={handleDelete}
                        className="h-16 w-16 items-center justify-center"
                      >
                        <Text className="text-brand-gold text-sm">Borrar</Text>
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={digit}
                      onPress={() => handlePinDigit(digit)}
                      className="h-16 w-16 items-center justify-center rounded-full border border-brand-dark active:bg-brand-dark"
                    >
                      <Text className="text-white text-2xl font-light">
                        {digit}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <Pressable onPress={handleBiometricAuth} className="mt-4">
            <Text className="text-brand-gold text-base underline">
              Usar Face ID
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
