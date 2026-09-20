import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, ChevronUp, ChevronDown, Play, Dumbbell, Sparkles } from "lucide-react-native";
import { HomeStackParamList } from "../../navigation/types";
import { useWorkoutStore } from "../../store/workoutStore";
import { getActiveSplit } from "../../api/splits";
import { ExerciseQueueItem, SplitDay } from "../../types";
import { getThumbnailUrl } from "../../utils/cloudinary";
import { WORKOUT_CONSTANTS, COLORS, FONTS } from "../../constants";

type Props = NativeStackScreenProps<HomeStackParamList, "PreWorkoutSetup">;

export default function PreWorkoutSetupScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { splitDayId, splitDayName, splitName, dayNumber, totalDays } = route.params || {};

  const {
    activeSession,
    initPreStartSession,
    reorderQueue,
    setSessionDeload,
    beginSession,
  } = useWorkoutStore();

  const [loading, setLoading] = useState(false);
  const [isDeload, setIsDeload] = useState(false);

  useEffect(() => {
    // If active session is not yet initialized or for a different day, initialize it
    if (!activeSession || activeSession.splitDayId !== splitDayId || activeSession.exerciseQueue.length === 0) {
      loadDayAndInit();
    } else {
      setIsDeload(Boolean(activeSession.isDeload));
    }
  }, [splitDayId]);

  const loadDayAndInit = async () => {
    try {
      setLoading(true);
      const res = await getActiveSplit();
      if (res.userSplit && res.userSplit.split?.days?.length > 0) {
        const day = res.userSplit.split.days.find((d: SplitDay) => d.id === splitDayId) || res.userSplit.split.days[0];
        initPreStartSession(day, splitName || res.userSplit.split.name, dayNumber || day.dayNumber, totalDays || res.userSplit.split.days.length);
      } else {
        // Fallback default day
        initPreStartSession(
          { id: splitDayId || "day-1", name: splitDayName || "Full Body Power", exercises: [] },
          splitName || "Full Body Split",
          dayNumber || 1,
          totalDays || 3
        );
      }
    } catch (e) {
      console.error("[PreWorkoutSetup] Failed to initialize split day:", e);
      initPreStartSession(
        { id: splitDayId || "day-1", name: splitDayName || "Full Body Power", exercises: [] },
        splitName || "Full Body Split",
        dayNumber || 1,
        totalDays || 3
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeload = (value: boolean) => {
    setIsDeload(value);
    setSessionDeload(value);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    reorderQueue(index, index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (!activeSession || index >= activeSession.exerciseQueue.length - 1) return;
    reorderQueue(index, index + 1);
  };

  const handleBeginWorkout = () => {
    beginSession();
    navigation.navigate("WorkoutLogger", {
      splitDayId: splitDayId || activeSession?.splitDayId || "",
      splitDayName: splitDayName || activeSession?.splitDayName || "Workout",
      splitName: splitName || activeSession?.splitName || "",
      dayNumber: dayNumber || activeSession?.dayNumber || 0,
      totalDays: totalDays || activeSession?.totalDays || 0,
    });
  };

  const queue = activeSession?.exerciseQueue || [];
  const exerciseCount = queue.length;
  const totalSets = queue.reduce((sum, item) => sum + (item.targetSets || 3), 0);
  const estimatedVolumeKg = totalSets * 10 * (isDeload ? 28 : 40); // Estimated tonnage in kg

  if (loading || !activeSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#c24914" />
        <Text style={styles.loadingText}>Preparing routine setup...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#1a1917" />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={styles.headerTitle}>Routine Setup</Text>
          <Text style={styles.headerSubtitle}>
            {exerciseCount} Exercises · {totalSets} Sets · {(estimatedVolumeKg / 1000).toFixed(1)}k kg Volume
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Deload Mode Card */}
        <View style={styles.deloadCard}>
          <View style={styles.deloadLeft}>
            <View style={styles.deloadIconWrapper}>
              <Sparkles size={18} color="#c24914" />
            </View>
            <View>
              <View style={styles.deloadTitleRow}>
                <Text style={styles.deloadTitle}>Deload Mode</Text>
                {isDeload && (
                  <View style={styles.deloadBadge}>
                    <Text style={styles.deloadBadgeText}>{WORKOUT_CONSTANTS.DELOAD_PERCENT_LABEL}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.deloadDesc}>
                {isDeload
                  ? "Target weights reduced by 30% for strategic recovery"
                  : "Standard training intensity with target progressive overload"}
              </Text>
            </View>
          </View>

          <Switch
            value={isDeload}
            onValueChange={handleToggleDeload}
            trackColor={{ false: "#dcdad4", true: "#c24914" }}
            thumbColor="#ffffff"
          />
        </View>

        {/* 3. Section Label */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Exercise Order</Text>
          <Text style={styles.sectionHint}>Use arrows to adjust exercise sequence</Text>
        </View>

        {/* 4. Reorderable Exercise Cards */}
        {queue.map((item: ExerciseQueueItem, index: number) => {
          const ex = item.exercise;
          const thumbnail = ex?.images?.[0]?.url ? getThumbnailUrl(ex.images[0].url) : null;
          const targetReps = `${item.targetRepsMin || 8}–${item.targetRepsMax || 12}`;
          const targetWeight = isDeload ? "10–12 kg" : "14–16 kg";

          return (
            <View key={item.id} style={styles.exerciseCard}>
              {/* Left Thumbnail or Placeholder */}
              <View style={styles.thumbnailWrapper}>
                {thumbnail ? (
                  <Image source={{ uri: thumbnail }} style={styles.thumbnailImg} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Dumbbell size={20} color="#7a766c" />
                  </View>
                )}
                <View style={styles.orderIndexBadge}>
                  <Text style={styles.orderIndexText}>{index + 1}</Text>
                </View>
              </View>

              {/* Middle Exercise Info */}
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName} numberOfLines={1}>
                  {ex?.name || "Exercise"}
                </Text>
                <Text style={styles.exerciseMeta}>
                  {item.targetSets || 3} sets × {targetReps} reps · {targetWeight}
                </Text>
                <View style={styles.equipmentTag}>
                  <Text style={styles.equipmentTagText}>
                    {ex?.equipment ? ex.equipment.charAt(0).toUpperCase() + ex.equipment.slice(1) : "Bodyweight"}
                  </Text>
                </View>
              </View>

              {/* Right Up/Down Controls */}
              <View style={styles.reorderControls}>
                <TouchableOpacity
                  onPress={() => handleMoveUp(index)}
                  disabled={index === 0}
                  style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                  activeOpacity={0.7}
                >
                  <ChevronUp size={18} color={index === 0 ? "#dcdad4" : "#1a1917"} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleMoveDown(index)}
                  disabled={index === queue.length - 1}
                  style={[styles.reorderButton, index === queue.length - 1 && styles.reorderButtonDisabled]}
                  activeOpacity={0.7}
                >
                  <ChevronDown size={18} color={index === queue.length - 1 ? "#dcdad4" : "#1a1917"} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 5. Fixed Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          onPress={handleBeginWorkout}
          activeOpacity={0.88}
          style={styles.beginButton}
        >
          <Play size={20} color="#ffffff" fill="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.beginButtonText}>Begin Workout</Text>
        </TouchableOpacity>
      </View>
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
  headerTitleCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1917",
  },
  headerSubtitle: {
    fontFamily: "Outfit_500Medium",
    fontSize: 11,
    color: "#7a766c",
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
  },
  deloadCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 16,
    marginBottom: 20,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  deloadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  deloadIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fbeee8",
    alignItems: "center",
    justifyContent: "center",
  },
  deloadTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  deloadTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1917",
  },
  deloadBadge: {
    backgroundColor: "#fbeee8",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  deloadBadgeText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    fontWeight: "700",
    color: "#c24914",
  },
  deloadDesc: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#7a766c",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    color: "#1a1917",
  },
  sectionHint: {
    fontFamily: "Outfit_400Regular",
    fontSize: 11,
    color: "#7a766c",
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dcdad4",
    padding: 12,
    marginBottom: 10,
    shadowColor: "#1a1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  thumbnailWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f6f3ed",
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  orderIndexBadge: {
    position: "absolute",
    bottom: 2,
    left: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(26, 25, 23, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  orderIndexText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    color: "#ffffff",
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  exerciseName: {
    fontFamily: "Outfit_700Bold",
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1917",
    marginBottom: 2,
  },
  exerciseMeta: {
    fontFamily: "Outfit_400Regular",
    fontSize: 12,
    color: "#7a766c",
    marginBottom: 4,
  },
  equipmentTag: {
    alignSelf: "flex-start",
    backgroundColor: "#f6f3ed",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  equipmentTagText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 10,
    color: "#7a766c",
  },
  reorderControls: {
    gap: 4,
    paddingLeft: 4,
  },
  reorderButton: {
    width: 32,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#f6f3ed",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dcdad4",
  },
  reorderButtonDisabled: {
    opacity: 0.35,
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
  beginButton: {
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
  beginButtonText: {
    fontFamily: "Outfit_700Bold",
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
});
