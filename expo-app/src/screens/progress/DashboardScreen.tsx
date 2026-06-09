import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProgressStackParamList } from "../../navigation/types";
import { getOverview, getHeatmap, getMuscleVolume } from "../../api/progress";
import { getRecords } from "../../api/records";
import { ProgressOverview, HeatmapEntry, MuscleVolume, PersonalRecord } from "../../types";

type Props = NativeStackScreenProps<ProgressStackParamList, "Dashboard">;

export default function DashboardScreen({ navigation }: Props) {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [muscleVolumes, setMuscleVolumes] = useState<MuscleVolume[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overRes, heatRes, muscRes, recRes] = await Promise.all([
        getOverview(), getHeatmap(), getMuscleVolume(), getRecords(),
      ]);
      setOverview(overRes.overview);
      setHeatmap(heatRes.heatmap);
      setMuscleVolumes(muscRes.muscleVolumes);
      setRecords(recRes.records);
    } catch (err) {}
    finally { setLoading(false); }
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}><ActivityIndicator color="#6366F1" /></View>;
  }

  const maxVol = Math.max(...muscleVolumes.map((m) => m.volume), 1);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 24 }}>Progress</Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 16, padding: 16, alignItems: "center" }}>
          <Text style={{ color: "#6366F1", fontSize: 28, fontWeight: "bold" }}>{overview?.totalWorkouts || 0}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 12 }}>Workouts</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 16, padding: 16, alignItems: "center" }}>
          <Text style={{ color: "#F59E0B", fontSize: 28, fontWeight: "bold" }}>{overview?.totalPRs || 0}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 12 }}>PRs</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 16, padding: 16, alignItems: "center" }}>
          <Text style={{ color: "#10B981", fontSize: 28, fontWeight: "bold" }}>{overview?.currentStreak || 0}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 12 }}>Streak</Text>
        </View>
      </View>

      {muscleVolumes.length > 0 && (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 16 }}>Weekly Volume by Muscle</Text>
          {muscleVolumes.map((mv) => (
            <View key={mv.muscleGroup} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ color: "#CBD5E1", fontSize: 14, textTransform: "capitalize" }}>{mv.muscleGroup}</Text>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>{mv.volume.toLocaleString()} kg</Text>
              </View>
              <View style={{ backgroundColor: "#0F172A", borderRadius: 4, height: 8 }}>
                <View style={{ backgroundColor: "#6366F1", borderRadius: 4, height: 8, width: `${(mv.volume / maxVol) * 100}%` }} />
              </View>
            </View>
          ))}
        </View>
      )}

      {records.length > 0 && (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Recent PRs</Text>
          {records.slice(0, 5).map((pr) => (
            <View key={pr.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155" }}>
              <Text style={{ color: "#CBD5E1", fontSize: 14 }}>{pr.exercise?.name || "Exercise"}</Text>
              <Text style={{ color: "#F59E0B", fontSize: 14 }}>{pr.weightKg}kg x {pr.reps}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate("Records")}
        style={{ backgroundColor: "#334155", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#6366F1", fontSize: 16, fontWeight: "600" }}>View All Records</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
