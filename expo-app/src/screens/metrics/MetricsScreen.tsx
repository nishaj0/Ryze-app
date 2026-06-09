import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { getBodyMetrics, logBodyMetric, deleteBodyMetric } from "../../api/metrics";
import { BodyMetric } from "../../types";

type Props = NativeStackScreenProps<ProfileStackParamList, "Metrics">;

export default function MetricsScreen({ navigation }: Props) {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const res = await getBodyMetrics();
      setMetrics(res.metrics);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const handleLog = async () => {
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      Alert.alert("Error", "Please enter a valid weight");
      return;
    }
    setSubmitting(true);
    try {
      await logBodyMetric(w, new Date().toISOString(), notes || undefined);
      setModalVisible(false);
      setWeight("");
      setNotes("");
      loadMetrics();
    } catch (err) {
      Alert.alert("Error", "Failed to log weight");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert("Delete", "Delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBodyMetric(id);
            setMetrics((prev) => prev.filter((m) => m.id !== id));
          } catch (err) {
            Alert.alert("Error", "Failed to delete");
          }
        },
      },
    ]);
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}><ActivityIndicator color="#6366F1" /></View>;
  }

  const latestWeight = metrics.length > 0 ? metrics[metrics.length - 1].weightKg : null;
  const maxWeight = Math.max(...metrics.map((m) => m.weightKg), 1);
  const minWeight = Math.min(...metrics.map((m) => m.weightKg), 0);
  const range = maxWeight - minWeight || 1;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 24 }}>Body Weight</Text>

      {latestWeight && (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 20, marginBottom: 24, alignItems: "center" }}>
          <Text style={{ color: "#94A3B8", fontSize: 14 }}>Current Weight</Text>
          <Text style={{ color: "#6366F1", fontSize: 48, fontWeight: "bold" }}>{latestWeight}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 16 }}>kg</Text>
        </View>
      )}

      {metrics.length > 1 && (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 16 }}>Weight Trend</Text>
          <View style={{ height: 120, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
            {metrics.slice(-20).map((m, idx) => {
              const height = ((m.weightKg - minWeight) / range) * 100 + 10;
              return (
                <View key={m.id} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
                  <View style={{ width: "100%", backgroundColor: "#6366F1", borderRadius: 2, height: height }} />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            <Text style={{ color: "#475569", fontSize: 10 }}>{new Date(metrics[0].date).toLocaleDateString()}</Text>
            <Text style={{ color: "#475569", fontSize: 10 }}>{new Date(metrics[metrics.length - 1].date).toLocaleDateString()}</Text>
          </View>
        </View>
      )}

      <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 }}>History</Text>
        {metrics.length === 0 ? (
          <Text style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", padding: 16 }}>No entries yet</Text>
        ) : (
          metrics.slice().reverse().map((m) => (
            <View key={m.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#334155" }}>
              <View>
                <Text style={{ color: "#CBD5E1", fontSize: 14 }}>{new Date(m.date).toLocaleDateString()}</Text>
                {m.notes && <Text style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>{m.notes}</Text>}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ color: "#6366F1", fontSize: 16, fontWeight: "600" }}>{m.weightKg} kg</Text>
                <TouchableOpacity onPress={() => handleDelete(m.id)}>
                  <Text style={{ color: "#EF4444", fontSize: 12 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Log Weight</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#1E293B", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Log Weight</Text>
            <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Weight (kg)</Text>
            <TextInput
              style={{ backgroundColor: "#0F172A", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 16, fontSize: 18 }}
              value={weight}
              onChangeText={setWeight}
              placeholder="70.5"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
            />
            <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Notes (optional)</Text>
            <TextInput
              style={{ backgroundColor: "#0F172A", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 24, fontSize: 16 }}
              value={notes}
              onChangeText={setNotes}
              placeholder="How are you feeling?"
              placeholderTextColor="#475569"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ flex: 1, backgroundColor: "#334155", borderRadius: 12, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#94A3B8", fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLog} disabled={submitting} style={{ flex: 1, backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" }}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
