import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { getSession } from "../../api/sessions";
import { WorkoutSession, PersonalRecord } from "../../types";

type Props = NativeStackScreenProps<HomeStackParamList, "WorkoutSummary">;

export default function WorkoutSummaryScreen({ navigation, route }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const res = await getSession(sessionId);
      setSession(res.session);

      let vol = 0;
      let sets = 0;
      for (const log of res.session.exerciseLogs || []) {
        for (const set of log.setLogs) {
          vol += set.weightKg * set.reps;
          sets++;
        }
      }
      setTotalVolume(Math.round(vol));
      setTotalSets(sets);
    } catch (err) {}
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: "#0F172A", justifyContent: "center" }}>
      <Text style={{ fontSize: 32, fontWeight: "bold", color: "#10B981", textAlign: "center", marginBottom: 8 }}>Workout Complete!</Text>
      <Text style={{ color: "#94A3B8", textAlign: "center", marginBottom: 40 }}>Great work. Keep pushing.</Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 32 }}>
        <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 16, padding: 20, alignItems: "center" }}>
          <Text style={{ color: "#6366F1", fontSize: 28, fontWeight: "bold" }}>{totalVolume.toLocaleString()}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 12 }}>Total Volume (kg)</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 16, padding: 20, alignItems: "center" }}>
          <Text style={{ color: "#10B981", fontSize: 28, fontWeight: "bold" }}>{totalSets}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 12 }}>Sets Done</Text>
        </View>
      </View>

      {session?.exerciseLogs && (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 32 }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>Exercises</Text>
          {session.exerciseLogs.map((log) => (
            <View key={log.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155" }}>
              <Text style={{ color: "#CBD5E1", fontSize: 14 }}>{log.exercise.name}</Text>
              <Text style={{ color: "#94A3B8", fontSize: 14 }}>{log.setLogs.length} sets</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={() => navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" })}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
