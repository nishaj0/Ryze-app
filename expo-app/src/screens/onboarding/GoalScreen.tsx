import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Goal">;

const options = [
  { value: "MUSCLE_GAIN", label: "Build Muscle", desc: "Gain strength and size", emoji: "💪" },
  { value: "WEIGHT_LOSS", label: "Lose Weight", desc: "Burn fat and get lean", emoji: "🔥" },
  { value: "GET_FIT", label: "Get Fit", desc: "Improve overall fitness", emoji: "🏃" },
  { value: "MAINTAIN", label: "Maintain", desc: "Keep current physique", emoji: "⚖️" },
];

function GoalContent({ navigation }: Props) {
  const { data, update } = useOnboarding();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>What's your main goal?</Text>
      <Text style={{ color: "#94A3B8", marginBottom: 32 }}>We'll tailor your program accordingly.</Text>

      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => {
            update({ goal: opt.value as any });
            navigation.navigate("Experience");
          }}
          style={{
            backgroundColor: data.goal === opt.value ? "#4F46E5" : "#1E293B",
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            borderWidth: data.goal === opt.value ? 2 : 0,
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

export default function GoalScreen(props: Props) {
  return <OnboardingProvider><GoalContent {...props} /></OnboardingProvider>;
}
