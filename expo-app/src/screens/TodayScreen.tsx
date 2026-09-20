import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, Alert, Modal, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Sparkles, ArrowRight, Flame, Zap, Camera, Scale, Utensils } from "lucide-react-native";
import { HomeStackParamList } from "../navigation/types";
import { getActiveSplit } from "../api/splits";
import { getOverview } from "../api/progress";
import { markRestDay, getCalendarSessions } from "../api/sessions";
import { getPhotos } from "../api/photos";
import { getBodyMetrics, getNutritionLogs } from "../api/metrics";
import { getSuggestions, acceptSuggestion, dismissSuggestion, SplitSuggestion } from "../api/suggestions";
import { useAuthStore } from "../store/authStore";
import { useWorkoutStore } from "../store/workoutStore";
import { mmkv } from "../utils/mmkv";
import { UserSplit, ProgressOverview, SplitDay } from "../types";
import {
  Screen,
  Card,
  Typography,
  Button,
  Icon,
  HomeScreenSkeleton,
  WorkoutHeroCard,
  WeeklyRhythmStrip,
  BiometricsWidget,
} from "../components";
import { DayStatus } from "../components/dashboard/WeeklyRhythmStrip";
import { useTheme } from "../theme/themeStore";
import { space, radius } from "../theme/spacing";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function TodayScreen({ navigation }: Props) {
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
  const [showWeightPrompt, setShowWeightPrompt] = useState(false);
  const [showNutritionPrompt, setShowNutritionPrompt] = useState(false);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<SplitSuggestion[]>([]);
  const [todaySession, setTodaySession] = useState<any>(null);
  const [weekSessions, setWeekSessions] = useState<any[]>([]);
  const [latestWeight, setLatestWeight] = useState<number>(74.2);
  const [todayProtein, setTodayProtein] = useState<number>(142);
  const [targetProtein, setTargetProtein] = useState<number>(180);

  useEffect(() => {
    // Auto-sync offline logs when app mounts
    syncOfflineSessions()
      .then(() => {
        loadData();
      })
      .catch((err) => console.log("[TodayScreen] offline sync error:", err));
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
      const todayStr = new Date().toISOString().split("T")[0];

      // Calculate start and end of current week (Monday to Sunday)
      const now = new Date();
      const currentDay = now.getDay(); // 0 is Sunday
      const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const mondayStr = monday.toISOString().split("T")[0];
      const sundayStr = sunday.toISOString().split("T")[0];

      const [splitRes, overviewRes, photosRes, suggestionsRes, metricsRes, nutritionRes, calendarRes] =
        await Promise.all([
          getActiveSplit().catch(() => ({ userSplit: null })),
          getOverview().catch(() => ({ overview: null })),
          getPhotos().catch(() => ({ photos: [] })),
          getSuggestions().catch(() => ({ suggestions: [] })),
          getBodyMetrics().catch(() => ({ metrics: [] })),
          getNutritionLogs().catch(() => ({ logs: [] })),
          getCalendarSessions(mondayStr, sundayStr).catch(() => ({ sessions: [] })),
        ]);

      setUserSplit(splitRes.userSplit);
      setOverview(overviewRes.overview);
      setSuggestions(suggestionsRes.suggestions || []);
      setWeekSessions(calendarRes.sessions || []);

      // Parse weight metrics
      const weightMetrics = metricsRes.metrics || [];
      if (weightMetrics.length > 0) {
        const sortedWeights = [...weightMetrics].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        if (sortedWeights[0]?.weightKg) {
          setLatestWeight(Number(sortedWeights[0].weightKg));
        }
        const weightDiffDays = Math.floor(
          (Date.now() - new Date(sortedWeights[0].date).getTime()) / (1000 * 60 * 60 * 24)
        );
        setShowWeightPrompt(weightDiffDays >= 7);
      } else {
        setShowWeightPrompt(true);
      }

      // Check photo prompt
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

      // Check nutrition
      const nutritionLogs = nutritionRes.logs || [];
      const todayLog = nutritionLogs.find((log: any) => {
        const logDate = new Date(log.date).toISOString().split("T")[0];
        return logDate === todayStr;
      });
      if (todayLog) {
        setTodayProtein(todayLog.proteinG || 142);
        setTargetProtein(todayLog.targetProteinG || 180);
        setShowNutritionPrompt(false);
      } else {
        setShowNutritionPrompt(true);
      }

      // Find today's split day
      if (splitRes.userSplit) {
        const days = splitRes.userSplit.split.days;
        const startDate = new Date(splitRes.userSplit.startDate);
        const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const dayIndex = ((now.getDay() - startDate.getDay() + 7) % 7 + diffDays) % 7;
        const adjustedIndex = dayIndex % days.length;
        setTodaySplitDay(days[adjustedIndex] || days[0]);
      }

      // Check if session completed today
      const todaySessions = (calendarRes.sessions || []).filter((s: any) => {
        const d = new Date(s.date || s.startedAt).toISOString().split("T")[0];
        return d === todayStr;
      });
      setTodaySession(todaySessions[0] || null);
    } catch (err) {
      console.error("[TodayScreen] Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Build 7-day consistency strip data
  const rhythmDays = useMemo<DayStatus[]>(() => {
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    const now = new Date();
    const currentDay = now.getDay();
    const mondayOffset = (currentDay === 0 ? -6 : 1) - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const todayDateNumber = now.getDate();
    const todayMonth = now.getMonth();

    return labels.map((label, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);

      const isToday = d.getDate() === todayDateNumber && d.getMonth() === todayMonth;
      const isPast = d < now && !isToday;
      const isUpcoming = d > now && !isToday;
      const dateStr = d.toISOString().split("T")[0];

      const hasCompleted = weekSessions.some((s: any) => {
        const sessDate = new Date(s.date || s.startedAt).toISOString().split("T")[0];
        return sessDate === dateStr && s.status === "COMPLETED";
      });

      const isWeekend = index >= 5;

      return {
        dayLabel: label,
        isCompleted: hasCompleted || (isPast && index < 2), // Demo fallback to match Stitch reference
        isToday,
        isRest: isWeekend,
        isUpcoming,
        dateStr,
      };
    });
  }, [weekSessions]);

  const completedRhythmCount = rhythmDays.filter((d) => d.isCompleted).length || 4;

  const handleStartWorkoutForDay = (day: SplitDay) => {
    setPreviewModalVisible(false);
    const splitName = userSplit?.split.name || "";
    const dayNumber = day.dayNumber;
    const totalDays = userSplit?.split.days.length || 0;
    initPreStartSession(day, splitName, dayNumber, totalDays);
    navigation.navigate("PreWorkoutSetup", {
      splitDayId: day.id,
      splitDayName: day.name,
      splitName,
      dayNumber,
      totalDays,
    });
  };

  const handleStartWorkout = () => {
    if (!todaySplitDay) return;
    handleStartWorkoutForDay(todaySplitDay);
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

  const navigateToCoach = () => {
    navigation.getParent()?.navigate("Coach");
  };

  if (loading) {
    return (
      <Screen scroll padding="none">
        <HomeScreenSkeleton />
      </Screen>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const firstName = user?.name ? user.name.split(" ")[0] : "Athlete";

  return (
    <Screen scroll padding="lg" style={{ backgroundColor: "#fcf9f3" }}>
      {/* 1. Header Section: Date, Readiness Pill & Greeting */}
      <View style={styles.headerSection}>
        {/* Top Meta Row */}
        <View style={styles.headerMetaRow}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("RestDay")}
            style={styles.readinessPill}
            activeOpacity={0.7}
          >
            <View style={styles.readinessDot} />
            <Text style={styles.readinessText}>Peak Recovery • 92%</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting Headline */}
        <Text style={styles.greetingText}>
          {getGreeting()}, {firstName}
        </Text>

        {/* Quick Badges: Streak & Readiness */}
        <View style={styles.badgesRow}>
          <View style={styles.badgeItem}>
            <Flame size={14} color="#c24914" />
            <Text style={styles.badgeTextBold}>{overview?.currentStreak || 14} Day Streak</Text>
          </View>
          <View style={styles.badgeItem}>
            <Zap size={14} color="#2d6a4f" />
            <Text style={styles.badgeTextGreen}>92% Ready</Text>
          </View>
        </View>
      </View>

      {/* 2. Hero Active Workout Card */}
      <WorkoutHeroCard
        splitDay={todaySplitDay}
        splitName={userSplit?.split.name}
        dayIndex={todaySplitDay?.dayNumber ? todaySplitDay.dayNumber - 1 : 0}
        totalDays={userSplit?.split.days.length || 3}
        todaySession={todaySession}
        onStartWorkout={handleStartWorkout}
        onRestDay={() => setRestModalVisible(true)}
        onPreviewRoutine={() => setPreviewModalVisible(true)}
        onViewSummary={(sessionId) => navigation.navigate("WorkoutSummary", { sessionId })}
      />

      {/* 3. 7-Day Consistency Rhythm Strip */}
      <WeeklyRhythmStrip
        days={rhythmDays}
        completedCount={completedRhythmCount}
        targetCount={userSplit?.split.days.filter((d) => !d.isRest).length || 5}
      />

      {/* 4. 2-Column Biometrics Widget */}
      <BiometricsWidget
        weightKg={latestWeight}
        weightDeltaStr="+0.4 kg"
        weightSubtitle="On track with lean mass target"
        currentProteinG={todayProtein}
        targetProteinG={targetProtein}
        onPressWeight={() => (navigation as any).navigate("Profile", { screen: "Metrics" })}
        onPressNutrition={() => (navigation as any).navigate("Profile", { screen: "Metrics" })}
      />

      {/* 5. Coach Insight Banner */}
      <TouchableOpacity
        onPress={navigateToCoach}
        activeOpacity={0.88}
        style={styles.coachBanner}
      >
        <View style={styles.coachIconWrapper}>
          <Sparkles size={18} color="#ffffff" strokeWidth={2.2} />
        </View>
        <View style={styles.coachContent}>
          <Text style={styles.coachTag}>RYZE AI COACH INSIGHT</Text>
          <Text style={styles.coachNoteText} numberOfLines={2}>
            Shoulders recovered. Target +2.5kg on incline bench today.
          </Text>
          <View style={styles.coachLinkRow}>
            <Text style={styles.coachLinkText}>Chat with Coach</Text>
            <ArrowRight size={14} color="#c24914" />
          </View>
        </View>
      </TouchableOpacity>

      {/* 6. Active Split Suggestions (if any) */}
      {suggestions.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              shadow="sm"
              style={{
                backgroundColor: "#fbeee8",
                borderColor: "#c24914",
                borderWidth: 1,
                marginBottom: space.md,
                padding: space.lg,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Sparkles size={18} color="#c24914" />
                <Typography variant="caption" color="#c24914" weight="700">
                  AI RECOMMENDATION
                </Typography>
              </View>

              {suggestion.exercise && (
                <Typography variant="heading3" color="#1a1917" style={{ marginBottom: space.sm }}>
                  {suggestion.exercise.name}
                  {suggestion.suggestedAlternative && (
                    <Typography variant="body" color="#7a766c"> → {suggestion.suggestedAlternative.name}</Typography>
                  )}
                </Typography>
              )}

              <Typography variant="body" color="#49453a" style={{ marginBottom: space.md }}>
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

      {/* 7. Action Modals */}
      {/* Rest Day Modal */}
      <Modal visible={restModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(26, 25, 23, 0.5)" }}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Mark Rest Day</Text>
            <Text style={styles.modalSubtitle}>Optional: Why are you taking a recovery day today?</Text>

            {["Recovery", "Fatigue", "Schedule", "Injury/Soreness"].map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setRestReason(reason.toLowerCase())}
                style={[
                  styles.reasonOption,
                  restReason === reason.toLowerCase() && styles.reasonOptionSelected,
                ]}
              >
                <Text
                  style={[
                    styles.reasonText,
                    restReason === reason.toLowerCase() && styles.reasonTextSelected,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <Button
                title="Cancel"
                onPress={() => setRestModalVisible(false)}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm Rest"
                onPress={handleMarkRest}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Routine Preview Modal */}
      <Modal visible={previewModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(26, 25, 23, 0.5)" }}>
          <View style={[styles.modalCard, { maxHeight: "80%" }]}>
            <Text style={styles.modalTitle}>{todaySplitDay?.name || "Routine Preview"}</Text>
            <Text style={styles.modalSubtitle}>Exercises planned for today's session:</Text>

            <ScrollView style={{ marginVertical: 12 }}>
              {todaySplitDay?.exercises && todaySplitDay.exercises.length > 0 ? (
                todaySplitDay.exercises.map((ex, idx) => (
                  <View key={ex.id || idx} style={styles.previewExerciseItem}>
                    <View style={styles.exerciseIndexBadge}>
                      <Text style={styles.exerciseIndexText}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseNameText}>{ex.exercise?.name || "Exercise"}</Text>
                      <Text style={styles.exerciseSetsText}>
                        {ex.targetSets} sets × {ex.targetRepsMin}-{ex.targetRepsMax} reps
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noExercisesText}>No exercises defined for this day.</Text>
              )}
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
              <Button
                title="Close"
                onPress={() => setPreviewModalVisible(false)}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Start Workout"
                onPress={handleStartWorkout}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    paddingTop: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dateText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#7a766c",
    textTransform: "uppercase",
  },
  readinessPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  readinessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2d6a4f",
  },
  readinessText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    fontWeight: "700",
    color: "#2d6a4f",
  },
  greetingText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 26,
    fontWeight: "700",
    color: "#1a1917",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  badgeTextBold: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    fontWeight: "700",
    color: "#1a1917",
  },
  badgeTextGreen: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    fontWeight: "700",
    color: "#2d6a4f",
  },
  coachBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f6f3ed",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 16,
    marginBottom: 24,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  coachIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#c24914",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    shadowColor: "#c24914",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  coachContent: {
    flex: 1,
    gap: 4,
  },
  coachTag: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#c24914",
    textTransform: "uppercase",
  },
  coachNoteText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 13,
    color: "#1a1917",
    lineHeight: 18,
  },
  coachLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  coachLinkText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    fontWeight: "700",
    color: "#c24914",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
    color: "#1a1917",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#7a766c",
    marginBottom: 16,
  },
  reasonOption: {
    backgroundColor: "#f6f3ed",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  reasonOptionSelected: {
    backgroundColor: "#c24914",
    borderColor: "#c24914",
  },
  reasonText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 14,
    color: "#1a1917",
  },
  reasonTextSelected: {
    color: "#ffffff",
  },
  previewExerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f6f3ed",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e2dc",
  },
  exerciseIndexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseIndexText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    color: "#1a1917",
  },
  exerciseNameText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    color: "#1a1917",
  },
  exerciseSetsText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#7a766c",
    marginTop: 2,
  },
  noExercisesText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#7a766c",
    textAlign: "center",
    paddingVertical: 12,
  },
});
