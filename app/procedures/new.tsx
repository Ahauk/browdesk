import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input, Badge } from "@/components/ui";
import { PROCEDURE_TYPES } from "@/constants";
import { useProcedures } from "@/hooks/useProcedures";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useClients } from "@/hooks/useClients";
import { pickPhoto, savePhoto } from "@/services/photo.service";
import {
  scheduleFollowUpReminder,
} from "@/services/notification.service";
import { fullName } from "@/utils/format";
import type { ProcedureType, Client } from "@/types/models";
import dayjs from "dayjs";

export default function NewProcedureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string }>();
  const { createProcedure } = useProcedures();
  const { createFollowUp } = useFollowUps();
  const { clients } = useClients();

  const [selectedClientId, setSelectedClientId] = useState(
    params.clientId || ""
  );
  const [selectedType, setSelectedType] = useState<ProcedureType>("brows");
  const [technique, setTechnique] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handlePickPhoto = async (type: "before" | "after") => {
    const uri = await pickPhoto();
    if (uri) {
      if (type === "before") setBeforePhoto(uri);
      else setAfterPhoto(uri);
    }
  };

  const handleSave = async () => {
    if (!selectedClientId || !technique.trim() || !cost.trim()) return;

    setSaving(true);
    try {
      const today = dayjs().format("YYYY-MM-DD");
      const followUpDate = dayjs().add(30, "day").format("YYYY-MM-DD");

      const procedure = await createProcedure({
        clientId: selectedClientId,
        type: selectedType,
        technique: technique.trim(),
        cost: parseFloat(cost),
        notes: notes.trim() || undefined,
        date: today,
        followUpDate,
      });

      if (!procedure) {
        Alert.alert("Error", "No se pudo guardar el procedimiento");
        return;
      }

      // Save photos if selected
      if (beforePhoto) {
        await savePhoto(beforePhoto, selectedClientId, procedure.id, "before");
      }
      if (afterPhoto) {
        await savePhoto(afterPhoto, selectedClientId, procedure.id, "after");
      }

      // Create follow-up
      await createFollowUp({
        procedureId: procedure.id,
        clientId: selectedClientId,
        dueDate: followUpDate,
        status: "pending",
        notes: `Seguimiento de ${technique}`,
      });

      // Schedule notification
      const client = selectedClient;
      if (client) {
        const reminderDate = dayjs(followUpDate)
          .subtract(1, "day")
          .hour(9)
          .toDate();
        const typeLabel =
          PROCEDURE_TYPES.find((t) => t.key === selectedType)?.label ||
          selectedType;
        await scheduleFollowUpReminder(
          fullName(client.firstName, client.lastName),
          typeLabel,
          reminderDate
        );
      }

      router.back();
    } catch {
      Alert.alert("Error", "Ocurrio un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-black" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-2 pb-4 flex-row items-center justify-between">
        <Pressable onPress={() => router.back()}>
          <Text className="text-brand-gold text-base">{"< Atras"}</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold">
          Nuevo procedimiento
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Client selector */}
        {!params.clientId && (
          <View className="mb-6">
            <Text className="text-white text-sm font-medium mb-3">
              Clienta
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {clients.map((client) => (
                  <Pressable
                    key={client.id}
                    onPress={() => setSelectedClientId(client.id)}
                    className={`px-4 py-2 rounded-full ${
                      selectedClientId === client.id
                        ? "bg-brand-gold"
                        : "border border-brand-dark"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        selectedClientId === client.id
                          ? "text-brand-black font-semibold"
                          : "text-white"
                      }`}
                    >
                      {client.firstName} {client.lastName}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Procedure type */}
        <View className="mb-6">
          <Text className="text-white text-sm font-medium mb-3">Tipo</Text>
          <View className="flex-row flex-wrap gap-2">
            {PROCEDURE_TYPES.map((type) => (
              <Pressable
                key={type.key}
                onPress={() => setSelectedType(type.key as ProcedureType)}
              >
                <Badge
                  label={type.label}
                  variant="gold"
                  selected={selectedType === type.key}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Technique */}
        <View className="mb-4">
          <Input
            label="Tecnica"
            placeholder="Ej: Microblading"
            value={technique}
            onChangeText={setTechnique}
            variant="dark"
          />
        </View>

        {/* Cost */}
        <View className="mb-4">
          <Input
            label="Costo"
            placeholder="$0.00"
            value={cost}
            onChangeText={setCost}
            variant="dark"
            keyboardType="numeric"
          />
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Input
            label="Notas"
            placeholder="Notas adicionales"
            value={notes}
            onChangeText={setNotes}
            variant="dark"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Photos */}
        <View className="mb-6">
          <Text className="text-white text-sm font-medium mb-3">Fotos</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => handlePickPhoto("before")}
              className="flex-1 h-28 bg-brand-dark rounded-xl items-center justify-center overflow-hidden"
            >
              {beforePhoto ? (
                <Image
                  source={{ uri: beforePhoto }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Text className="text-brand-gold text-2xl mb-1">+</Text>
                  <Text className="text-brand-gray text-xs">Antes</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => handlePickPhoto("after")}
              className="flex-1 h-28 bg-brand-dark rounded-xl items-center justify-center overflow-hidden"
            >
              {afterPhoto ? (
                <Image
                  source={{ uri: afterPhoto }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Text className="text-brand-gold text-2xl mb-1">+</Text>
                  <Text className="text-brand-gray text-xs">Despues</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View className="px-6 pb-8">
        <Button
          title="Guardar"
          onPress={handleSave}
          disabled={!selectedClientId || !technique.trim() || !cost.trim()}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}
