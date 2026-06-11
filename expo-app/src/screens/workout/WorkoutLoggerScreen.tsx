import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Linking,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { useWorkoutStore } from "../../store/workoutStore";
import { getSetRecommendation } from "../../utils/progression";
import { listExercises } from "../../api/exercises";
import { Exercise, SetLog, ExerciseQueueItem } from "../../types";
import { Typography, Card, Button, Icon, Input } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";
import { useAuthStore } from "../../store/authStore";

type Props = NativeStackScreenProps<HomeStackParamList, "WorkoutLogger">;
const { width: screenW, height: screenH } = Dimensions.get("window");

export default function WorkoutLoggerScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const {
    activeSession,
    reorderQueue,
    beginSession,
    logSet,
    deleteSet,
    replaceExercise,
    addExerciseToQueue,
    updateExerciseNotes,
    updateSessionNotes,
    setRestTimer,
    clearSession,
    setCurrentExerciseIndex,
  } = useWorkoutStore();

  const [elapsed, setElapsed] = useState(0);
  const [restTimeElapsed, setRestTimeElapsed] = useState(0);

  // Focus Card input fields
  const [weightStr, setWeightStr] = useState("");
  const [repsStr, setRepsStr] = useState("");
  const [durationStr, setDurationStr] = useState("");

  // Modals & Sheets
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceMode, setReplaceMode] = useState<"today" | "permanent">("today");

  // Alternatives / Fallbacks
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Exercise Complete state
  const [phase, setPhase] = useState<"active" | "exercise_complete">("active");
  const [detectedPR, setDetectedPR] = useState<string | null>(null);
  const [completeTimeoutId, setCompleteTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Recommendations history
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const currentItem = activeSession?.exerciseQueue[activeSession.currentExerciseIndex];

  // Helper to determine exercise style
  const isBodyweight = (ex?: Exercise) => {
    if (!ex) return false;
    const eq = (ex.equipmentNeeded || "").toLowerCase();
    const name = (ex.name || "").toLowerCase();
    return eq.includes("bodyweight") || eq.includes("none") || eq.includes("body weight");
  };

  const isTimed = (ex?: Exercise) => {
    if (!ex) return false;
    const name = (ex.name || "").toLowerCase();
    return name.includes("plank") || name.includes("hold") || name.includes("duration") || name.includes("timed") || name.includes("hang");
  };

  // 1RM Calculation Helper
  const calc1RM = (weight: number, reps: number) => weight * (1 + reps / 30);

  const getMaxPrevious1RM = (historyLogs: any[]) => {
    let max = 0;
    historyLogs.forEach((log) => {
      if (log.setLogs) {
        log.setLogs.forEach((set: any) => {
          if (!set.wasSkipped && set.weightKg && set.reps) {
            const oneRM = calc1RM(set.weightKg, set.reps);
            if (oneRM > max) max = oneRM;
          }
        });
      }
    });
    return max;
  };

  // Get progressive overload recommendation
  const recommendation = currentItem
    ? getSetRecommendation(
        currentItem.exercise,
        currentItem.targetRepsMin,
        currentItem.targetRepsMax,
        history
      )
    : { recommendedWeight: null, recommendedReps: null, lastWeight: null, lastReps: null };

  // Fetch History for recommendation
  useEffect(() => {
    if (activeSession && currentItem) {
      setLoadingHistory(true);
      const { getExerciseHistory } = require("../../api/exercises");
      getExerciseHistory(currentItem.exercise.id)
        .then((res: any) => {
          setHistory(res.logs || []);
        })
        .catch((err: any) => {
          console.error("Failed to fetch exercise history", err);
          setHistory([]);
        })
        .finally(() => {
          setLoadingHistory(false);
        });
    }
  }, [activeSession?.currentExerciseIndex, currentItem?.exercise.id]);

  // Handle inputs fill
  useEffect(() => {
    if (!currentItem) return;
    const setNum = activeSession.currentSetNumber;

    if (setNum === 1) {
      if (recommendation.recommendedWeight !== null) {
        setWeightStr(String(recommendation.recommendedWeight));
      } else {
        setWeightStr("");
      }
    } else {
      const prevSet = currentItem.loggedSets[setNum - 2];
      if (prevSet && prevSet.weightKg !== null) {
        setWeightStr(String(prevSet.weightKg));
      } else {
        setWeightStr("");
      }
    }
    setRepsStr("");
    setDurationStr("");
  }, [activeSession?.currentExerciseIndex, activeSession?.currentSetNumber, recommendation.recommendedWeight]);

  // Timers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && activeSession.hasStarted) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - activeSession.startedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.hasStarted, activeSession?.startedAt]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && activeSession.isRestTimerActive && activeSession.restStartedAt) {
      setRestTimeElapsed(Math.floor((Date.now() - activeSession.restStartedAt) / 1000));
      interval = setInterval(() => {
        setRestTimeElapsed(Math.floor((Date.now() - activeSession.restStartedAt!) / 1000));
      }, 1000);
    } else {
      setRestTimeElapsed(0);
    }
    return () => clearInterval(interval);
  }, [activeSession?.isRestTimerActive, activeSession?.restStartedAt]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getRestRecommendationText = (goal: string | null) => {
    const g = (goal || "").toUpperCase();
    if (g.includes("MUSCLE") || g.includes("GROWTH") || g.includes("HYPERTROPHY")) {
      return { range: "Rest 1–2 min (Hypertrophy)", limit: 60 };
    } else if (g.includes("FIT") || g.includes("LOSS") || g.includes("ENDURANCE")) {
      return { range: "Rest 30–90 sec (Endurance)", limit: 30 };
    } else {
      return { range: "Rest 2–5 min (Strength/Power)", limit: 120 };
    }
  };

  const restConfig = getRestRecommendationText(user?.goal || null);
  const isGoodToGo = restTimeElapsed >= restConfig.limit;
  const timerColor = isGoodToGo ? lightTheme.success : lightTheme.textMuted;

  // Logging Set
  const handleLogSet = (wasSkipped = false) => {
    if (!currentItem || !activeSession) return;

    let weight: number | null = null;
    let reps: number | null = null;
    let duration: number | null = null;

    if (!wasSkipped) {
      if (!isBodyweight(currentItem.exercise)) {
        weight = parseFloat(weightStr);
        if (isNaN(weight) || weight < 0) {
          Alert.alert("Error", "Please enter a valid weight.");
          return;
        }
      }

      if (isTimed(currentItem.exercise)) {
        duration = parseInt(durationStr);
        if (isNaN(duration) || duration <= 0) {
          Alert.alert("Error", "Please enter a duration (seconds).");
          return;
        }
      } else {
        const repsVal = repsStr || String(recommendation.recommendedReps || currentItem.targetRepsMin);
        reps = parseInt(repsVal);
        if (isNaN(reps) || reps <= 0) {
          Alert.alert("Error", "Please enter reps.");
          return;
        }
      }
    }

    // PR Check
    let isPR = false;
    if (!wasSkipped && weight !== null && reps !== null && !isBodyweight(currentItem.exercise) && !isTimed(currentItem.exercise)) {
      const current1RM = calc1RM(weight, reps);
      const prevMax = getMaxPrevious1RM(history);
      if (prevMax > 0 && current1RM > prevMax) {
        isPR = true;
        setDetectedPR(`🏆 New PR! ${weight}kg × ${reps}`);
      }
    }

    logSet(
      currentItem.id,
      weight,
      reps,
      duration,
      wasSkipped,
      false,
      null,
      isPR
    );

    // Check completed count
    const loggedCount = currentItem.loggedSets.length + 1;
    if (loggedCount >= currentItem.targetSets) {
      // Completed last set of this exercise
      setPhase("exercise_complete");
      const nextIndex = activeSession.currentExerciseIndex + 1;
      const tid = setTimeout(() => {
        handleNextExercise(nextIndex);
      }, 2000);
      setCompleteTimeoutId(tid);
    }
  };

  const handleSkipSet = () => {
    Alert.alert(
      "Skip Set?",
      "Skipping a set reduces total volume and may slow your progress. Are you sure you want to skip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          style: "destructive",
          onPress: () => handleLogSet(true),
        },
      ]
    );
  };

  const handleNextExercise = (targetIndex?: number) => {
    if (completeTimeoutId) {
      clearTimeout(completeTimeoutId);
      setCompleteTimeoutId(null);
    }
    setDetectedPR(null);
    setPhase("active");

    const index = targetIndex !== undefined ? targetIndex : activeSession!.currentExerciseIndex + 1;
    if (activeSession && index < activeSession.exerciseQueue.length) {
      setCurrentExerciseIndex(index);
    } else {
      // Completed all exercises
      navigation.navigate("WorkoutSummary", {
        sessionId: activeSession!.sessionId,
      });
    }
  };

  const openReplaceModal = async () => {
    if (!currentItem) return;
    setShowReplaceModal(true);
    setLoadingAlternatives(true);
    try {
      const { getAlternatives } = require("../../api/exercises");
      const res = await getAlternatives(currentItem.exercise.id);
      setAlternatives(res.alternatives || []);
    } catch (err) {
      console.error("Failed to load alternatives", err);
      setAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
    }

    // load all exercises as fallback
    try {
      const res = await listExercises();
      setAllExercises(res.exercises || []);
    } catch (err) {}
  };

  const handleReplaceConfirm = async (selectedEx: Exercise) => {
    if (!currentItem || !activeSession) return;

    if (replaceMode === "permanent") {
      Alert.alert(
        "Confirm Permanent Replace",
        `Replace ${currentItem.exercise.name} with ${selectedEx.name} in your split permanently? You can undo this in Split Settings.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace",
            onPress: async () => {
              await replaceExercise(currentItem.id, selectedEx, true);
              setShowReplaceModal(false);
            },
          },
        ]
      );
    } else {
      await replaceExercise(currentItem.id, selectedEx, false);
      setShowReplaceModal(false);
    }
  };

  const handleAddExercise = (selectedEx: Exercise) => {
    addExerciseToQueue(selectedEx);
    Alert.alert("Success", `${selectedEx.name} added to session queue.`);
  };

  if (!activeSession) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg, justifyContent: "center", alignItems: "center" }}>
        <Typography variant="body" color={lightTheme.textMuted}>
          No active session
        </Typography>
      </SafeAreaView>
    );
  }

  // PRE-START PHASE
  if (!activeSession.hasStarted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top", "bottom"]}>
        <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: lightTheme.border }}>
          <Typography variant="caption" color={lightTheme.textMuted} weight="700">
            PRE-WORKOUT SETUP
          </Typography>
          <Typography variant="heading1" color={lightTheme.textPrimary}>
            {activeSession.splitDayName}
          </Typography>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg }}>
          <Typography variant="body" color={lightTheme.textSecondary} style={{ marginBottom: space.lg }}>
            Reorder the exercises below to change the order of your workout today:
          </Typography>

          {activeSession.exerciseQueue.map((item, idx) => (
            <Card key={item.id} shadow="sm" style={{ marginBottom: space.md, padding: space.md }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: radius.md,
                    backgroundColor: lightTheme.surfaceTertiary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: space.md,
                  }}
                >
                  <Typography variant="body" color={lightTheme.textSecondary} weight="700">
                    {idx + 1}
                  </Typography>
                </View>

                <View style={{ flex: 1 }}>
                  <Typography variant="heading3" color={lightTheme.textPrimary}>
                    {item.exercise.name}
                  </Typography>
                  <Typography variant="caption" color={lightTheme.textMuted}>
                    {item.exercise.muscleGroup} · {item.targetSets} sets × {item.targetRepsMin}-{item.targetRepsMax} reps
                  </Typography>
                </View>

                <View style={{ flexDirection: "row", gap: space.xs }}>
                  <TouchableOpacity
                    onPress={() => reorderQueue(idx, idx - 1)}
                    disabled={idx === 0}
                    style={{
                      padding: space.xs,
                      backgroundColor: idx === 0 ? "transparent" : lightTheme.surfaceSecondary,
                      borderRadius: radius.sm,
                    }}
                  >
                    <Icon name="ChevronUp" size={20} color={idx === 0 ? lightTheme.disabledText : lightTheme.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => reorderQueue(idx, idx + 1)}
                    disabled={idx === activeSession.exerciseQueue.length - 1}
                    style={{
                      padding: space.xs,
                      backgroundColor: idx === activeSession.exerciseQueue.length - 1 ? "transparent" : lightTheme.surfaceSecondary,
                      borderRadius: radius.sm,
                    }}
                  >
                    <Icon name="ChevronDown" size={20} color={idx === activeSession.exerciseQueue.length - 1 ? lightTheme.disabledText : lightTheme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>

        <View style={{ padding: space.lg, borderTopWidth: 1, borderTopColor: lightTheme.border }}>
          <Button title="Begin Session" onPress={beginSession} variant="primary" size="lg" icon={<Icon name="Play" color={lightTheme.primaryText} size={20} />} />
        </View>
      </SafeAreaView>
    );
  }

  // ACTIVE FOCUS CARD PHASE
  const progressPercent = ((activeSession.currentExerciseIndex + (phase === "exercise_complete" ? 1 : 0)) / activeSession.exerciseQueue.length) * 100;
  const isCardBodyweight = isBodyweight(currentItem?.exercise);
  const isCardTimed = isTimed(currentItem?.exercise);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top", "bottom"]}>
      {/* Sticky Header */}
      <View style={{ backgroundColor: lightTheme.surface, borderBottomWidth: 1, borderBottomColor: lightTheme.border }}>
        <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Typography variant="caption" color={lightTheme.textMuted} weight="700">
              ACTIVE SESSION · {activeSession.splitDayName}
            </Typography>
            <Typography variant="heading2" color={lightTheme.textPrimary}>
              Exercise {activeSession.currentExerciseIndex + 1} of {activeSession.exerciseQueue.length}
            </Typography>
          </View>
          <View style={{ backgroundColor: lightTheme.primaryLight, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: space.sm }}>
            <Icon name="Timer" size={16} color={lightTheme.primary} />
            <Typography variant="body" color={lightTheme.primary} weight="700">
              {formatTime(elapsed)}
            </Typography>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ height: 4, backgroundColor: lightTheme.surfaceTertiary, width: "100%" }}>
          <View style={{ height: "100%", backgroundColor: lightTheme.primary, width: `${progressPercent}%` }} />
        </View>
      </View>

      {/* Main Focus Exercise Area */}
      <View style={{ flex: 1 }}>
        {phase === "exercise_complete" ? (
          /* Exercise Complete celebration banner */
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: space.xl }}>
            <Card style={{ width: "100%", padding: space.xl, alignItems: "center", borderColor: lightTheme.success, borderWidth: 2 }} shadow="md">
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: lightTheme.successBg, alignItems: "center", justifyContent: "center", marginBottom: space.md }}>
                <Icon name="Check" size={48} color={lightTheme.success} strokeWidth={3} />
              </View>
              <Typography variant="heading1" color={lightTheme.textPrimary} style={{ marginBottom: space.sm }}>
                Exercise Complete!
              </Typography>

              {detectedPR && (
                <View style={{ backgroundColor: "#FEF3C7", borderColor: "#F59E0B", borderWidth: 1, paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radius.md, marginVertical: space.md, flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Icon name="Trophy" size={20} color="#D97706" />
                  <Typography variant="body" color="#92400E" weight="800">
                    {detectedPR}
                  </Typography>
                </View>
              )}

              <Typography variant="body" color={lightTheme.textSecondary} style={{ marginTop: space.sm, marginBottom: space.lg }} align="center">
                Moving to next exercise...
              </Typography>
              <Button title="Next Exercise" onPress={() => handleNextExercise()} variant="primary" size="md" />
            </Card>
          </View>
        ) : currentItem ? (
          <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }} style={{ flex: 1 }}>
            {/* Active Exercise Title details */}
            <Card style={{ padding: space.lg, marginBottom: space.lg }} shadow="sm">
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Typography variant="heading2" color={lightTheme.textPrimary}>
                    {currentItem.exercise.name}
                  </Typography>
                  <Typography variant="bodySmall" color={lightTheme.textSecondary} style={{ textTransform: "capitalize", marginTop: 4 }}>
                    Primary Muscle: {currentItem.exercise.muscleGroup}
                  </Typography>
                </View>
                {currentItem.exercise.demoUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(currentItem.exercise.demoUrl!).catch(() => {})}
                    style={{ padding: space.sm, backgroundColor: lightTheme.primaryLight, borderRadius: radius.md, flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <Icon name="Video" size={16} color={lightTheme.primary} />
                    <Typography variant="caption" color={lightTheme.primary} weight="700">DEMO</Typography>
                  </TouchableOpacity>
                )}
              </View>

              {/* Set list completed */}
              {currentItem.loggedSets.length > 0 && (
                <View style={{ marginTop: space.lg, borderTopWidth: 1, borderTopColor: lightTheme.border, paddingTop: space.md }}>
                  <Typography variant="caption" color={lightTheme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
                    COMPLETED SETS
                  </Typography>
                  {currentItem.loggedSets.map((set, idx) => (
                    <View
                      key={set.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: set.wasSkipped ? "rgba(239, 68, 68, 0.05)" : lightTheme.surfaceSecondary,
                        borderRadius: radius.md,
                        padding: space.md,
                        marginBottom: space.xs,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: set.wasSkipped ? lightTheme.error : lightTheme.success,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: space.md,
                        }}
                      >
                        <Typography variant="bodySmall" color={lightTheme.primaryText} weight="700">
                          {set.setNumber}
                        </Typography>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography
                          variant="body"
                          color={set.wasSkipped ? lightTheme.textMuted : lightTheme.textPrimary}
                          style={{ textDecorationLine: set.wasSkipped ? "line-through" : "none", fontWeight: "600" }}
                        >
                          {set.wasSkipped
                            ? "Set Skipped"
                            : isCardTimed
                            ? `${set.durationSeconds}s duration`
                            : isCardBodyweight
                            ? `${set.reps} reps`
                            : `${set.weightKg}kg × ${set.reps}`}
                        </Typography>
                      </View>
                      <TouchableOpacity onPress={() => deleteSet(currentItem.id, set.id)}>
                        <Icon name="Trash2" size={16} color={lightTheme.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Active input row */}
              <View style={{ marginTop: space.lg, borderTopWidth: 1, borderTopColor: lightTheme.border, paddingTop: space.md }}>
                <Typography variant="caption" color={lightTheme.primary} weight="800" style={{ marginBottom: space.sm }}>
                  LOG SET {activeSession.currentSetNumber} OF {currentItem.targetSets}
                </Typography>

                <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
                  {!isCardBodyweight && (
                    <View style={{ flex: 1 }}>
                      <Input
                        value={weightStr}
                        onChangeText={setWeightStr}
                        placeholder={recommendation.recommendedWeight !== null ? `${recommendation.recommendedWeight} kg` : "Weight kg"}
                        keyboardType="decimal-pad"
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  )}

                  {isCardTimed ? (
                    <View style={{ flex: 1 }}>
                      <Input
                        value={durationStr}
                        onChangeText={setDurationStr}
                        placeholder="Seconds"
                        keyboardType="number-pad"
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <Input
                        value={repsStr}
                        onChangeText={setRepsStr}
                        placeholder={recommendation.recommendedReps !== null ? `${recommendation.recommendedReps} reps` : `${currentItem.targetRepsMin}-${currentItem.targetRepsMax} reps`}
                        keyboardType="number-pad"
                        containerStyle={{ marginBottom: 0 }}
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => handleLogSet(false)}
                    style={{
                      backgroundColor: lightTheme.success,
                      borderRadius: radius.md,
                      width: 48,
                      height: 48,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon name="Check" size={22} color={lightTheme.primaryText} strokeWidth={3} />
                  </TouchableOpacity>
                </View>

                {/* Progressive recommendation displays */}
                {(!isCardBodyweight || recommendation.lastReps !== null) && (
                  <View style={{ marginTop: space.md, padding: space.sm, backgroundColor: lightTheme.surfaceTertiary, borderRadius: radius.md, gap: 4 }}>
                    {recommendation.lastWeight !== null && (
                      <Typography variant="caption" color={lightTheme.textSecondary} style={{ fontStyle: "italic" }}>
                        Last session best: {isCardBodyweight ? "" : `${recommendation.lastWeight}kg × `}{recommendation.lastReps} reps
                      </Typography>
                    )}
                    {recommendation.recommendedWeight !== null && (
                      <Typography variant="caption" color={lightTheme.success} weight="700">
                        Aim today: {isCardBodyweight ? "" : `${recommendation.recommendedWeight}kg × `}{recommendation.recommendedReps} reps
                      </Typography>
                    )}
                  </View>
                )}

                {/* Skip Set Button */}
                {activeSession.currentSetNumber >= 2 && (
                  <TouchableOpacity
                    onPress={handleSkipSet}
                    style={{
                      marginTop: space.md,
                      paddingVertical: space.sm,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: lightTheme.error,
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="bodySmall" color={lightTheme.error} weight="600">
                      Skip Set
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>

              {/* Notes for current exercise */}
              <View style={{ marginTop: space.lg }}>
                <Input
                  value={(currentItem as any).notes || ""}
                  onChangeText={(val) => updateExerciseNotes(currentItem.id, val)}
                  placeholder="Notes for this exercise..."
                  containerStyle={{ marginBottom: 0 }}
                  style={{ fontSize: 13 }}
                />
              </View>
            </Card>

            {/* Inactive future sets indicators preview */}
            {currentItem.targetSets > currentItem.loggedSets.length + 1 && (
              <View style={{ opacity: 0.5, gap: space.xs, marginBottom: space.lg }}>
                {Array.from({ length: currentItem.targetSets - (currentItem.loggedSets.length + 1) }).map((_, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: lightTheme.surfaceSecondary,
                      borderRadius: radius.md,
                      padding: space.md,
                    }}
                  >
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: lightTheme.disabledText, alignItems: "center", justifyContent: "center", marginRight: space.md }}>
                      <Typography variant="bodySmall" color={lightTheme.primaryText} weight="700">
                        {currentItem.loggedSets.length + 2 + idx}
                      </Typography>
                    </View>
                    <Typography variant="body" color={lightTheme.textMuted} weight="500">
                      Set Target: {isCardTimed ? "Duration" : isCardBodyweight ? "Bodyweight reps" : "Weight × reps"}
                    </Typography>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator color={lightTheme.primary} />
          </View>
        )}
      </View>

      {/* REST TIMER SHEET OVERLAY */}
      {activeSession.isRestTimerActive && activeSession.restStartedAt && (
        <View style={StyleSheet.absoluteFillObject}>
          {/* Backdrop blur effect */}
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15, 23, 42, 0.75)" }} />

          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: lightTheme.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: space.xl,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 20,
            }}
          >
            {/* Handle bar */}
            <View style={{ width: 40, height: 4, backgroundColor: lightTheme.border, borderRadius: 2, marginBottom: space.lg }} />

            <Typography variant="caption" color={lightTheme.textMuted} weight="700">
              REST TIMER ACTIVE
            </Typography>

            <Typography variant="display" color={timerColor} style={{ fontSize: 64, marginVertical: space.md, fontWeight: "800" }}>
              {formatTime(restTimeElapsed)}
            </Typography>

            <View style={{ backgroundColor: lightTheme.surfaceSecondary, borderRadius: radius.md, paddingVertical: space.sm, paddingHorizontal: space.lg, marginBottom: space.md }}>
              <Typography variant="caption" color={lightTheme.textSecondary} weight="700">
                Goal: {restConfig.range}
              </Typography>
            </View>

            {isGoodToGo ? (
              <View style={{ backgroundColor: lightTheme.successBg, borderRadius: radius.md, padding: space.sm, marginBottom: space.lg, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Icon name="CheckCircle2" size={16} color={lightTheme.success} />
                <Typography variant="caption" color={lightTheme.successText} weight="700">
                  GOOD TO GO!
                </Typography>
              </View>
            ) : (
              <View style={{ height: 32 }} />
            )}

            {/* Static tip display */}
            {currentItem?.exercise.instructions && (
              <Card style={{ backgroundColor: lightTheme.primaryLight, borderColor: lightTheme.primary, borderWidth: 0.5, padding: space.md, marginBottom: space.xl, width: "100%" }} border={false}>
                <View style={{ flexDirection: "row", gap: space.sm }}>
                  <Icon name="Sparkles" color={lightTheme.primary} size={18} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="caption" color={lightTheme.primary} weight="800">
                      TIPS FOR {currentItem.exercise.name.toUpperCase()}
                    </Typography>
                    <Typography variant="bodySmall" color={lightTheme.textSecondary} numberOfLines={2}>
                      {currentItem.exercise.instructions}
                    </Typography>
                  </View>
                </View>
              </Card>
            )}

            <Button
              title="Start Next Set"
              onPress={() => setRestTimer(false, null)}
              variant="primary"
              size="lg"
              style={{ width: "100%", marginBottom: space.md }}
              icon={<Icon name="Play" size={20} color={lightTheme.primaryText} />}
            />
          </View>
        </View>
      )}

      {/* BOTTOM PERSISTENT BAR */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: lightTheme.surface,
          borderTopWidth: 1,
          borderTopColor: lightTheme.border,
          flexDirection: "row",
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          gap: space.md,
        }}
      >
        <TouchableOpacity
          onPress={() => setShowQueueModal(true)}
          style={{
            flex: 1,
            height: 48,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: lightTheme.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: space.xs,
          }}
        >
          <Icon name="List" size={18} color={lightTheme.textSecondary} />
          <Typography variant="body" color={lightTheme.textSecondary} weight="600">
            Switch Exercise
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openReplaceModal}
          style={{
            flex: 1,
            height: 48,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: lightTheme.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: space.xs,
          }}
        >
          <Icon name="Repeat" size={18} color={lightTheme.textSecondary} />
          <Typography variant="body" color={lightTheme.textSecondary} weight="600">
            Replace Exercise
          </Typography>
        </TouchableOpacity>
      </View>

      {/* EXERCISE QUEUE MODAL */}
      <Modal visible={showQueueModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <View
            style={{
              backgroundColor: lightTheme.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: space.lg,
              height: "75%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
              <Typography variant="heading2" color={lightTheme.textPrimary}>
                Exercise Queue
              </Typography>
              <TouchableOpacity onPress={() => setShowQueueModal(false)} style={{ padding: space.xs }}>
                <Icon name="X" size={24} color={lightTheme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xl }}>
              {activeSession.exerciseQueue.map((item, idx) => {
                const isActive = idx === activeSession.currentExerciseIndex;
                let statusColor: string = lightTheme.textMuted;
                let statusBg: string = lightTheme.surfaceSecondary;
                let statusLabel = "Not Started";
                let statusIcon: any = "Play";

                if (item.status === "complete") {
                  statusColor = lightTheme.success;
                  statusBg = lightTheme.successBg;
                  statusLabel = "Complete";
                  statusIcon = "CheckCircle2";
                } else if (item.status === "in_progress" || isActive) {
                  statusColor = lightTheme.warning;
                  statusBg = lightTheme.warningBg;
                  statusLabel = isActive ? "Active" : "In Progress";
                  statusIcon = "Clock";
                } else if (item.status === "skipped") {
                  statusColor = lightTheme.error;
                  statusBg = lightTheme.errorBg;
                  statusLabel = "Skipped";
                  statusIcon = "HelpCircle";
                }

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setCurrentExerciseIndex(idx);
                      setPhase("active");
                      setShowQueueModal(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isActive ? "rgba(99, 102, 241, 0.05)" : lightTheme.surface,
                      borderRadius: radius.lg,
                      padding: space.md,
                      marginBottom: space.sm,
                      borderWidth: 1.5,
                      borderColor: isActive ? lightTheme.primary : lightTheme.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography
                        variant="heading3"
                        color={lightTheme.textPrimary}
                        style={{
                          textDecorationLine: item.status === "skipped" ? "line-through" : "none",
                        }}
                      >
                        {item.exercise.name}
                      </Typography>
                      <Typography variant="caption" color={lightTheme.textMuted} style={{ marginTop: 2 }}>
                        {item.exercise.muscleGroup} · {item.loggedSets.length} / {item.targetSets} sets
                      </Typography>
                    </View>

                    <View style={{ backgroundColor: statusBg, paddingHorizontal: space.sm, paddingVertical: space.xs, borderRadius: radius.sm, flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Icon name={statusIcon} size={12} color={statusColor} />
                      <Typography variant="caption" color={statusColor} weight="700">
                        {statusLabel.toUpperCase()}
                      </Typography>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* REPLACE EXERCISE SHEET */}
      <Modal visible={showReplaceModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <View
            style={{
              backgroundColor: lightTheme.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: space.lg,
              height: "85%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
              <Typography variant="heading2" color={lightTheme.textPrimary}>
                Swap / Replace Exercise
              </Typography>
              <TouchableOpacity onPress={() => setShowReplaceModal(false)} style={{ padding: space.xs }}>
                <Icon name="X" size={24} color={lightTheme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Replace Mode Segmented Toggles */}
            <View style={{ flexDirection: "row", backgroundColor: lightTheme.surfaceTertiary, borderRadius: radius.md, padding: 2, marginBottom: space.md }}>
              <TouchableOpacity
                onPress={() => setReplaceMode("today")}
                style={{
                  flex: 1,
                  paddingVertical: space.sm,
                  backgroundColor: replaceMode === "today" ? lightTheme.surface : "transparent",
                  borderRadius: radius.sm,
                  alignItems: "center",
                }}
              >
                <Typography variant="bodySmall" color={replaceMode === "today" ? lightTheme.primary : lightTheme.textSecondary} weight="700">
                  Just this session
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReplaceMode("permanent")}
                style={{
                  flex: 1,
                  paddingVertical: space.sm,
                  backgroundColor: replaceMode === "permanent" ? lightTheme.surface : "transparent",
                  borderRadius: radius.sm,
                  alignItems: "center",
                }}
              >
                <Typography variant="bodySmall" color={replaceMode === "permanent" ? lightTheme.primary : lightTheme.textSecondary} weight="700">
                  Update split permanently
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Alternatives section */}
            <Typography variant="caption" color={lightTheme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
              RECOMMENDED ALTERNATIVES
            </Typography>

            {loadingAlternatives ? (
              <ActivityIndicator color={lightTheme.primary} style={{ marginVertical: space.lg }} />
            ) : alternatives.length > 0 ? (
              <View style={{ maxHeight: 220, marginBottom: space.md }}>
                <ScrollView nestedScrollEnabled>
                  {alternatives.map((item, idx) => {
                    const ex = item.alternative;
                    // Tag generation
                    let tag = "RECOMMENDED";
                    let tagColor: string = lightTheme.success;
                    let tagBg: string = lightTheme.successBg;

                    if (idx === 1) {
                      tag = "MACHINE_FREE";
                      tagColor = lightTheme.primary;
                      tagBg = lightTheme.primaryLight;
                    } else if (idx === 2) {
                      tag = "BEGINNER_FRIENDLY";
                      tagColor = lightTheme.warning;
                      tagBg = lightTheme.warningBg;
                    }

                    return (
                      <TouchableOpacity
                        key={ex.id}
                        onPress={() => handleReplaceConfirm(ex)}
                        style={{
                          backgroundColor: lightTheme.surfaceSecondary,
                          borderRadius: radius.md,
                          padding: space.md,
                          marginBottom: space.sm,
                          borderWidth: 1,
                          borderColor: lightTheme.border,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ flex: 1, marginRight: space.sm }}>
                          <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                            {ex.name}
                          </Typography>
                          <Typography variant="caption" color={lightTheme.textMuted} style={{ textTransform: "capitalize", marginTop: 2 }}>
                            {ex.muscleGroup}
                          </Typography>
                        </View>
                        <View style={{ backgroundColor: tagBg, borderRadius: 6, paddingHorizontal: space.sm, paddingVertical: space.xs }}>
                          <Typography variant="caption" color={tagColor} weight="800" style={{ fontSize: 9 }}>
                            {tag}
                          </Typography>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <Typography variant="bodySmall" color={lightTheme.textMuted} style={{ marginBottom: space.md }}>
                No direct alternatives recommended.
              </Typography>
            )}

            {/* Fallback Search All */}
            <View style={{ marginBottom: space.sm }}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search other exercises..."
                containerStyle={{ marginBottom: 0 }}
              />
            </View>

            <ScrollView style={{ flex: 1 }} nestedScrollEnabled>
              <Typography variant="caption" color={lightTheme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
                ALL EXERCISES
              </Typography>
              {allExercises
                .filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 30)
                .map((ex) => (
                  <View
                    key={ex.id}
                    style={{
                      backgroundColor: lightTheme.surface,
                      borderRadius: radius.md,
                      padding: space.md,
                      marginBottom: space.xs,
                      borderWidth: 1,
                      borderColor: lightTheme.border,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                        {ex.name}
                      </Typography>
                      <Typography variant="caption" color={lightTheme.textMuted} style={{ textTransform: "capitalize", marginTop: 2 }}>
                        {ex.muscleGroup}
                      </Typography>
                    </View>

                    <View style={{ flexDirection: "row", gap: space.sm }}>
                      <TouchableOpacity
                        onPress={() => handleReplaceConfirm(ex)}
                        style={{ paddingVertical: space.xs, paddingHorizontal: space.sm, backgroundColor: lightTheme.primaryLight, borderRadius: radius.sm }}
                      >
                        <Typography variant="caption" color={lightTheme.primary} weight="800">SWAP</Typography>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAddExercise(ex)}
                        style={{ paddingVertical: space.xs, paddingHorizontal: space.sm, backgroundColor: lightTheme.successBg, borderRadius: radius.sm }}
                      >
                        <Typography variant="caption" color={lightTheme.success} weight="800">ADD QUEUE</Typography>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
