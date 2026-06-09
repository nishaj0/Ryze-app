import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Gender">;

const options = [
  { value: "MALE", label: "Male", emoji: "♂️" },
  { value: "FEMALE", label: "Female", emoji: "♀️" },
  { value: "OTHER", label: "Other", emoji: "⚧️" },
];

function GenderContent({ navigation }: Props) {
  const { data, update } = useOnboarding();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>What's your gender?</Text>
      <Text style={{ color: "#94A3B8", marginBottom: 32 }}>This helps us personalize your experience.</Text>

      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => {
            update({ gender: opt.value as any });
            navigation.navigate("Goal");
          }}
          style={{
            backgroundColor: data.gender === opt.value ? "#4F46E5" : "#1E293B",
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: data.gender === opt.value ? 2 : 0,
            borderColor: "#6366F1",
          }}
        >
          <Text style={{ fontSize: 28, marginRight: 16 }}>{opt.emoji}</Text>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default function GenderScreen(props: Props) {
  return (
    <OnboardingProvider>
      <GenderContent {...props} />
    </OnboardingProvider>
  );
}
