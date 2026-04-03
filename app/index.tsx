import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { useRouter } from "expo-router";
import { BRAND_MONOGRAM, BRAND_NAME, BRAND_SUBTITLE } from "@/constants";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(lineWidth, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      router.replace("/unlock");
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const lineInterpolation = lineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "60%"],
  });

  return (
    <View className="flex-1 items-center justify-center bg-brand-black">
      <Animated.View style={{ opacity: fadeAnim }} className="items-center">
        {/* Monogram */}
        <Text
          className="text-brand-gold mb-2"
          style={{ fontSize: 56, fontFamily: "serif", fontWeight: "300" }}
        >
          {BRAND_MONOGRAM}
        </Text>

        {/* Brand Name */}
        <Text
          className="text-brand-gold tracking-[6px] mb-4"
          style={{ fontSize: 16, fontWeight: "300", letterSpacing: 6 }}
        >
          {BRAND_NAME}
        </Text>

        {/* Animated Line */}
        <Animated.View
          style={{ width: lineInterpolation }}
          className="h-[0.5px] bg-brand-gold mb-4"
        />

        {/* Subtitle */}
        <Text
          className="text-brand-gold/60 tracking-[4px]"
          style={{ fontSize: 11, fontWeight: "300", letterSpacing: 4 }}
        >
          {BRAND_SUBTITLE}
        </Text>
      </Animated.View>
    </View>
  );
}
