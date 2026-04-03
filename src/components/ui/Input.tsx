import { View, TextInput, Text } from "react-native";

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
}

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
}: InputProps) {
  const inputVariant = {
    light: "bg-gray-100 text-brand-black placeholder:text-brand-gray",
    dark: "bg-brand-dark text-white placeholder:text-brand-gray",
  };

  const labelVariant = {
    light: "text-brand-black",
    dark: "text-white",
  };

  return (
    <View className="gap-1.5">
      {label && (
        <Text className={`text-sm font-medium ${labelVariant[variant]}`}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8A8A"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        secureTextEntry={secureTextEntry}
        editable={editable}
        className={`rounded-xl px-4 py-3 text-base ${inputVariant[variant]} ${
          multiline ? "min-h-[100px] text-top" : ""
        }`}
      />
    </View>
  );
}
