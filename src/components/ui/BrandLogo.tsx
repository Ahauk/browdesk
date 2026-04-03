import { View, Text, StyleSheet } from "react-native";
import Svg, { Line } from "react-native-svg";
import { colors } from "@/theme";
import {
  BRAND_MONOGRAM,
  BRAND_NAME,
  BRAND_SUBTITLE,
} from "@/constants";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
}

const sizeConfig = {
  sm: {
    monogram: 28,
    name: 10,
    subtitle: 8,
    lineWidth: 100,
    gap: 6,
  },
  md: {
    monogram: 40,
    name: 13,
    subtitle: 9,
    lineWidth: 140,
    gap: 10,
  },
  lg: {
    monogram: 56,
    name: 16,
    subtitle: 11,
    lineWidth: 180,
    gap: 14,
  },
};

export function BrandLogo({ size = "lg" }: BrandLogoProps) {
  const config = sizeConfig[size];

  return (
    <View style={styles.container}>
      {/* Monogram */}
      <Text
        style={[
          styles.monogram,
          { fontSize: config.monogram, marginBottom: config.gap / 2 },
        ]}
      >
        {BRAND_MONOGRAM}
      </Text>

      {/* Brand Name */}
      <Text
        style={[
          styles.brandName,
          { fontSize: config.name, marginBottom: config.gap },
        ]}
      >
        {BRAND_NAME}
      </Text>

      {/* Line */}
      <Svg
        width={config.lineWidth}
        height={1}
        style={{ marginBottom: config.gap }}
      >
        <Line
          x1={0}
          y1={0.5}
          x2={config.lineWidth}
          y2={0.5}
          stroke={colors.brand.gold}
          strokeWidth={0.5}
        />
      </Svg>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { fontSize: config.subtitle }]}>
        {BRAND_SUBTITLE}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  monogram: {
    color: colors.brand.gold,
    fontFamily: "serif",
    fontWeight: "300",
  },
  brandName: {
    color: colors.brand.gold,
    fontWeight: "300",
    letterSpacing: 6,
  },
  subtitle: {
    color: `${colors.brand.gold}99`,
    fontWeight: "300",
    letterSpacing: 4,
  },
});
