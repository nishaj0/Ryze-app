import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { updateProfile } from "../../api/auth";

type Props = NativeStackScreenProps<ProfileStackParamList, "EditProfile">;

const goals = [
  { value: "MUSCLE_GAIN", label: "Build Muscle" },
  { value: "WEIGHT_LOSS", label: "Lose Weight" },
  { value: "GET_FIT", label: "Get Fit" },
  { value: "MAINTAIN", label: "Maintain" },
];

export default function EditProfileScreen({ navigation }: Props) {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [goal, setGoal] = useState(user?.goal || "GET_FIT");
  const [weight, setWeight] = useState(String(user?.currentWeight || ""));
  const [height, setHeight] = useState(String(user?.height || ""));
  const [sleep, setSleep] = useState(String(user?.sleepHours || ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = { name };
      if (goal) updates.goal = goal;
      if (weight) updates.currentWeight = parseFloat(weight);
      if (height) updates.height = parseFloat(height);
      if (sleep) updates.sleepHours = parseFloat(sleep);

      await updateProfile(updates);
      updateUser(updates);
      Alert.alert("Success", "Profile updated", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Name</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 20, fontSize: 16 }}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        placeholderTextColor="#475569"
      />

      <Text style={{ color: "#CBD5E1", marginBottom: 12, fontSize: 14 }}>Goal</Text>
      <View style={{ gap: 8, marginBottom: 20 }}>
        {goals.map((g) => (
          <TouchableOpacity
            key={g.value}
            onPress={() => setGoal(g.value)}
            style={{
              backgroundColor: goal === g.value ? "#4F46E5" : "#1E293B",
              borderRadius: 12,
              padding: 14,
              borderWidth: goal === g.value ? 2 : 0,
              borderColor: "#6366F1",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16 }}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Current Weight (kg)</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 20, fontSize: 16 }}
        value={weight}
        onChangeText={setWeight}
        placeholder="70"
        placeholderTextColor="#475569"
        keyboardType="decimal-pad"
      />

      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Height (cm)</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 20, fontSize: 16 }}
        value={height}
        onChangeText={setHeight}
        placeholder="175"
        placeholderTextColor="#475569"
        keyboardType="decimal-pad"
      />

      <Text style={{ color: "#CBD5E1", marginBottom: 8, fontSize: 14 }}>Sleep Hours</Text>
      <TextInput
        style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "#fff", marginBottom: 32, fontSize: 16 }}
        value={sleep}
        onChangeText={setSleep}
        placeholder="8"
        placeholderTextColor="#475569"
        keyboardType="decimal-pad"
      />

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{ backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
