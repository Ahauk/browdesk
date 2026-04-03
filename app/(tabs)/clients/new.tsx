import { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Input } from "@/components/ui";
import { CLINICAL_CONDITIONS } from "@/constants";
import { useClients } from "@/hooks/useClients";

type Step = 1 | 2 | 3;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View className="flex-row justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-1.5 rounded-full ${
            i + 1 <= current ? "bg-brand-gold w-8" : "bg-brand-dark w-4"
          }`}
        />
      ))}
    </View>
  );
}

export default function NewClientScreen() {
  const router = useRouter();
  const { createClient } = useClients();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Personal data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2: Clinical data
  const [diabetes, setDiabetes] = useState(false);
  const [pregnancy, setPregnancy] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");

  // Step 3: Confirm
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await createClient({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        notes: [notes, clinicalNotes].filter(Boolean).join("\n") || undefined,
        allergies: allergies.trim() || undefined,
        diabetes,
        pregnancy,
        hypertension,
      });
      if (result) {
        router.back();
      } else {
        Alert.alert("Error", "No se pudo guardar la clienta");
      }
    } catch {
      Alert.alert("Error", "Ocurrio un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return firstName.trim() && lastName.trim() && phone.trim();
    return true;
  };

  const stepTitles: Record<Step, string> = {
    1: "Datos personales",
    2: "Datos clinicos",
    3: "Confirmar",
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-black" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-2 pb-4 flex-row items-center justify-between">
        <Pressable onPress={() => (step > 1 ? setStep((s) => (s - 1) as Step) : router.back())}>
          <Text className="text-brand-gold text-base">{"< Atras"}</Text>
        </Pressable>
        <Text className="text-white text-lg font-semibold">
          {stepTitles[step]}
        </Text>
        <View className="w-12" />
      </View>

      <StepIndicator current={step} total={3} />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View className="gap-4">
            <Input
              label="Nombre"
              placeholder="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              variant="dark"
            />
            <Input
              label="Apellido"
              placeholder="Apellido"
              value={lastName}
              onChangeText={setLastName}
              variant="dark"
            />
            <Input
              label="Telefono"
              placeholder="+52 664 123 4567"
              value={phone}
              onChangeText={setPhone}
              variant="dark"
              keyboardType="phone-pad"
            />
            <Input
              label="Notas"
              placeholder="Notas adicionales"
              value={notes}
              onChangeText={setNotes}
              variant="dark"
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {step === 2 && (
          <View className="gap-4">
            {/* Conditions toggles */}
            {CLINICAL_CONDITIONS.map((condition) => {
              const values: Record<string, [boolean, (v: boolean) => void]> = {
                diabetes: [diabetes, setDiabetes],
                pregnancy: [pregnancy, setPregnancy],
                hypertension: [hypertension, setHypertension],
              };
              const [value, setter] = values[condition.key];
              return (
                <View
                  key={condition.key}
                  className="flex-row items-center justify-between bg-brand-dark rounded-xl px-4 py-3"
                >
                  <Text className="text-white text-base">
                    {condition.label}
                  </Text>
                  <Switch
                    value={value}
                    onValueChange={setter}
                    trackColor={{ false: "#555", true: "#C4A87C" }}
                    thumbColor="#fff"
                  />
                </View>
              );
            })}

            <Input
              label="Alergias"
              placeholder="Describir alergias si aplica"
              value={allergies}
              onChangeText={setAllergies}
              variant="dark"
              multiline
              numberOfLines={2}
            />
            <Input
              label="Notas clinicas"
              placeholder="Notas adicionales"
              value={clinicalNotes}
              onChangeText={setClinicalNotes}
              variant="dark"
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {step === 3 && (
          <View className="gap-4">
            <View className="bg-brand-dark rounded-xl p-4 gap-3">
              <Text className="text-brand-gold text-base font-semibold mb-2">
                Resumen
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-brand-gray text-sm">Nombre</Text>
                <Text className="text-white text-sm">
                  {firstName} {lastName}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-brand-gray text-sm">Telefono</Text>
                <Text className="text-white text-sm">{phone}</Text>
              </View>
              {notes ? (
                <View className="flex-row justify-between">
                  <Text className="text-brand-gray text-sm">Notas</Text>
                  <Text className="text-white text-sm">{notes}</Text>
                </View>
              ) : null}
              <View className="flex-row justify-between">
                <Text className="text-brand-gray text-sm">Diabetes</Text>
                <Text className="text-white text-sm">
                  {diabetes ? "Si" : "No"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-brand-gray text-sm">Embarazo</Text>
                <Text className="text-white text-sm">
                  {pregnancy ? "Si" : "No"}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-brand-gray text-sm">Hipertension</Text>
                <Text className="text-white text-sm">
                  {hypertension ? "Si" : "No"}
                </Text>
              </View>
              {allergies ? (
                <View className="flex-row justify-between">
                  <Text className="text-brand-gray text-sm">Alergias</Text>
                  <Text className="text-white text-sm">{allergies}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View className="px-6 pb-8">
        {step < 3 ? (
          <Button
            title="Siguiente"
            onPress={() => setStep((s) => (s + 1) as Step)}
            disabled={!canGoNext()}
          />
        ) : (
          <Button title="Guardar clienta" onPress={handleSave} loading={saving} />
        )}
      </View>
    </SafeAreaView>
  );
}
