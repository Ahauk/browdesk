import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Card } from "@/components/ui";
import { useClients } from "@/hooks/useClients";
import { useProcedures } from "@/hooks/useProcedures";
import { useFollowUps } from "@/hooks/useFollowUps";
import { getPhotosForClient } from "@/services/photo.service";
import { formatDate } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import type { Client, Photo } from "@/types/models";

type DetailTab = "resumen" | "procedimientos" | "fotos" | "notas";

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full ${
        active ? "bg-brand-gold" : "bg-transparent"
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          active ? "text-brand-black" : "text-brand-gray"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("resumen");
  const [client, setClient] = useState<Client | null>(null);
  const [clientPhotos, setClientPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const { getClient } = useClients();
  const { procedures } = useProcedures(id);
  const { followUps } = useFollowUps(id);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const c = await getClient(id);
      setClient(c);
      const photos = await getPhotosForClient(id);
      setClientPhotos(photos);
      setLoading(false);
    }
    load();
  }, [id]);

  const tabs: { key: DetailTab; label: string }[] = [
    { key: "resumen", label: "Resumen" },
    { key: "procedimientos", label: "Procedimientos" },
    { key: "fotos", label: "Fotos" },
    { key: "notas", label: "Notas" },
  ];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-brand-beige items-center justify-center">
        <ActivityIndicator color="#C4A87C" size="large" />
      </SafeAreaView>
    );
  }

  if (!client) {
    return (
      <SafeAreaView className="flex-1 bg-brand-beige items-center justify-center">
        <Text className="text-brand-gray">Clienta no encontrada</Text>
      </SafeAreaView>
    );
  }

  const lastProcedure = procedures[0];
  const pendingFollowUp = followUps.find((f) => f.status === "pending");

  return (
    <SafeAreaView className="flex-1 bg-brand-beige" edges={["top"]}>
      {/* Back button */}
      <View className="px-6 pt-2">
        <Pressable onPress={() => router.back()} className="py-2">
          <Text className="text-brand-gold text-base">{"< Atras"}</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Client header */}
        <View className="items-center py-6 gap-3">
          <Avatar
            firstName={client.firstName}
            lastName={client.lastName}
            uri={client.avatarUri}
            size="lg"
          />
          <Text className="text-brand-black text-xl font-bold">
            {client.firstName} {client.lastName}
          </Text>
          <Text className="text-brand-gray text-base">{client.phone}</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row justify-center gap-1 px-4 mb-6">
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              label={tab.label}
              active={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
            />
          ))}
        </View>

        {/* Tab content */}
        <View className="px-6">
          {activeTab === "resumen" && (
            <Card variant="dark">
              <View className="gap-4">
                <View className="flex-row justify-between">
                  <Text className="text-brand-gray text-sm">Alergias</Text>
                  <Text className="text-white text-sm">
                    {client.allergies || "Ninguna"}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-brand-gray text-sm">Diabetes</Text>
                  <Text className="text-white text-sm">
                    {client.diabetes ? "Si" : "No"}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-brand-gray text-sm">Embarazo</Text>
                  <Text className="text-white text-sm">
                    {client.pregnancy ? "Si" : "No"}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-brand-gray text-sm">Hipertension</Text>
                  <Text className="text-white text-sm">
                    {client.hypertension ? "Si" : "No"}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-brand-gray text-sm">
                    Ultima visita
                  </Text>
                  <Text className="text-white text-sm">
                    {lastProcedure
                      ? formatDate(lastProcedure.date)
                      : "Sin visitas"}
                  </Text>
                </View>
                {pendingFollowUp && (
                  <View className="flex-row justify-between">
                    <Text className="text-brand-gray text-sm">
                      Seguimiento
                    </Text>
                    <Text className="text-brand-gold text-sm">
                      {formatDate(pendingFollowUp.dueDate)}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {activeTab === "procedimientos" && (
            <Card variant="dark">
              {procedures.length > 0 ? (
                <View className="gap-3">
                  {procedures.map((proc) => {
                    const typeLabel =
                      PROCEDURE_TYPES.find((t) => t.key === proc.type)
                        ?.label || proc.type;
                    return (
                      <Pressable
                        key={proc.id}
                        className="flex-row justify-between py-2 border-b border-brand-dark"
                      >
                        <View>
                          <Text className="text-white text-sm">
                            {formatDate(proc.date)} / {typeLabel}
                          </Text>
                          <Text className="text-brand-gray text-xs">
                            {proc.technique} - ${proc.cost}
                          </Text>
                        </View>
                        <Text className="text-brand-gray">{">"}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <Text className="text-brand-gray text-sm py-4 text-center">
                  Sin procedimientos
                </Text>
              )}
            </Card>
          )}

          {activeTab === "fotos" && (
            <View>
              {clientPhotos.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {clientPhotos.map((photo) => (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.localUri }}
                      className="w-[48%] h-40 rounded-xl"
                      resizeMode="cover"
                    />
                  ))}
                </View>
              ) : (
                <View className="items-center py-12">
                  <Text className="text-brand-gray text-base">
                    Sin fotos aun
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === "notas" && (
            <Card variant="dark">
              <Text className="text-white text-sm">
                {client.notes || "Sin notas adicionales"}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
