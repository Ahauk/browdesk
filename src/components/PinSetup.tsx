import { useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing } from "@/theme";

interface PinSetupProps {
  onComplete: (pin: string) => void;
}

/**
 * Two-step 4-digit PIN creation (enter → confirm) with the premium dark pad,
 * matching the unlock screen. Calls onComplete(pin) once confirmed.
 */
export function PinSetup({ onComplete }: PinSetupProps) {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const current = step === "enter" ? pin : confirm;

  const handleDigit = useCallback(
    (digit: string) => {
      setError("");
      if (step === "enter") {
        const next = (pin + digit).slice(0, 4);
        setPin(next);
        if (next.length === 4) {
          setStep("confirm");
          setConfirm("");
        }
      } else {
        const next = (confirm + digit).slice(0, 4);
        setConfirm(next);
        if (next.length === 4) {
          if (next === pin) {
            onComplete(pin);
          } else {
            setError("Los códigos no coinciden");
            setPin("");
            setConfirm("");
            setStep("enter");
          }
        }
      }
    },
    [step, pin, confirm, onComplete]
  );

  const handleDelete = useCallback(() => {
    setError("");
    if (step === "enter") setPin((p) => p.slice(0, -1));
    else setConfirm((c) => c.slice(0, -1));
  }, [step]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {step === "enter" ? "Crea un código de 4 dígitos" : "Confirma tu código"}
      </Text>

      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < current.length ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.pad}>
        {[
          ["1", "2", "3"],
          ["4", "5", "6"],
          ["7", "8", "9"],
          ["", "0", "del"],
        ].map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((d) => {
              if (d === "") return <View key="e" style={styles.key} />;
              if (d === "del")
                return (
                  <Pressable key="del" style={styles.key} onPress={handleDelete}>
                    <Text style={styles.delText}>Borrar</Text>
                  </Pressable>
                );
              return (
                <Pressable
                  key={d}
                  onPress={() => handleDigit(d)}
                  style={({ pressed }) => [
                    styles.key,
                    styles.keyBorder,
                    pressed && styles.keyPressed,
                  ]}
                >
                  <Text style={styles.keyText}>{d}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: spacing.lg },
  title: { fontSize: 18, fontWeight: "300", color: colors.white },
  dotsRow: { flexDirection: "row", gap: 16 },
  dot: { height: 15, width: 15, borderRadius: 9999 },
  dotFilled: { backgroundColor: colors.splash.gold },
  dotEmpty: { borderWidth: 1, borderColor: colors.brand.gray },
  error: { color: "#EF6B6B", fontSize: 13 },
  pad: { gap: 14 },
  row: { flexDirection: "row", gap: 22, justifyContent: "center" },
  key: {
    height: 62,
    width: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  keyBorder: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.brand.dark,
  },
  keyPressed: { backgroundColor: colors.brand.dark },
  keyText: { color: colors.white, fontSize: 24, fontWeight: "300" },
  delText: { color: colors.splash.gold, fontSize: 13 },
});
