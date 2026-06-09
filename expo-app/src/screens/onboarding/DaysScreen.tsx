import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Days">;

function DaysContent({ navigation }: Props) {
  const { data, update } = useOnboarding();
  const [days, setDays] = useState(data.daysAvailable);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>How many days per week?</Text>
      <Text style={{ color: "#94A3B8", marginBottom: 32 }}>How many days can you commit to working out?</Text>

      <View style={{ alignItems: "center", marginBottom: 40 }}>
        <Text style={{ fontSize: 72, fontWeight: "bold", color: "#6366F1" }}>{days}</Text>
        <Text style={{ color: "#94A3B8", fontSize: 16 }}>days per week</Text>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 32 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setDays(d)}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: days === d ? "#4F46E5" : "#1E293B",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: days === d ? 2 : 0,
              borderColor: "#6366F1",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "600" }}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => {
          update({ daysAvailable: days });
          navigation.navigate("Equipment");
        }}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function DaysScreen(props: Props) {
  return <OnboardingProvider><DaysContent {...props} /></OnboardingProvider>;
}
