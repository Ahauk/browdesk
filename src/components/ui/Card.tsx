import { View, Pressable } from "react-native";

interface CardProps {
  children: React.ReactNode;
  variant?: "light" | "dark";
  onPress?: () => void;
  className?: string;
}

export function Card({
  children,
  variant = "light",
  onPress,
  className = "",
}: CardProps) {
  const variantClasses = {
    light: "bg-white",
    dark: "bg-brand-dark",
  };

  const content = (
    <View
      className={`rounded-2xl p-4 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-90">
        {content}
      </Pressable>
    );
  }

  return content;
}
