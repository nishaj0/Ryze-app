import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProgressStackParamList } from "../../navigation/types";
import {
  getOverview,
  getHeatmap,
  getMuscleVolume,
  getVolumeHistory,
} from "../../api/progress";
import { getRecords } from "../../api/records";
import {
  ProgressOverview,
  HeatmapEntry,
  MuscleVolume,
  PersonalRecord,
} from "../../types";
import { Typography, Card, Icon, Button, DashboardScreenSkeleton } from "../../components";
import { LineChart, BarChart, Heatmap, RingChart } from "../../components/charts";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProgressStackParamList, "Dashboard">;

const { width: screenW } = Dimensions.get("window");

export default function DashboardScreen({ navigation }: Props) {
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [muscleVolumes, setMuscleVolumes] = useState<MuscleVolume[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<{ week: string; volume: number; workouts: number }[]>([]);
  const [dailyActivity, setDailyActivity] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overRes, heatRes, muscRes, recRes, volRes] = await Promise.all([
        getOverview(),
        getHeatmap(),
        getMuscleVolume(),
        getRecords(),
        getVolumeHistory(8),
      ]);
      setOverview(overRes.overview);
      setHeatmap(heatRes.heatmap);
      setMuscleVolumes(muscRes.muscleVolumes);
      setRecords(recRes.records);
      setVolumeHistory(volRes.weekly);
      setDailyActivity(volRes.daily);
    } catch (err) {
      console.error("[Dashboard] load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
        <DashboardScreenSkeleton />
      </SafeAreaView>
    );
  }

  // Compute deltas
  const currentWeekVol = volumeHistory[volumeHistory.length - 1]?.volume || 0;
  const prevWeekVol = volumeHistory[volumeHistory.length - 2]?.volume || 0;
  const volDelta = prevWeekVol > 0 ? Math.round(((currentWeekVol - prevWeekVol) / prevWeekVol) * 100) : 0;

  // Total volume
  const totalVolume = volumeHistory.reduce((sum, w) => sum + w.volume, 0);

  // Top muscle group
  const topMuscle = muscleVolumes.length > 0
    ? muscleVolumes.reduce((max, m) => (m.volume > max.volume ? m : max), muscleVolumes[0])
    : null;

  // Heatmap data
  const heatmapData = heatmap.map((h) => ({ date: h.date, count: h.count }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
          <Typography variant="heading1" color={lightTheme.textPrimary}>
            Progress
          </Typography>
          <Typography variant="body" color={lightTheme.textSecondary} style={{ marginTop: space.xs }}>
            Track your gains over time
          </Typography>
        </View>

        {/* Key Stats Row */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <StatCard
              icon="Flame"
              color={lightTheme.primary}
              bg={lightTheme.primaryLight}
              value={overview?.currentStreak || 0}
              label="Day Streak"
            />
            <StatCard
              icon="Trophy"
              color={lightTheme.warning}
              bg="#FEF3C7"
              value={overview?.totalPRs || 0}
              label="PRs Set"
            />
            <StatCard
              icon="Dumbbell"
              color={lightTheme.success}
              bg={lightTheme.successBg}
              value={overview?.totalWorkouts || 0}
              label="Workouts"
            />
          </View>
        </View>

        {/* Volume Trend Chart */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ padding: space.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.xs }}>
                  <Icon name="TrendingUp" size={16} color={lightTheme.textMuted} />
                  <Typography variant="caption" color={lightTheme.textMuted} weight="600">
                    WEEKLY VOLUME
                  </Typography>
                </View>
                <Typography variant="heading1" color={lightTheme.textPrimary}>
                  {currentWeekVol.toLocaleString()} <Typography variant="body" color={lightTheme.textMuted}>kg</Typography>
                </Typography>
                {volDelta !== 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                    <Icon
                      name={volDelta > 0 ? "ArrowUp" : "ArrowDown"}
                      size={14}
                      color={volDelta > 0 ? lightTheme.success.DEFAULT : lightTheme.danger.DEFAULT}
                    />
                    <Typography
                      variant="bodySmall"
                      color={volDelta > 0 ? lightTheme.success.DEFAULT : lightTheme.danger.DEFAULT}
                      weight="600"
                    >
                      {Math.abs(volDelta)}% vs last week
                    </Typography>
                  </View>
                )}
              </View>
            </View>

            {volumeHistory.length > 0 && (
              <LineChart
                data={volumeHistory.map((w) => ({ label: w.week, value: w.volume }))}
                width={screenW - 80}
                height={180}
                color={lightTheme.primary}
                yAxisFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
              />
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: lightTheme.border }}>
              <View>
                <Typography variant="caption" color={lightTheme.textMuted}>8-WEEK TOTAL</Typography>
                <Typography variant="heading3" color={lightTheme.textPrimary}>
                  {(totalVolume / 1000).toFixed(1)}k kg
                </Typography>
              </View>
              <View>
                <Typography variant="caption" color={lightTheme.textMuted}>THIS WEEK</Typography>
                <Typography variant="heading3" color={lightTheme.textPrimary}>
                  {overview?.thisWeekWorkouts || 0} workouts
                </Typography>
              </View>
            </View>
          </Card>
        </View>

        {/* Weekly Activity Bar Chart */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ padding: space.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
              <Icon name="Calendar" size={16} color={lightTheme.textMuted} />
              <Typography variant="caption" color={lightTheme.textMuted} weight="600">
                LAST 7 DAYS
              </Typography>
            </View>
            <Typography variant="heading3" color={lightTheme.textPrimary} style={{ marginBottom: space.md }}>
              Weekly Activity
            </Typography>
            {dailyActivity.length > 0 && (
              <BarChart
                data={dailyActivity.map((d) => ({ label: d.day, value: d.count }))}
                width={screenW - 80}
                height={160}
                color={lightTheme.primary}
                yAxisFormatter={(v) => `${v}`}
                showValues={true}
              />
            )}
          </Card>
        </View>

        {/* Heatmap */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ padding: space.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
              <Icon name="Activity" size={16} color={lightTheme.textMuted} />
              <Typography variant="caption" color={lightTheme.textMuted} weight="600">
                WORKOUT HEATMAP (90 DAYS)
              </Typography>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Heatmap data={heatmapData} weeks={13} />
            </ScrollView>
          </Card>
        </View>

        {/* Muscle Volume + Top Muscle Ring */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          {muscleVolumes.length > 0 && (
            <Card shadow="sm" style={{ padding: space.lg }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                <Icon name="BarChart3" size={16} color={lightTheme.textMuted} />
                <Typography variant="caption" color={lightTheme.textMuted} weight="600">
                  MUSCLE GROUP VOLUME (THIS WEEK)
                </Typography>
              </View>

              {topMuscle && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: space.lg, gap: space.lg }}>
                  <RingChart
                    value={topMuscle.volume}
                    max={Math.max(...muscleVolumes.map((m) => m.volume), 1)}
                    size={100}
                    color={lightTheme.primary}
                    label="Top"
                    unit="kg"
                  />
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color={lightTheme.textMuted}>TOP MUSCLE</Typography>
                    <Typography variant="heading2" color={lightTheme.textPrimary} style={{ textTransform: "capitalize" }}>
                      {topMuscle.muscleGroup}
                    </Typography>
                    <Typography variant="bodySmall" color={lightTheme.textSecondary} style={{ marginTop: space.xs }}>
                      {topMuscle.volume.toLocaleString()} kg lifted
                    </Typography>
                  </View>
                </View>
              )}

              <View style={{ gap: space.md }}>
                {muscleVolumes.map((mv) => {
                  const maxV = Math.max(...muscleVolumes.map((m) => m.volume), 1);
                  const pct = (mv.volume / maxV) * 100;
                  return (
                    <View key={mv.muscleGroup}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: space.xs }}>
                        <Typography variant="bodySmall" color={lightTheme.textPrimary} weight="600" style={{ textTransform: "capitalize" }}>
                          {mv.muscleGroup}
                        </Typography>
                        <Typography variant="bodySmall" color={lightTheme.textMuted}>
                          {mv.volume.toLocaleString()} kg
                        </Typography>
                      </View>
                      <View style={{ height: 8, backgroundColor: lightTheme.surfaceTertiary, borderRadius: 4, overflow: "hidden" }}>
                        <View
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            backgroundColor: lightTheme.primary,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Card>
          )}
        </View>

        {/* Recent PRs */}
        {records.length > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                <Icon name="Award" size={18} color={lightTheme.textPrimary} />
                <Typography variant="heading3" color={lightTheme.textPrimary}>
                  Recent PRs
                </Typography>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("Records")}>
                <Typography variant="bodySmall" color={lightTheme.primary} weight="600">
                  See all
                </Typography>
              </TouchableOpacity>
            </View>

            {records.slice(0, 5).map((pr) => (
              <Card
                key={pr.id}
                shadow="sm"
                style={{ marginBottom: space.sm, padding: space.md }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.md,
                      backgroundColor: "#FEF3C7",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="Trophy" size={20} color={lightTheme.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                      {pr.exercise?.name || "Exercise"}
                    </Typography>
                    <Typography variant="caption" color={lightTheme.textMuted} style={{ textTransform: "capitalize" }}>
                      {pr.exercise?.muscleGroup || ""}
                    </Typography>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Typography variant="body" color={lightTheme.primary} weight="700">
                      {pr.weightKg}kg × {pr.reps}
                    </Typography>
                    <Typography variant="caption" color={lightTheme.textMuted}>
                      ~{pr.estimated1rm}kg 1RM
                    </Typography>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Empty state */}
        {(!overview || overview.totalWorkouts === 0) && (
          <View style={{ paddingHorizontal: space.lg, marginTop: space.lg }}>
            <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: lightTheme.primaryLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: space.md,
                }}
              >
                <Icon name="BarChart3" size={36} color={lightTheme.primary} />
              </View>
              <Typography variant="heading3" color={lightTheme.textPrimary} align="center">
                No data yet
              </Typography>
              <Typography variant="body" color={lightTheme.textSecondary} align="center" style={{ marginTop: space.sm }}>
                Complete your first workout to see your progress charts and stats.
              </Typography>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatCardProps {
  icon: any;
  color: string;
  bg: string;
  value: number;
  label: string;
}

function StatCard({ icon, color, bg, value, label }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: lightTheme.surface,
        borderRadius: radius.lg,
        padding: space.md,
        borderWidth: 1,
        borderColor: lightTheme.border,
        shadowColor: lightTheme.shadowSm,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: space.sm,
        }}
      >
        <Icon name={icon} size={18} color={color} />
      </View>
      <Typography variant="heading1" color={lightTheme.textPrimary}>
        {value}
      </Typography>
      <Typography variant="caption" color={lightTheme.textMuted}>
        {label}
      </Typography>
    </View>
  );
}
