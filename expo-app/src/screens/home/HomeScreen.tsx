import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Alert, Modal, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { getActiveSplit } from "../../api/splits";
import { getOverview } from "../../api/progress";
import { markRestDay } from "../../api/sessions";
import { getPhotos } from "../../api/photos";
import { useAuthStore } from "../../store/authStore";
import { useWorkoutStore } from "../../store/workoutStore";
import { mmkv } from "../../utils/mmkv";
import { UserSplit, ProgressOverview, SplitDay } from "../../types";
import { Screen, Card, Typography, Button, Icon, Input, HomeScreenSkeleton } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const { initPreStartSession, resumeSession, discardSession, completeSession, syncOfflineSessions } = useWorkoutStore();
  const [userSplit, setUserSplit] = useState<UserSplit | null>(null);
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [restModalVisible, setRestModalVisible] = useState(false);
  const [restReason, setRestReason] = useState("");
  const [todaySplitDay, setTodaySplitDay] = useState<SplitDay | null>(null);
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);

  useEffect(() => {
    loadData();
    // Auto-sync offline logs when app mounts
    syncOfflineSessions()
      .then(() => {
        // Reload data after sync to reflect new stats
        loadData();
      })
      .catch((err) => console.log("[HomeScreen] offline sync error:", err));
  }, []);

  // Check for unfinished session in MMKV
  useEffect(() => {
    const saved = mmkv.getString("active_session");
    if (saved) {
      try {
        const sessionData = JSON.parse(saved);
        if (sessionData) {
          Alert.alert(
            "Unfinished Workout",
            `You have an unfinished workout from ${new Date(sessionData.startedAt).toLocaleTimeString()}. Resume or discard?`,
            [
              {
                text: "Discard",
                style: "destructive",
                onPress: () => {
                  Alert.alert(
                    "Save Partial?",
                    "Do you want to save this partial workout before discarding it?",
                    [
                      {
                        text: "Discard Entirely",
                        style: "destructive",
                        onPress: () => discardSession(),
                      },
                      {
                        text: "Save & Discard",
                        onPress: async () => {
                          resumeSession(sessionData);
                          try {
                            const res = await completeSession();
                            loadData();
                            if (res && !res.isOffline) {
                              Alert.alert("Success", "Partial workout saved successfully.");
                            } else {
                              Alert.alert("Saved Offline", "Partial workout saved offline.");
                            }
                          } catch (err) {
                            Alert.alert("Error", "Failed to save workout.");
                          }
                        },
                      },
                    ]
                  );
                },
              },
              {
                text: "Resume",
                onPress: () => {
                  resumeSession(sessionData);
                  navigation.navigate("WorkoutLogger", {
                    splitDayId: sessionData.splitDayId,
                    splitDayName: sessionData.splitDayName,
                  });
                },
              },
            ]
          );
        }
      } catch (e) {
        console.error("Failed to parse active session from MMKV", e);
      }
    }
  }, []);

  const loadData = async () => {
    try {
      const [splitRes, overviewRes, photosRes] = await Promise.all([
        getActiveSplit(),
        getOverview(),
        getPhotos().catch(() => ({ photos: [] })),
      ]);
      setUserSplit(splitRes.userSplit);
      setOverview(overviewRes.overview);

      // Check if weekly photo is needed
      const photos = photosRes.photos || [];
      if (photos.length === 0) {
        setShowPhotoPrompt(true);
      } else {
        const sorted = [...photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latestPhoto = sorted[0];
        const latestDate = new Date(latestPhoto.date);
        const diffDays = Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
        setShowPhotoPrompt(diffDays >= 7);
      }

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

  const handleStartWorkoutForDay = (day: SplitDay) => {
    setWorkoutModalVisible(false);
    initPreStartSession(day);
    navigation.navigate("WorkoutLogger", {
      splitDayId: day.id,
      splitDayName: day.name,
    });
  };

  const handleStartWorkout = async () => {
    if (!todaySplitDay) return;
    await handleStartWorkoutForDay(todaySplitDay);
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
      <Screen scroll padding="none">
        <HomeScreenSkeleton />
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

      {/* Progress Photo Prompt */}
      {showPhotoPrompt && (
        <Card
          shadow="sm"
          style={{
            backgroundColor: lightTheme.primaryLight,
            borderColor: lightTheme.primary,
            borderWidth: 1,
            marginBottom: space.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: space.md,
          }}
        >
          <View style={{ flex: 1, marginRight: space.md }}>
            <Typography variant="heading3" color={lightTheme.primary} style={{ marginBottom: 4 }}>
              Progress Photo Reminder
            </Typography>
            <Typography variant="bodySmall" color={lightTheme.textSecondary}>
              It's time for your weekly check-in. Keep track of your visual progress!
            </Typography>
          </View>
          <Button
            title="Take Photo"
            onPress={() => (navigation as any).navigate("Photos", { screen: "PhotoCapture" })}
            variant="primary"
            size="sm"
            fullWidth={false}
          />
        </Card>
      )}

      {/* Today's Plan Card */}
      {todaySplitDay ? (
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
            <View style={{ gap: space.md, marginTop: space.md }}>
              <Card
                padding="md"
                border={false}
                shadow="none"
                style={{ backgroundColor: lightTheme.successBg }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Icon name="Moon" size={24} color={lightTheme.success} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading3" color={lightTheme.success}>
                      Rest Day
                    </Typography>
                    <Typography variant="bodySmall" color={lightTheme.successText}>
                      Recovery is growth. Enjoy it!
                    </Typography>
                  </View>
                </View>
              </Card>
              <Button
                title="Work Out Anyway"
                onPress={() => setWorkoutModalVisible(true)}
                variant="primary"
                size="lg"
                icon={<Icon name="Play" size={20} color={lightTheme.primaryText} />}
              />
            </View>
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
      ) : (
        <Card shadow="md" style={{ marginBottom: space.lg, padding: space.xl, alignItems: "center" }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: lightTheme.primaryLight,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.md,
          }}>
            <Icon name="Calendar" size={32} color={lightTheme.primary} />
          </View>
          <Typography variant="heading3" color={lightTheme.textPrimary} style={{ marginBottom: space.sm, textAlign: "center" }}>
            No Active Workout Plan
          </Typography>
          <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.lg, textAlign: "center" }}>
            Choose a workout split to get your daily exercises and start tracking your progress.
          </Typography>
          <Button
            title="Browse Plans"
            onPress={() => (navigation as any).navigate("Profile", { screen: "SplitSwitcher" })}
            variant="primary"
            size="lg"
            style={{ width: "100%" }}
            icon={<Icon name="Search" size={20} color={lightTheme.primaryText} />}
          />
        </Card>
      )}

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.lg }}>
        <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="display" color={lightTheme.primary} style={{ fontSize: 32 }}>
            {overview?.currentStreak || 0}
          </Typography>
          <Typography variant="caption" color={lightTheme.textMuted}>
            Day Streak
          </Typography>
        </Card>
        <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="display" color={lightTheme.success} style={{ fontSize: 32 }}>
            {overview?.thisWeekWorkouts || 0}
          </Typography>
          <Typography variant="caption" color={lightTheme.textMuted}>
            This Week
          </Typography>
        </Card>
        <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="display" color={lightTheme.warning} style={{ fontSize: 32 }}>
            {overview?.totalWorkouts || 0}
          </Typography>
          <Typography variant="caption" color={lightTheme.textMuted}>
            Total
          </Typography>
        </Card>
      </View>

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

      {/* Work Out Anyway Modal */}
      <Modal visible={workoutModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <Card
            shadow="none"
            border={false}
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "80%",
              padding: space.lg,
            }}
          >
            <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.md }}>
              Choose a Workout Day
            </Typography>
            <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.md }}>
              Select which day from your split you would like to perform today:
            </Typography>

            <ScrollView style={{ marginBottom: space.md }}>
              {userSplit?.split.days
                .filter((day) => !day.isRest)
                .map((day) => {
                  const dayMuscleGroups = (() => {
                    try { return JSON.parse(day.muscleGroups); } catch { return []; }
                  })();
                  return (
                    <TouchableOpacity
                      key={day.id}
                      onPress={() => handleStartWorkoutForDay(day)}
                      style={{
                        backgroundColor: lightTheme.surfaceSecondary,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: space.sm,
                        borderWidth: 1,
                        borderColor: lightTheme.border,
                      }}
                    >
                      <Typography variant="heading3" color={lightTheme.textPrimary}>
                        {day.name}
                      </Typography>
                      {dayMuscleGroups.length > 0 && (
                        <Typography variant="caption" color={lightTheme.textMuted} style={{ marginTop: 4 }}>
                          Targets: {dayMuscleGroups.join(", ")}
                        </Typography>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <Button
              title="Cancel"
              onPress={() => setWorkoutModalVisible(false)}
              variant="secondary"
              size="md"
            />
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}
