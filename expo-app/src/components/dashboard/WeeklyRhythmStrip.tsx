import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Check } from "lucide-react-native";

export interface DayStatus {
  dayLabel: string; // 'M', 'T', 'W', 'T', 'F', 'S', 'S'
  isCompleted: boolean;
  isToday: boolean;
  isRest: boolean;
  isUpcoming: boolean;
  dateStr?: string;
}

export interface WeeklyRhythmStripProps {
  days?: DayStatus[];
  completedCount?: number;
  targetCount?: number;
}

const DEFAULT_DAYS: DayStatus[] = [
  { dayLabel: "M", isCompleted: true, isToday: false, isRest: false, isUpcoming: false },
  { dayLabel: "T", isCompleted: true, isToday: false, isRest: false, isUpcoming: false },
  { dayLabel: "W", isCompleted: false, isToday: true, isRest: false, isUpcoming: false },
  { dayLabel: "T", isCompleted: false, isToday: false, isRest: false, isUpcoming: true },
  { dayLabel: "F", isCompleted: false, isToday: false, isRest: false, isUpcoming: true },
  { dayLabel: "S", isCompleted: false, isToday: false, isRest: true, isUpcoming: true },
  { dayLabel: "S", isCompleted: false, isToday: false, isRest: true, isUpcoming: true },
];

export default function WeeklyRhythmStrip({
  days = DEFAULT_DAYS,
  completedCount = 4,
  targetCount = 5,
}: WeeklyRhythmStripProps) {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Weekly Rhythm</Text>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {completedCount} of {targetCount} Done
          </Text>
        </View>
      </View>

      {/* 7-Day Rhythm Row */}
      <View style={styles.rhythmRow}>
        {days.map((item, index) => {
          return (
            <View key={index} style={styles.dayColumn}>
              <Text
                style={[
                  styles.dayLabel,
                  item.isToday && styles.dayLabelToday,
                  (item.isRest && item.isUpcoming) && styles.dayLabelRest,
                ]}
              >
                {item.dayLabel}
              </Text>

              {/* Day Indicator Pill */}
              {item.isCompleted ? (
                <View style={styles.completedCircle}>
                  <Check size={16} color="#ffffff" strokeWidth={2.8} />
                </View>
              ) : item.isToday ? (
                <View style={styles.todayCircle}>
                  <View style={styles.todayInnerDot} />
                </View>
              ) : item.isRest ? (
                <View style={styles.restCircle}>
                  <View style={styles.restInnerDot} />
                </View>
              ) : (
                <View style={styles.upcomingCircle}>
                  <View style={styles.upcomingInnerDot} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1917",
    letterSpacing: -0.2,
  },
  counterBadge: {
    backgroundColor: "#fbeee8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  counterText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 11,
    fontWeight: "600",
    color: "#c24914",
    letterSpacing: 0.2,
  },
  rhythmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  dayColumn: {
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    fontWeight: "600",
    color: "#7a766c",
  },
  dayLabelToday: {
    color: "#c24914",
    fontFamily: "Outfit_700Bold",
  },
  dayLabelRest: {
    color: "#a8a196",
  },
  completedCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  todayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#c24914",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#c24914",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  todayInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
  upcomingCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    alignItems: "center",
    justifyContent: "center",
  },
  upcomingInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7a766c",
  },
  restCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#e5e2dc",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },
  restInnerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#dcdad4",
  },
});
