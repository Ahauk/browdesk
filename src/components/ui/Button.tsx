import { Pressable, Text, ActivityIndicator, View } from "react-native";

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
  const baseClasses = "items-center justify-center flex-row rounded-2xl";

  const variantClasses = {
    primary: "bg-brand-gold active:bg-brand-gold-dark",
    secondary: "bg-brand-dark active:bg-brand-black",
    outline: "border border-brand-gold bg-transparent active:bg-brand-gold/10",
    ghost: "bg-transparent active:bg-brand-beige-medium/20",
  };

  const textVariantClasses = {
    primary: "text-brand-black font-semibold",
    secondary: "text-white font-semibold",
    outline: "text-brand-gold font-semibold",
    ghost: "text-brand-gold font-medium",
  };

  const sizeClasses = {
    sm: "py-2 px-4",
    md: "py-3.5 px-6",
    lg: "py-4 px-8",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass = disabled || loading ? "opacity-50" : "";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#1A1A1A" : "#C4A87C"}
          size="small"
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            className={`${textVariantClasses[variant]} ${textSizeClasses[size]}`}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
