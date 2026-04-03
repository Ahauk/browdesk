import { View, Text, Image, StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";
import { getInitials } from "@/utils/format";
import { colors, radius } from "@/theme";

interface AvatarProps {
  firstName: string;
  lastName: string;
  uri?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap: Record<string, { container: ViewStyle; text: TextStyle }> = {
  sm: { container: { height: 40, width: 40 }, text: { fontSize: 13 } },
  md: { container: { height: 48, width: 48 }, text: { fontSize: 15 } },
  lg: { container: { height: 80, width: 80 }, text: { fontSize: 24 } },
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
        style={[styles.image, container as ImageStyle]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.fallback, container]}>
      <Text style={[styles.initials, text]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderRadius: radius.full,
  } as ImageStyle,
  fallback: {
    borderRadius: radius.full,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontWeight: "600",
    color: colors.primaryDark,
  },
});
