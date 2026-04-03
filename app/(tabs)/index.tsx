import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar } from "@/components/ui";
import { useClients } from "@/hooks/useClients";
import { useAppointments } from "@/hooks/useAppointments";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useProcedures } from "@/hooks/useProcedures";
import { useSync } from "@/hooks/useSync";
import { fullName } from "@/utils/format";
import { PROCEDURE_TYPES } from "@/constants";
import type { Procedure } from "@/types/models";

function StatCard({
  title,
  value,
  subtitle,
  onPress,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Card variant="dark" onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-white text-base font-semibold">{title}</Text>
          <Text className="text-brand-gray text-xs mt-0.5">{subtitle}</Text>
        </View>
        <Text className="text-brand-gold text-2xl font-bold">{value}</Text>
      </View>
    </Card>
  );
}

function RecentProcedureItem({
  clientName,
  procedure,
  onPress,
}: {
  clientName: string;
  procedure: Procedure;
  onPress?: () => void;
}) {
  const typeLabel =
    PROCEDURE_TYPES.find((t) => t.key === procedure.type)?.label ||
    procedure.type;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-3 border-b border-brand-dark"
    >
      <View className="flex-row items-center gap-3">
        <Avatar
          firstName={clientName.split(" ")[0]}
          lastName={clientName.split(" ")[1] || ""}
          size="sm"
        />
        <View>
          <Text className="text-white text-sm font-medium">{clientName}</Text>
          <Text className="text-brand-gray text-xs">
            {typeLabel} - {procedure.technique}
          </Text>
        </View>
      </View>
      <Text className="text-brand-gray text-lg">{">"}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { count: clientCount } = useClients();
  const { todayCount } = useAppointments();
  const { pendingCount } = useFollowUps();
  const { getRecentProcedures } = useProcedures();
  const { sync } = useSync();
  const { getClient } = useClients();

  const [recentProcedures, setRecentProcedures] = useState<
    { procedure: Procedure; clientName: string }[]
  >([]);

  useEffect(() => {
    async function loadRecent() {
      const procedures = await getRecentProcedures(5);
      const withNames = await Promise.all(
        procedures.map(async (proc) => {
          const client = await getClient(proc.clientId);
          return {
            procedure: proc,
            clientName: client
              ? fullName(client.firstName, client.lastName)
              : "Sin nombre",
          };
        })
      );
      setRecentProcedures(withNames);
    }
    loadRecent();
  }, []);

  // Background sync on load
  useEffect(() => {
    sync();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-brand-beige" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-brand-black text-2xl font-bold">
            Hola, Carolina 👋
          </Text>
        </View>

        {/* Stats */}
        <View className="px-6 gap-3">
          <StatCard
            title="Clientas"
            value={clientCount}
            subtitle="registradas"
            onPress={() => router.push("/(tabs)/clients")}
          />
          <StatCard
            title="Citas hoy"
            value={todayCount}
            subtitle="hoy"
            onPress={() => router.push("/(tabs)/agenda")}
          />
          <StatCard
            title="Seguimientos"
            value={pendingCount}
            subtitle="pendientes"
          />
        </View>

        {/* Recent Procedures */}
        <View className="px-6 mt-6">
          <Text className="text-brand-black text-lg font-semibold mb-3">
            Procedimientos recientes
          </Text>
          <Card variant="dark">
            {recentProcedures.length > 0 ? (
              recentProcedures.map((item) => (
                <RecentProcedureItem
                  key={item.procedure.id}
                  clientName={item.clientName}
                  procedure={item.procedure}
                  onPress={() =>
                    router.push(
                      `/(tabs)/clients/${item.procedure.clientId}`
                    )
                  }
                />
              ))
            ) : (
              <Text className="text-brand-gray text-sm py-4 text-center">
                Sin procedimientos aun
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
