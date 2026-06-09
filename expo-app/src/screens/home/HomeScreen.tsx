import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { getActiveSplit } from "../../api/splits";
import { getOverview } from "../../api/progress";
import { markRestDay } from "../../api/sessions";
import { useAuthStore } from "../../store/authStore";
import { useWorkoutStore } from "../../store/workoutStore";
import { createSession } from "../../api/sessions";
import { UserSplit, ProgressOverview, SplitDay } from "../../types";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { startSession } = useWorkoutStore();
  const [userSplit, setUserSplit] = useState<UserSplit | null>(null);
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [restModalVisible, setRestModalVisible] = useState(false);
  const [restReason, setRestReason] = useState("");
  const [todaySplitDay, setTodaySplitDay] = useState<SplitDay | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [splitRes, overviewRes] = await Promise.all([getActiveSplit(), getOverview()]);
      setUserSplit(splitRes.userSplit);
      setOverview(overviewRes.overview);

      if (splitRes.userSplit) {
        const days = splitRes.userSplit.split.days;
        const startDate = new Date(splitRes.userSplit.startDate);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const dayIndex = ((today.getDay() - startDate.getDay() + 7) % 7 + diffDays) % 7;
        const adjustedIndex = dayIndex % days.length;
        setTodaySplitDay(days[adjustedIndex] || days[0]);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!todaySplitDay) return;
    try {
      const res = await createSession(todaySplitDay.id);
      startSession(res.session, res.lastSessionLogs);
      navigation.navigate("WorkoutLogger", {
        splitDayId: todaySplitDay.id,
        splitDayName: todaySplitDay.name,
      });
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to start workout");
    }
  };

  const handleMarkRest = async () => {
    if (!todaySplitDay) return;
    try {
      await markRestDay(todaySplitDay.id, new Date().toISOString(), restReason || undefined);
      setRestModalVisible(false);
      setRestReason("");
      Alert.alert("Rest Day", "Rest day logged. Recovery is part of the plan!");
      loadData();
    } catch (err) {
      Alert.alert("Error", "Failed to log rest day");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  const muscleGroups = todaySplitDay ? (() => {
    try { return JSON.parse(todaySplitDay.muscleGroups); } catch { return []; }
  })() : [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0F172A" }} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 4 }}>
        {greeting()}{user?.name ? `, ${user.name}` : ""}
      </Text>
      <Text style={{ color: "#94A3B8", fontSize: 16, marginBottom: 32 }}>Let's make today count.</Text>

      {todaySplitDay && (
        <View style={{ backgroundColor: "#1E293B", borderRadius: 20, padding: 24, marginBottom: 24 }}>
          <Text style={{ color: "#94A3B8", fontSize: 14, marginBottom: 4 }}>Today's Plan</Text>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>{todaySplitDay.name}</Text>

          {muscleGroups.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {muscleGroups.map((mg: string) => (
                <View key={mg} style={{ backgroundColor: "#334155", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text style={{ color: "#CBD5E1", fontSize: 12 }}>{mg.charAt(0).toUpperCase() + mg.slice(1)}</Text>
                </View>
              ))}
            </View>
          )}

          {todaySplitDay.isRest ? (
            <View style={{ backgroundColor: "#1E293B", borderRadius: 12, padding: 16, alignItems: "center" }}>
              <Text style={{ color: "#10B981", fontSize: 18, fontWeight: "600" }}>Rest Day</Text>
              <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>Recovery is growth. Enjoy it!</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleStartWorkout}
                style={{ flex: 1, backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Start Workout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRestModalVisible(true)}
                style={{ backgroundColor: "#334155", borderRadius: 12, padding: 16, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#94A3B8", fontSize: 12 }}>Rest</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {overview && (
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 16, padding: 16, alignItems: "center" }}>
            <Text style={{ color: "#6366F1", fontSize: 32, fontWeight: "bold" }}>{overview.currentStreak}</Text>
            <Text style={{ color: "#94A3B8", fontSize: 12 }}>Day Streak</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 16, padding: 16, alignItems: "center" }}>
            <Text style={{ color: "#10B981", fontSize: 32, fontWeight: "bold" }}>{overview.thisWeekWorkouts}</Text>
            <Text style={{ color: "#94A3B8", fontSize: 12 }}>This Week</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: "#1E293B", borderRadius: 16, padding: 16, alignItems: "center" }}>
            <Text style={{ color: "#F59E0B", fontSize: 32, fontWeight: "bold" }}>{overview.totalWorkouts}</Text>
            <Text style={{ color: "#94A3B8", fontSize: 12 }}>Total</Text>
          </View>
        </View>
      )}

      <Modal visible={restModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#1E293B", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Mark Rest Day</Text>
            <Text style={{ color: "#94A3B8", marginBottom: 16 }}>Optional: Why are you resting today?</Text>

            {["Tired", "Sick", "Busy", "Other"].map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setRestReason(reason.toLowerCase())}
                style={{
                  backgroundColor: restReason === reason.toLowerCase() ? "#4F46E5" : "#334155",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setRestModalVisible(false)}
                style={{ flex: 1, backgroundColor: "#334155", borderRadius: 12, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#94A3B8", fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMarkRest}
                style={{ flex: 1, backgroundColor: "#6366F1", borderRadius: 12, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
