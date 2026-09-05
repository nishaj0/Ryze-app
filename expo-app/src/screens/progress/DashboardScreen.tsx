import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import Body from "react-native-body-highlighter";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProgressStackParamList } from "../../navigation/types";
import { useFocusEffect } from "@react-navigation/native";
import {
  getOverview,
  getHeatmap,
  getMuscleVolume,
  getWeeklyMuscleVolume,
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
import ProgressiveOverloadCard from "./ProgressiveOverloadCard";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";
import { useAuthStore } from "../../store/authStore";
import { getWeeklyVolumeHighlightData, isSlugVisibleOnSide, MuscleHighlightData } from "../../constants/muscleHighlighterMapping";

type Props = NativeStackScreenProps<ProgressStackParamList, "Dashboard">;

const { width: screenW } = Dimensions.get("window");

export default function DashboardScreen({ navigation }: Props) {
  const theme = useTheme();
  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [muscleVolumes, setMuscleVolumes] = useState<MuscleVolume[]>([]);
  const [weeklyMuscleVolumes, setWeeklyMuscleVolumes] = useState<MuscleVolume[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [volumeHistory, setVolumeHistory] = useState<{ week: string; volume: number; workouts: number }[]>([]);
  const [dailyActivity, setDailyActivity] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [bodySide, setBodySide] = useState<"front" | "back">("front");
  const { user } = useAuthStore();

  const loadData = useCallback(async () => {
    try {
      const [overRes, heatRes, muscRes, weeklyMuscRes, recRes, volRes] = await Promise.all([
        getOverview(),
        getHeatmap(),
        getMuscleVolume(),
        getWeeklyMuscleVolume(),
        getRecords(),
        getVolumeHistory(8),
      ]);
      setOverview(overRes.overview);
      setHeatmap(heatRes.heatmap);
      setMuscleVolumes(muscRes.muscleVolumes);
      setWeeklyMuscleVolumes(weeklyMuscRes.muscleVolumes);
      setRecords(recRes.records);
      setVolumeHistory(volRes.weekly);
      setDailyActivity(volRes.daily);
    } catch (err) {
      console.error("[Dashboard] load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );


  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
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
  const weeklyHighlightData = useMemo(() => getWeeklyVolumeHighlightData(weeklyMuscleVolumes), [weeklyMuscleVolumes]);
  const visibleWeeklyHighlights = weeklyHighlightData.filter((highlight) => isSlugVisibleOnSide(highlight.slug, bodySide));
  const bodyGender = user?.gender?.toUpperCase() === "FEMALE" ? "female" : "male";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg }}>
          <Typography variant="heading1" color={theme.textPrimary}>
            Progress
          </Typography>
          <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.xs }}>
            Track your gains over time
          </Typography>
        </View>

        {/* Key Stats Row */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <StatCard
              icon="Flame"
              color={theme.primary}
              bg={theme.primaryLight}
              value={overview?.currentStreak || 0}
              label="Day Streak"
            />
            <StatCard
              icon="Trophy"
              color={theme.warning}
              bg={theme.warningBg}
              value={overview?.totalPRs || 0}
              label="PRs Set"
            />
            <StatCard
              icon="Dumbbell"
              color={theme.success}
              bg={theme.successBg}
              value={overview?.totalWorkouts || 0}
              label="Workouts"
            />
          </View>
        </View>

        {overview && overview.totalWorkouts > 0 && (
          <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
            <ProgressiveOverloadCard />
          </View>
        )}

        {/* Volume Trend Chart */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ padding: space.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.xs }}>
                  <Icon name="TrendingUp" size={16} color={theme.textMuted} />
                  <Typography variant="caption" color={theme.textMuted} weight="600">
                    WEEKLY VOLUME
                  </Typography>
                </View>
                <Typography variant="heading1" color={theme.textPrimary}>
                  {currentWeekVol.toLocaleString()} <Typography variant="body" color={theme.textMuted}>kg</Typography>
                </Typography>
                {volDelta !== 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                    <Icon
                      name={volDelta > 0 ? "ArrowUp" : "ArrowDown"}
                      size={14}
                      color={volDelta > 0 ? theme.success : theme.danger}
                    />
                    <Typography
                      variant="bodySmall"
                      color={volDelta > 0 ? theme.success : theme.danger}
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
                color={theme.primary}
                yAxisFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`}
              />
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: theme.border }}>
              <View>
                <Typography variant="caption" color={theme.textMuted}>8-WEEK TOTAL</Typography>
                <Typography variant="heading3" color={theme.textPrimary}>
                  {(totalVolume / 1000).toFixed(1)}k kg
                </Typography>
              </View>
              <View>
                <Typography variant="caption" color={theme.textMuted}>THIS WEEK</Typography>
                <Typography variant="heading3" color={theme.textPrimary}>
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
              <Icon name="Calendar" size={16} color={theme.textMuted} />
              <Typography variant="caption" color={theme.textMuted} weight="600">
                LAST 7 DAYS
              </Typography>
            </View>
            <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: space.md }}>
              Weekly Activity
            </Typography>
            {dailyActivity.length > 0 && (
              <BarChart
                data={dailyActivity.map((d) => ({ label: d.day, value: d.count }))}
                width={screenW - 80}
                height={160}
                color={theme.primary}
                yAxisFormatter={(v) => `${v}`}
                showValues={true}
              />
            )}
          </Card>
        </View>

        {/* Weekly Muscle Volume */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <WeeklyMuscleVolumeCard
            hasData={weeklyMuscleVolumes.length > 0}
            side={bodySide}
            onSideChange={setBodySide}
            highlights={visibleWeeklyHighlights}
            gender={bodyGender}
          />
        </View>

        {/* Heatmap */}
        <View style={{ paddingHorizontal: space.lg, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ padding: space.lg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
              <Icon name="Activity" size={16} color={theme.textMuted} />
              <Typography variant="caption" color={theme.textMuted} weight="600">
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
                <Icon name="BarChart3" size={16} color={theme.textMuted} />
                <Typography variant="caption" color={theme.textMuted} weight="600">
                  MUSCLE GROUP VOLUME (THIS WEEK)
                </Typography>
              </View>

              {topMuscle && (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: space.lg, gap: space.lg }}>
                  <RingChart
                    value={topMuscle.volume}
                    max={Math.max(...muscleVolumes.map((m) => m.volume), 1)}
                    size={100}
                    color={theme.primary}
                    label="Top"
                    unit="kg"
                  />
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color={theme.textMuted}>TOP MUSCLE</Typography>
                    <Typography variant="heading2" color={theme.textPrimary} style={{ textTransform: "capitalize" }}>
                      {topMuscle.muscleGroup}
                    </Typography>
                    <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: space.xs }}>
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
                        <Typography variant="bodySmall" color={theme.textPrimary} weight="600" style={{ textTransform: "capitalize" }}>
                          {mv.muscleGroup}
                        </Typography>
                        <Typography variant="bodySmall" color={theme.textMuted}>
                          {mv.volume.toLocaleString()} kg
                        </Typography>
                      </View>
                      <View style={{ height: 8, backgroundColor: theme.surfaceTertiary, borderRadius: 4, overflow: "hidden" }}>
                        <View
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            backgroundColor: theme.primary,
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
                <Icon name="Award" size={18} color={theme.textPrimary} />
                <Typography variant="heading3" color={theme.textPrimary}>
                  Recent PRs
                </Typography>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("Records")}>
                <Typography variant="bodySmall" color={theme.primary} weight="600">
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
                      backgroundColor: theme.warningBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="Trophy" size={20} color={theme.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" color={theme.textPrimary} weight="600">
                      {pr.exercise?.name || "Exercise"}
                    </Typography>
                    <Typography variant="caption" color={theme.textMuted} style={{ textTransform: "capitalize" }}>
                      {pr.exercise?.muscles?.find(m => m.isPrimary)?.muscle.name || ""}
                    </Typography>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Typography variant="body" color={theme.primary} weight="700">
                      {pr.weightKg}kg × {pr.reps}
                    </Typography>
                    <Typography variant="caption" color={theme.textMuted}>
                      ~{pr.estimated1rm}kg 1RM
                    </Typography>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ paddingHorizontal: space.lg, marginTop: space.lg }}>
          <TouchableOpacity onPress={() => navigation.navigate("CheckInHistory")} activeOpacity={0.8}>
            <Card shadow="sm" style={{ padding: space.md, flexDirection: "row", alignItems: "center", gap: space.md }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: theme.primaryLight, alignItems: "center", justifyContent: "center" }}>
                <Icon name="MessageSquare" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Typography variant="body" color={theme.textPrimary} weight="700">Training Feel</Typography>
                <Typography variant="caption" color={theme.textMuted}>Review your check-in trend and reported issues</Typography>
              </View>
              <Icon name="ChevronRight" size={18} color={theme.textMuted} />
            </Card>
          </TouchableOpacity>
        </View>

        {/* Empty state */}
        {(!overview || overview.totalWorkouts === 0) && (
          <View style={{ paddingHorizontal: space.lg, marginTop: space.lg }}>
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
                <Icon name="BarChart3" size={36} color={theme.primary} />
              </View>
              <Typography variant="heading3" color={theme.textPrimary} align="center">
                No data yet
              </Typography>
              <Typography variant="body" color={theme.textSecondary} align="center" style={{ marginTop: space.sm }}>
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
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.surface,
        borderRadius: radius.lg,
        padding: space.md,
        borderWidth: 1,
        borderColor: theme.border,
        shadowColor: theme.shadowSm,
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
      <Typography variant="heading1" color={theme.textPrimary}>
        {value}
      </Typography>
      <Typography variant="caption" color={theme.textMuted}>
        {label}
      </Typography>
    </View>
  );
}

function WeeklyMuscleVolumeCard({
  hasData,
  side,
  onSideChange,
  highlights,
  gender,
}: {
  hasData: boolean;
  side: "front" | "back";
  onSideChange: (side: "front" | "back") => void;
  highlights: MuscleHighlightData[];
  gender: "male" | "female";
}) {
  const theme = useTheme();

  if (!hasData) {
    return (
      <Card padding="lg" shadow="sm" style={{ alignItems: "center" }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: space.md }}>
          <Icon name="Dumbbell" size={30} color={theme.primary} />
        </View>
        <Typography variant="heading3" color={theme.textPrimary} align="center">No data yet</Typography>
        <Typography variant="bodySmall" color={theme.textSecondary} align="center" style={{ marginTop: space.xs }}>
          Complete a workout to see your weekly muscle volume.
        </Typography>
      </Card>
    );
  }

  return (
    <Card shadow="sm" style={{ padding: space.lg }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
        <Icon name="Dumbbell" size={16} color={theme.textMuted} />
        <Typography variant="caption" color={theme.textMuted} weight="600">WEEKLY MUSCLE VOLUME</Typography>
      </View>
      <BodySideToggle side={side} onChange={onSideChange} />
      <View style={{ alignItems: "center", marginVertical: space.md }}>
        <Body
          data={highlights}
          side={side}
          gender={gender}
          scale={1.05}
          colors={[theme.primaryLight, theme.primary]}
          border={theme.border}
          defaultFill={theme.surfaceTertiary}
        />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.md }}>
        <Legend color={theme.primaryLight} label="Less trained" />
        <Legend color={theme.primary} label="More trained" />
      </View>
    </Card>
  );
}

function BodySideToggle({ side, onChange }: { side: "front" | "back"; onChange: (side: "front" | "back") => void }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: theme.surfaceTertiary, borderRadius: radius.md, padding: 3 }}>
      {(["front", "back"] as const).map((option) => {
        const selected = side === option;
        return (
          <TouchableOpacity
            key={option}
            accessibilityRole="button"
            accessibilityLabel={`${option} body view`}
            accessibilityState={{ selected }}
            onPress={() => onChange(option)}
            style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: selected ? theme.surface : "transparent" }}
          >
            <Typography variant="bodySmall" color={selected ? theme.textPrimary : theme.textMuted} weight="600">
              {option === "front" ? "Front" : "Back"}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Typography variant="caption" color={theme.textMuted}>{label}</Typography>
    </View>
  );
}
