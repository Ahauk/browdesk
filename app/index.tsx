import { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { BrandLogo } from "@/components/ui";
import { colors } from "@/theme";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      router.replace("/unlock");
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <BrandLogo size="lg" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand.black,
  },
});
