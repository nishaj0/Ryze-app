import React, { useEffect, useState } from "react";
import { View, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { getSession } from "../../api/sessions";
import { WorkoutSession, PersonalRecord } from "../../types";
import { Typography, Card, Button, Icon } from "../../components";
import { BarChart } from "../../components/charts";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<HomeStackParamList, "WorkoutSummary">;

const { width: screenW } = Dimensions.get("window");

export default function WorkoutSummaryScreen({ navigation, route }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const res = await getSession(sessionId);
      setSession(res.session);

      let vol = 0;
      let sets = 0;
      const exerciseMap: Record<string, { name: string; muscle: string; volume: number; sets: number }> = {};
      for (const log of res.session.exerciseLogs || []) {
        for (const set of log.setLogs) {
          vol += set.weightKg * set.reps;
          sets++;
          if (!exerciseMap[log.exerciseId]) {
            exerciseMap[log.exerciseId] = { name: log.exercise.name, muscle: log.exercise.muscleGroup, volume: 0, sets: 0 };
          }
          exerciseMap[log.exerciseId].volume += set.weightKg * set.reps;
          exerciseMap[log.exerciseId].sets++;
        }
      }
      setTotalVolume(Math.round(vol));
      setTotalSets(sets);
    } catch (err) {
      console.error("[WorkoutSummary] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const exerciseBreakdown = session?.exerciseLogs?.reduce((acc, log) => {
    const vol = log.setLogs.reduce((s, set) => s + set.weightKg * set.reps, 0);
    acc.push({ name: log.exercise.name, muscle: log.exercise.muscleGroup, volume: Math.round(vol), sets: log.setLogs.length });
    return acc;
  }, [] as { name: string; muscle: string; volume: number; sets: number }[]) || [];

  const totalExercises = session?.exerciseLogs?.length || 0;
  const duration = session?.durationMinutes || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={{ alignItems: "center", paddingTop: space.xl, paddingHorizontal: space.lg, paddingBottom: space.lg }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: lightTheme.successBg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: space.lg,
            }}
          >
            <Icon name="Trophy" size={48} color={lightTheme.success.DEFAULT} />
          </View>
          <Typography variant="display" color={lightTheme.textPrimary} align="center">
            Workout Complete!
          </Typography>
          <Typography variant="body" color={lightTheme.textSecondary} align="center" style={{ marginTop: space.sm }}>
            Great work. Keep pushing forward.
          </Typography>
        </View>

        {/* Stats Grid */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1, backgroundColor: lightTheme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: lightTheme.border, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: lightTheme.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: space.sm }}>
                <Icon name="Weight" size={20} color={lightTheme.primary} />
              </View>
              <Typography variant="display" color={lightTheme.textPrimary} style={{ fontSize: 28 }}>
                {totalVolume.toLocaleString()}
              </Typography>
              <Typography variant="caption" color={lightTheme.textMuted}>
                VOLUME (KG)
              </Typography>
            </View>
            <View style={{ flex: 1, backgroundColor: lightTheme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: lightTheme.border, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: lightTheme.successBg, alignItems: "center", justifyContent: "center", marginBottom: space.sm }}>
                <Icon name="Layers" size={20} color={lightTheme.success.DEFAULT} />
              </View>
              <Typography variant="display" color={lightTheme.textPrimary} style={{ fontSize: 28 }}>
                {totalSets}
              </Typography>
              <Typography variant="caption" color={lightTheme.textMuted}>
                SETS
              </Typography>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1, backgroundColor: lightTheme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: lightTheme.border, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center", marginBottom: space.sm }}>
                <Icon name="Dumbbell" size={20} color={lightTheme.warning} />
              </View>
              <Typography variant="display" color={lightTheme.textPrimary} style={{ fontSize: 28 }}>
                {totalExercises}
              </Typography>
              <Typography variant="caption" color={lightTheme.textMuted}>
                EXERCISES
              </Typography>
            </View>
            <View style={{ flex: 1, backgroundColor: lightTheme.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: lightTheme.border, alignItems: "center" }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: lightTheme.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: space.sm }}>
                <Icon name="Clock" size={20} color={lightTheme.primary} />
              </View>
              <Typography variant="display" color={lightTheme.textPrimary} style={{ fontSize: 28 }}>
                {duration}
              </Typography>
              <Typography variant="caption" color={lightTheme.textMuted}>
                MINUTES
              </Typography>
            </View>
          </View>
        </View>

        {/* Volume Per Exercise Bar Chart */}
        {exerciseBreakdown.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <Card shadow="sm" style={{ padding: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="BarChart3" size={16} color={lightTheme.textMuted} />
                <Typography variant="caption" color={lightTheme.textMuted} weight="600">
                  VOLUME BY EXERCISE
                </Typography>
              </View>
              <BarChart
                data={exerciseBreakdown.map((e) => ({ label: e.name.substring(0, 8), value: e.volume }))}
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

        {/* Exercise list */}
        {exerciseBreakdown.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
              <Icon name="ListChecks" size={18} color={lightTheme.textPrimary} />
              <Typography variant="heading3" color={lightTheme.textPrimary}>
                Exercises
              </Typography>
            </View>

            {exerciseBreakdown.map((ex, idx) => (
              <Card key={idx} shadow="sm" style={{ marginBottom: space.sm, padding: space.md }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: lightTheme.primaryLight,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="Check" size={18} color={lightTheme.primary} strokeWidth={3} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                      {ex.name}
                    </Typography>
                    <Typography variant="caption" color={lightTheme.textMuted} style={{ textTransform: "capitalize" }}>
                      {ex.muscle} · {ex.sets} set{ex.sets !== 1 ? "s" : ""}
                    </Typography>
                  </View>
                  <Typography variant="body" color={lightTheme.textPrimary} weight="700">
                    {ex.volume.toLocaleString()}kg
                  </Typography>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Back to Home Button */}
        <View style={{ paddingHorizontal: space.lg }}>
          <Button
            title="Back to Home"
            onPress={() => navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" })}
            variant="primary"
            size="lg"
            icon={<Icon name="Home" size={20} color={lightTheme.primaryText} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
