import { useState, useCallback } from "react";
import { View, TextInput, Text, StyleSheet, Pressable } from "react-native";
import { colors, spacing, radius } from "@/theme";

interface PhoneInputProps {
  value: string;
  onChangeText: (raw: string, formatted: string) => void;
  label?: string;
  error?: string;
}

type Country = "mx" | "us";

function formatMX(digits: string): string {
  // Format: 33-1452-3565
  const d = digits.slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
}

function formatUS(digits: string): string {
  // Format: 1-345-678-5687
  const d = digits.slice(0, 11);
  if (d.length <= 1) return d;
  if (d.length <= 4) return `${d.slice(0, 1)}-${d.slice(1)}`;
  if (d.length <= 7) return `${d.slice(0, 1)}-${d.slice(1, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 1)}-${d.slice(1, 4)}-${d.slice(4, 7)}-${d.slice(7)}`;
}

function detectCountry(digits: string): Country {
  return digits.startsWith("1") ? "us" : "mx";
}

function getFlag(country: Country): string {
  return country === "us" ? "🇺🇸" : "🇲🇽";
}

function getMaxDigits(country: Country): number {
  return country === "us" ? 11 : 10;
}

function getPrefix(country: Country): string {
  return country === "us" ? "+1" : "+52";
}

export function PhoneInput({
  value,
  onChangeText,
  label,
  error,
}: PhoneInputProps) {
  // Extract only digits from value
  const digits = value.replace(/\D/g, "");
  const country = detectCountry(digits);
  const flag = getFlag(country);
  const prefix = getPrefix(country);
  const maxDigits = getMaxDigits(country);

  const handleChange = useCallback(
    (text: string) => {
      // Only keep digits
      const newDigits = text.replace(/\D/g, "").slice(0, 11);
      const detected = detectCountry(newDigits);
      const max = getMaxDigits(detected);
      const trimmed = newDigits.slice(0, max);
      const formatted =
        detected === "us" ? formatUS(trimmed) : formatMX(trimmed);
      onChangeText(trimmed, formatted);
    },
    [onChangeText]
  );

  const displayValue =
    country === "us" ? formatUS(digits) : formatMX(digits);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        <View style={styles.flagBox}>
          <Text style={styles.flag}>{flag}</Text>
          <Text style={styles.prefix}>{prefix}</Text>
        </View>
        <View style={styles.divider} />
        <TextInput
          value={displayValue}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          maxLength={country === "us" ? 14 : 12}
          placeholder={country === "us" ? "345-678-5687" : "33-1452-3565"}
          placeholderTextColor={colors.textLight}
          style={styles.input}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Text style={styles.hint}>
        {digits.length > 0
          ? `${country === "us" ? "Estados Unidos" : "Mexico"} · ${digits.length}/${maxDigits} digitos`
          : "Inicia con 1 para USA, cualquier otro para Mexico"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputError: {
    borderColor: colors.danger,
  },
  flagBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  prefix: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
  },
  hint: {
    fontSize: 11,
    color: colors.textLight,
  },
});
