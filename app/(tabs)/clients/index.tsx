import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchBar, Avatar } from "@/components/ui";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { useClients } from "@/hooks/useClients";
import type { Client } from "@/types/models";
import { fullName } from "@/utils/format";

function ClientRow({
  client,
  onPress,
}: {
  client: Client;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row items-center gap-3">
        <Avatar
          firstName={client.firstName}
          lastName={client.lastName}
          uri={client.avatarUri}
          size="md"
        />
        <View>
          <Text className="text-brand-black text-base font-semibold">
            {fullName(client.firstName, client.lastName)}
          </Text>
          <Text className="text-brand-gray text-sm">{client.phone}</Text>
        </View>
      </View>
      <Text className="text-brand-gray text-lg">{">"}</Text>
    </Pressable>
  );
}

export default function ClientsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { clients, loading, searchClients } = useClients();

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchClients(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, searchClients]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-brand-black text-xl font-bold mb-4">
          Clientas
        </Text>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#C4A87C" size="large" />
        </View>
      ) : clients.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-brand-gray text-base text-center">
            {search
              ? "No se encontraron clientas"
              : "Aun no hay clientas registradas"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ClientRow
              client={item}
              onPress={() => router.push(`/(tabs)/clients/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <FloatingActionButton
        onPress={() => router.push("/(tabs)/clients/new")}
      />
    </SafeAreaView>
  );
}
