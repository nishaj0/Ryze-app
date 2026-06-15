import React, { useEffect, useState, useCallback } from "react";
import { View, TouchableOpacity, Modal, ScrollView, Dimensions, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCalendarSessions, updateSession } from "../../api/sessions";
import { CalendarSession } from "../../types";
import { Screen, Card, Typography, Button, Icon } from "../../components";
import { lightTheme, colors } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const REST_REASONS = ["Tired", "Sick", "Busy", "Sore", "Injured", "Other"];

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
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CalendarSession | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editReasonVisible, setEditReasonVisible] = useState(false);
  const [editReason, setEditReason] = useState("");

  const sessionMap = new Map<string, CalendarSession>();
  sessions.forEach((s) => {
    const key = new Date(s.date).toISOString().split("T")[0];
    sessionMap.set(key, s);
  });

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const start = formatDate(currentYear, currentMonth, 1);
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const end = formatDate(currentYear, currentMonth, daysInMonth);
      const res = await getCalendarSessions(start, end);
      setSessions(res.sessions);
    } catch {
      Alert.alert("Error", "Failed to load workout history");
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const key = formatDate(currentYear, currentMonth, day);
    const session = sessionMap.get(key);
    if (session) {
      setSelectedSession(session);
      setDetailVisible(true);
    }
  };

  const handleEditReason = async () => {
    if (!selectedSession) return;
    try {
      await updateSession(selectedSession.id, { restReason: editReason.toLowerCase() });
      setEditReasonVisible(false);
      setDetailVisible(false);
      loadSessions();
    } catch {
      Alert.alert("Error", "Failed to update rest reason");
    }
  };

  const openEditReason = () => {
    setEditReason(selectedSession?.restReason || "");
    setDetailVisible(false);
    setEditReasonVisible(true);
  };

  const days = getMonthDays(currentYear, currentMonth);
  const screenWidth = Dimensions.get("window").width;
  const cellSize = (screenWidth - space.lg * 2 - space.sm * 6) / 7;

  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const restCount = sessions.filter((s) => s.status === "SKIPPED").length;

  const parseMuscleGroups = (mg: string): string[] => {
    try { return JSON.parse(mg); } catch { return []; }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={lightTheme.textMuted} weight="600">
            WORKOUT HISTORY
          </Typography>
          <Typography variant="heading1" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
            Calendar
          </Typography>
        </View>

        <Card shadow="sm" style={{ padding: space.md, marginBottom: space.lg }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.md }}>
            <TouchableOpacity onPress={prevMonth} style={{ padding: space.sm }}>
              <Icon name="ChevronLeft" size={24} color={lightTheme.textPrimary} />
            </TouchableOpacity>
            <Typography variant="heading2" color={lightTheme.textPrimary}>
              {MONTHS[currentMonth]} {currentYear}
            </Typography>
            <TouchableOpacity onPress={nextMonth} style={{ padding: space.sm }}>
              <Icon name="ChevronRight" size={24} color={lightTheme.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", marginBottom: space.sm }}>
            {DAYS.map((d) => (
              <View key={d} style={{ width: cellSize, alignItems: "center" }}>
                <Typography variant="caption" color={lightTheme.textMuted} weight="600">
                  {d}
                </Typography>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {days.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={{ width: cellSize, height: cellSize }} />;
              }
              const key = formatDate(currentYear, currentMonth, day);
              const session = sessionMap.get(key);
              const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              const isCompleted = session?.status === "COMPLETED";
              const isRest = session?.status === "SKIPPED";

              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: cellSize - 4,
                      height: cellSize - 4,
                      borderRadius: (cellSize - 4) / 2,
                      backgroundColor: isToday ? lightTheme.primaryLight : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: isToday ? 2 : 0,
                      borderColor: lightTheme.primary,
                    }}
                  >
                    <Typography
                      variant="body"
                      color={isToday ? lightTheme.primary : lightTheme.textPrimary}
                      weight={isToday ? "700" : "400"}
                    >
                      {day}
                    </Typography>
                    {isCompleted && (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: lightTheme.success.DEFAULT,
                          position: "absolute",
                          bottom: 4,
                        }}
                      />
                    )}
                    {isRest && (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: colors.info.DEFAULT,
                          position: "absolute",
                          bottom: 4,
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.lg }}>
          <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.xs }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: lightTheme.success.DEFAULT }} />
              <Typography variant="caption" color={lightTheme.textMuted}>Workouts</Typography>
            </View>
            <Typography variant="heading2" color={lightTheme.success.DEFAULT}>{completedCount}</Typography>
          </Card>
          <Card shadow="sm" style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginBottom: space.xs }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.info.DEFAULT }} />
              <Typography variant="caption" color={lightTheme.textMuted}>Rest Days</Typography>
            </View>
            <Typography variant="heading2" color={colors.info.DEFAULT}>{restCount}</Typography>
          </Card>
        </View>

        {loading && (
          <View style={{ alignItems: "center", padding: space.lg }}>
            <Typography variant="body" color={lightTheme.textMuted}>Loading...</Typography>
          </View>
        )}
      </ScrollView>

      <Modal visible={detailVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <Card
            shadow="none"
            border={false}
            style={{
              borderTopLeftRadius: radius["2xl"],
              borderTopRightRadius: radius["2xl"],
              padding: space.lg,
            }}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: lightTheme.border, alignSelf: "center", marginBottom: space.md }} />

            {selectedSession?.status === "COMPLETED" ? (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: lightTheme.successBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="Dumbbell" size={20} color={lightTheme.success.DEFAULT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading2" color={lightTheme.textPrimary}>
                      {selectedSession.splitDayName}
                    </Typography>
                    <Typography variant="caption" color={lightTheme.textMuted}>
                      {new Date(selectedSession.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </Typography>
                  </View>
                </View>

                {parseMuscleGroups(selectedSession.muscleGroups).length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginBottom: space.md }}>
                    {parseMuscleGroups(selectedSession.muscleGroups).map((mg: string) => (
                      <View
                        key={mg}
                        style={{
                          backgroundColor: lightTheme.primaryLight,
                          borderRadius: radius.sm,
                          paddingHorizontal: space.md,
                          paddingVertical: space.xs,
                        }}
                      >
                        <Typography variant="caption" color={lightTheme.primary} weight="600">
                          {mg.charAt(0).toUpperCase() + mg.slice(1)}
                        </Typography>
                      </View>
                    ))}
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: space.md, marginBottom: space.md }}>
                  {selectedSession.durationMinutes && (
                    <Card shadow="none" style={{ flex: 1, alignItems: "center", backgroundColor: lightTheme.surfaceSecondary }}>
                      <Icon name="Clock" size={16} color={lightTheme.textMuted} />
                      <Typography variant="heading3" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
                        {selectedSession.durationMinutes}m
                      </Typography>
                      <Typography variant="caption" color={lightTheme.textMuted}>Duration</Typography>
                    </Card>
                  )}
                  <Card shadow="none" style={{ flex: 1, alignItems: "center", backgroundColor: lightTheme.surfaceSecondary }}>
                    <Icon name="ListChecks" size={16} color={lightTheme.textMuted} />
                    <Typography variant="heading3" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
                      {selectedSession.exerciseCount}
                    </Typography>
                    <Typography variant="caption" color={lightTheme.textMuted}>Exercises</Typography>
                  </Card>
                  {selectedSession.totalVolume > 0 && (
                    <Card shadow="none" style={{ flex: 1, alignItems: "center", backgroundColor: lightTheme.surfaceSecondary }}>
                      <Icon name="TrendingUp" size={16} color={lightTheme.textMuted} />
                      <Typography variant="heading3" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
                        {selectedSession.totalVolume.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color={lightTheme.textMuted}>Volume (kg)</Typography>
                    </Card>
                  )}
                </View>

                {selectedSession.notes && (
                  <Card shadow="none" style={{ backgroundColor: lightTheme.surfaceSecondary, marginBottom: space.md }}>
                    <Typography variant="caption" color={lightTheme.textMuted} weight="600">NOTES</Typography>
                    <Typography variant="body" color={lightTheme.textPrimary} style={{ marginTop: space.xs }}>
                      {selectedSession.notes}
                    </Typography>
                  </Card>
                )}
              </>
            ) : (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.info.light,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="Moon" size={20} color={colors.info.DEFAULT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="heading2" color={lightTheme.textPrimary}>
                      Rest Day
                    </Typography>
                    <Typography variant="caption" color={lightTheme.textMuted}>
                      {new Date(selectedSession!.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </Typography>
                  </View>
                </View>

                <Card
                  shadow="none"
                  padding="md"
                  border={false}
                  style={{ backgroundColor: lightTheme.successBg, marginBottom: space.md }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                    <Icon name="Heart" size={20} color={lightTheme.success.DEFAULT} />
                    <View style={{ flex: 1 }}>
                      <Typography variant="body" color={lightTheme.successText} weight="600">
                        Reason: {selectedSession?.restReason ? selectedSession.restReason.charAt(0).toUpperCase() + selectedSession.restReason.slice(1) : "Not specified"}
                      </Typography>
                      <Typography variant="caption" color={lightTheme.successText}>
                        Recovery is part of the plan
                      </Typography>
                    </View>
                  </View>
                </Card>

                <Button
                  title="Edit Reason"
                  onPress={openEditReason}
                  variant="secondary"
                  size="md"
                  icon={<Icon name="Pencil" size={16} color={lightTheme.secondaryText} />}
                />
              </>
            )}

            <View style={{ marginTop: space.md }}>
              <Button
                title="Close"
                onPress={() => setDetailVisible(false)}
                variant="secondary"
                size="md"
              />
            </View>
          </Card>
        </View>
      </Modal>

      <Modal visible={editReasonVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <Card
            shadow="none"
            border={false}
            style={{
              borderTopLeftRadius: radius["2xl"],
              borderTopRightRadius: radius["2xl"],
              padding: space.lg,
            }}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: lightTheme.border, alignSelf: "center", marginBottom: space.md }} />

            <Typography variant="heading2" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
              Edit Rest Reason
            </Typography>
            <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.md }}>
              Why did you rest on this day?
            </Typography>

            {REST_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                onPress={() => setEditReason(reason.toLowerCase())}
                style={{
                  backgroundColor: editReason === reason.toLowerCase() ? lightTheme.primary : lightTheme.surfaceSecondary,
                  borderRadius: radius.md,
                  padding: 14,
                  marginBottom: space.sm,
                  borderWidth: editReason === reason.toLowerCase() ? 0 : 1,
                  borderColor: lightTheme.border,
                }}
              >
                <Typography
                  variant="body"
                  color={editReason === reason.toLowerCase() ? lightTheme.primaryText : lightTheme.textPrimary}
                  weight={editReason === reason.toLowerCase() ? "600" : "400"}
                >
                  {reason}
                </Typography>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: "row", gap: space.md, marginTop: space.md }}>
              <Button
                title="Cancel"
                onPress={() => {
                  setEditReasonVisible(false);
                  setDetailVisible(true);
                }}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                onPress={handleEditReason}
                variant="primary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
