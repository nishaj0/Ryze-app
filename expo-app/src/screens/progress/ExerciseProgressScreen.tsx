import React, { useEffect, useState } from "react";
import { View, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProgressStackParamList } from "../../navigation/types";
import { getExerciseProgress } from "../../api/progress";
import { ExerciseProgress } from "../../types";
import { Typography, Card, Icon, ExerciseProgressScreenSkeleton } from "../../components";
import { LineChart } from "../../components/charts";
import { useTheme } from "../../theme/themeStore";
import { space } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProgressStackParamList, "ExerciseProgress">;

const { width: screenW } = Dimensions.get("window");

export default function ExerciseProgressScreen({ route }: Props) {
  const theme = useTheme();
  const { exerciseId, exerciseName } = route.params;
  const [progression, setProgression] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [exerciseId]);

  const loadProgress = async () => {
    try {
      const res = await getExerciseProgress(exerciseId);
      setProgression(res.progression);
    } catch (err) {
      console.error("[ExerciseProgress] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <ExerciseProgressScreenSkeleton />
      </SafeAreaView>
    );
  }

  if (progression.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <View style={{ padding: space.lg }}>
          <Typography variant="heading2" color={theme.textPrimary} style={{ marginBottom: space.xl }}>
            {exerciseName}
          </Typography>
          <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.primaryLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: space.md,
              }}
            >
              <Icon name="Dumbbell" size={36} color={theme.primary} />
            </View>
            <Typography variant="heading3" color={theme.textPrimary} align="center">
              No data yet
            </Typography>
            <Typography variant="body" color={theme.textSecondary} align="center" style={{ marginTop: space.sm }}>
              Complete a workout with this exercise to see your progress.
            </Typography>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // Prepare chart data — reverse to chronological order
  const sorted = [...progression].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const weightData = sorted.map((p, i) => ({
    label: `${i + 1}`,
    value: p.maxWeight,
  }));

  const volumeData = sorted.map((p, i) => ({
    label: `${i + 1}`,
    value: p.totalVolume,
  }));

  // Stats
  const maxWeight = Math.max(...sorted.map((p) => p.maxWeight));
  const totalVolume = sorted.reduce((sum, p) => sum + p.totalVolume, 0);
  const totalReps = sorted.reduce((sum, p) => sum + p.totalReps, 0);
  const sessions = sorted.length;

  // First vs last for trend
  const firstWeight = sorted[0]?.maxWeight || 0;
  const lastWeight = sorted[sorted.length - 1]?.maxWeight || 0;
  const weightGain = firstWeight > 0 ? Math.round(((lastWeight - firstWeight) / firstWeight) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">
            EXERCISE
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
            {exerciseName}
          </Typography>
        </View>

        {/* Quick Stats */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 16, padding: space.md, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: space.xs }}>
                <Icon name="Weight" size={14} color={theme.primary} />
                <Typography variant="caption" color={theme.textMuted}>MAX</Typography>
              </View>
              <Typography variant="heading1" color={theme.textPrimary}>
                {maxWeight}<Typography variant="body" color={theme.textMuted}>kg</Typography>
              </Typography>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 16, padding: space.md, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: space.xs }}>
                <Icon name="TrendingUp" size={14} color={theme.success} />
                <Typography variant="caption" color={theme.textMuted}>GAIN</Typography>
              </View>
              <Typography variant="heading1" color={weightGain >= 0 ? theme.success : theme.danger}>
                {weightGain >= 0 ? "+" : ""}{weightGain}<Typography variant="body" color={theme.textMuted}>%</Typography>
              </Typography>
            </View>
            <View style={{ flex: 1, backgroundColor: theme.surface, borderRadius: 16, padding: space.md, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: space.xs }}>
                <Icon name="Layers" size={14} color={theme.warning} />
                <Typography variant="caption" color={theme.textMuted}>VOLUME</Typography>
              </View>
              <Typography variant="heading1" color={theme.textPrimary}>
                {(totalVolume / 1000).toFixed(1)}<Typography variant="body" color={theme.textMuted}>k</Typography>
              </Typography>
            </View>
          </View>
        </View>

        {/* Weight Progression Chart */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ padding: space.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
              <Icon name="Weight" size={16} color={theme.primary} />
              <Typography variant="caption" color={theme.textMuted} weight="600">
                MAX WEIGHT PROGRESSION
              </Typography>
            </View>
            <LineChart
              data={weightData}
              width={screenW - 80}
              height={200}
              color={theme.primary}
              yAxisFormatter={(v) => `${v}kg`}
            />
          </Card>
        </View>

        {/* Volume Progression Chart */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ padding: space.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
              <Icon name="BarChart3" size={16} color={theme.success} />
              <Typography variant="caption" color={theme.textMuted} weight="600">
                VOLUME PROGRESSION
              </Typography>
            </View>
            <LineChart
              data={volumeData}
              width={screenW - 80}
              height={200}
              color={theme.success}
              yAxisFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
            />
          </Card>
        </View>

        {/* History */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
            <Icon name="History" size={18} color={theme.textPrimary} />
            <Typography variant="heading3" color={theme.textPrimary}>
              History
            </Typography>
            <Typography variant="caption" color={theme.textMuted} style={{ marginLeft: "auto" }}>
              {sessions} session{sessions !== 1 ? "s" : ""}
            </Typography>
          </View>

          {sorted.slice().reverse().map((p, idx) => {
            const isPR = p.maxWeight === maxWeight;
            return (
              <Card
                key={idx}
                shadow="sm"
                style={{
                  marginBottom: space.sm,
                  padding: space.md,
                  borderColor: isPR ? theme.warning : theme.border,
                  borderWidth: isPR ? 1.5 : 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isPR ? "#FEF3C7" : theme.surfaceTertiary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon
                      name={isPR ? "Trophy" : "Calendar"}
                      size={16}
                      color={isPR ? theme.warning : theme.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" color={theme.textPrimary} weight="600">
                      {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </Typography>
                    <Typography variant="caption" color={theme.textMuted}>
                      {p.sets} sets · {p.totalReps} reps
                    </Typography>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Typography variant="body" color={isPR ? theme.warning : theme.textPrimary} weight="700">
                      {p.maxWeight}kg
                    </Typography>
                    <Typography variant="caption" color={theme.textMuted}>
                      {p.totalVolume.toLocaleString()}kg vol
                    </Typography>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
