import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Play, Moon, Clock, Dumbbell, Target, ChevronRight, CheckCircle2 } from "lucide-react-native";
import { SplitDay } from "../../types";

export interface WorkoutHeroCardProps {
  splitDay: SplitDay | null;
  splitName?: string;
  dayIndex?: number;
  totalDays?: number;
  todaySession?: any;
  onStartWorkout: () => void;
  onRestDay: () => void;
  onPreviewRoutine?: () => void;
  onViewSummary?: (sessionId: string) => void;
}

export default function WorkoutHeroCard({
  splitDay,
  splitName = "",
  dayIndex = 0,
  totalDays = 3,
  todaySession,
  onStartWorkout,
  onRestDay,
  onPreviewRoutine,
  onViewSummary,
}: WorkoutHeroCardProps) {
  if (!splitDay) {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.emptyState}>
          <Moon size={28} color="#7a766c" />
          <Text style={styles.emptyTitle}>Rest & Recovery Day</Text>
          <Text style={styles.emptySubtitle}>No workout scheduled for today. Take time to recover!</Text>
        </View>
      </View>
    );
  }

  // Parse muscle groups
  let muscleList: string[] = [];
  try {
    if (typeof splitDay.muscleGroups === "string") {
      muscleList = JSON.parse(splitDay.muscleGroups);
    } else if (Array.isArray(splitDay.muscleGroups)) {
      muscleList = splitDay.muscleGroups;
    }
  } catch {
    muscleList = splitDay.muscleGroups ? [String(splitDay.muscleGroups)] : [];
  }

  const exerciseCount = splitDay.exercises?.length || 6;
  let totalSets = 0;
  if (splitDay.exercises && splitDay.exercises.length > 0) {
    totalSets = splitDay.exercises.reduce((acc, ex) => acc + (ex.targetSets || 3), 0);
  } else {
    totalSets = exerciseCount * 3;
  }

  const durationMin = Math.max(35, Math.min(75, Math.round(totalSets * 2.8)));
  const muscleText = muscleList.length > 0 ? muscleList.slice(0, 3).join(", ") : "Full Body";
  const targetLabel = muscleList.length > 0 ? muscleList.slice(0, 2).join(" & ") : "Full Body";

  const isCompletedToday = Boolean(todaySession);

  return (
    <View style={styles.cardContainer}>
      {/* Background Accent Glow */}
      <View style={styles.accentGlow} />

      <View style={styles.cardContent}>
        {/* Top Meta Row */}
        <View style={styles.topMetaRow}>
          <Text style={styles.routineTag}>
            TODAY'S WORKOUT {totalDays > 0 ? `• DAY ${dayIndex + 1} OF ${totalDays}` : ""}
          </Text>

          {onPreviewRoutine ? (
            <TouchableOpacity
              onPress={onPreviewRoutine}
              activeOpacity={0.7}
              style={styles.previewTrigger}
            >
              <Text style={styles.previewText}>Routine Preview</Text>
              <ChevronRight size={14} color="#7a766c" />
            </TouchableOpacity>
          ) : (
            <View style={styles.durationBadge}>
              <Clock size={13} color="#7a766c" style={{ marginRight: 4 }} />
              <Text style={styles.durationBadgeText}>{durationMin} min</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.workoutTitle} numberOfLines={1}>
          {splitDay.name}
        </Text>

        {/* Subtitle Details */}
        <Text style={styles.workoutDetails}>
          {exerciseCount} exercises • {totalSets} sets • {muscleText}
        </Text>

        {/* 3 Metric Summary Blocks */}
        <View style={styles.statsGrid}>
          <View style={styles.statBlock}>
            <View style={styles.statHeader}>
              <Clock size={14} color="#7a766c" />
              <Text style={styles.statLabel}>DURATION</Text>
            </View>
            <Text style={styles.statValue}>{durationMin} min</Text>
          </View>

          <View style={styles.statBlock}>
            <View style={styles.statHeader}>
              <Dumbbell size={14} color="#7a766c" />
              <Text style={styles.statLabel}>VOLUME</Text>
            </View>
            <Text style={styles.statValue}>{exerciseCount} lifts</Text>
          </View>

          <View style={styles.statBlock}>
            <View style={styles.statHeader}>
              <Target size={14} color="#7a766c" />
              <Text style={styles.statLabel}>TARGET</Text>
            </View>
            <Text style={styles.statValue} numberOfLines={1}>
              {targetLabel}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {isCompletedToday ? (
          <View style={styles.completedBanner}>
            <View style={styles.completedHeader}>
              <CheckCircle2 size={20} color="#2d6a4f" />
              <Text style={styles.completedTitle}>Workout Completed Today</Text>
            </View>
            {todaySession?.id && onViewSummary && (
              <TouchableOpacity
                onPress={() => onViewSummary(todaySession.id)}
                style={styles.summaryBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.summaryBtnText}>View Summary</Text>
                <ChevronRight size={14} color="#2d6a4f" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.actionRow}>
            {/* Primary Start Workout (75% width) */}
            <TouchableOpacity
              onPress={onStartWorkout}
              activeOpacity={0.88}
              style={styles.startBtn}
            >
              <Play size={18} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.startBtnText}>Start Workout</Text>
            </TouchableOpacity>

            {/* Secondary Rest Button (25% width) */}
            <TouchableOpacity
              onPress={onRestDay}
              activeOpacity={0.7}
              style={styles.restBtn}
            >
              <Moon size={16} color="#49453a" style={{ marginRight: 4 }} />
              <Text style={styles.restBtnText}>Rest</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 20,
    marginBottom: 24,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  accentGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 219, 207, 0.35)",
  },
  cardContent: {
    zIndex: 1,
  },
  topMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  routineTag: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#7a766c",
    textTransform: "uppercase",
    flex: 1,
  },
  previewTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  previewText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    color: "#7a766c",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationBadgeText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    color: "#7a766c",
  },
  workoutTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1917",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  workoutDetails: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#7a766c",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statBlock: {
    flex: 1,
    backgroundColor: "#f6f3ed",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e2dc",
    padding: 10,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#7a766c",
    textTransform: "uppercase",
  },
  statValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1917",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  startBtn: {
    flex: 3,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#c24914",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#c24914",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  startBtnText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  restBtn: {
    flex: 1.1,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  restBtnText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    fontWeight: "600",
    color: "#49453a",
  },
  completedBanner: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b1f2bf",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completedTitle: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    fontWeight: "600",
    color: "#2d6a4f",
  },
  summaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  summaryBtnText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 11,
    color: "#2d6a4f",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    color: "#1a1917",
  },
  emptySubtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#7a766c",
    textAlign: "center",
  },
});
