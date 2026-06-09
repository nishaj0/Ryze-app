import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Sleep">;

function SleepContent({ navigation }: Props) {
  const { data, update } = useOnboarding();
  const [hours, setHours] = useState(data.sleepHours);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>Sleep hours?</Text>
      <Text style={{ color: "#94A3B8", marginBottom: 32 }}>Recovery starts with sleep.</Text>

      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Text style={{ fontSize: 72, fontWeight: "bold", color: "#6366F1" }}>{hours}</Text>
        <Text style={{ color: "#94A3B8", fontSize: 16 }}>hours per night</Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 32 }}>
        {[4, 5, 6, 7, 8, 9, 10].map((h) => (
          <TouchableOpacity
            key={h}
            onPress={() => setHours(h)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: hours === h ? "#4F46E5" : "#1E293B",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: hours === h ? 2 : 0,
              borderColor: "#6366F1",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>{h}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => {
          update({ sleepHours: hours });
          navigation.navigate("SplitSelection");
        }}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function SleepScreen(props: Props) {
  return <OnboardingProvider><SleepContent {...props} /></OnboardingProvider>;
}
