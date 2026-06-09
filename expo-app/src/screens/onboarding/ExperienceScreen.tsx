import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Experience">;

const options = [
  { value: "BEGINNER", label: "Beginner", desc: "Less than 6 months of training", emoji: "🌱" },
  { value: "INTERMEDIATE", label: "Intermediate", desc: "6 months to 2 years", emoji: "🌿" },
  { value: "ADVANCED", label: "Advanced", desc: "2+ years of consistent training", emoji: "🌳" },
];

function ExperienceContent({ navigation }: Props) {
  const { data, update } = useOnboarding();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>Experience level?</Text>
      <Text style={{ color: "#94A3B8", marginBottom: 32 }}>Be honest — we'll match the right program.</Text>

      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => {
            update({ experienceLevel: opt.value as any });
            navigation.navigate("Days");
          }}
          style={{
            backgroundColor: data.experienceLevel === opt.value ? "#4F46E5" : "#1E293B",
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            borderWidth: data.experienceLevel === opt.value ? 2 : 0,
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

export default function ExperienceScreen(props: Props) {
  return <OnboardingProvider><ExperienceContent {...props} /></OnboardingProvider>;
}
