import { Pressable, Text } from "react-native";

interface FloatingActionButtonProps {
  onPress: () => void;
}

export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-brand-gold shadow-lg active:bg-brand-gold-dark"
    >
      <Text className="text-2xl font-bold text-brand-black">+</Text>
    </Pressable>
  );
}
