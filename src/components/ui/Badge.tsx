import { View, Text } from "react-native";

interface BadgeProps {
  label: string;
  variant?: "gold" | "dark" | "beige";
  selected?: boolean;
  onPress?: () => void;
}

export function Badge({
  label,
  variant = "gold",
  selected = false,
}: BadgeProps) {
  const variants = {
    gold: selected
      ? "bg-brand-gold"
      : "bg-transparent border border-brand-gold",
    dark: selected
      ? "bg-brand-dark"
      : "bg-transparent border border-brand-dark",
    beige: selected
      ? "bg-brand-beige-medium"
      : "bg-transparent border border-brand-beige-medium",
  };

  const textVariants = {
    gold: selected ? "text-brand-black" : "text-brand-gold",
    dark: selected ? "text-white" : "text-brand-dark",
    beige: selected ? "text-brand-gold-dark" : "text-brand-beige-medium",
  };

  return (
    <View className={`rounded-full px-4 py-1.5 ${variants[variant]}`}>
      <Text className={`text-sm font-medium ${textVariants[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
