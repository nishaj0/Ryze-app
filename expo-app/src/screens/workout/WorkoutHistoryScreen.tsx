import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Dumbbell, Moon, Clock, Flame, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react-native";
import { getCalendarSessions } from "../../api/sessions";
import { CalendarSession } from "../../types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function WorkoutHistoryScreen() {
  const insets = useSafeAreaInsets();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loading, setLoading] = useState(false);

  const sessionMap = useMemo(() => {
    const map = new Map<string, CalendarSession>();
    sessions.forEach((s) => {
      const key = new Date(s.date).toISOString().split("T")[0];
      map.set(key, s);
    });
    return map;
  }, [sessions]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const start = formatDate(currentYear, currentMonth, 1);
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const end = formatDate(currentYear, currentMonth, daysInMonth);
      const res = await getCalendarSessions(start, end);
      setSessions(res.sessions || []);
    } catch {
      console.log("Failed to load workout history");
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const monthDays = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  // Selected date session
  const selectedDateStr = formatDate(currentYear, currentMonth, selectedDay);
  const selectedSession = sessionMap.get(selectedDateStr);

  // Completed workouts and rest days count in current month
  const workoutsCompletedCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const restDaysLoggedCount = sessions.filter((s) => s.status === "SKIPPED").length;

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTag}>TRAINING LOG</Text>
          <Text style={styles.headerTitle}>Workout History</Text>
        </View>

        <View style={styles.monthSwitcher}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn} activeOpacity={0.7}>
            <ChevronLeft size={18} color="#1a1917" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn} activeOpacity={0.7}>
            <ChevronRight size={18} color="#1a1917" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Dual KPI Summary */}
        <View style={styles.kpiSummaryRow}>
          <View style={styles.kpiBox}>
            <View style={styles.kpiIconWrapperGreen}>
              <CheckCircle2 size={16} color="#2d6a4f" />
            </View>
            <View>
              <Text style={styles.kpiBoxCount}>{workoutsCompletedCount}</Text>
              <Text style={styles.kpiBoxLabel}>Workouts Completed</Text>
            </View>
          </View>

          <View style={styles.kpiBox}>
            <View style={styles.kpiIconWrapperTerracotta}>
              <Moon size={16} color="#c24914" />
            </View>
            <View>
              <Text style={styles.kpiBoxCount}>{restDaysLoggedCount}</Text>
              <Text style={styles.kpiBoxLabel}>Rest Days Logged</Text>
            </View>
          </View>
        </View>

        {/* 3. Monthly Calendar Grid */}
        <View style={styles.calendarCard}>
          {/* Day of Week Headers */}
          <View style={styles.weekHeadersRow}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.weekDayHeader}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Matrix */}
          <View style={styles.daysGrid}>
            {monthDays.map((dayNum, idx) => {
              if (dayNum === null) {
                return <View key={idx} style={styles.emptyDayCell} />;
              }

              const dateStr = formatDate(currentYear, currentMonth, dayNum);
              const sess = sessionMap.get(dateStr);
              const isSelected = selectedDay === dayNum;
              const isToday =
                today.getFullYear() === currentYear &&
                today.getMonth() === currentMonth &&
                today.getDate() === dayNum;

              const isCompleted = sess?.status === "COMPLETED";
              const isRest = sess?.status === "SKIPPED";

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedDay(dayNum)}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumberText,
                      isSelected && styles.dayNumberTextSelected,
                      isToday && styles.dayNumberTextToday,
                    ]}
                  >
                    {dayNum}
                  </Text>

                  {/* Dot Indicators */}
                  <View style={styles.dotsRow}>
                    {isCompleted && <View style={styles.dotGreen} />}
                    {isRest && <View style={styles.dotTerracotta} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Selected Date Detail Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <CalendarIcon size={16} color="#c24914" />
              <Text style={styles.detailCardTitle}>
                {MONTHS[currentMonth]} {selectedDay}, {currentYear}
              </Text>
            </View>
            <View style={styles.dateTypeBadge}>
              <Text style={styles.dateTypeBadgeText}>
                {selectedSession?.status === "COMPLETED"
                  ? "Completed"
                  : selectedSession?.status === "SKIPPED"
                  ? "Rest Day"
                  : "No Session"}
              </Text>
            </View>
          </View>

          {selectedSession?.status === "COMPLETED" ? (
            <View style={styles.sessionDetailBody}>
              <Text style={styles.sessionRoutineName}>
                {selectedSession.splitDayName || "Workout Routine"}
              </Text>

              <View style={styles.metricsTriple}>
                <View style={styles.metricItem}>
                  <Clock size={14} color="#7a766c" />
                  <Text style={styles.metricText}>
                    {selectedSession.durationMinutes || 45} min
                  </Text>
                </View>

                <View style={styles.metricItem}>
                  <Dumbbell size={14} color="#7a766c" />
                  <Text style={styles.metricText}>
                    {selectedSession.totalVolume
                      ? `${selectedSession.totalVolume.toLocaleString()} kg`
                      : "Volume Logged"}
                  </Text>
                </View>
              </View>

              {selectedSession.notes && (
                <Text style={styles.notesText}>Note: {selectedSession.notes}</Text>
              )}
            </View>
          ) : selectedSession?.status === "SKIPPED" ? (
            <View style={styles.restDetailBody}>
              <View style={styles.restIconCircle}>
                <Moon size={20} color="#c24914" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.restTitle}>Scheduled Recovery Day</Text>
                <Text style={styles.restReasonText}>
                  Reason:{" "}
                  {selectedSession.restReason
                    ? selectedSession.restReason.charAt(0).toUpperCase() +
                      selectedSession.restReason.slice(1)
                    : "Standard Recovery"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptySessionBody}>
              <Text style={styles.emptySessionText}>
                No workout or rest log recorded for this date.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f3",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dcdad4",
    backgroundColor: "#ffffff",
  },
  headerTag: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    letterSpacing: 0.8,
    color: "#7a766c",
    textTransform: "uppercase",
  },
  headerTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
    color: "#1a1917",
    marginTop: 2,
  },
  monthSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f3ed",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#dcdad4",
    gap: 6,
  },
  arrowBtn: {
    padding: 4,
  },
  monthText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    color: "#1a1917",
  },
  scrollContent: {
    padding: 16,
  },
  kpiSummaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  kpiIconWrapperGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiIconWrapperTerracotta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fbeee8",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiBoxCount: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    color: "#1a1917",
  },
  kpiBoxLabel: {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    color: "#7a766c",
  },
  calendarCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  weekHeadersRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
    paddingBottom: 8,
  },
  weekDayHeader: {
    width: 36,
    textAlign: "center",
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    color: "#7a766c",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  emptyDayCell: {
    width: 42,
    height: 44,
    marginVertical: 3,
  },
  dayCell: {
    width: 42,
    height: 44,
    marginVertical: 3,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: "#c24914",
    backgroundColor: "#fbeee8",
  },
  dayCellToday: {
    backgroundColor: "#f6f3ed",
  },
  dayNumberText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
    color: "#1a1917",
  },
  dayNumberTextSelected: {
    color: "#c24914",
    fontFamily: "Outfit_700Bold",
  },
  dayNumberTextToday: {
    color: "#c24914",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 2,
    height: 6,
    alignItems: "center",
  },
  dotGreen: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#2d6a4f",
  },
  dotTerracotta: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#c24914",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 16,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f6f3ed",
    paddingBottom: 8,
  },
  detailCardTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    color: "#1a1917",
  },
  dateTypeBadge: {
    backgroundColor: "#f6f3ed",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateTypeBadgeText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 10,
    color: "#7a766c",
  },
  sessionDetailBody: {
    gap: 8,
  },
  sessionRoutineName: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    color: "#1a1917",
  },
  metricsTriple: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 4,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    color: "#49453a",
  },
  notesText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#7a766c",
    fontStyle: "italic",
    marginTop: 4,
  },
  restDetailBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  restIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fbeee8",
    alignItems: "center",
    justifyContent: "center",
  },
  restTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    color: "#1a1917",
  },
  restReasonText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#7a766c",
    marginTop: 2,
  },
  emptySessionBody: {
    paddingVertical: 12,
    alignItems: "center",
  },
  emptySessionText: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#7a766c",
  },
});
