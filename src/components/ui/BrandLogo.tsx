import { View, StyleSheet } from "react-native";
import { SvgXml } from "react-native-svg";
import { colors } from "@/theme";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

// Full logo SVG with CV monogram, name, line, and subtitle
const fullLogoSvg = `
<svg viewBox="0 0 450 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#c5a47e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#e2c7a7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b08d5c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <g transform="translate(225, 100)">
    <text font-family="'Apple Chancery', 'Snell Roundhand', cursive" font-size="120" fill="url(#goldGradient)" text-anchor="middle" font-style="italic">
      <tspan x="-15" y="0">C</tspan>
      <tspan x="15" y="25" letter-spacing="-40">V</tspan>
    </text>
    <text x="0" y="95" font-family="'Optima', 'Gill Sans', sans-serif" font-size="28" fill="url(#goldGradient)" text-anchor="middle" letter-spacing="4" font-weight="300">CAROLINA VAZQUEZ</text>
    <rect x="-185" y="115" width="370" height="1.2" fill="url(#goldGradient)" />
    <text x="0" y="145" font-family="'Optima', 'Gill Sans', sans-serif" font-size="16" fill="url(#goldGradient)" text-anchor="middle" letter-spacing="6" font-weight="300">MICROPIGMENTACION</text>
  </g>
</svg>
`;

// CV monogram with gold gradient (for dark backgrounds)
const monogramGoldSvg = `
<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#c5a47e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#e2c7a7;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#b08d5c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <text font-family="'Apple Chancery', 'Snell Roundhand', cursive" font-size="80" fill="url(#goldGradient)" text-anchor="middle" font-style="italic">
    <tspan x="50" y="65">C</tspan>
    <tspan x="70" y="80" letter-spacing="-30">V</tspan>
  </text>
</svg>
`;

// CV monogram with dark color (for light/coral backgrounds)
const monogramDarkSvg = `
<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
  <text font-family="'Apple Chancery', 'Snell Roundhand', cursive" font-size="80" fill="#5C4634" text-anchor="middle" font-style="italic">
    <tspan x="50" y="65">C</tspan>
    <tspan x="70" y="80" letter-spacing="-30">V</tspan>
  </text>
</svg>
`;

const sizeConfig = {
  sm: { width: 50, height: 42 },
  md: { width: 80, height: 67 },
  lg: { width: 300, height: 200 },
};

export function CVMonogram({
  size = 40,
  variant = "gold",
}: {
  size?: number;
  color?: string;
  variant?: "gold" | "dark";
}) {
  const svg = variant === "dark" ? monogramDarkSvg : monogramGoldSvg;
  return <SvgXml xml={svg} width={size} height={size * 0.83} />;
}

export function BrandLogo({ size = "lg", showText = true }: BrandLogoProps) {
  const config = sizeConfig[size];

  if (!showText) {
    return (
      <View style={styles.container}>
        <CVMonogram size={config.width} />
      </View>
    );
  }

  // For sizes with text, use the full logo
  const logoWidth = size === "sm" ? 160 : size === "md" ? 240 : 340;
  const logoHeight = logoWidth * (300 / 450);

  return (
    <View style={styles.container}>
      <SvgXml xml={fullLogoSvg} width={logoWidth} height={logoHeight} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
});
