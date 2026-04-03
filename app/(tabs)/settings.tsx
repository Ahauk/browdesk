import { View, Text, Pressable, Switch, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Avatar, Card, Button } from "@/components/ui";
import { useState } from "react";
import { colors, spacing, radius } from "@/theme";

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
    <Pressable onPress={onPress} style={styles.settingsRow}>
      <Text style={styles.settingsLabel}>{label}</Text>
      {trailing || <Text style={styles.chevron}>{">"}</Text>}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      {/* Profile */}
      <View style={styles.profileSection}>
        <Avatar firstName="Carolina" lastName="Vazquez" size="lg" />
        <Text style={styles.profileName}>Carolina Vazquez</Text>
      </View>

      {/* Settings sections */}
      <View style={styles.settingsContainer}>
        <Card variant="light" style={styles.settingsCard}>
          <SettingsRow
            label="Seguridad"
            trailing={
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: "#ccc", true: colors.accent }}
                thumbColor={colors.white}
              />
            }
          />
          <SettingsRow label="Datos clinicos" />
          <SettingsRow label="Exportar respaldo" />
        </Card>

        <View style={styles.saveButtonContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
  },
  profileName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 12,
  },
  settingsContainer: {
    paddingHorizontal: spacing["2xl"],
  },
  settingsCard: {
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingsLabel: {
    color: colors.text,
    fontSize: 15,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 17,
  },
  saveButtonContainer: {
    marginTop: spacing["2xl"],
  },
});
