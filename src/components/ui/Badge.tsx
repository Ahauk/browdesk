import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors, spacing, radius } from "@/theme";

interface BadgeProps {
  label: string;
  variant?: "gold" | "dark" | "beige";
  selected?: boolean;
  onPress?: () => void;
}

const variantMap: Record<string, { selected: ViewStyle; unselected: ViewStyle }> = {
  gold: {
    selected: { backgroundColor: colors.primary },
    unselected: {
      backgroundColor: colors.transparent,
      borderWidth: 1,
      borderColor: colors.primary,
    },
  },
  dark: {
    selected: { backgroundColor: colors.brand.dark },
    unselected: {
      backgroundColor: colors.transparent,
      borderWidth: 1,
      borderColor: colors.brand.dark,
    },
  },
  beige: {
    selected: { backgroundColor: colors.brand.beigeMedium },
    unselected: {
      backgroundColor: colors.transparent,
      borderWidth: 1,
      borderColor: colors.brand.beigeMedium,
    },
  },
};

const textVariantMap: Record<string, { selected: TextStyle; unselected: TextStyle }> = {
  gold: {
    selected: { color: colors.white },
    unselected: { color: colors.primary },
  },
  dark: {
    selected: { color: colors.white },
    unselected: { color: colors.brand.dark },
  },
  beige: {
    selected: { color: colors.brand.roseDark },
    unselected: { color: colors.brand.beigeMedium },
  },
};

export function Badge({
  label,
  variant = "gold",
  selected = false,
}: BadgeProps) {
  const state = selected ? "selected" : "unselected";

  return (
    <View style={[styles.badge, variantMap[variant][state]]}>
      <Text style={[styles.text, textVariantMap[variant][state]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});
