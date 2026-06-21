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
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { useWorkoutStore } from "../../store/workoutStore";
import { getSetRecommendation } from "../../utils/progression";
import { listExercises } from "../../api/exercises";
import { Exercise, SetLog, ExerciseQueueItem } from "../../types";
import {
  Typography,
  Card,
  Button,
  Icon,
  Input,
  InlineListSkeleton,
  ExerciseImageCarousel,
  InstructionStepper,
  SetTrackerStrip,
  ExerciseMetaBadges,
} from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";
import { useAuthStore } from "../../store/authStore";

type Props = NativeStackScreenProps<HomeStackParamList, "WorkoutLogger">;
const { width: screenW, height: screenH } = Dimensions.get("window");
const theme = useTheme();

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
    addExtraSet,
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
    const eq = (ex.equipment || "").toLowerCase();
    const name = (ex.name || "").toLowerCase();
    return eq.includes("body") || eq.includes("none") || name.includes("bodyweight");
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
  const timerColor = isGoodToGo ? theme.success : theme.textMuted;

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

    // currentItem.loggedSets.length is the count BEFORE this set was added.
    // After adding, loggedCount = length + 1.
    const loggedCountAfter = currentItem.loggedSets.length + 1;
    const isLastSet = loggedCountAfter >= currentItem.targetSets;

    if (isLastSet) {
      // All target sets done (including this one) → show exercise_complete
      setPhase("exercise_complete");
    }
    // If not last set and not skipped, the store already started isRestTimerActive=true
    // so the inline rest view renders automatically.
  };

  const handleSkipSet = () => {
    handleLogSet(true);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }}>
        <Typography variant="body" color={theme.textMuted}>
          No active session
        </Typography>
      </SafeAreaView>
    );
  }

  // PRE-START PHASE
  if (!activeSession.hasStarted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
        <View style={{ paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <Typography variant="caption" color={theme.textMuted} weight="700">
            PRE-WORKOUT SETUP
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary}>
            {activeSession.splitDayName}
          </Typography>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg }}>
          <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: space.lg }}>
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
                    backgroundColor: theme.surfaceTertiary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: space.md,
                  }}
                >
                  <Typography variant="body" color={theme.textSecondary} weight="700">
                    {idx + 1}
                  </Typography>
                </View>

                <View style={{ flex: 1 }}>
                  <Typography variant="heading3" color={theme.textPrimary}>
                    {item.exercise.name}
                  </Typography>
                  <Typography variant="caption" color={theme.textMuted}>
                    {item.targetSets} sets × {item.targetRepsMin}-{item.targetRepsMax} reps
                  </Typography>
                </View>

                <View style={{ flexDirection: "row", gap: space.xs }}>
                  <TouchableOpacity
                    onPress={() => reorderQueue(idx, idx - 1)}
                    disabled={idx === 0}
                    style={{
                      padding: space.xs,
                      backgroundColor: idx === 0 ? "transparent" : theme.surfaceSecondary,
                      borderRadius: radius.sm,
                    }}
                  >
                    <Icon name="ChevronUp" size={20} color={idx === 0 ? theme.disabledText : theme.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => reorderQueue(idx, idx + 1)}
                    disabled={idx === activeSession.exerciseQueue.length - 1}
                    style={{
                      padding: space.xs,
                      backgroundColor: idx === activeSession.exerciseQueue.length - 1 ? "transparent" : theme.surfaceSecondary,
                      borderRadius: radius.sm,
                    }}
                  >
                    <Icon name="ChevronDown" size={20} color={idx === activeSession.exerciseQueue.length - 1 ? theme.disabledText : theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>

        <View style={{ padding: space.lg, borderTopWidth: 1, borderTopColor: theme.border }}>
          <Button title="Begin Session" onPress={beginSession} variant="primary" size="lg" icon={<Icon name="Play" color={theme.primaryText} size={20} />} />
        </View>
      </SafeAreaView>
    );
  }

  // ACTIVE FOCUS CARD PHASE
  const progressPercent = ((activeSession.currentExerciseIndex + (phase === "exercise_complete" ? 1 : 0)) / activeSession.exerciseQueue.length) * 100;
  const isCardBodyweight = isBodyweight(currentItem?.exercise);
  const isCardTimed = isTimed(currentItem?.exercise);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top", "bottom"]}>
      {/* Sticky Header */}
      <View style={{ backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm }}>
          {/* Split name - small, muted */}
          {activeSession.splitName ? (
            <Typography variant="caption" color={theme.textMuted} weight="600">
              {activeSession.splitName.toUpperCase()}
            </Typography>
          ) : null}

          {/* Day name + exercise counter */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
            <Typography variant="heading3" color={theme.textPrimary} weight="700">
              {activeSession.splitDayName}
            </Typography>
            <Typography variant="caption" color={theme.textSecondary} weight="600">
              Exercise {activeSession.currentExerciseIndex + 1} of {activeSession.exerciseQueue.length}
            </Typography>
          </View>

          {/* Workout name */}
          <Typography variant="display" color={theme.textPrimary} weight="800" style={{ marginTop: space.sm, fontSize: 24 }}>
            {currentItem?.exercise.name || ""}
          </Typography>

          {/* Day number */}
          {activeSession.dayNumber > 0 && activeSession.totalDays > 0 && (
            <Typography variant="caption" color={theme.textSecondary} style={{ marginTop: 2 }}>
              Day {activeSession.dayNumber} of {activeSession.totalDays}
            </Typography>
          )}
        </View>

        {/* Progress Bar */}
        <View style={{ height: 4, backgroundColor: theme.surfaceTertiary, width: "100%" }}>
          <View style={{ height: "100%", backgroundColor: theme.primary, width: `${progressPercent}%` }} />
        </View>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {phase === "exercise_complete" ? (
          /* Exercise Complete banner */
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: space.xl }}>
            <Card style={{ width: "100%", padding: space.xl, alignItems: "center", borderColor: theme.success, borderWidth: 2 }} shadow="md">
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.successBg, alignItems: "center", justifyContent: "center", marginBottom: space.md }}>
                <Icon name="Check" size={40} color={theme.success} strokeWidth={3} />
              </View>
              <Typography variant="heading1" color={theme.textPrimary} style={{ marginBottom: space.xs }}>
                Exercise Done!
              </Typography>
              <Typography variant="bodySmall" color={theme.textMuted} style={{ marginBottom: space.lg }} align="center">
                {currentItem?.targetSets} sets completed
              </Typography>

              {detectedPR && (
                <View style={{ backgroundColor: theme.warningBg, borderColor: theme.warning, borderWidth: 1, paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radius.md, marginBottom: space.lg, flexDirection: "row", alignItems: "center", gap: space.sm }}>
                  <Icon name="Trophy" size={20} color={theme.warning} />
                  <Typography variant="body" color={theme.warningText} weight="800">
                    {detectedPR}
                  </Typography>
                </View>
              )}

              {/* Next exercise — primary CTA */}
              <TouchableOpacity
                onPress={() => handleNextExercise()}
                style={{
                  backgroundColor: theme.primary,
                  borderRadius: radius.lg,
                  paddingVertical: 14,
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: space.sm,
                  marginBottom: space.sm,
                }}
              >
                <Icon name="ArrowRight" size={20} color="#fff" />
                <Typography variant="heading3" color="#fff" weight="700">
                  Next Exercise
                </Typography>
              </TouchableOpacity>

              {/* Add another set — secondary option */}
              {currentItem && (
                <TouchableOpacity
                  onPress={() => {
                    if (completeTimeoutId) clearTimeout(completeTimeoutId);
                    setDetectedPR(null);
                    setPhase("active");
                    addExtraSet(currentItem.id);
                  }}
                  style={{
                    borderWidth: 1.5,
                    borderColor: theme.border,
                    borderRadius: radius.lg,
                    paddingVertical: 13,
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: space.sm,
                  }}
                >
                  <Icon name="Plus" size={18} color={theme.textSecondary} />
                  <Typography variant="body" color={theme.textSecondary} weight="600">
                    Add Another Set
                  </Typography>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        ) : currentItem ? (
          <ScrollView
            contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Exercise Image Carousel */}
            {currentItem.exercise.images && currentItem.exercise.images.length > 0 && (
              <View style={{ marginBottom: space.md }}>
                <ExerciseImageCarousel images={currentItem.exercise.images} intervalMs={2000} />
              </View>
            )}

            {/* Meta Badges */}
            <ExerciseMetaBadges
              level={currentItem.exercise.level}
              mechanic={currentItem.exercise.mechanic}
              equipment={currentItem.exercise.equipment}
              muscles={currentItem.exercise.muscles}
            />

            {/* Instruction Stepper */}
            <InstructionStepper instructions={currentItem.exercise.instructions} autoRotateMs={5000} />

            {/* Set Tracker Strip */}
            <SetTrackerStrip
              targetSets={currentItem.targetSets}
              loggedSets={currentItem.loggedSets}
              currentSetNumber={activeSession.currentSetNumber}
            />

            {/* Inline Rest Timer OR Active Input */}
            {activeSession.isRestTimerActive && activeSession.restStartedAt ? (
              /* Inline Rest Timer */
              <Card style={{ padding: space.lg, marginBottom: space.lg, alignItems: "center" }} shadow="sm">
                <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.md }}>
                  <Icon name="Timer" size={20} color={theme.primary} />
                  <Typography variant="heading3" color={theme.primary} weight="700">
                    REST
                  </Typography>
                </View>

                <Typography
                  variant="display"
                  color={isGoodToGo ? theme.success : theme.textPrimary}
                  style={{ fontSize: 48, fontWeight: "800", marginBottom: space.sm }}
                >
                  {formatTime(restTimeElapsed)}
                </Typography>

                <Typography variant="caption" color={theme.textSecondary} style={{ marginBottom: space.md }}>
                  {restConfig.range}
                </Typography>

                {isGoodToGo && (
                  <View style={{ backgroundColor: theme.successBg, borderRadius: radius.sm, paddingVertical: space.xs, paddingHorizontal: space.md, marginBottom: space.md, flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Icon name="CheckCircle2" size={14} color={theme.success} />
                    <Typography variant="caption" color={theme.successText} weight="700">
                      Good to go!
                    </Typography>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setRestTimer(false, null)}
                  style={{
                    backgroundColor: theme.primary,
                    borderRadius: radius.md,
                    paddingVertical: 12,
                    paddingHorizontal: space.xl,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: space.sm,
                    width: "100%",
                  }}
                >
                  <Icon name="Play" size={18} color="#fff" />
                  <Typography variant="body" color="#fff" weight="700">
                    Start Next Set
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRestTimer(false, null)}
                  style={{ marginTop: space.sm, paddingVertical: space.xs }}
                >
                  <Typography variant="caption" color={theme.textMuted} weight="600">
                    Skip rest
                  </Typography>
                </TouchableOpacity>
              </Card>
            ) : (
              /* Active Set Input */
              <Card style={{ padding: space.lg, marginBottom: space.lg }} shadow="sm">
                <Typography variant="caption" color={theme.primary} weight="800" style={{ marginBottom: space.md }}>
                  LOG SET {activeSession.currentSetNumber} OF {currentItem.targetSets}
                </Typography>

                {/* Input row: weight + reps */}
                <View style={{ flexDirection: "row", gap: space.sm, marginBottom: space.md }}>
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
                </View>

                {/* Progressive recommendation */}
                {(!isCardBodyweight || recommendation.lastReps !== null) && (
                  <View style={{ marginBottom: space.md, padding: space.sm, backgroundColor: theme.surfaceTertiary, borderRadius: radius.md, gap: 4 }}>
                    {recommendation.lastWeight !== null && (
                      <Typography variant="caption" color={theme.textSecondary} style={{ fontStyle: "italic" }}>
                        Last session: {isCardBodyweight ? "" : `${recommendation.lastWeight}kg × `}{recommendation.lastReps} reps
                      </Typography>
                    )}
                    {recommendation.recommendedWeight !== null && (
                      <Typography variant="caption" color={theme.success} weight="700">
                        Aim today: {isCardBodyweight ? "" : `${recommendation.recommendedWeight}kg × `}{recommendation.recommendedReps} reps
                      </Typography>
                    )}
                  </View>
                )}

                {/* Done Button */}
                <TouchableOpacity
                  onPress={() => handleLogSet(false)}
                  style={{
                    backgroundColor: theme.success,
                    borderRadius: radius.lg,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: space.sm,
                    shadowColor: theme.success,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <Icon name="CheckCircle2" size={20} color="#fff" />
                  <Typography variant="heading3" color="#fff" weight="700">
                    Done
                  </Typography>
                </TouchableOpacity>

                {/* Skip Button */}
                <TouchableOpacity
                  onPress={handleSkipSet}
                  style={{ marginTop: space.sm, alignItems: "center", paddingVertical: space.sm }}
                >
                  <Typography variant="bodySmall" color={theme.textMuted} weight="600">
                    Skip →
                  </Typography>
                </TouchableOpacity>

                {/* Notes */}
                <View style={{ marginTop: space.md }}>
                  <Typography variant="caption" color={theme.textMuted} weight="600" style={{ marginBottom: space.xs }}>
                    NOTES
                  </Typography>
                  <Input
                    value={(currentItem as any).notes || ""}
                    onChangeText={(val) => updateExerciseNotes(currentItem.id, val)}
                    placeholder="Add notes..."
                    containerStyle={{ marginBottom: 0 }}
                    style={{ fontSize: 13 }}
                  />
                </View>
              </Card>
            )}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: space.md }}>
            <InlineListSkeleton rows={3} />
          </View>
        )}
      </View>

      {/* BOTTOM PERSISTENT BAR */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
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
            borderColor: theme.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: space.xs,
          }}
        >
          <Icon name="List" size={18} color={theme.textSecondary} />
          <Typography variant="body" color={theme.textSecondary} weight="600">
            Switch
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openReplaceModal}
          style={{
            flex: 1,
            height: 48,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: theme.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: space.xs,
          }}
        >
          <Icon name="Repeat" size={18} color={theme.textSecondary} />
          <Typography variant="body" color={theme.textSecondary} weight="600">
            Replace
          </Typography>
        </TouchableOpacity>
      </View>

      {/* EXERCISE QUEUE MODAL */}
      <Modal visible={showQueueModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.bgOverlay }}>
          <View
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: space.lg,
              height: "75%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
              <Typography variant="heading2" color={theme.textPrimary}>
                Exercise Queue
              </Typography>
              <TouchableOpacity onPress={() => setShowQueueModal(false)} style={{ padding: space.xs }}>
                <Icon name="X" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: space.xl }}>
              {activeSession.exerciseQueue.map((item, idx) => {
                const isActive = idx === activeSession.currentExerciseIndex;
                let statusColor: string = theme.textMuted;
                let statusBg: string = theme.surfaceSecondary;
                let statusLabel = "Not Started";
                let statusIcon: any = "Play";

                if (item.status === "complete") {
                  statusColor = theme.success;
                  statusBg = theme.successBg;
                  statusLabel = "Complete";
                  statusIcon = "CheckCircle2";
                } else if (item.status === "in_progress" || isActive) {
                  statusColor = theme.warning;
                  statusBg = theme.warningBg;
                  statusLabel = isActive ? "Active" : "In Progress";
                  statusIcon = "Clock";
                } else if (item.status === "skipped") {
                  statusColor = theme.error;
                  statusBg = theme.errorBg;
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
                      backgroundColor: isActive ? theme.primaryLight : theme.surface,
                      borderRadius: radius.lg,
                      padding: space.md,
                      marginBottom: space.sm,
                      borderWidth: 1.5,
                      borderColor: isActive ? theme.primary : theme.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography
                        variant="heading3"
                        color={theme.textPrimary}
                        style={{
                          textDecorationLine: item.status === "skipped" ? "line-through" : "none",
                        }}
                      >
                        {item.exercise.name}
                      </Typography>
                      <Typography variant="caption" color={theme.textMuted} style={{ marginTop: 2 }}>
                        {item.loggedSets.length} / {item.targetSets} sets
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
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.bgOverlay }}>
          <View
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: space.lg,
              height: "85%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
              <Typography variant="heading2" color={theme.textPrimary}>
                Swap / Replace Exercise
              </Typography>
              <TouchableOpacity onPress={() => setShowReplaceModal(false)} style={{ padding: space.xs }}>
                <Icon name="X" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Replace Mode Segmented Toggles */}
            <View style={{ flexDirection: "row", backgroundColor: theme.surfaceTertiary, borderRadius: radius.md, padding: 2, marginBottom: space.md }}>
              <TouchableOpacity
                onPress={() => setReplaceMode("today")}
                style={{
                  flex: 1,
                  paddingVertical: space.sm,
                  backgroundColor: replaceMode === "today" ? theme.surface : "transparent",
                  borderRadius: radius.sm,
                  alignItems: "center",
                }}
              >
                <Typography variant="bodySmall" color={replaceMode === "today" ? theme.primary : theme.textSecondary} weight="700">
                  Just this session
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setReplaceMode("permanent")}
                style={{
                  flex: 1,
                  paddingVertical: space.sm,
                  backgroundColor: replaceMode === "permanent" ? theme.surface : "transparent",
                  borderRadius: radius.sm,
                  alignItems: "center",
                }}
              >
                <Typography variant="bodySmall" color={replaceMode === "permanent" ? theme.primary : theme.textSecondary} weight="700">
                  Update split permanently
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Alternatives section */}
            <Typography variant="caption" color={theme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
              RECOMMENDED ALTERNATIVES
            </Typography>

            {loadingAlternatives ? (
              <InlineListSkeleton rows={3} />
            ) : alternatives.length > 0 ? (
              <View style={{ maxHeight: 220, marginBottom: space.md }}>
                <ScrollView nestedScrollEnabled>
                  {alternatives.map((item, idx) => {
                    const ex = item.alternative;
                    // Tag generation
                    let tag = "RECOMMENDED";
                    let tagColor: string = theme.success;
                    let tagBg: string = theme.successBg;

                    if (idx === 1) {
                      tag = "MACHINE_FREE";
                      tagColor = theme.primary;
                      tagBg = theme.primaryLight;
                    } else if (idx === 2) {
                      tag = "BEGINNER_FRIENDLY";
                      tagColor = theme.warning;
                      tagBg = theme.warningBg;
                    }

                    return (
                      <TouchableOpacity
                        key={ex.id}
                        onPress={() => handleReplaceConfirm(ex)}
                        style={{
                          backgroundColor: theme.surfaceSecondary,
                          borderRadius: radius.md,
                          padding: space.md,
                          marginBottom: space.sm,
                          borderWidth: 1,
                          borderColor: theme.border,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ flex: 1, marginRight: space.sm }}>
                          <Typography variant="body" color={theme.textPrimary} weight="600">
                            {ex.name}
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
              <Typography variant="bodySmall" color={theme.textMuted} style={{ marginBottom: space.md }}>
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
              <Typography variant="caption" color={theme.textMuted} weight="700" style={{ marginBottom: space.sm }}>
                ALL EXERCISES
              </Typography>
              {allExercises
                .filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 30)
                .map((ex) => (
                  <View
                    key={ex.id}
                    style={{
                      backgroundColor: theme.surface,
                      borderRadius: radius.md,
                      padding: space.md,
                      marginBottom: space.xs,
                      borderWidth: 1,
                      borderColor: theme.border,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Typography variant="body" color={theme.textPrimary} weight="600">
                        {ex.name}
                      </Typography>
                    </View>

                    <View style={{ flexDirection: "row", gap: space.sm }}>
                      <TouchableOpacity
                        onPress={() => handleReplaceConfirm(ex)}
                        style={{
                          backgroundColor: theme.primary,
                          borderRadius: radius.sm,
                          paddingHorizontal: space.md,
                          paddingVertical: space.xs,
                        }}
                      >
                        <Typography variant="caption" color={theme.primaryText} weight="700">
                          SWAP
                        </Typography>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAddExercise(ex)}
                        style={{
                          backgroundColor: theme.surfaceSecondary,
                          borderRadius: radius.sm,
                          paddingHorizontal: space.md,
                          paddingVertical: space.xs,
                          borderWidth: 1,
                          borderColor: theme.border,
                        }}
                      >
                        <Typography variant="caption" color={theme.textSecondary} weight="700">
                          ADD
                        </Typography>
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
