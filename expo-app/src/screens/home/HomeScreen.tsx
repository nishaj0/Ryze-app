import React, { useEffect, useState, useCallback } from "react";
import { View, TouchableOpacity, Alert, Modal, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { getActiveSplit } from "../../api/splits";
import { getOverview } from "../../api/progress";
import { markRestDay, getCalendarSessions } from "../../api/sessions";
import { getPhotos } from "../../api/photos";
import { getSuggestions, acceptSuggestion, dismissSuggestion, SplitSuggestion } from "../../api/suggestions";
import { useAuthStore } from "../../store/authStore";
import { useWorkoutStore } from "../../store/workoutStore";
import { mmkv } from "../../utils/mmkv";
import { UserSplit, ProgressOverview, SplitDay } from "../../types";
import { Screen, Card, Typography, Button, Icon, Input, HomeScreenSkeleton } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const theme = useTheme();
  const { initPreStartSession, resumeSession, discardSession, completeSession, syncOfflineSessions } = useWorkoutStore();
  const [userSplit, setUserSplit] = useState<UserSplit | null>(null);
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [restModalVisible, setRestModalVisible] = useState(false);
  const [restReason, setRestReason] = useState("");
  const [todaySplitDay, setTodaySplitDay] = useState<SplitDay | null>(null);
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<SplitSuggestion[]>([]);
  const [todaySession, setTodaySession] = useState<any>(null);

  useEffect(() => {
    // Auto-sync offline logs when app mounts
    syncOfflineSessions()
      .then(() => {
        // Reload data after sync to reflect new stats
        loadData();
      })
      .catch((err) => console.log("[HomeScreen] offline sync error:", err));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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
                    splitName: sessionData.splitName || "",
                    dayNumber: sessionData.dayNumber || 0,
                    totalDays: sessionData.totalDays || 0,
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
      const [splitRes, overviewRes, photosRes, suggestionsRes] = await Promise.all([
        getActiveSplit(),
        getOverview(),
        getPhotos().catch(() => ({ photos: [] })),
        getSuggestions().catch(() => ({ suggestions: [] })),
      ]);
      setUserSplit(splitRes.userSplit);
      setOverview(overviewRes.overview);
      setSuggestions(suggestionsRes.suggestions);

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

      const todayStr = new Date().toISOString().split("T")[0];
      const calendarRes = await getCalendarSessions(todayStr, todayStr).catch(() => ({ sessions: [] }));
      const todaySess = calendarRes.sessions && calendarRes.sessions.length > 0 ? calendarRes.sessions[0] : null;
      setTodaySession(todaySess);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkoutForDay = (day: SplitDay) => {
    setWorkoutModalVisible(false);
    const splitName = userSplit?.split.name || "";
    const dayNumber = day.dayNumber;
    const totalDays = userSplit?.split.days.length || 0;
    initPreStartSession(day, splitName, dayNumber, totalDays);
    navigation.navigate("WorkoutLogger", {
      splitDayId: day.id,
      splitDayName: day.name,
      splitName,
      dayNumber,
      totalDays,
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

  const handleAcceptSuggestion = async (id: string) => {
    try {
      await acceptSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      Alert.alert("Applied", "Suggestion applied to your split.");
    } catch (err) {
      Alert.alert("Error", "Failed to apply suggestion");
    }
  };

  const handleDismissSuggestion = async (id: string) => {
    try {
      await dismissSuggestion(id);
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      Alert.alert("Error", "Failed to dismiss suggestion");
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
        <Typography variant="heading2" color={theme.textPrimary}>
          {greeting()}{user?.name ? `, ${user.name}` : ""}
        </Typography>
        <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.sm }}>
          Let's make today count.
        </Typography>
      </View>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <View style={{ marginBottom: space.lg }}>
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              shadow="sm"
              style={{
                backgroundColor: theme.primaryLight,
                borderColor: theme.primary,
                borderWidth: 1,
                marginBottom: space.md,
                padding: space.lg,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="Sparkles" size={20} color={theme.primary} />
                <Typography variant="caption" color={theme.primary} weight="700">
                  AI SUGGESTION
                </Typography>
              </View>

              {suggestion.exercise && (
                <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: space.sm }}>
                  {suggestion.exercise.name}
                  {suggestion.suggestedAlternative && (
                    <Typography variant="body" color={theme.textSecondary}> → {suggestion.suggestedAlternative.name}</Typography>
                  )}
                </Typography>
              )}

              <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.md }}>
                {suggestion.reasoning}
              </Typography>

              <View style={{ flexDirection: "row", gap: space.sm }}>
                <Button
                  title="Apply"
                  onPress={() => handleAcceptSuggestion(suggestion.id)}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Dismiss"
                  onPress={() => handleDismissSuggestion(suggestion.id)}
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Progress Photo Prompt */}
      {showPhotoPrompt && (
        <Card
          shadow="sm"
          style={{
            backgroundColor: theme.primaryLight,
            borderColor: theme.primary,
            borderWidth: 1,
            marginBottom: space.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: space.md,
          }}
        >
          <View style={{ flex: 1, marginRight: space.md }}>
            <Typography variant="heading3" color={theme.primary} style={{ marginBottom: 4 }}>
              Progress Photo Reminder
            </Typography>
            <Typography variant="bodySmall" color={theme.textSecondary}>
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
            <Icon name="Calendar" size={18} color={theme.textMuted} />
            <Typography variant="caption" color={theme.textMuted}>
              TODAY'S PLAN
            </Typography>
          </View>

          <Typography variant="heading2" color={theme.textPrimary} style={{ marginBottom: space.sm }}>
            {todaySplitDay.name}
          </Typography>

          {muscleGroups.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginBottom: space.md }}>
              {muscleGroups.map((mg: string) => (
                <View
                  key={mg}
                  style={{
                    backgroundColor: theme.primaryLight,
                    borderRadius: 8,
                    paddingHorizontal: space.md,
                    paddingVertical: space.xs,
                  }}
                >
                  <Typography variant="caption" color={theme.primary} weight="600">
                    {mg.charAt(0).toUpperCase() + mg.slice(1)}
                  </Typography>
                </View>
              ))}
            </View>
          )}

          {todaySession && todaySession.status === "COMPLETED" ? (
            <View style={{ gap: space.md, marginTop: space.md }}>
              <Card
                padding="md"
                border={false}
                shadow="none"
                style={{ backgroundColor: theme.successBg }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Icon name="CheckCircle" size={24} color={theme.success} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading3" color={theme.success}>
                      Workout Completed!
                    </Typography>
                    <Typography variant="bodySmall" color={theme.successText}>
                      Awesome job hitting your targets today.
                    </Typography>
                  </View>
                </View>
              </Card>
              <Button
                title="View Today's Summary"
                onPress={() => navigation.navigate("WorkoutSummary", { sessionId: todaySession.id })}
                variant="primary"
                size="lg"
                icon={<Icon name="Trophy" size={20} color={theme.primaryText} />}
              />
            </View>
          ) : todaySession && todaySession.status === "SKIPPED" ? (
            <View style={{ gap: space.md, marginTop: space.md }}>
              <Card
                padding="md"
                border={false}
                shadow="none"
                style={{ backgroundColor: theme.successBg }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Icon name="Moon" size={24} color={theme.success} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading3" color={theme.success}>
                      Rest Day Logged
                    </Typography>
                    <Typography variant="bodySmall" color={theme.successText}>
                      Reason: {todaySession.restReason ? todaySession.restReason.charAt(0).toUpperCase() + todaySession.restReason.slice(1) : "Not specified"}
                    </Typography>
                  </View>
                </View>
              </Card>
              <Button
                title="Work Out Anyway"
                onPress={() => setWorkoutModalVisible(true)}
                variant="primary"
                size="lg"
                icon={<Icon name="Play" size={20} color={theme.primaryText} />}
              />
            </View>
          ) : todaySplitDay.isRest ? (
            <View style={{ gap: space.md, marginTop: space.md }}>
              <Card
                padding="md"
                border={false}
                shadow="none"
                style={{ backgroundColor: theme.successBg }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Icon name="Moon" size={24} color={theme.success} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading3" color={theme.success}>
                      Rest Day
                    </Typography>
                    <Typography variant="bodySmall" color={theme.successText}>
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
                icon={<Icon name="Play" size={20} color={theme.primaryText} />}
              />
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: space.md, marginTop: space.md }}>
              <Button
                title="Start Workout"
                onPress={handleStartWorkout}
                variant="primary"
                size="lg"
                icon={<Icon name="Play" size={20} color={theme.primaryText} />}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                onPress={() => setRestModalVisible(true)}
                style={{
                  backgroundColor: theme.secondary,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  aspectRatio: 1,
                }}
              >
                <Icon name="Moon" size={24} color={theme.textSecondary} />
                <Typography variant="caption" color={theme.textSecondary} style={{ marginTop: 4 }}>
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
            backgroundColor: theme.primaryLight,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: space.md,
          }}>
            <Icon name="Calendar" size={32} color={theme.primary} />
          </View>
          <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: space.sm, textAlign: "center" }}>
            No Active Workout Plan
          </Typography>
          <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.lg, textAlign: "center" }}>
            Choose a workout split to get your daily exercises and start tracking your progress.
          </Typography>
          <View style={{ flexDirection: "row", gap: space.sm, width: "100%" }}>
            <Button
              title="Create My Own"
              onPress={() => (navigation as any).navigate("Profile", { screen: "CustomSplit" })}
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
              icon={<Icon name="Plus" size={20} color={theme.primary} />}
            />
            <Button
              title="Browse Plans"
              onPress={() => (navigation as any).navigate("Profile", { screen: "SplitSwitcher" })}
              variant="primary"
              size="lg"
              style={{ flex: 1 }}
              icon={<Icon name="Search" size={20} color={theme.primaryText} />}
            />
          </View>
        </Card>
      )}

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.lg }}>
        <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="display" color={theme.primary} style={{ fontSize: 32 }}>
            {overview?.currentStreak || 0}
          </Typography>
          <Typography variant="caption" color={theme.textMuted}>
            Day Streak
          </Typography>
        </Card>
        <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="display" color={theme.success} style={{ fontSize: 32 }}>
            {overview?.thisWeekWorkouts || 0}
          </Typography>
          <Typography variant="caption" color={theme.textMuted}>
            This Week
          </Typography>
        </Card>
        <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
          <Typography variant="display" color={theme.warning} style={{ fontSize: 32 }}>
            {overview?.totalWorkouts || 0}
          </Typography>
          <Typography variant="caption" color={theme.textMuted}>
            Total
          </Typography>
        </Card>
      </View>

      {/* Rest Day Modal */}
      <Modal visible={restModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.bgOverlay }}>
          <Card
            shadow="none"
            border={false}
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
            }}
          >
            <Typography variant="heading2" color={theme.textPrimary} style={{ marginBottom: space.md }}>
              Mark Rest Day
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.md }}>
              Optional: Why are you resting today?
            </Typography>

            {["Tired", "Sick", "Busy", "Other"].map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setRestReason(reason.toLowerCase())}
                style={{
                  backgroundColor: restReason === reason.toLowerCase() ? theme.primary : theme.surfaceSecondary,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: space.sm,
                  borderWidth: restReason === reason.toLowerCase() ? 0 : 1,
                  borderColor: theme.border,
                }}
              >
                <Typography variant="body" color={restReason === reason.toLowerCase() ? theme.primaryText : theme.textPrimary}>
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
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.bgOverlay }}>
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
            <Typography variant="heading2" color={theme.textPrimary} style={{ marginBottom: space.md }}>
              Choose a Workout Day
            </Typography>
            <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.md }}>
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
                        backgroundColor: theme.surfaceSecondary,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: space.sm,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Typography variant="heading3" color={theme.textPrimary}>
                        {day.name}
                      </Typography>
                      {dayMuscleGroups.length > 0 && (
                        <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 4 }}>
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
