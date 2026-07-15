import { View, Text, Image, StyleSheet } from "react-native";
import { useProfile } from "@/hooks/useProfile";
import { brandName, monogramFromName } from "@/utils/branding";
import { colors } from "@/theme";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "gold" | "dark";
}

const sizeConfig = {
  sm: { logo: 46, name: 12, letterSpacing: 2, gap: 8, monogram: 20 },
  md: { logo: 92, name: 16, letterSpacing: 3, gap: 14, monogram: 36 },
  lg: { logo: 140, name: 24, letterSpacing: 6, gap: 20, monogram: 56 },
};

/**
 * White-label brand mark: the user's studio logo (circular) with the studio
 * name in the elegant gold lettering. Falls back to just the app name when no
 * studio is configured. Kept intentionally simple so the splash's shimmer +
 * sparkle animations can layer on top.
 */
export function BrandLogo({
  size = "lg",
  showText = true,
  variant = "gold",
}: BrandLogoProps) {
  const { profile } = useProfile();
  const config = sizeConfig[size];
  const name = brandName(profile);
  const logoUri = profile?.logoUri;
  const tint = variant === "dark" ? colors.primaryDark : colors.splash.gold;

  return (
    <View style={[styles.container, { gap: config.gap }]}>
      {logoUri ? (
        <Image
          source={{ uri: logoUri }}
          style={{
            width: config.logo,
            height: config.logo,
            borderRadius: config.logo / 2,
          }}
        />
      ) : (
        <View
          style={[
            styles.monogramCircle,
            {
              width: config.logo,
              height: config.logo,
              borderRadius: config.logo / 2,
              borderColor: tint,
            },
          ]}
        >
          <Text
            style={{ fontSize: config.monogram, color: tint, fontWeight: "300" }}
          >
            {monogramFromName(name)}
          </Text>
        </View>
      )}
      {showText && (
        <Text
          style={[
            styles.nameText,
            {
              fontSize: config.name,
              color: tint,
              letterSpacing: config.letterSpacing,
            },
          ]}
          numberOfLines={2}
        >
          {name.toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  monogramCircle: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nameText: {
    fontWeight: "300",
    textAlign: "center",
    maxWidth: 320,
  },
});
