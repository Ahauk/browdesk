import { Ionicons } from "@expo/vector-icons";
import { LipsIcon } from "./LipsIcon";
import { colors } from "@/theme";

interface ZoneIconProps {
  icon: string;
  size?: number;
  color?: string;
}

export function ZoneIcon({ icon, size = 20, color = colors.primary }: ZoneIconProps) {
  if (icon === "lips") {
    return <LipsIcon size={size} color={color} />;
  }
  return <Ionicons name={icon as any} size={size} color={color} />;
}
