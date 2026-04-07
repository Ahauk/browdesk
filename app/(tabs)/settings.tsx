import { useState, useCallback } from "react";
import { setStatusBarStyle } from "expo-status-bar";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, Input, Button } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { pickPhoto, takePhoto } from "@/services/photo.service";
// backup service available but sync via Supabase is primary backup
import {
  savePin,
  verifyPin,
  hasPin,
  isBiometricAvailable,
} from "@/services/auth.service";
import { requestNotificationPermissions } from "@/services/notification.service";
import { colors, spacing, radius } from "@/theme";
import {
  documentDirectory,
  copyAsync,
  makeDirectoryAsync,
  getInfoAsync,
} from "expo-file-system/legacy";
import { randomUUID } from "expo-crypto";

/* ───────────────── PIN Modal Inline ───────────────── */
type PinStep = "verify" | "new" | "confirm";

/* ═══════════════════════ Main Screen ═══════════════════════ */
export default function SettingsScreen() {
  const { profile, loading, updateProfile, refresh } = useProfile();

  // Edit mode
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // PIN change
  const [showPinChange, setShowPinChange] = useState(false);
  const [pinStep, setPinStep] = useState<PinStep>("verify");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [hasPinSet, setHasPinSet] = useState(false);

  // Biometric
  const [biometricAvailable, setBiometricAvailable] = useState(false);


  // Load state on focus
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark");
      refresh();
      hasPin().then(setHasPinSet);
      isBiometricAvailable().then(setBiometricAvailable);
    }, [])
  );

  // ── Profile photo ──
  const handleChangePhoto = () => {
    Alert.alert("Foto de perfil", "¿De dónde quieres agregar?", [
      { text: "Cámara", onPress: () => saveProfilePhoto("camera") },
      { text: "Galería", onPress: () => saveProfilePhoto("gallery") },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const saveProfilePhoto = async (mode: "camera" | "gallery") => {
    const uri = mode === "camera" ? await takePhoto() : await pickPhoto();
    if (!uri) return;

    // Copy to permanent location
    const avatarDir = `${documentDirectory}avatars/`;
    const dirInfo = await getInfoAsync(avatarDir);
    if (!dirInfo.exists) {
      await makeDirectoryAsync(avatarDir, { intermediates: true });
    }
    const ext = uri.split(".").pop() || "jpg";
    const dest = `${avatarDir}profile.${ext}`;
    await copyAsync({ from: uri, to: dest });

    await updateProfile({ avatarUri: dest });
  };

  // ── Profile edit ──
  const startEditProfile = () => {
    setEditName(profile?.name || "");
    setEditEmail(profile?.email || "");
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }
    await updateProfile({
      name: editName.trim(),
      email: editEmail.trim() || undefined,
    });
    setEditingProfile(false);
  };

  // ── Biometric toggle ──
  const handleBiometricToggle = async (value: boolean) => {
    await updateProfile({ biometricEnabled: value });
  };

  // ── PIN change ──
  const startPinChange = () => {
    setShowPinChange(true);
    setPinStep(hasPinSet ? "verify" : "new");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setPinError("");
  };

  const handlePinAction = async () => {
    setPinError("");

    if (pinStep === "verify") {
      if (currentPin.length !== 4) {
        setPinError("El PIN debe ser de 4 dígitos");
        return;
      }
      const valid = await verifyPin(currentPin);
      if (!valid) {
        setPinError("PIN incorrecto");
        return;
      }
      setPinStep("new");
      return;
    }

    if (pinStep === "new") {
      if (newPin.length !== 4) {
        setPinError("El PIN debe ser de 4 dígitos");
        return;
      }
      setPinStep("confirm");
      return;
    }

    if (pinStep === "confirm") {
      if (confirmPin !== newPin) {
        setPinError("Los PIN no coinciden");
        setConfirmPin("");
        return;
      }
      await savePin(newPin);
      setHasPinSet(true);
      setShowPinChange(false);
      Alert.alert("PIN actualizado", "Tu nuevo PIN se guardó correctamente");
    }
  };

  // ── Notifications permission ──
  const handleNotificationPermission = async () => {
    const granted = await requestNotificationPermissions();
    Alert.alert(
      granted ? "Notificaciones activadas" : "Permiso denegado",
      granted
        ? "Recibirás recordatorios de citas y seguimientos"
        : "Puedes activarlas desde Configuración del sistema"
    );
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ajustes</Text>
        </View>

        {/* ── Profile section ── */}
        <View style={styles.profileSection}>
          <Pressable onPress={handleChangePhoto} style={styles.avatarWrap}>
            <Avatar
              firstName={profile.name.split(" ")[0]}
              lastName={profile.name.split(" ")[1] || ""}
              uri={profile.avatarUri}
              size="lg"
            />
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color={colors.white} />
            </View>
          </Pressable>

          {editingProfile ? (
            <View style={styles.editProfileForm}>
              <Input
                label="Nombre"
                value={editName}
                onChangeText={setEditName}
                variant="light"
                maxLength={60}
              />
              <Input
                label="Email"
                placeholder="Opcional"
                value={editEmail}
                onChangeText={setEditEmail}
                variant="light"
                keyboardType="email-address"
                maxLength={100}
              />
              <View style={styles.editProfileActions}>
                <View style={{ flex: 1 }}>
                  <Button title="Guardar" onPress={saveProfile} size="sm" />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancelar"
                    onPress={() => setEditingProfile(false)}
                    variant="outline"
                    size="sm"
                  />
                </View>
              </View>
            </View>
          ) : (
            <Pressable onPress={startEditProfile} style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              {profile.email && (
                <Text style={styles.profileEmail}>{profile.email}</Text>
              )}
              <Text style={styles.editHint}>Toca para editar</Text>
            </Pressable>
          )}
        </View>

        {/* ── Security section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <View style={styles.card}>
            {/* Biometric toggle */}
            {biometricAvailable && (
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons
                    name="finger-print-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.settingsLabel}>Face ID / Touch ID</Text>
                </View>
                <Switch
                  value={profile.biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: colors.divider, true: colors.accent }}
                  thumbColor={colors.white}
                />
              </View>
            )}

            {/* Change PIN */}
            <Pressable onPress={startPinChange} style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Ionicons
                  name="keypad-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.settingsLabel}>
                  {hasPinSet ? "Cambiar PIN" : "Configurar PIN"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* ── PIN Change inline ── */}
        {showPinChange && (
          <View style={styles.section}>
            <View style={styles.pinCard}>
              <Text style={styles.pinTitle}>
                {pinStep === "verify"
                  ? "Ingresa tu PIN actual"
                  : pinStep === "new"
                    ? "Ingresa tu nuevo PIN"
                    : "Confirma tu nuevo PIN"}
              </Text>
              <Input
                placeholder="4 dígitos"
                value={
                  pinStep === "verify"
                    ? currentPin
                    : pinStep === "new"
                      ? newPin
                      : confirmPin
                }
                onChangeText={(v) => {
                  const clean = v.replace(/\D/g, "").slice(0, 4);
                  if (pinStep === "verify") setCurrentPin(clean);
                  else if (pinStep === "new") setNewPin(clean);
                  else setConfirmPin(clean);
                }}
                variant="light"
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                error={pinError || undefined}
              />
              <View style={styles.pinActions}>
                <View style={{ flex: 1 }}>
                  <Button title="Continuar" onPress={handlePinAction} size="sm" />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancelar"
                    onPress={() => setShowPinChange(false)}
                    variant="outline"
                    size="sm"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Notifications section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <View style={styles.card}>
            <Pressable
              onPress={handleNotificationPermission}
              style={styles.settingsRow}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.settingsLabel}>
                  Activar notificaciones
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Data section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos</Text>
          <View style={styles.card}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Ionicons
                  name="cloud-done-outline"
                  size={20}
                  color={colors.success}
                />
                <Text style={styles.settingsLabel}>Sincronización</Text>
              </View>
              <Text style={styles.syncStatusText}>Automática</Text>
            </View>
          </View>
          <Text style={styles.sectionHint}>
            Tus datos se sincronizan automáticamente con la nube
          </Text>
        </View>

        {/* ── App info ── */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>BrowDesk v1.0.0</Text>
          <Text style={styles.appInfoText}>Carolina Vazquez Studio</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },

  // Profile
  profileSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },
  profileInfo: {
    alignItems: "center",
    gap: 4,
  },
  profileName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  editHint: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  editProfileForm: {
    width: "100%",
    paddingHorizontal: spacing["2xl"],
    gap: 12,
    marginTop: 8,
  },
  editProfileActions: {
    flexDirection: "row",
    gap: 10,
  },

  // Section
  section: {
    paddingHorizontal: spacing["2xl"],
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
    paddingHorizontal: 4,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },

  // Settings row
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsLabel: {
    color: colors.text,
    fontSize: 15,
  },
  syncStatusText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "500",
  },

  // PIN
  pinCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  pinTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  pinActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  // App info
  appInfo: {
    alignItems: "center",
    paddingVertical: spacing["2xl"],
    gap: 4,
  },
  appInfoText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
