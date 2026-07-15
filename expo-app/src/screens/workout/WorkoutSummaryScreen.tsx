import React, { useEffect, useState } from "react";
import { View, ScrollView, Dimensions, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { useWorkoutStore } from "../../store/workoutStore";
import { Typography, Card, Button, Icon, Input, WorkoutSummaryScreenSkeleton } from "../../components";
import { BarChart } from "../../components/charts";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";
import { createCheckIn, getCheckIn } from "../../api/checkins";
import { useQueryClient } from "@tanstack/react-query";

type Props = NativeStackScreenProps<HomeStackParamList, "WorkoutSummary">;
const { width: screenW } = Dimensions.get("window");

const abbreviateExerciseName = (name: string): string => {
  if (!name) return "";
  let abbr = name;
  abbr = abbr.replace(/barbell/i, "BB");
  abbr = abbr.replace(/dumbbell/i, "DB");
  abbr = abbr.replace(/incline/i, "Inc");
  abbr = abbr.replace(/decline/i, "Dec");
  abbr = abbr.replace(/standing/i, "Std");
  abbr = abbr.replace(/seated/i, "Seat");
  abbr = abbr.replace(/lying/i, "Lying");
  abbr = abbr.replace(/alternate/i, "Alt");
  abbr = abbr.replace(/extension/i, "Ext");
  abbr = abbr.replace(/crossover/i, "Cross");
  abbr = abbr.replace(/straight/i, "St.");
  if (abbr.length > 15) {
    abbr = abbr.substring(0, 14) + "..";
  }
  return abbr;
};

export default function WorkoutSummaryScreen({ route, navigation }: Props) {
  const { sessionId } = route.params || {};
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { activeSession, completeSession, updateSessionNotes } = useWorkoutStore();
  const [saving, setSaving] = useState(false);
  const [checkInText, setCheckInText] = useState("");

  // For viewing past/completed summary
  const [loadingPastSession, setLoadingPastSession] = useState(false);
  const [pastSession, setPastSession] = useState<any>(null);
  const [pastPrs, setPastPrs] = useState<any[]>([]);

  useEffect(() => {
    if (!activeSession) {
      if (sessionId) {
        // Load session from server
        setLoadingPastSession(true);
        const { getSession } = require("../../api/sessions");
        getSession(sessionId)
          .then((res: any) => {
            setPastSession(res.session);
            setPastPrs(res.prs || []);
            // Also try to load check-in for this completed session
            getCheckIn(sessionId)
              .then((ciRes) => {
                if (ciRes?.checkIn) {
                  setCheckInText(ciRes.checkIn.rawText);
                }
              })
              .catch(() => {});
          })
          .catch((err: any) => {
            console.error("Failed to load completed session summary:", err);
            Alert.alert("Error", "Failed to load session details.");
            navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" });
          })
          .finally(() => {
            setLoadingPastSession(false);
          });
      } else {
        navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" });
      }
    }
    // Note: Don't try to load check-in for activeSession here - it hasn't been saved to DB yet
  }, [activeSession, sessionId]);

  const isPast = !activeSession;
  const session = activeSession || pastSession;

  if (loadingPastSession || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <WorkoutSummaryScreenSkeleton />
      </SafeAreaView>
    );
  }

  // Duration
  const durationMinutes = isPast
    ? (session.durationMinutes || 0)
    : Math.max(1, Math.floor(Math.floor((Date.now() - session.startedAt) / 1000) / 60));

  let totalSets = 0;
  let totalVolume = 0;
  const completedExercisesList: any[] = [];
  const incompleteExercisesList: any[] = [];
  const prsList: any[] = [];

  if (isPast) {
    // Map PRs from pastPrs
    pastPrs.forEach((pr) => {
      prsList.push({
        id: pr.id,
        exerciseName: pr.exercise?.name || "Exercise",
        weightKg: pr.weightKg,
        reps: pr.reps,
        estimated1rm: pr.estimated1rm,
      });
    });

    const logs = session.exerciseLogs || [];
    logs.forEach((item: any) => {
      const completedSets = item.setLogs?.filter((s: any) => !s.wasSkipped) || [];
      const exerciseVolume = completedSets.reduce((sum: number, s: any) => sum + (s.weightKg || 0) * (s.reps || 0), 0);
      totalSets += completedSets.length;
      totalVolume += exerciseVolume;

      const breakdownItem = {
        name: item.exercise?.name || "Exercise",
        muscle: item.exercise?.muscles?.find((m: any) => m.isPrimary)?.muscle?.name || "",
        volume: exerciseVolume,
        sets: completedSets.length,
        targetSets: completedSets.length,
        status: "complete",
        hasPR: pastPrs.some(pr => pr.exerciseId === item.exerciseId),
      };

      completedExercisesList.push(breakdownItem);
    });
  } else {
    activeSession.exerciseQueue.forEach((item) => {
      const isCompleted = item.status === "complete" || item.status === "skipped";
      
      const completedSets = item.loggedSets.filter(s => !s.wasSkipped);
      const exerciseVolume = completedSets.reduce((sum, s) => sum + (s.weightKg || 0) * (s.reps || 0), 0);
      
      totalSets += completedSets.length;
      totalVolume += exerciseVolume;

      item.loggedSets.forEach((set) => {
        if ((set as any).isPR) {
          prsList.push({
            id: set.id,
            exerciseName: item.exercise.name,
            weightKg: set.weightKg,
            reps: set.reps,
            estimated1rm: (set.weightKg || 0) * (1 + (set.reps || 0) / 30),
          });
        }
      });

      const breakdownItem = {
        name: item.exercise.name,
        muscle: item.exercise.muscles?.find(m => m.isPrimary)?.muscle.name || "",
        volume: exerciseVolume,
        sets: completedSets.length,
        targetSets: item.targetSets,
        status: item.status,
        hasPR: item.loggedSets.some(s => (s as any).isPR),
      };

      if (isCompleted) {
        completedExercisesList.push(breakdownItem);
      } else {
        incompleteExercisesList.push(breakdownItem);
      }
    });
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await completeSession();
      
      // Create check-in AFTER session is saved (using the real server-generated session ID)
      if (res && !res.isOffline && res.session?.id && checkInText.trim()) {
        try {
          await createCheckIn(res.session.id, checkInText.trim());
        } catch (err) {
          console.error("Failed to save check-in:", err);
        }
      }
      
      // Invalidate the cache to refresh charts/metrics immediately
      try {
        queryClient.invalidateQueries();
      } catch (cacheErr) {
        console.error("Query cache invalidation failed:", cacheErr);
      }

      if (res && res.isOffline) {
        Alert.alert(
          "Workout Saved Offline",
          "You are offline. Your workout has been saved locally and will sync when you are online.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Workout Saved!",
          "Great job finishing your workout today!",
          [
            {
              text: "Awesome",
              onPress: () => {
                navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" });
              },
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save workout session.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xl }}>
        {/* Header */}
        <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Typography variant="heading1" color={theme.textPrimary}>
              {isPast ? "Workout Summary" : "Workout Complete!"}
            </Typography>
            <Typography variant="body" color={theme.textSecondary}>
              {isPast ? new Date(session.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Awesome job. Here is your summary:"}
            </Typography>
          </View>
        </View>

        {/* PR Trophy Banner */}
        {prsList.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card style={{ backgroundColor: theme.warningBg, borderColor: theme.warning, borderWidth: 1, padding: space.md }} shadow="sm">
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.xs }}>
                <Icon name="Trophy" size={24} color={theme.warning} />
                <Typography variant="heading3" color={theme.warningText} weight="700">
                  {prsList.length} Personal Record{prsList.length > 1 ? "s" : ""} Achieved!
                </Typography>
              </View>
              {prsList.map((pr, idx) => (
                <Typography key={pr.id || idx} variant="bodySmall" color={theme.warningText} style={{ marginLeft: 32 }}>
                  • {pr.exerciseName}: {pr.weightKg}kg × {pr.reps} reps (Est. 1RM: {Math.round(pr.estimated1rm)}kg)
                </Typography>
              ))}
            </Card>
          </View>
        )}

        {/* Incomplete Workout Warning */}
        {!isPast && incompleteExercisesList.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card style={{ borderColor: theme.error, borderWidth: 1, padding: space.md }} shadow="sm">
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.xs }}>
                <Icon name="AlertTriangle" size={20} color={theme.error} />
                <Typography variant="heading3" color={theme.error} weight="700">
                  Incomplete Exercises
                </Typography>
              </View>
              <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginBottom: space.md }}>
                You have {incompleteExercisesList.length} incomplete exercise(s). You can go back to finish them.
              </Typography>
              {incompleteExercisesList.map((item, idx) => (
                <Typography key={idx} variant="caption" color={theme.textPrimary} style={{ marginLeft: 8 }}>
                  • {item.name} ({item.status})
                </Typography>
              ))}
              <Button
                title="Go Back & Resume"
                onPress={() => navigation.goBack()}
                variant="secondary"
                size="sm"
                style={{ marginTop: space.md }}
              />
            </Card>
          </View>
        )}

        {/* Stats Grid */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: theme.border, alignItems: "center" }}>
              <View style={{ marginBottom: space.xs }}><Icon name="Weight" size={24} color={theme.primary} /></View>
              <Typography variant="display" color={theme.textPrimary} style={{ fontSize: 24 }}>
                {totalVolume.toLocaleString()}
              </Typography>
              <Typography variant="caption" color={theme.textMuted}>
                Vol (kg)
              </Typography>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: theme.border, alignItems: "center" }}>
              <View style={{ marginBottom: space.xs }}><Icon name="Layers" size={24} color={theme.success} /></View>
              <Typography variant="display" color={theme.textPrimary} style={{ fontSize: 24 }}>
                {totalSets}
              </Typography>
              <Typography variant="caption" color={theme.textMuted}>
                SETS
              </Typography>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: theme.border, alignItems: "center" }}>
              <View style={{ marginBottom: space.xs }}><Icon name="Clock" size={24} color={theme.warning} /></View>
              <Typography variant="display" color={theme.textPrimary} style={{ fontSize: 24 }}>
                {durationMinutes}
              </Typography>
              <Typography variant="caption" color={theme.textMuted}>
                Min
              </Typography>
            </View>
          </View>
        </View>

        {/* Chart */}
        {completedExercisesList.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card shadow="sm" style={{ padding: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="BarChart3" size={16} color={theme.textMuted} />
                <Typography variant="caption" color={theme.textMuted} weight="600">
                  VOLUME BY EXERCISE
                </Typography>
              </View>
              <BarChart
                data={completedExercisesList.map((e) => ({ label: abbreviateExerciseName(e.name), value: e.volume }))}
                width={screenW - 80}
                height={180}
                color={theme.primary}
                yAxisFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                showValues={true}
                horizontal={true}
              />
            </Card>
          </View>
        )}

        {/* Notes Card */}
        {(!isPast || session.notes) && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card shadow="sm" style={{ padding: space.lg }}>
              <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: space.sm }}>
                Session Notes
              </Typography>
              {isPast ? (
                <Typography variant="body" color={theme.textSecondary}>
                  {session.notes}
                </Typography>
              ) : (
                <Input
                  value={session.notes || ""}
                  onChangeText={(val) => updateSessionNotes(val)}
                  placeholder="How did you feel? Energy level, fatigue, general notes..."
                  multiline
                  numberOfLines={3}
                  containerStyle={{ marginBottom: 0 }}
                />
              )}
            </Card>
          </View>
        )}

        {/* Check-In Card */}
        {(!isPast || checkInText.trim().length > 0) && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card shadow="sm" style={{ padding: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm }}>
                <Icon name="MessageCircle" size={16} color={theme.primary} />
                <Typography variant="heading3" color={theme.textPrimary}>
                  How did today feel?
                </Typography>
              </View>
              {!isPast && (
                <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
                  Anything uncomfortable? Your feedback helps us adapt your training.
                </Typography>
              )}
              {isPast ? (
                <Typography variant="body" color={theme.textSecondary}>
                  {checkInText}
                </Typography>
              ) : (
                <Input
                  value={checkInText}
                  onChangeText={setCheckInText}
                  placeholder="e.g. Shoulder felt a bit tight on press, but overall good energy..."
                  multiline
                  numberOfLines={3}
                  containerStyle={{ marginBottom: 0 }}
                />
              )}
            </Card>
          </View>
        )}

        {/* Exercise breakdown */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: space.sm }}>
            Exercises Completed
          </Typography>
          {completedExercisesList.map((ex, idx) => (
            <Card key={idx} shadow="sm" style={{ marginBottom: space.xs, padding: space.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: ex.status === "skipped" ? theme.errorBg : theme.successBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={ex.status === "skipped" ? "X" : "Check"} size={16} color={ex.status === "skipped" ? theme.error : theme.success} strokeWidth={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="body" color={theme.textPrimary} weight="600">
                    {ex.name}
                  </Typography>
                  <Typography variant="caption" color={theme.textMuted} style={{ textTransform: "capitalize" }}>
                    {ex.muscle} · {ex.sets} / {ex.targetSets} sets completed
                  </Typography>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Typography variant="body" color={theme.textPrimary} weight="700">
                    {ex.volume.toLocaleString()}kg
                  </Typography>
                  {ex.hasPR && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Icon name="Trophy" size={10} color={theme.warning} />
                      <Typography variant="caption" color={theme.warning} weight="700">PR</Typography>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Save button / Back button */}
        <View style={{ paddingHorizontal: space.lg }}>
          {isPast ? (
            <Button
              title="Back to Home"
              onPress={() => navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" })}
              variant="primary"
              size="lg"
              icon={<Icon name="Home" size={20} color={theme.primaryText} />}
            />
          ) : (
            <Button
              title={saving ? "Saving Workout..." : "Save Workout"}
              onPress={handleSave}
              disabled={saving}
              loading={saving}
              variant="primary"
              size="lg"
              icon={<Icon name="CheckCircle2" size={20} color={theme.primaryText} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
