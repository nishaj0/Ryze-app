import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  Check,
  Plus,
  Minus,
  Info,
  RefreshCw,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  Flame,
  ChevronRight,
  X,
  Layers,
} from "lucide-react-native";
import { HomeStackParamList } from "../../navigation/types";
import { useWorkoutStore } from "../../store/workoutStore";
import { getAlternatives } from "../../api/exercises";
import { Exercise, ExerciseQueueItem, SetLog } from "../../types";
import { getThumbnailUrl } from "../../utils/cloudinary";
import RestTimerModal from "../../components/workout/RestTimerModal";
import ExerciseDetailSheet from "../../components/ExerciseDetailSheet";

type Props = NativeStackScreenProps<HomeStackParamList, "WorkoutLogger">;

export default function ActiveWorkoutLoggerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { splitDayId, splitDayName, splitName, dayNumber, totalDays } = route.params || {};

  const {
    activeSession,
    logSet,
    deleteSet,
    replaceExercise,
    setCurrentExerciseIndex,
    setCurrentSetNumber,
    addExtraSet,
    setRestTimer,
    completeSession,
    discardSession,
  } = useWorkoutStore();

  const [currentWeight, setCurrentWeight] = useState<number>(20);
  const [currentReps, setCurrentReps] = useState<number>(10);
  const [weightStep, setWeightStep] = useState<number>(2.5);
  const [isWarmup, setIsWarmup] = useState<boolean>(false);
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);
  const [showRpePicker, setShowRpePicker] = useState<boolean>(false);

  // Modals
  const [restTimerVisible, setRestTimerVisible] = useState<boolean>(false);
  const [exerciseDetailVisible, setExerciseDetailVisible] = useState<boolean>(false);
  const [alternativeModalVisible, setAlternativeModalVisible] = useState<boolean>(false);
  const [alternativesList, setAlternativesList] = useState<Exercise[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);

  const queue = activeSession?.exerciseQueue || [];
  const currentIndex = activeSession?.currentExerciseIndex || 0;
  const currentItem: ExerciseQueueItem | undefined = queue[currentIndex];
  const currentExercise = currentItem?.exercise;

  // Initialize weight and reps based on target and past logs
  useEffect(() => {
    if (currentItem) {
      const logged = currentItem.loggedSets || [];
      if (logged.length > 0) {
        const lastSet = logged[logged.length - 1];
        if (lastSet.weightKg !== null && lastSet.weightKg !== undefined) {
          setCurrentWeight(lastSet.weightKg);
        }
        if (lastSet.reps !== null && lastSet.reps !== undefined) {
          setCurrentReps(lastSet.reps);
        }
      } else {
        const defaultWeight = activeSession?.isDeload ? 14 : 20;
        setCurrentWeight(defaultWeight);
        setCurrentReps(currentItem.targetRepsMin || 10);
      }
      setIsWarmup(false);
      setSelectedRpe(null);
    }
  }, [currentIndex, currentItem?.id]);

  const loggedCount = currentItem?.loggedSets?.length || 0;
  const targetSetsCount = currentItem?.targetSets || 3;
  const activeSetNumber = loggedCount + 1;

  // Weight stepper handlers
  const handleWeightDelta = (delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setCurrentWeight((prev) => Math.max(0, Math.round((prev + delta) * 10) / 10));
  };

  // Reps stepper handlers
  const handleRepsDelta = (delta: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setCurrentReps((prev) => Math.max(1, prev + delta));
  };

  // Log set handler
  const handleCompleteSet = () => {
    if (!currentItem) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    logSet(
      currentItem.id,
      currentWeight,
      currentReps,
      null,
      false,
      currentItem.wasReplaced,
      currentItem.replacedWithExerciseId,
      false,
      selectedRpe,
      isWarmup
    );

    // If more sets remain in this exercise or next exercise exists, show rest timer
    const isLastSetInExercise = loggedCount + 1 >= targetSetsCount;
    const isLastExerciseInQueue = currentIndex >= queue.length - 1;

    if (isLastSetInExercise && isLastExerciseInQueue) {
      // Workout completed!
      Alert.alert(
        "Workout Complete!",
        "You've completed all sets in this session. Ready to view your summary?",
        [
          {
            text: "Review Sets",
            style: "cancel",
          },
          {
            text: "Finish & Save",
            onPress: handleFinishWorkout,
          },
        ]
      );
    } else {
      setRestTimerVisible(true);
    }
  };

  // Advance to next set or exercise when rest timer finishes/starts
  const handleStartNextFromRest = () => {
    setRestTimerVisible(false);
    if (!currentItem) return;

    if (loggedCount >= targetSetsCount) {
      // Move to next exercise
      if (currentIndex < queue.length - 1) {
        setCurrentExerciseIndex(currentIndex + 1);
      }
    }
  };

  // Open alternatives
  const handleOpenAlternatives = async () => {
    if (!currentExercise?.id) return;
    try {
      setLoadingAlternatives(true);
      setAlternativeModalVisible(true);
      const res = await getAlternatives(currentExercise.id);
      setAlternativesList(res.alternatives || []);
    } catch (e) {
      console.error("Failed to load alternatives:", e);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleSelectAlternative = async (alt: Exercise) => {
    if (!currentItem) return;
    try {
      await replaceExercise(currentItem.id, alt, false);
      setAlternativeModalVisible(false);
      Alert.alert("Exercise Switched", `Switched to ${alt.name}`);
    } catch (e) {
      Alert.alert("Error", "Failed to switch exercise");
    }
  };

  // Finish Workout
  const handleFinishWorkout = async () => {
    try {
      setIsFinishing(true);
      const res = await completeSession();
      const sessionId = res?.session?.id || activeSession?.sessionId || "completed";
      navigation.navigate("WorkoutSummary", { sessionId });
    } catch (e) {
      console.error("Failed to finish workout:", e);
      Alert.alert("Error", "Failed to save workout session.");
    } finally {
      setIsFinishing(false);
    }
  };

  // Handle Quit / Discard
  const handleQuitWorkout = () => {
    Alert.alert(
      "End Session?",
      "Are you sure you want to finish or discard this active workout session?",
      [
        { text: "Continue Workout", style: "cancel" },
        {
          text: "Save Partial & Finish",
          onPress: handleFinishWorkout,
        },
        {
          text: "Discard Workout",
          style: "destructive",
          onPress: () => {
            discardSession();
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!activeSession || !currentItem) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c24914" />
        <Text style={styles.loadingText}>Loading active session...</Text>
      </SafeAreaView>
    );
  }

  const thumbnail = currentExercise?.images?.[0]?.url
    ? getThumbnailUrl(currentExercise.images[0].url)
    : null;

  // Next up calculations for rest timer
  const nextSetNum = loggedCount + 1 < targetSetsCount ? loggedCount + 2 : 1;
  const nextExName =
    loggedCount + 1 < targetSetsCount
      ? currentExercise?.name || "Next Set"
      : queue[currentIndex + 1]?.exercise?.name || "Next Exercise";

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleQuitWorkout} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#1a1917" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeSession.splitDayName || "Active Workout"}
          </Text>
          <Text style={styles.headerSubtitle}>
            Exercise {currentIndex + 1} of {queue.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleFinishWorkout}
          style={styles.finishHeaderBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.finishHeaderText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Horizontal Exercise Queue Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.exerciseQueueRow}
        >
          {queue.map((item, idx) => {
            const isSelected = idx === currentIndex;
            const isDone = (item.loggedSets?.length || 0) >= (item.targetSets || 3);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setCurrentExerciseIndex(idx)}
                style={[
                  styles.queuePill,
                  isSelected && styles.queuePillActive,
                  isDone && styles.queuePillDone,
                ]}
                activeOpacity={0.8}
              >
                {isDone ? (
                  <Check size={12} color="#ffffff" strokeWidth={3} style={{ marginRight: 4 }} />
                ) : (
                  <Text style={[styles.queueIndexText, isSelected && styles.queueIndexTextActive]}>
                    {idx + 1}.
                  </Text>
                )}
                <Text
                  style={[
                    styles.queuePillText,
                    isSelected && styles.queuePillTextActive,
                    isDone && styles.queuePillTextDone,
                  ]}
                  numberOfLines={1}
                >
                  {item.exercise?.name || `Exercise ${idx + 1}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3. Deload Indicator Badge (if active) */}
        {activeSession.isDeload && (
          <View style={styles.deloadBanner}>
            <Sparkles size={14} color="#c24914" />
            <Text style={styles.deloadBannerText}>Deload Protocol Active · -30% Volume Load</Text>
          </View>
        )}

        {/* 4. Current Exercise Card */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseCardHeader}>
            <View style={styles.exerciseMetaCol}>
              <Text style={styles.exerciseTitle} numberOfLines={2}>
                {currentExercise?.name || "Exercise"}
              </Text>
              <Text style={styles.exerciseTags}>
                {currentExercise?.level ? currentExercise.level.charAt(0).toUpperCase() + currentExercise.level.slice(1) : "Intermediate"} · {currentExercise?.category ? currentExercise.category.charAt(0).toUpperCase() + currentExercise.category.slice(1) : "Strength"} · {currentExercise?.equipment ? currentExercise.equipment.charAt(0).toUpperCase() + currentExercise.equipment.slice(1) : "Standard"}
              </Text>
            </View>

            {/* Posture Thumbnail / Info trigger */}
            <TouchableOpacity
              onPress={() => setExerciseDetailVisible(true)}
              style={styles.thumbnailBtn}
              activeOpacity={0.85}
            >
              {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.thumbnailImg} resizeMode="cover" />
              ) : (
                <Dumbbell size={24} color="#7a766c" />
              )}
              <View style={styles.infoIconBadge}>
                <Info size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* 5. Set Progress Pills Bar */}
          <View style={styles.setPillsContainer}>
            {Array.from({ length: targetSetsCount }).map((_, sIdx) => {
              const setNum = sIdx + 1;
              const setLog = currentItem.loggedSets?.[sIdx];
              const isSetDone = Boolean(setLog);
              const isCurrentActiveSet = setNum === activeSetNumber;

              return (
                <View
                  key={sIdx}
                  style={[
                    styles.setPill,
                    isSetDone && styles.setPillCompleted,
                    isCurrentActiveSet && styles.setPillActive,
                  ]}
                >
                  {isSetDone ? (
                    <View style={styles.setDoneRow}>
                      <Check size={13} color="#ffffff" strokeWidth={3} />
                      <Text style={styles.setPillDoneText}>
                        {setLog.weightKg || 0}kg × {setLog.reps}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.setPillText,
                        isCurrentActiveSet && styles.setPillTextActive,
                      ]}
                    >
                      Set {setNum}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* 6. Big Stepper Loggers (Thumb-Optimized Side-by-Side) */}
        <View style={styles.stepperSection}>
          <View style={styles.steppersRow}>
            {/* Weight Stepper Card */}
            <View style={styles.stepperCard}>
              <View style={styles.stepperHeader}>
                <Text style={styles.stepperTitle}>WEIGHT (KG)</Text>
                {/* Step Interval Switcher */}
                <TouchableOpacity
                  onPress={() =>
                    setWeightStep((prev) => (prev === 2.5 ? 5 : prev === 5 ? 1 : 2.5))
                  }
                  style={styles.stepToggle}
                  activeOpacity={0.7}
                >
                  <Text style={styles.stepToggleText}>±{weightStep}kg</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.stepperBigValue}>{currentWeight}</Text>

              <View style={styles.stepperButtonsRow}>
                <TouchableOpacity
                  onPress={() => handleWeightDelta(-weightStep)}
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                >
                  <Minus size={22} color="#1a1917" strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleWeightDelta(weightStep)}
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                >
                  <Plus size={22} color="#1a1917" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reps Stepper Card */}
            <View style={styles.stepperCard}>
              <View style={styles.stepperHeader}>
                <Text style={styles.stepperTitle}>REPS</Text>
                <Text style={styles.targetRepsHint}>
                  Target: {currentItem.targetRepsMin || 8}–{currentItem.targetRepsMax || 12}
                </Text>
              </View>

              <Text style={styles.stepperBigValue}>{currentReps}</Text>

              <View style={styles.stepperButtonsRow}>
                <TouchableOpacity
                  onPress={() => handleRepsDelta(-1)}
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                >
                  <Minus size={22} color="#1a1917" strokeWidth={2.5} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleRepsDelta(1)}
                  style={styles.stepperButton}
                  activeOpacity={0.7}
                >
                  <Plus size={22} color="#1a1917" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Warm-up & RPE Options */}
          <View style={styles.quickOptionsRow}>
            <TouchableOpacity
              onPress={() => setIsWarmup(!isWarmup)}
              style={[styles.warmupPill, isWarmup && styles.warmupPillActive]}
              activeOpacity={0.7}
            >
              <Flame size={14} color={isWarmup ? "#ffffff" : "#7a766c"} />
              <Text style={[styles.warmupPillText, isWarmup && styles.warmupPillTextActive]}>
                {isWarmup ? "Warm-up Set" : "Mark as Warm-up"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowRpePicker(!showRpePicker)}
              style={[styles.rpePill, selectedRpe !== null && styles.rpePillActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.rpePillText, selectedRpe !== null && styles.rpePillTextActive]}>
                {selectedRpe !== null ? `RPE ${selectedRpe}` : "Rate RPE"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Optional RPE Selector Grid */}
          {showRpePicker && (
            <View style={styles.rpeGrid}>
              {[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpeVal) => (
                <TouchableOpacity
                  key={rpeVal}
                  onPress={() => {
                    setSelectedRpe(rpeVal);
                    setShowRpePicker(false);
                  }}
                  style={[
                    styles.rpeOptionBtn,
                    selectedRpe === rpeVal && styles.rpeOptionBtnSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.rpeOptionText,
                      selectedRpe === rpeVal && styles.rpeOptionTextSelected,
                    ]}
                  >
                    {rpeVal}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 7. Bottom Utilities: Switch Exercise & Extra Set */}
        <View style={styles.utilitiesRow}>
          <TouchableOpacity
            onPress={handleOpenAlternatives}
            style={styles.utilityBtn}
            activeOpacity={0.7}
          >
            <RefreshCw size={15} color="#49453a" />
            <Text style={styles.utilityBtnText}>Replace Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => addExtraSet(currentItem.id)}
            style={styles.utilityBtn}
            activeOpacity={0.7}
          >
            <Plus size={15} color="#49453a" />
            <Text style={styles.utilityBtnText}>Add Extra Set</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 8. Fixed Bottom Primary Complete Set CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          onPress={handleCompleteSet}
          activeOpacity={0.88}
          style={styles.completeSetBtn}
        >
          <Check size={20} color="#ffffff" strokeWidth={3} style={{ marginRight: 8 }} />
          <Text style={styles.completeSetBtnText}>
            Complete Set {activeSetNumber} ({currentWeight}kg × {currentReps})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 9. Rest Timer Modal */}
      <RestTimerModal
        visible={restTimerVisible}
        initialSeconds={90}
        nextExerciseName={nextExName}
        nextSetNumber={nextSetNum}
        totalSets={targetSetsCount}
        onStartNextSet={handleStartNextFromRest}
        onSkip={() => setRestTimerVisible(false)}
        onClose={() => setRestTimerVisible(false)}
      />

      {/* 10. Exercise Form / Detail Sheet */}
      {currentExercise && (
        <ExerciseDetailSheet
          visible={exerciseDetailVisible}
          exercise={currentExercise}
          onClose={() => setExerciseDetailVisible(false)}
        />
      )}

      {/* 11. Alternatives Modal */}
      <Modal visible={alternativeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Replace Exercise</Text>
              <TouchableOpacity
                onPress={() => setAlternativeModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color="#7a766c" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select an alternative movement targeting the same muscle groups:
            </Text>

            {loadingAlternatives ? (
              <ActivityIndicator size="large" color="#c24914" style={{ marginVertical: 32 }} />
            ) : (
              <ScrollView style={{ maxHeight: 360, marginVertical: 12 }}>
                {alternativesList.map((alt) => (
                  <TouchableOpacity
                    key={alt.id}
                    onPress={() => handleSelectAlternative(alt)}
                    style={styles.alternativeItem}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.altName}>{alt.name}</Text>
                      <Text style={styles.altMeta}>
                        {alt.level || "Intermediate"} · {alt.equipment || "Standard"}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#c24914" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcf9f3",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fcf9f3",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    color: "#7a766c",
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 10,
  },
  headerTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1917",
  },
  headerSubtitle: {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    color: "#7a766c",
    marginTop: 2,
  },
  finishHeaderBtn: {
    backgroundColor: "#fbeee8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  finishHeaderText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    color: "#c24914",
  },
  scrollContent: {
    padding: 16,
  },
  exerciseQueueRow: {
    gap: 8,
    paddingBottom: 12,
  },
  queuePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dcdad4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 160,
  },
  queuePillActive: {
    borderColor: "#c24914",
    backgroundColor: "#fbeee8",
  },
  queuePillDone: {
    backgroundColor: "#2d6a4f",
    borderColor: "#2d6a4f",
  },
  queueIndexText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    color: "#7a766c",
    marginRight: 4,
  },
  queueIndexTextActive: {
    color: "#c24914",
  },
  queuePillText: {
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    color: "#1a1917",
  },
  queuePillTextActive: {
    color: "#c24914",
    fontFamily: "Outfit_700Bold",
  },
  queuePillTextDone: {
    color: "#ffffff",
    fontFamily: "Outfit_600SemiBold",
  },
  deloadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fbeee8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  deloadBannerText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    color: "#c24914",
  },
  exerciseCard: {
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
  exerciseCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  exerciseMetaCol: {
    flex: 1,
    marginRight: 12,
  },
  exerciseTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1917",
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  exerciseTags: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#7a766c",
  },
  thumbnailBtn: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
  },
  infoIconBadge: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(26, 25, 23, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  setPillsContainer: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f6f3ed",
    paddingTop: 12,
  },
  setPill: {
    flex: 1,
    backgroundColor: "#f6f3ed",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e2dc",
  },
  setPillActive: {
    borderColor: "#c24914",
    backgroundColor: "#fbeee8",
  },
  setPillCompleted: {
    backgroundColor: "#2d6a4f",
    borderColor: "#2d6a4f",
  },
  setPillText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    color: "#7a766c",
  },
  setPillTextActive: {
    color: "#c24914",
    fontFamily: "Outfit_700Bold",
  },
  setDoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  setPillDoneText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    color: "#ffffff",
  },
  stepperSection: {
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
  steppersRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  stepperCard: {
    flex: 1,
    backgroundColor: "#f6f3ed",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e2dc",
    padding: 12,
    alignItems: "center",
  },
  stepperHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  stepperTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "#7a766c",
    textTransform: "uppercase",
  },
  stepToggle: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  stepToggleText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    color: "#1a1917",
  },
  targetRepsHint: {
    fontFamily: "Outfit_500Medium",
    fontSize: 10,
    color: "#7a766c",
  },
  stepperBigValue: {
    fontFamily: "Outfit_700Bold",
    fontSize: 38,
    fontWeight: "700",
    color: "#1a1917",
    letterSpacing: -1,
    marginVertical: 4,
  },
  stepperButtonsRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginTop: 6,
  },
  stepperButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickOptionsRow: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#f6f3ed",
    paddingTop: 12,
  },
  warmupPill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  warmupPillActive: {
    backgroundColor: "#c24914",
    borderColor: "#c24914",
  },
  warmupPillText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    color: "#49453a",
  },
  warmupPillTextActive: {
    color: "#ffffff",
  },
  rpePill: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
    alignItems: "center",
    justifyContent: "center",
  },
  rpePillActive: {
    backgroundColor: "#2d6a4f",
    borderColor: "#2d6a4f",
  },
  rpePillText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    color: "#49453a",
  },
  rpePillTextActive: {
    color: "#ffffff",
  },
  rpeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f6f3ed",
  },
  rpeOptionBtn: {
    width: "22%",
    height: 34,
    borderRadius: 8,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  rpeOptionBtnSelected: {
    backgroundColor: "#2d6a4f",
    borderColor: "#2d6a4f",
  },
  rpeOptionText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 12,
    color: "#1a1917",
  },
  rpeOptionTextSelected: {
    color: "#ffffff",
  },
  utilitiesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  utilityBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dcdad4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  utilityBtnText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 12,
    color: "#49453a",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#dcdad4",
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  completeSetBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#c24914",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#c24914",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  completeSetBtnText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 25, 23, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 20,
    color: "#1a1917",
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontFamily: "Outfit_400Regular",
    fontSize: 13,
    color: "#7a766c",
    marginBottom: 12,
  },
  alternativeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f3ed",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 14,
    marginBottom: 8,
  },
  altName: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    color: "#1a1917",
    marginBottom: 2,
  },
  altMeta: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#7a766c",
  },
});
