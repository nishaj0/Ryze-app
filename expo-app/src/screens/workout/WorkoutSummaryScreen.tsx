import React, { useEffect, useState } from "react";
import { View, ScrollView, Dimensions, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { useWorkoutStore } from "../../store/workoutStore";
import { Typography, Card, Button, Icon, Input, WorkoutSummaryScreenSkeleton } from "../../components";
import { BarChart } from "../../components/charts";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<HomeStackParamList, "WorkoutSummary">;
const { width: screenW } = Dimensions.get("window");

export default function WorkoutSummaryScreen({ navigation }: Props) {
  const { activeSession, completeSession, updateSessionNotes } = useWorkoutStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeSession) {
      navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" });
    }
  }, [activeSession]);

  if (!activeSession) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
        <WorkoutSummaryScreenSkeleton />
      </SafeAreaView>
    );
  }

  // Calculate statistics from active session
  const elapsedSeconds = Math.floor((Date.now() - activeSession.startedAt) / 1000);
  const durationMinutes = Math.max(1, Math.floor(elapsedSeconds / 60));

  let totalSets = 0;
  let totalVolume = 0;
  const completedExercisesList: any[] = [];
  const incompleteExercisesList: any[] = [];
  const prsList: any[] = [];

  activeSession.exerciseQueue.forEach((item) => {
    const isCompleted = item.status === "complete" || item.status === "skipped";
    
    // Calculate exercise volume and completed sets
    const completedSets = item.loggedSets.filter(s => !s.wasSkipped);
    const exerciseVolume = completedSets.reduce((sum, s) => sum + (s.weightKg || 0) * (s.reps || 0), 0);
    
    totalSets += completedSets.length;
    totalVolume += exerciseVolume;

    // Collect PRs
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
      muscle: item.exercise.muscleGroup,
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await completeSession();
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
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top", "bottom"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={{ alignItems: "center", paddingTop: space.xl, paddingHorizontal: space.lg, paddingBottom: space.lg }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: lightTheme.successBg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space.lg,
            }}
          >
            <Icon name="Trophy" size={40} color={lightTheme.success} />
          </View>
          <Typography variant="display" color={lightTheme.textPrimary} align="center">
            Workout Summary
          </Typography>
          <Typography variant="body" color={lightTheme.textSecondary} align="center" style={{ marginTop: space.sm }}>
            Review your workout and save it below.
          </Typography>
        </View>

        {/* PR Achievements list */}
        {prsList.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card
              style={{
                backgroundColor: "#FEF3C7", // gold background
                borderColor: "#F59E0B",
                borderWidth: 1.5,
                padding: space.lg,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="Trophy" size={24} color="#D97706" />
                <Typography variant="heading2" color="#92400E" weight="800">
                  New PRs Achieved!
                </Typography>
              </View>
              {prsList.map((pr) => (
                <View
                  key={pr.id}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                    borderRadius: radius.md,
                    padding: space.md,
                    marginBottom: space.xs,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" color="#92400E" weight="700">
                      {pr.exerciseName}
                    </Typography>
                    <Typography variant="caption" color="#B45309">
                      1RM Est: {Math.round(pr.estimated1rm)}kg
                    </Typography>
                  </View>
                  <Typography variant="heading3" color="#D97706" weight="800">
                    {pr.weightKg}kg × {pr.reps}
                  </Typography>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Incomplete Exercises Warnings */}
        {incompleteExercisesList.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.05)",
                borderColor: lightTheme.error,
                borderWidth: 1.5,
                padding: space.lg,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm }}>
                <Icon name="AlertTriangle" size={24} color={lightTheme.error} />
                <Typography variant="heading3" color={lightTheme.error} weight="800">
                  Incomplete Exercises
                </Typography>
              </View>
              <Typography variant="bodySmall" color={lightTheme.textSecondary} style={{ marginBottom: space.md }}>
                You have {incompleteExercisesList.length} incomplete exercise(s). You can go back to finish them.
              </Typography>
              {incompleteExercisesList.map((item, idx) => (
                <Typography key={idx} variant="caption" color={lightTheme.textPrimary} style={{ marginLeft: 8 }}>
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
            <View style={{ flex: 1, backgroundColor: lightTheme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: lightTheme.border, alignItems: "center" }}>
              <View style={{ marginBottom: space.xs }}><Icon name="Weight" size={24} color={lightTheme.primary} /></View>
              <Typography variant="display" color={lightTheme.textPrimary} style={{ fontSize: 24 }}>
                {totalVolume.toLocaleString()}
              </Typography>
              <Typography variant="caption" color={lightTheme.textMuted}>
                VOLUME (KG)
              </Typography>
            </View>
            <View style={{ flex: 1, backgroundColor: lightTheme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: lightTheme.border, alignItems: "center" }}>
              <View style={{ marginBottom: space.xs }}><Icon name="Layers" size={24} color={lightTheme.success} /></View>
              <Typography variant="display" color={lightTheme.textPrimary} style={{ fontSize: 24 }}>
                {totalSets}
              </Typography>
              <Typography variant="caption" color={lightTheme.textMuted}>
                SETS
              </Typography>
            </View>
            <View style={{ flex: 1, backgroundColor: lightTheme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: lightTheme.border, alignItems: "center" }}>
              <View style={{ marginBottom: space.xs }}><Icon name="Clock" size={24} color={lightTheme.warning} /></View>
              <Typography variant="display" color={lightTheme.textPrimary} style={{ fontSize: 24 }}>
                {durationMinutes}
              </Typography>
              <Typography variant="caption" color={lightTheme.textMuted}>
                MINUTES
              </Typography>
            </View>
          </View>
        </View>

        {/* Chart */}
        {completedExercisesList.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card shadow="sm" style={{ padding: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="BarChart3" size={16} color={lightTheme.textMuted} />
                <Typography variant="caption" color={lightTheme.textMuted} weight="600">
                  VOLUME BY EXERCISE
                </Typography>
              </View>
              <BarChart
                data={completedExercisesList.map((e) => ({ label: e.name.substring(0, 8), value: e.volume }))}
                width={screenW - 80}
                height={180}
                color={lightTheme.primary}
                yAxisFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
                showValues={true}
                horizontal={true}
              />
            </Card>
          </View>
        )}

        {/* Notes Card */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ padding: space.lg }}>
            <Typography variant="heading3" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
              Session Notes
            </Typography>
            <Input
              value={activeSession.notes}
              onChangeText={(val) => updateSessionNotes(val)}
              placeholder="How did you feel? Energy level, fatigue, general notes..."
              multiline
              numberOfLines={3}
              containerStyle={{ marginBottom: 0 }}
            />
          </Card>
        </View>

        {/* Exercise breakdown */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Typography variant="heading3" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
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
                    backgroundColor: ex.status === "skipped" ? "rgba(239, 68, 68, 0.05)" : lightTheme.successBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={ex.status === "skipped" ? "X" : "Check"} size={16} color={ex.status === "skipped" ? lightTheme.error : lightTheme.success} strokeWidth={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                    {ex.name}
                  </Typography>
                  <Typography variant="caption" color={lightTheme.textMuted} style={{ textTransform: "capitalize" }}>
                    {ex.muscle} · {ex.sets} / {ex.targetSets} sets completed
                  </Typography>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Typography variant="body" color={lightTheme.textPrimary} weight="700">
                    {ex.volume.toLocaleString()}kg
                  </Typography>
                  {ex.hasPR && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      <Icon name="Trophy" size={10} color="#D97706" />
                      <Typography variant="caption" color="#D97706" weight="700">PR</Typography>
                    </View>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Save button */}
        <View style={{ paddingHorizontal: space.lg }}>
          <Button
            title={saving ? "Saving Workout..." : "Save Workout"}
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            variant="primary"
            size="lg"
            icon={<Icon name="CheckCircle2" size={20} color={lightTheme.primaryText} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
