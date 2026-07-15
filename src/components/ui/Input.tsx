import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  TextStyle,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  // Autofill / QuickType hints (iOS email + password suggestions)
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
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
  autoComplete,
  textContentType,
  autoCapitalize,
  autoCorrect,
  onFocus,
  onBlur,
}: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, labelVariantStyles[variant]]}>
          {label}
        </Text>
      )}
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.brand.gray}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry && hidden}
          editable={editable}
          maxLength={maxLength}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onFocus={onFocus}
          onBlur={onBlur}
          style={[
            styles.input,
            inputVariantStyles[variant],
            multiline && styles.multiline,
            secureTextEntry && styles.inputWithIcon,
            error ? styles.inputError : undefined,
          ]}
        />
        {secureTextEntry && (
          <Pressable
            style={styles.eyeButton}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityLabel={
              hidden ? "Mostrar contraseña" : "Ocultar contraseña"
            }
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={variant === "dark" ? colors.brand.gray : colors.textSecondary}
            />
          </Pressable>
        )}
      </View>
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
  inputWrap: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  eyeButton: {
    position: "absolute",
    right: spacing.md,
    height: "100%",
    justifyContent: "center",
    paddingHorizontal: 4,
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
