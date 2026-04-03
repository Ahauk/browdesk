import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchBar, Avatar } from "@/components/ui";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { useClients } from "@/hooks/useClients";
import type { Client } from "@/types/models";
import { fullName } from "@/utils/format";
import { colors, spacing, radius } from "@/theme";

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
      style={({ pressed }) => [
        styles.clientRow,
        pressed && styles.clientRowPressed,
      ]}
    >
      <View style={styles.clientRowLeft}>
        <Avatar
          firstName={client.firstName}
          lastName={client.lastName}
          uri={client.avatarUri}
          size="md"
        />
        <View>
          <Text style={styles.clientName}>
            {fullName(client.firstName, client.lastName)}
          </Text>
          <Text style={styles.clientPhone}>{client.phone}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>{">"}</Text>
    </Pressable>
  );
}

export default function ClientsListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { clients, loading, searchClients, refresh } = useClients();

  // Refresh list when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchClients(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, searchClients]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientas</Text>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : clients.length === 0 ? (
        <View style={styles.centeredPadded}>
          <Text style={styles.emptyText}>
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
              onPress={() => router.push(`/clients/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <FloatingActionButton
        onPress={() => router.push("/clients/new")}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: spacing["2xl"],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centeredPadded: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing["2xl"],
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  clientRowPressed: {
    backgroundColor: colors.bg,
  },
  clientRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clientName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  clientPhone: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chevron: {
    color: colors.textSecondary,
    fontSize: 17,
  },
});
