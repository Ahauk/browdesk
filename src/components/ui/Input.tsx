import { View, TextInput, Text, StyleSheet, TextStyle, ViewStyle } from "react-native";
import { colors, spacing, radius } from "@/theme";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: "light" | "dark";
  keyboardType?: "default" | "phone-pad" | "email-address" | "numeric";
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  editable?: boolean;
  maxLength?: number;
  error?: string;
}

const inputVariantStyles: Record<string, TextStyle> = {
  light: { backgroundColor: colors.gray100, color: colors.brand.black },
  dark: { backgroundColor: colors.brand.dark, color: colors.white },
};

const labelVariantStyles: Record<string, TextStyle> = {
  light: { color: colors.brand.black },
  dark: { color: colors.white },
};

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  variant = "light",
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  editable = true,
  maxLength,
  error,
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, labelVariantStyles[variant]]}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.brand.gray}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        editable={editable}
        maxLength={maxLength}
        style={[
          styles.input,
          inputVariantStyles[variant],
          multiline && styles.multiline,
          error ? styles.inputError : undefined,
        ]}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 2,
  },
});
