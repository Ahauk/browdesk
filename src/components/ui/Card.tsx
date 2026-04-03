import { View, Pressable, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, radius } from "@/theme";

interface CardProps {
  children: React.ReactNode;
  variant?: "light" | "dark";
  onPress?: () => void;
  style?: ViewStyle;
}

const variantStyles: Record<string, ViewStyle> = {
  light: { backgroundColor: colors.white },
  dark: { backgroundColor: colors.brand.dark },
};

export function Card({
  children,
  variant = "light",
  onPress,
  style,
}: CardProps) {
  const content = (
    <View style={[styles.card, variantStyles[variant], style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius["2xl"],
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.9,
  },
});
