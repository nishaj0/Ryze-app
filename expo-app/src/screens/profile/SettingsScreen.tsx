import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { updateProfile } from "../../api/auth";

export default function SettingsScreen() {
  const { user, updateUser } = useAuthStore();
  const [units, setUnits] = useState(user?.units || "kg");
  const [weeklyCheckin, setWeeklyCheckin] = useState(user?.weeklyCheckin ?? true);

  const handleUnitsChange = async (newUnits: string) => {
    setUnits(newUnits);
    try {
      await updateProfile({ units: newUnits });
      updateUser({ units: newUnits });
    } catch (err) {
      Alert.alert("Error", "Failed to update units");
      setUnits(units);
    }
  };

  const handleWeeklyCheckinChange = async (value: boolean) => {
    setWeeklyCheckin(value);
    try {
      await updateProfile({ weeklyCheckin: value });
      updateUser({ weeklyCheckin: value });
    } catch (err) {
      Alert.alert("Error", "Failed to update preferences");
      setWeeklyCheckin(weeklyCheckin);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 24 }}>Settings</Text>

      <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
        <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 12 }}>UNITS</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => handleUnitsChange("kg")}
            style={{
              flex: 1,
              backgroundColor: units === "kg" ? "#4F46E5" : "#334155",
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Kilograms</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleUnitsChange("lbs")}
            style={{
              flex: 1,
              backgroundColor: units === "lbs" ? "#4F46E5" : "#334155",
              borderRadius: 12,
              padding: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Pounds</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 24 }}>
        <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 12 }}>NOTIFICATIONS</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ color: "#fff", fontSize: 16 }}>Weekly Check-in</Text>
            <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>Remind to log weight & photos</Text>
          </View>
          <Switch
            value={weeklyCheckin}
            onValueChange={handleWeeklyCheckinChange}
            trackColor={{ false: "#334155", true: "#6366F1" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16 }}>
        <Text style={{ color: "#94A3B8", fontSize: 12, marginBottom: 12 }}>ABOUT</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
          <Text style={{ color: "#CBD5E1", fontSize: 14 }}>Version</Text>
          <Text style={{ color: "#94A3B8", fontSize: 14 }}>1.0.0</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
          <Text style={{ color: "#CBD5E1", fontSize: 14 }}>App</Text>
          <Text style={{ color: "#94A3B8", fontSize: 14 }}>Ryze</Text>
        </View>
      </View>
    </ScrollView>
  );
}
