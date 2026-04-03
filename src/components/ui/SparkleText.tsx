import { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { colors } from "@/theme";

interface SparkleTextProps {
  text: string;
  fontSize?: number;
}

function Sparkle({
  delay,
  top,
  left,
  size = 12,
}: {
  delay: number;
  top: number;
  left: number;
  size?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(800),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.sparkle,
        {
          top,
          left,
          fontSize: size,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      ✦
    </Animated.Text>
  );
}

export function SparkleText({ text, fontSize = 18 }: SparkleTextProps) {
  // Shimmer animation for the text itself
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  const textColor = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#FFFFFF", "#F5DEB3", "#FFFFFF"],
  });

  return (
    <View style={styles.container}>
      {/* Sparkles positioned around the text */}
      <Sparkle delay={0} top={-6} left={10} size={10} />
      <Sparkle delay={600} top={2} left={-8} size={8} />
      <Sparkle delay={1200} top={-4} left={180} size={11} />
      <Sparkle delay={400} top={18} left={200} size={7} />
      <Sparkle delay={900} top={-8} left={100} size={9} />
      <Sparkle delay={1500} top={20} left={50} size={6} />

      <Animated.Text
        style={[styles.text, { fontSize, color: textColor }]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    fontWeight: "300",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  sparkle: {
    position: "absolute",
    color: "#F5DEB3",
    zIndex: 1,
  },
});
