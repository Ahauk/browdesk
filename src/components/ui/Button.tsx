import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, spacing, radius } from "@/theme";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceSoft },
  outline: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.transparent,
  },
  ghost: { backgroundColor: colors.transparent },
};

const variantPressedStyles: Record<string, ViewStyle> = {
  primary: { backgroundColor: colors.primaryDark },
  secondary: { backgroundColor: colors.accentLight },
  outline: { backgroundColor: "rgba(139,107,79,0.1)" },
  ghost: { backgroundColor: "rgba(139,107,79,0.08)" },
};

const textVariantStyles: Record<string, TextStyle> = {
  primary: { color: colors.white, fontWeight: "600" },
  secondary: { color: colors.primary, fontWeight: "600" },
  outline: { color: colors.primary, fontWeight: "600" },
  ghost: { color: colors.primary, fontWeight: "500" },
};

const sizeStyles: Record<string, ViewStyle> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  md: { paddingVertical: 14, paddingHorizontal: spacing["2xl"] },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing["3xl"] },
};

const textSizeStyles: Record<string, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        pressed && variantPressedStyles[variant],
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.white : colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[textVariantStyles[variant], textSizeStyles[size]]}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderRadius: radius["2xl"],
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
