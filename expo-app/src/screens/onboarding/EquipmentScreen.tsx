import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Equipment">;

const options = [
  { value: "FULL_GYM", label: "Full Gym", desc: "Access to barbells, machines, cables, dumbbells", emoji: "🏋️" },
  { value: "HOME", label: "Home Gym", desc: "Basic equipment: dumbbells, bench, maybe a barbell", emoji: "🏠" },
  { value: "LIMITED", label: "Limited", desc: "Minimal equipment or bodyweight only", emoji: "💪" },
];

function EquipmentContent({ navigation }: Props) {
  const { data, update } = useOnboarding();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>Equipment access?</Text>
      <Text style={{ color: "#94A3B8", marginBottom: 32 }}>This helps us suggest the right exercises.</Text>

      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => {
            update({ equipmentAccess: opt.value as any });
            navigation.navigate("BodyStats");
          }}
          style={{
            backgroundColor: data.equipmentAccess === opt.value ? "#4F46E5" : "#1E293B",
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            borderWidth: data.equipmentAccess === opt.value ? 2 : 0,
            borderColor: "#6366F1",
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 4 }}>{opt.emoji}</Text>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>{opt.label}</Text>
          <Text style={{ color: "#CBD5E1", fontSize: 14 }}>{opt.desc}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default function EquipmentScreen(props: Props) {
  return <OnboardingProvider><EquipmentContent {...props} /></OnboardingProvider>;
}
