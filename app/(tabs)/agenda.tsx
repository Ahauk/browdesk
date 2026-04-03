import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Avatar, Badge } from "@/components/ui";
import { useAppointments } from "@/hooks/useAppointments";
import { useFollowUps } from "@/hooks/useFollowUps";
import { useClients } from "@/hooks/useClients";
import { fullName, formatDate } from "@/utils/format";
import dayjs from "dayjs";
import "dayjs/locale/es";
import type { Client } from "@/types/models";

dayjs.locale("es");

export default function AgendaScreen() {
  const today = dayjs().format("D MMMM");
  const { todayAppointments, upcomingAppointments } = useAppointments();
  const { pendingFollowUps } = useFollowUps();
  const { getClient } = useClients();

  const [clientMap, setClientMap] = useState<Record<string, Client>>({});

  // Load client names for all referenced client IDs
  useEffect(() => {
    async function loadClients() {
      const allClientIds = new Set<string>();
      todayAppointments.forEach((a) => allClientIds.add(a.clientId));
      upcomingAppointments.forEach((a) => allClientIds.add(a.clientId));
      pendingFollowUps.forEach((f) => allClientIds.add(f.clientId));

      const map: Record<string, Client> = {};
      for (const id of allClientIds) {
        const client = await getClient(id);
        if (client) map[id] = client;
      }
      setClientMap(map);
    }
    loadClients();
  }, [todayAppointments, upcomingAppointments, pendingFollowUps]);

  const getClientName = (clientId: string) => {
    const client = clientMap[clientId];
    return client ? fullName(client.firstName, client.lastName) : "...";
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-beige" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
          <Text className="text-brand-black text-xl font-bold">Agenda</Text>
          <Text className="text-brand-gray text-sm capitalize">{today}</Text>
        </View>

        {/* Today's appointments */}
        <View className="px-6 mb-6">
          <Text className="text-brand-black text-base font-semibold mb-3">
            Hoy
          </Text>
          <Card variant="dark">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt) => (
                <Pressable
                  key={apt.id}
                  className="flex-row items-center gap-3 py-3 border-b border-brand-dark"
                >
                  <Text className="text-brand-gold text-sm font-medium w-14">
                    {apt.time}
                  </Text>
                  <Avatar
                    firstName={
                      clientMap[apt.clientId]?.firstName || "?"
                    }
                    lastName={
                      clientMap[apt.clientId]?.lastName || ""
                    }
                    size="sm"
                  />
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium">
                      {getClientName(apt.clientId)}
                    </Text>
                    <Text className="text-brand-gray text-xs">
                      {apt.procedureType || "Cita"}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text className="text-brand-gray text-sm py-4 text-center">
                Sin citas para hoy
              </Text>
            )}
          </Card>
        </View>

        {/* Upcoming */}
        <View className="px-6 mb-6">
          <Text className="text-brand-black text-base font-semibold mb-3">
            Proximas citas
          </Text>
          <Card variant="dark">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.slice(0, 5).map((apt) => (
                <Pressable
                  key={apt.id}
                  className="flex-row items-center justify-between py-3 border-b border-brand-dark"
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-brand-gold text-sm w-16">
                      {formatDate(apt.date)}
                    </Text>
                    <View>
                      <Text className="text-white text-sm font-medium">
                        {getClientName(apt.clientId)}
                      </Text>
                      <Text className="text-brand-gray text-xs">
                        {apt.procedureType || "Cita"}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-brand-gray">{">"}</Text>
                </Pressable>
              ))
            ) : (
              <Text className="text-brand-gray text-sm py-4 text-center">
                Sin citas proximas
              </Text>
            )}
          </Card>
        </View>

        {/* Follow-ups */}
        <View className="px-6">
          <Text className="text-brand-black text-base font-semibold mb-3">
            Seguimientos
          </Text>
          <Card variant="dark">
            {pendingFollowUps.length > 0 ? (
              pendingFollowUps.map((fu) => (
                <Pressable
                  key={fu.id}
                  className="flex-row items-center justify-between py-3 border-b border-brand-dark"
                >
                  <View>
                    <Text className="text-white text-sm font-medium">
                      {getClientName(fu.clientId)}
                    </Text>
                    <Text className="text-brand-gray text-xs">
                      {fu.notes || "Seguimiento"} - {formatDate(fu.dueDate)}
                    </Text>
                  </View>
                  <Badge label="Pendiente" variant="gold" />
                </Pressable>
              ))
            ) : (
              <Text className="text-brand-gray text-sm py-4 text-center">
                Sin seguimientos pendientes
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
