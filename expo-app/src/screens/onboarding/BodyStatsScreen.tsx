import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "BodyStats">;

function BodyStatsContent({ navigation }: Props) {
  const { data, update } = useOnboarding();
  const [weight, setWeight] = useState(String(data.currentWeight));
  const [height, setHeight] = useState(String(data.height));

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>Body stats</Text>
      <Text style={{ color: "#94A3B8", marginBottom: 32 }}>We'll track these over time.</Text>

      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Current weight (kg)</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 20, fontSize: 18 }}
        value={weight}
        onChangeText={setWeight}
        placeholder="70"
        placeholderTextColor="#475569"
        keyboardType="decimal-pad"
      />

      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Height (cm)</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 32, fontSize: 18 }}
        value={height}
        onChangeText={setHeight}
        placeholder="175"
        placeholderTextColor="#475569"
        keyboardType="decimal-pad"
      />

      <TouchableOpacity
        onPress={() => {
          update({ currentWeight: parseFloat(weight) || 70, height: parseFloat(height) || 175 });
          navigation.navigate("Sleep");
        }}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function BodyStatsScreen(props: Props) {
  return <OnboardingProvider><BodyStatsContent {...props} /></OnboardingProvider>;
}
