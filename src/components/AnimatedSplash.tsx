import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { BrandLogo } from "@/components/ui";
import { colors } from "@/theme";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const LOGO_WIDTH = 360;

const pct = (yPct: number, xPct: number) => ({
  top: SCREEN_H * yPct,
  left: SCREEN_W * xPct,
});

const SPARKLES = [
  { ...pct(0.06, 0.15), size: 5, delay: 1800 },
  { ...pct(0.1, 0.75), size: 6, delay: 2200 },
  { ...pct(0.14, 0.45), size: 7, delay: 1000 },
  { ...pct(0.18, 0.85), size: 5, delay: 400 },
  { ...pct(0.22, 0.08), size: 8, delay: 600 },
  { ...pct(0.26, 0.88), size: 6, delay: 1400 },
  { ...pct(0.3, 0.35), size: 5, delay: 800 },
  { ...pct(0.35, 0.7), size: 7, delay: 200 },
  { ...pct(0.4, 0.05), size: 9, delay: 1100 },
  { ...pct(0.42, 0.92), size: 7, delay: 300 },
  { ...pct(0.48, 0.03), size: 6, delay: 1600 },
  { ...pct(0.5, 0.95), size: 8, delay: 900 },
  { ...pct(0.55, 0.08), size: 5, delay: 1300 },
  { ...pct(0.58, 0.9), size: 7, delay: 500 },
  { ...pct(0.64, 0.12), size: 6, delay: 700 },
  { ...pct(0.68, 0.82), size: 8, delay: 1500 },
  { ...pct(0.72, 0.4), size: 5, delay: 1900 },
  { ...pct(0.76, 0.65), size: 7, delay: 2000 },
  { ...pct(0.82, 0.2), size: 6, delay: 1200 },
  { ...pct(0.86, 0.78), size: 5, delay: 2400 },
  { ...pct(0.9, 0.5), size: 7, delay: 1700 },
  { ...pct(0.94, 0.3), size: 5, delay: 2100 },
];

function Sparkle({
  top,
  left,
  size,
  delay,
}: {
  top: number;
  left: number;
  size: number;
  delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const animate = () => {
      opacity.setValue(0);
      scale.setValue(0.2);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.2,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(600 + ((delay % 5) / 5) * 800),
      ]).start(() => animate());
    };
    const t = setTimeout(animate, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.Text
      style={{
        position: "absolute",
        top,
        left,
        fontSize: size,
        color: "#e2c7a7",
        opacity,
        transform: [{ scale }],
      }}
    >
      ✦
    </Animated.Text>
  );
}

/**
 * The premium animated brand splash: black backdrop, floating gold sparkles,
 * and a gold shimmer sweeping across the studio logo/name. Used both on app
 * launch and in onboarding as a live "this is how it will look" preview.
 */
export function AnimatedSplash() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shimmerX = useRef(new Animated.Value(-LOGO_WIDTH)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    let cancelled = false;
    const startShimmer = () => {
      if (cancelled) return;
      shimmerX.setValue(-LOGO_WIDTH);
      Animated.timing(shimmerX, {
        toValue: LOGO_WIDTH,
        duration: 1800,
        useNativeDriver: true,
      }).start(() => {
        if (!cancelled) setTimeout(startShimmer, 1000);
      });
    };
    const t = setTimeout(startShimmer, 1400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.sparkleLayer, { opacity: fadeAnim }]}>
        {SPARKLES.map((s, i) => (
          <Sparkle key={i} {...s} />
        ))}
      </Animated.View>

      <Animated.View
        style={[
          styles.logoArea,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <BrandLogo size="lg" />

        <View style={styles.shimmerOverlay}>
          <MaskedView
            style={styles.maskedView}
            maskElement={
              <View style={styles.maskContainer}>
                <BrandLogo size="lg" />
              </View>
            }
          >
            <Animated.View
              style={[
                styles.shimmerTrack,
                { transform: [{ translateX: shimmerX }] },
              ]}
            >
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(255,245,225,0.0)",
                  "rgba(255,245,225,0.5)",
                  "rgba(255,255,255,0.7)",
                  "rgba(255,245,225,0.5)",
                  "rgba(255,245,225,0.0)",
                  "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </MaskedView>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.splash.black,
  },
  sparkleLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoArea: {
    position: "relative",
    padding: 20,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  maskedView: {
    flex: 1,
  },
  maskContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shimmerTrack: {
    flex: 1,
    width: LOGO_WIDTH * 3,
    justifyContent: "center",
  },
  shimmerGradient: {
    flex: 1,
    width: 120,
  },
});
