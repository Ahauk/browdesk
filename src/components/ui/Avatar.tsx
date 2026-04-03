import { View, Text, Image } from "react-native";
import { getInitials } from "@/utils/format";

interface AvatarProps {
  firstName: string;
  lastName: string;
  uri?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { container: "h-10 w-10", text: "text-sm" },
  md: { container: "h-12 w-12", text: "text-base" },
  lg: { container: "h-20 w-20", text: "text-2xl" },
};

export function Avatar({
  firstName,
  lastName,
  uri,
  size = "md",
}: AvatarProps) {
  const { container, text } = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${container} rounded-full`}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      className={`${container} rounded-full bg-brand-beige-medium items-center justify-center`}
    >
      <Text className={`${text} font-semibold text-brand-gold-dark`}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
}
