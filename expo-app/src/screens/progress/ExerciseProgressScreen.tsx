import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProgressStackParamList } from "../../navigation/types";
import { getExerciseProgress } from "../../api/progress";
import { ExerciseProgress } from "../../types";

type Props = NativeStackScreenProps<ProgressStackParamList, "ExerciseProgress">;

export default function ExerciseProgressScreen({ route }: Props) {
  const { exerciseId, exerciseName } = route.params;
  const [progression, setProgression] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [exerciseId]);

  const loadProgress = async () => {
    try {
      const res = await getExerciseProgress(exerciseId);
      setProgression(res.progression);
    } catch (err) {}
    finally { setLoading(false); }
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}><ActivityIndicator color="#6366F1" /></View>;
  }

  const maxWeight = Math.max(...progression.map((p) => p.maxWeight), 1);
  const maxVolume = Math.max(...progression.map((p) => p.totalVolume), 1);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 24 }}>{exerciseName}</Text>

      {progression.length === 0 ? (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 32, alignItems: "center" }}>
          <Text style={{ color: "#94A3B8", fontSize: 16 }}>No data yet. Complete a workout to see progress!</Text>
        </View>
      ) : (
        <>
          <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 16 }}>Weight Progression</Text>
            {progression.map((p, idx) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: "#CBD5E1", fontSize: 12 }}>{new Date(p.date).toLocaleDateString()}</Text>
                  <Text style={{ color: "#6366F1", fontSize: 12, fontWeight: "600" }}>{p.maxWeight}kg</Text>
                </View>
                <View style={{ backgroundColor: "#0F172A", borderRadius: 4, height: 6 }}>
                  <View style={{ backgroundColor: "#6366F1", borderRadius: 4, height: 6, width: `${(p.maxWeight / maxWeight) * 100}%` }} />
                </View>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 16 }}>Volume Progression</Text>
            {progression.map((p, idx) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: "#CBD5E1", fontSize: 12 }}>{new Date(p.date).toLocaleDateString()}</Text>
                  <Text style={{ color: "#10B981", fontSize: 12, fontWeight: "600" }}>{p.totalVolume.toLocaleString()}kg</Text>
                </View>
                <View style={{ backgroundColor: "#0F172A", borderRadius: 4, height: 6 }}>
                  <View style={{ backgroundColor: "#10B981", borderRadius: 4, height: 6, width: `${(p.totalVolume / maxVolume) * 100}%` }} />
                </View>
              </View>
            ))}
          </View>

          <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>History</Text>
            {progression.slice().reverse().map((p, idx) => (
              <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155" }}>
                <Text style={{ color: "#CBD5E1", fontSize: 14 }}>{new Date(p.date).toLocaleDateString()}</Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  <Text style={{ color: "#6366F1", fontSize: 14 }}>{p.maxWeight}kg</Text>
                  <Text style={{ color: "#10B981", fontSize: 14 }}>{p.totalReps} reps</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
