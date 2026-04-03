import { View, Text, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Avatar, Card, Button } from "@/components/ui";
import { useState } from "react";

function SettingsRow({
  label,
  onPress,
  trailing,
}: {
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4 border-b border-gray-100"
    >
      <Text className="text-brand-black text-base">{label}</Text>
      {trailing || <Text className="text-brand-gray text-lg">{">"}</Text>}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-brand-beige" edges={["top"]}>
      <View className="px-6 pt-4 pb-6">
        <Text className="text-brand-black text-xl font-bold">Ajustes</Text>
      </View>

      {/* Profile */}
      <View className="items-center py-6">
        <Avatar firstName="Carolina" lastName="Vazquez" size="lg" />
        <Text className="text-brand-black text-lg font-bold mt-3">
          Carolina Vazquez
        </Text>
      </View>

      {/* Settings sections */}
      <View className="px-6">
        <Card variant="light" className="mb-4">
          <SettingsRow
            label="Seguridad"
            trailing={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: "#ccc", true: "#C4A87C" }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow label="Datos clinicos" />
          <SettingsRow label="Exportar respaldo" />
        </Card>

        <View className="mt-6">
          <Button
            title="Guardar"
            onPress={() => {
              // TODO: Save settings
              router.back();
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
