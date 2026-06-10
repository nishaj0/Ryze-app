import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ActivityIndicator, Alert, Modal } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { getActiveSplit } from "../../api/splits";
import { getOverview } from "../../api/progress";
import { markRestDay } from "../../api/sessions";
import { useAuthStore } from "../../store/authStore";
import { useWorkoutStore } from "../../store/workoutStore";
import { createSession } from "../../api/sessions";
import { UserSplit, ProgressOverview, SplitDay } from "../../types";
import { Screen, Card, Typography, Button, Icon, Input } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space } from "../../theme/spacing";

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
      <Screen scroll={false} padding="none">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={lightTheme.primary} />
        </View>
      </Screen>
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
    <Screen scroll padding="lg">
      {/* Greeting */}
      <View style={{ marginBottom: space.lg }}>
        <Typography variant="heading2" color={lightTheme.textPrimary}>
          {greeting()}{user?.name ? `, ${user.name}` : ""}
        </Typography>
        <Typography variant="body" color={lightTheme.textSecondary} style={{ marginTop: space.sm }}>
          Let's make today count.
        </Typography>
      </View>

      {/* Today's Plan Card */}
      {todaySplitDay && (
        <Card shadow="md" style={{ marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm }}>
            <Icon name="Calendar" size={18} color={lightTheme.textMuted} />
            <Typography variant="caption" color={lightTheme.textMuted}>
              TODAY'S PLAN
            </Typography>
          </View>

          <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
            {todaySplitDay.name}
          </Typography>

          {muscleGroups.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginBottom: space.md }}>
              {muscleGroups.map((mg: string) => (
                <View
                  key={mg}
                  style={{
                    backgroundColor: lightTheme.primaryLight,
                    borderRadius: 8,
                    paddingHorizontal: space.md,
                    paddingVertical: space.xs,
                  }}
                >
                  <Typography variant="caption" color={lightTheme.primary} weight="600">
                    {mg.charAt(0).toUpperCase() + mg.slice(1)}
                  </Typography>
                </View>
              ))}
            </View>
          )}

          {todaySplitDay.isRest ? (
            <Card
              padding="md"
              border={false}
              shadow="none"
              style={{ backgroundColor: lightTheme.successBg, marginTop: space.md }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Icon name="Moon" size={24} color={lightTheme.success} />
                <View>
                  <Typography variant="heading3" color={lightTheme.success}>
                    Rest Day
                  </Typography>
                  <Typography variant="bodySmall" color={lightTheme.successText}>
                    Recovery is growth. Enjoy it!
                  </Typography>
                </View>
              </View>
            </Card>
          ) : (
            <View style={{ flexDirection: "row", gap: space.md, marginTop: space.md }}>
              <Button
                title="Start Workout"
                onPress={handleStartWorkout}
                variant="primary"
                size="lg"
                icon={<Icon name="Play" size={20} color={lightTheme.primaryText} />}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                onPress={() => setRestModalVisible(true)}
                style={{
                  backgroundColor: lightTheme.secondary,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  aspectRatio: 1,
                }}
              >
                <Icon name="Moon" size={24} color={lightTheme.textSecondary} />
                <Typography variant="caption" color={lightTheme.textSecondary} style={{ marginTop: 4 }}>
                  Rest
                </Typography>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      )}

      {/* Stats */}
      {overview && (
        <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
            <Typography variant="display" color={lightTheme.primary} style={{ fontSize: 32 }}>
              {overview.currentStreak}
            </Typography>
            <Typography variant="caption" color={lightTheme.textMuted}>
              Day Streak
            </Typography>
          </Card>
          <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
            <Typography variant="display" color={lightTheme.success} style={{ fontSize: 32 }}>
              {overview.thisWeekWorkouts}
            </Typography>
            <Typography variant="caption" color={lightTheme.textMuted}>
              This Week
            </Typography>
          </Card>
          <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
            <Typography variant="display" color={lightTheme.warning} style={{ fontSize: 32 }}>
              {overview.totalWorkouts}
            </Typography>
            <Typography variant="caption" color={lightTheme.textMuted}>
              Total
            </Typography>
          </Card>
        </View>
      )}

      {/* Rest Day Modal */}
      <Modal visible={restModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <Card
            shadow="none"
            border={false}
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
            }}
          >
            <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.md }}>
              Mark Rest Day
            </Typography>
            <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.md }}>
              Optional: Why are you resting today?
            </Typography>

            {["Tired", "Sick", "Busy", "Other"].map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setRestReason(reason.toLowerCase())}
                style={{
                  backgroundColor: restReason === reason.toLowerCase() ? lightTheme.primary : lightTheme.surfaceSecondary,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: space.sm,
                  borderWidth: restReason === reason.toLowerCase() ? 0 : 1,
                  borderColor: lightTheme.border,
                }}
              >
                <Typography variant="body" color={restReason === reason.toLowerCase() ? lightTheme.primaryText : lightTheme.textPrimary}>
                  {reason}
                </Typography>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: "row", gap: space.md, marginTop: space.md }}>
              <Button
                title="Cancel"
                onPress={() => setRestModalVisible(false)}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm"
                onPress={handleMarkRest}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}
