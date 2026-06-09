import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { listSplits, setActiveSplit } from "../../api/splits";
import { Split } from "../../types";

type Props = NativeStackScreenProps<ProfileStackParamList, "SplitSwitcher">;

export default function SplitSwitcherScreen({ navigation }: Props) {
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const res = await listSplits();
      setSplits(res.splits);
    } catch (err) {}
    finally { setLoading(false); }
  };

  const handleSwitch = (splitId: string, splitName: string) => {
    Alert.alert(
      "Switch Split",
      `Switch to "${splitName}"? Your workout tracking will reset for the new split.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: async () => {
            setSwitching(splitId);
            try {
              await setActiveSplit(splitId);
              Alert.alert("Success", "Split switched!", [{ text: "OK", onPress: () => navigation.goBack() }]);
            } catch (err) {
              Alert.alert("Error", "Failed to switch split");
            } finally {
              setSwitching(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}><ActivityIndicator color="#6366F1" /></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8 }}>Switch Split</Text>
      <Text style={{ color: "#94A3B8", fontSize: 14, marginBottom: 24 }}>Choose a new training program</Text>

      {splits.map((split) => (
        <TouchableOpacity
          key={split.id}
          onPress={() => handleSwitch(split.id, split.name)}
          disabled={switching !== null}
          style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 20, marginBottom: 12 }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>{split.name}</Text>
          <Text style={{ color: "#CBD5E1", fontSize: 14, marginTop: 4 }}>{split.description}</Text>
          <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
            <Text style={{ color: "#94A3B8", fontSize: 12 }}>{split.daysPerWeek} days/week</Text>
            <Text style={{ color: "#94A3B8", fontSize: 12, textTransform: "capitalize" }}>{split.type.replace("_", " ")}</Text>
          </View>
          {switching === split.id && (
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <ActivityIndicator color="#6366F1" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
