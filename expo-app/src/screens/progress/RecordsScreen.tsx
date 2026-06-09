import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProgressStackParamList } from "../../navigation/types";
import { getRecords } from "../../api/records";
import { PersonalRecord } from "../../types";

type Props = NativeStackScreenProps<ProgressStackParamList, "Records">;

export default function RecordsScreen({ navigation }: Props) {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const res = await getRecords();
      setRecords(res.records);
    } catch (err) {}
    finally { setLoading(false); }
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}><ActivityIndicator color="#6366F1" /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 24 }}>Personal Records</Text>

      {records.length === 0 ? (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 32, alignItems: "center" }}>
          <Text style={{ color: "#94A3B8", fontSize: 16 }}>No records yet. Keep training!</Text>
        </View>
      ) : (
        records.map((pr) => (
          <View key={pr.id} style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{pr.exercise?.name || "Exercise"}</Text>
                <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>{pr.exercise?.muscleGroup}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#F59E0B", fontSize: 18, fontWeight: "bold" }}>{pr.weightKg}kg</Text>
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>{pr.reps} reps</Text>
                <Text style={{ color: "#6366F1", fontSize: 12, marginTop: 4 }}>Est. 1RM: {pr.estimated1rm.toFixed(1)}kg</Text>
              </View>
            </View>
            <Text style={{ color: "#475569", fontSize: 12, marginTop: 8 }}>{new Date(pr.achievedAt).toLocaleDateString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
