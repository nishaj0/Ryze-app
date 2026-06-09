import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { useOnboarding, OnboardingProvider } from "./OnboardingContext";
import { getRecommendedSplits, completeOnboarding } from "../../api/onboarding";
import { useAuthStore } from "../../store/authStore";
import { Split } from "../../types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "SplitSelection">;

function SplitSelectionContent({ navigation }: Props) {
  const { data } = useOnboarding();
  const { setAuth, token } = useAuthStore();
  const [splits, setSplits] = useState<Split[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recommendedType, setRecommendedType] = useState<string | null>(null);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const res = await getRecommendedSplits(data.experienceLevel, data.daysAvailable);
      setSplits(res.splits);
      setRecommendedType(res.recommendedType);
      if (res.splits.length > 0) {
        setSelected(res.splits[0].id);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to load splits");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await completeOnboarding({ ...data, splitId: selected });
      await setAuth(token!, res.user);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to complete onboarding");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>Choose your split</Text>
      <Text style={{ color: "#94A3B8", marginBottom: 32 }}>Based on your answers, we recommend the highlighted split.</Text>

      {splits.map((split, idx) => {
        const isRecommended = split.type === recommendedType;
        const isSelected = selected === split.id;

        return (
          <TouchableOpacity
            key={split.id}
            onPress={() => setSelected(split.id)}
            style={{
              backgroundColor: isSelected ? "#4F46E5" : "#1E293B",
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              borderWidth: isSelected ? 2 : isRecommended ? 1 : 0,
              borderColor: isSelected ? "#6366F1" : isRecommended ? "#6366F1" : "transparent",
            }}
          >
            {isRecommended && (
              <View style={{ backgroundColor: "#10B981", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginBottom: 8 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>RECOMMENDED</Text>
              </View>
            )}
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>{split.name}</Text>
            <Text style={{ color: "#CBD5E1", fontSize: 14, marginTop: 4 }}>{split.description}</Text>
            <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 8 }}>{split.daysPerWeek} days/week</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        onPress={handleComplete}
        disabled={submitting || !selected}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 16 }}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Start Training</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function SplitSelectionScreen(props: Props) {
  return <OnboardingProvider><SplitSelectionContent {...props} /></OnboardingProvider>;
}
