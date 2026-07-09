import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Switch, Modal, Alert, ActivityIndicator, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../navigation/types";
import { createSplit, setActiveSplit, getSplit, updateSplit } from "../../api/splits";
import { listExercises, getDistinctMuscles, getExercise } from "../../api/exercises";
import { Exercise } from "../../types";
import { Typography, Card, Icon, Button, Input, InlineListSkeleton, ExerciseDetailSheet } from "../../components";
import { useTheme } from "../../theme/themeStore";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<ProfileStackParamList, "CustomSplit">;

interface DayConfig {
  id?: string;
  dayNumber: number;
  name: string;
  isRest: boolean;
  muscleGroups: string[];
  exercises: {
    id?: string;
    exerciseId: string;
    name: string;
    targetSets: number;
    targetRepsMin: number;
    targetRepsMax: number;
  }[];
}

const MIN_DAYS = 1;
const MAX_DAYS = 14;
const EXERCISES_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function CustomSplitScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const splitId = route.params?.splitId;
  const fromPrebuilt = route.params?.fromPrebuilt;
  const isEditMode = !!splitId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [days, setDays] = useState<DayConfig[]>([]);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [loadingSplit, setLoadingSplit] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // Exercise library state (paginated)
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [hasMoreExercises, setHasMoreExercises] = useState(true);
  const [exercisePage, setExercisePage] = useState(1);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [loadingMuscles, setLoadingMuscles] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Exercise detail sheet state
  const [exerciseDetailVisible, setExerciseDetailVisible] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);

  // Load existing split in edit mode
  useEffect(() => {
    if (!isEditMode || !splitId) return;
    loadExistingSplit();
  }, [splitId]);

  const loadExistingSplit = async () => {
    try {
      const res = await getSplit(splitId!);
      const s = res.split;
      setName(s.name);
      setDescription(s.description || "");
      setDaysPerWeek(s.daysPerWeek);
      const loadedDays: DayConfig[] = s.days.map((d) => ({
        id: d.id,
        dayNumber: d.dayNumber,
        name: d.name,
        isRest: d.isRest,
        muscleGroups: (() => {
          try { return JSON.parse(d.muscleGroups); } catch { return []; }
        })(),
        exercises: (d.exercises || []).map((ex) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          name: ex.exercise.name,
          targetSets: ex.targetSets,
          targetRepsMin: ex.targetRepsMin,
          targetRepsMax: ex.targetRepsMax,
        })),
      }));
      setDays(loadedDays);
      setActiveDayIdx(0);
    } catch (err) {
      Alert.alert("Error", "Failed to load split for editing");
      navigation.goBack();
    } finally {
      setLoadingSplit(false);
    }
  };

  // Initialize days when daysPerWeek changes (create mode only)
  useEffect(() => {
    if (isEditMode) return;
    setDays((prev) => {
      if (prev.length === daysPerWeek) return prev;
      const newDays: DayConfig[] = [];
      for (let i = 1; i <= daysPerWeek; i++) {
        if (prev[i - 1]) {
          newDays.push(prev[i - 1]);
        } else {
          newDays.push({
            dayNumber: i,
            name: `Day ${i}`,
            isRest: false,
            muscleGroups: [],
            exercises: [],
          });
        }
      }
      return newDays;
    });
    setActiveDayIdx(0);
  }, [daysPerWeek, isEditMode]);

  useEffect(() => {
    loadMuscleGroups();
  }, []);

  const loadMuscleGroups = async () => {
    setLoadingMuscles(true);
    try {
      const res = await getDistinctMuscles();
      setMuscleGroups(res.muscles);
    } catch (err) {
      console.error("[CustomSplit] failed to load muscle groups:", err);
    } finally {
      setLoadingMuscles(false);
    }
  };

  const loadExercises = useCallback(async (page: number, reset: boolean = false) => {
    setLoadingExercises(true);
    try {
      const params: any = { page, limit: EXERCISES_PER_PAGE };
      if (searchQuery) params.search = searchQuery;
      if (selectedMuscleFilter) params.muscle = selectedMuscleFilter;

      const res = await listExercises(params);
      if (reset) {
        setExercises(res.exercises);
      } else {
        setExercises((prev) => [...prev, ...res.exercises]);
      }
      setHasMoreExercises(res.exercises.length === EXERCISES_PER_PAGE);
      setExercisePage(page);
    } catch (err) {
      console.error("[CustomSplit] failed to load exercises:", err);
    } finally {
      setLoadingExercises(false);
    }
  }, [searchQuery, selectedMuscleFilter]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadExercises(1, true);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleMuscleFilterChange = (muscle: string | null) => {
    setSelectedMuscleFilter(muscle);
    loadExercises(1, true);
  };

  const loadMoreExercises = () => {
    if (hasMoreExercises && !loadingExercises) {
      loadExercises(exercisePage + 1);
    }
  };

  const handleDaysPerWeekChange = (newCount: number) => {
    if (newCount < MIN_DAYS || newCount > MAX_DAYS) return;

    if (isEditMode && newCount < days.length) {
      const removedDays = days.slice(newCount);
      const removedNames = removedDays.map((d) => d.name).join(", ");
      Alert.alert(
        "Remove Day(s)?",
        `Removing ${removedNames}. Any workout sessions logged for these days will be permanently deleted. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              setDaysPerWeek(newCount);
              setDays((prev) => prev.slice(0, newCount));
              if (activeDayIdx >= newCount) setActiveDayIdx(newCount - 1);
            },
          },
        ]
      );
    } else {
      setDaysPerWeek(newCount);
      if (isEditMode) {
        setDays((prev) => {
          const newDays = [...prev];
          while (newDays.length < newCount) {
            newDays.push({
              dayNumber: newDays.length + 1,
              name: `Day ${newDays.length + 1}`,
              isRest: false,
              muscleGroups: [],
              exercises: [],
            });
          }
          return newDays.slice(0, newCount);
        });
      }
      if (activeDayIdx >= newCount) setActiveDayIdx(newCount - 1);
    }
  };

  const handleReorderDay = (idx: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= days.length) return;
    const updated = [...days];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    updated.forEach((d, i) => (d.dayNumber = i + 1));
    setDays(updated);
    setActiveDayIdx(newIdx);
  };

  const handleDeleteDay = (idx: number) => {
    if (days.length <= 1) {
      Alert.alert("Cannot Remove", "You must have at least one day.");
      return;
    }
    const dayName = days[idx].name;
    Alert.alert(
      "Remove Day?",
      `Removing "${dayName}". Any workout sessions logged for this day will be permanently deleted. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const updated = days.filter((_, i) => i !== idx);
            updated.forEach((d, i) => (d.dayNumber = i + 1));
            setDays(updated);
            setDaysPerWeek(updated.length);
            if (activeDayIdx >= updated.length) setActiveDayIdx(updated.length - 1);
          },
        },
      ]
    );
  };

  const handleToggleRest = (idx: number, isRest: boolean) => {
    const updated = [...days];
    updated[idx].isRest = isRest;
    if (isRest) {
      updated[idx].muscleGroups = [];
      updated[idx].exercises = [];
    }
    setDays(updated);
  };

  const handleToggleMuscle = (idx: number, muscle: string) => {
    const updated = [...days];
    const mGroups = updated[idx].muscleGroups;
    if (mGroups.includes(muscle)) {
      updated[idx].muscleGroups = mGroups.filter((m) => m !== muscle);
    } else {
      updated[idx].muscleGroups = [...mGroups, muscle];
    }
    setDays(updated);
  };

  const handleAddExerciseToDay = (ex: Exercise) => {
    const updated = [...days];
    if (updated[activeDayIdx].exercises.some((e) => e.exerciseId === ex.id)) {
      Alert.alert("Already Added", `${ex.name} is already in this day's workout.`);
      return;
    }

    updated[activeDayIdx].exercises.push({
      exerciseId: ex.id,
      name: ex.name,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
    });
    setDays(updated);
    setExerciseModalVisible(false);
  };

  const handleExerciseTap = async (ex: { exerciseId: string; name: string }) => {
    try {
      const res = await getExercise(ex.exerciseId);
      setSelectedExerciseDetail(res.exercise);
      setExerciseDetailVisible(true);
    } catch (err) {
      console.error("[CustomSplit] failed to load exercise details:", err);
      Alert.alert("Error", "Failed to load exercise details");
    }
  };

  const handleRemoveExercise = (dayIdx: number, exId: string) => {
    const updated = [...days];
    updated[dayIdx].exercises = updated[dayIdx].exercises.filter((e) => e.exerciseId !== exId);
    setDays(updated);
  };

  const handleUpdateExerciseTarget = (
    dayIdx: number,
    exId: string,
    field: "targetSets" | "targetRepsMin" | "targetRepsMax",
    val: number
  ) => {
    if (val < 1) return;
    const updated = [...days];
    updated[dayIdx].exercises = updated[dayIdx].exercises.map((e) =>
      e.exerciseId === exId ? { ...e, [field]: val } : e
    );
    setDays(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please provide a name for your split.");
      return;
    }

    for (const d of days) {
      if (!d.isRest && d.exercises.length === 0) {
        Alert.alert(
          "Validation Error",
          `Please add at least one exercise or mark ${d.name} as a rest day.`
        );
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name,
        description: description || undefined,
        daysPerWeek,
        days: days.map((d) => ({
          id: d.id,
          name: d.name,
          isRest: d.isRest,
          muscleGroups: d.muscleGroups,
          exercises: d.isRest
            ? []
            : d.exercises.map((e) => ({
                id: e.id,
                exerciseId: e.exerciseId,
                targetSets: e.targetSets,
                targetRepsMin: e.targetRepsMin,
                targetRepsMax: e.targetRepsMax,
              })),
        })),
      };

      if (fromPrebuilt) {
        const res = await createSplit({
          ...payload,
          name: name.endsWith(" (Edited)") ? name : `${name} (Edited)`,
          type: "CUSTOM",
        });
        await setActiveSplit(res.split.id);
        Alert.alert("Success", "Your edited split has been created and activated!", [
          { text: "OK", onPress: () => navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" }) },
        ]);
      } else if (isEditMode) {
        await updateSplit(splitId!, {
          ...payload,
          type: "CUSTOM",
        });
        Alert.alert("Success", "Split updated successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        const res = await createSplit({ ...payload, type: "CUSTOM" });
        await setActiveSplit(res.split.id);
        Alert.alert("Success", "Custom split created and activated!", [
          { text: "OK", onPress: () => navigation.getParent()?.getParent()?.navigate("Home", { screen: "HomeMain" }) },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", fromPrebuilt ? "Failed to create edited split" : isEditMode ? "Failed to update split" : "Failed to create custom split");
    } finally {
      setSaving(false);
    }
  };

  // Load exercises when modal opens
  useEffect(() => {
    if (exerciseModalVisible) {
      loadExercises(1, true);
    }
  }, [exerciseModalVisible]);

  if (loadingSplit) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Typography variant="body" color={theme.textSecondary} style={{ marginTop: space.md }}>
            Loading split...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["top"]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={{ marginBottom: space.lg }}>
          <Typography variant="caption" color={theme.textMuted} weight="600">
            {isEditMode ? "EDITOR" : "CREATOR"}
          </Typography>
          <Typography variant="heading1" color={theme.textPrimary} style={{ marginTop: space.xs }}>
            {fromPrebuilt ? "Edit Prebuilt Split" : isEditMode ? "Edit Split" : "Custom Split"}
          </Typography>
          {fromPrebuilt && (
            <Typography variant="bodySmall" color={theme.textSecondary} style={{ marginTop: space.sm }}>
              Saving will create your own editable copy of this prebuilt split.
            </Typography>
          )}
        </View>

        {/* Name & Desc */}
        <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
          <Input
            label="Split Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. My Hypertrophy Split"
            icon={<Icon name="PenTool" size={20} color={theme.textMuted} />}
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Focused on upper body width"
            icon={<Icon name="AlignLeft" size={20} color={theme.textMuted} />}
            multiline
            numberOfLines={4}
            containerStyle={{ marginBottom: 0 }}
          />
        </Card>

        {/* Days Select - Stepper */}
        <Card shadow="sm" style={{ padding: space.lg, marginBottom: space.lg }}>
          <Typography variant="label" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
            DAYS PER WEEK
          </Typography>
          <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
            <TouchableOpacity
              onPress={() => handleDaysPerWeekChange(daysPerWeek - 1)}
              disabled={daysPerWeek <= MIN_DAYS}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: daysPerWeek <= MIN_DAYS ? theme.surfaceTertiary : theme.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="heading2" color={daysPerWeek <= MIN_DAYS ? theme.textMuted : theme.primaryText}>
                -
              </Typography>
            </TouchableOpacity>
            <Typography variant="heading1" color={theme.textPrimary} style={{ minWidth: 50, textAlign: "center" }}>
              {daysPerWeek}
            </Typography>
            <TouchableOpacity
              onPress={() => handleDaysPerWeekChange(daysPerWeek + 1)}
              disabled={daysPerWeek >= MAX_DAYS}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                backgroundColor: daysPerWeek >= MAX_DAYS ? theme.surfaceTertiary : theme.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="heading2" color={daysPerWeek >= MAX_DAYS ? theme.textMuted : theme.primaryText}>
                +
              </Typography>
            </TouchableOpacity>
            <Typography variant="caption" color={theme.textMuted} style={{ marginLeft: space.xs }}>
              ({MIN_DAYS}-{MAX_DAYS} days)
            </Typography>
          </View>
        </Card>

        {/* Config area per Day */}
        <Typography variant="heading3" color={theme.textPrimary} style={{ marginBottom: space.sm }}>
          Configure Days
        </Typography>

        {/* Day Selector Tabs with Reorder */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.md }}>
          <View style={{ flexDirection: "row", gap: space.sm }}>
            {days.map((d, idx) => {
              const isActive = activeDayIdx === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setActiveDayIdx(idx)}
                  style={{
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm,
                    borderRadius: radius.full,
                    backgroundColor: isActive ? theme.primaryLight : theme.surface,
                    borderWidth: 1,
                    borderColor: isActive ? theme.primary : theme.border,
                  }}
                >
                  <Typography variant="bodySmall" color={isActive ? theme.primary : theme.textPrimary} weight="700">
                    Day {d.dayNumber} {d.isRest ? "💤" : "🔥"}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Selected Day Card */}
        {days[activeDayIdx] && (
          <Card shadow="sm" style={{ padding: space.lg }}>
            {/* Day header with reorder + delete controls */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
              <Typography variant="heading2" color={theme.textPrimary}>
                {days[activeDayIdx].name}
              </Typography>
              <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                {/* Reorder up */}
                <TouchableOpacity
                  onPress={() => handleReorderDay(activeDayIdx, "up")}
                  disabled={activeDayIdx === 0}
                  style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.surfaceSecondary, alignItems: "center", justifyContent: "center", opacity: activeDayIdx === 0 ? 0.4 : 1 }}
                >
                  <Icon name="ChevronUp" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                {/* Reorder down */}
                <TouchableOpacity
                  onPress={() => handleReorderDay(activeDayIdx, "down")}
                  disabled={activeDayIdx === days.length - 1}
                  style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.surfaceSecondary, alignItems: "center", justifyContent: "center", opacity: activeDayIdx === days.length - 1 ? 0.4 : 1 }}
                >
                  <Icon name="ChevronDown" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
                {/* Delete day (edit mode only) */}
                {isEditMode && (
                  <TouchableOpacity
                    onPress={() => handleDeleteDay(activeDayIdx)}
                    style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.surfaceSecondary, alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon name="Trash2" size={14} color={theme.danger} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Rest toggle */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
              <Typography variant="bodySmall" color={theme.textSecondary}>
                Rest Day?
              </Typography>
              <Switch
                value={days[activeDayIdx].isRest}
                onValueChange={(val) => handleToggleRest(activeDayIdx, val)}
                trackColor={{ false: theme.surfaceTertiary, true: theme.primary }}
                thumbColor={theme.surface}
              />
            </View>

            {/* Custom Day Name */}
            <Input
              label="Day Title"
              value={days[activeDayIdx].name}
              onChangeText={(t) => {
                const updated = [...days];
                updated[activeDayIdx].name = t;
                setDays(updated);
              }}
              placeholder={`Day ${activeDayIdx + 1} Name`}
            />

            {!days[activeDayIdx].isRest && (
              <>
                {/* Muscle Target Selection */}
                <Typography variant="label" color={theme.textSecondary} style={{ marginBottom: space.sm }}>
                  TARGET MUSCLE GROUPS
                </Typography>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs, marginBottom: space.lg }}>
                  {muscleGroups.map((mg) => {
                    const isSelected = days[activeDayIdx].muscleGroups.includes(mg);
                    return (
                      <TouchableOpacity
                        key={mg}
                        onPress={() => handleToggleMuscle(activeDayIdx, mg)}
                        style={{
                          backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.primary : theme.border,
                          borderWidth: 1,
                          borderRadius: 8,
                          paddingHorizontal: space.md,
                          paddingVertical: space.sm,
                        }}
                      >
                        <Typography variant="caption" color={isSelected ? theme.primary : theme.textPrimary} weight="600" style={{ textTransform: "capitalize" }}>
                          {mg}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Exercises list for this Day */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.sm }}>
                  <Typography variant="label" color={theme.textSecondary}>
                    EXERCISES ({days[activeDayIdx].exercises.length})
                  </Typography>
                  <TouchableOpacity
                    onPress={() => {
                      setExerciseModalVisible(true);
                      setSearchQuery("");
                      setSelectedMuscleFilter(days[activeDayIdx].muscleGroups[0] || null);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <Icon name="Plus" size={14} color={theme.primary} />
                    <Typography variant="bodySmall" color={theme.primary} weight="600">
                      Add
                    </Typography>
                  </TouchableOpacity>
                </View>

                {days[activeDayIdx].exercises.length === 0 ? (
                  <View style={{ padding: space.xl, alignItems: "center", borderWidth: 1, borderColor: theme.border, borderStyle: "dashed", borderRadius: radius.md }}>
                    <Typography variant="bodySmall" color={theme.textMuted}>
                      No exercises added yet. Tap "Add" above.
                    </Typography>
                  </View>
                ) : (
                  <View style={{ gap: space.sm }}>
                    {days[activeDayIdx].exercises.map((ex) => (
                      <Card key={ex.exerciseId} style={{ backgroundColor: theme.surfaceSecondary, padding: space.md }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
                          <TouchableOpacity
                            onPress={() => handleExerciseTap(ex)}
                            style={{ flex: 1, marginRight: space.sm }}
                          >
                            <Typography variant="body" color={theme.primary} weight="700">
                              {ex.name}
                            </Typography>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleRemoveExercise(activeDayIdx, ex.exerciseId)}>
                            <Icon name="X" size={16} color={theme.danger} />
                          </TouchableOpacity>
                        </View>

                        {/* Sets / Reps targets */}
                        <View style={{ flexDirection: "row", gap: space.md }}>
                          <View style={{ flex: 1 }}>
                            <Typography variant="caption" color={theme.textMuted} style={{ marginBottom: 4 }}>SETS</Typography>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                              <TouchableOpacity onPress={() => handleUpdateExerciseTarget(activeDayIdx, ex.exerciseId, "targetSets", ex.targetSets - 1)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}>
                                <Typography variant="body" color={theme.textPrimary}>-</Typography>
                              </TouchableOpacity>
                              <Typography variant="body" color={theme.textPrimary} weight="700">{ex.targetSets}</Typography>
                              <TouchableOpacity onPress={() => handleUpdateExerciseTarget(activeDayIdx, ex.exerciseId, "targetSets", ex.targetSets + 1)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}>
                                <Typography variant="body" color={theme.textPrimary}>+</Typography>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View style={{ flex: 1.5 }}>
                            <Typography variant="caption" color={theme.textMuted} style={{ marginBottom: 4 }}>REPS RANGE</Typography>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <View style={{ flex: 1 }}>
                                <Input
                                  value={String(ex.targetRepsMin)}
                                  onChangeText={(t) => handleUpdateExerciseTarget(activeDayIdx, ex.exerciseId, "targetRepsMin", Number(t) || 1)}
                                  placeholder="Min"
                                  keyboardType="number-pad"
                                  containerStyle={{ marginBottom: 0 }}
                                  style={{ paddingVertical: 4, height: 32, textAlign: "center" }}
                                />
                              </View>
                              <Typography variant="bodySmall" color={theme.textMuted}>-</Typography>
                              <View style={{ flex: 1 }}>
                                <Input
                                  value={String(ex.targetRepsMax)}
                                  onChangeText={(t) => handleUpdateExerciseTarget(activeDayIdx, ex.exerciseId, "targetRepsMax", Number(t) || 1)}
                                  placeholder="Max"
                                  keyboardType="number-pad"
                                  containerStyle={{ marginBottom: 0 }}
                                  style={{ paddingVertical: 4, height: 32, textAlign: "center" }}
                                />
                              </View>
                            </View>
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                )}
              </>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border, padding: space.lg }}>
        <Button
          title={fromPrebuilt ? "Save Edited Copy" : isEditMode ? "Save Changes" : "Create & Activate Split"}
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          variant="primary"
          size="lg"
          icon={<Icon name="Save" size={20} color={theme.primaryText} />}
        />
      </View>

      {/* Add Exercise Modal */}
      <Modal visible={exerciseModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: theme.bgOverlay }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: space.lg, maxHeight: "80%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
              <Typography variant="heading2" color={theme.textPrimary}>
                Select Exercise
              </Typography>
              <TouchableOpacity onPress={() => setExerciseModalVisible(false)}>
                <Icon name="X" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Input
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholder="Search exercise library..."
              icon={<Icon name="Search" size={18} color={theme.textMuted} />}
            />

            {/* Muscle Filter Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: space.md, flexGrow: 0 }}>
              <View style={{ flexDirection: "row", gap: space.xs }}>
                <TouchableOpacity
                  onPress={() => handleMuscleFilterChange(null)}
                  style={{
                    backgroundColor: selectedMuscleFilter === null ? theme.primaryLight : theme.surfaceSecondary,
                    paddingHorizontal: space.md,
                    paddingVertical: space.sm,
                    borderRadius: radius.full,
                  }}
                >
                  <Typography variant="caption" color={selectedMuscleFilter === null ? theme.primary : theme.textPrimary} weight="600">
                    All
                  </Typography>
                </TouchableOpacity>
                {muscleGroups.map((mg) => (
                  <TouchableOpacity
                    key={mg}
                    onPress={() => handleMuscleFilterChange(mg)}
                    style={{
                      backgroundColor: selectedMuscleFilter === mg ? theme.primaryLight : theme.surfaceSecondary,
                      paddingHorizontal: space.md,
                      paddingVertical: space.sm,
                      borderRadius: radius.full,
                    }}
                  >
                    <Typography variant="caption" color={selectedMuscleFilter === mg ? theme.primary : theme.textPrimary} weight="600" style={{ textTransform: "capitalize" }}>
                      {mg}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleExerciseTap(item)}
                  onLongPress={() => handleAddExerciseToDay(item)}
                  style={{
                    backgroundColor: theme.surfaceSecondary,
                    borderRadius: radius.md,
                    padding: space.md,
                    marginBottom: space.sm,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >
                  <Typography variant="body" color={theme.textPrimary} weight="600">
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color={theme.textMuted} style={{ textTransform: "capitalize", marginTop: 2 }}>
                    {item.muscles?.find(m => m.isPrimary)?.muscle.name || ""}
                  </Typography>
                </TouchableOpacity>
              )}
              onEndReached={loadMoreExercises}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                !loadingExercises ? (
                  <Typography variant="body" color={theme.textMuted} align="center" style={{ padding: space.xl }}>
                    No exercises found matching filters.
                  </Typography>
                ) : (
                  <InlineListSkeleton rows={4} />
                )
              }
              ListFooterComponent={
                loadingExercises ? <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: space.md }} /> : null
              }
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: "100%" }}
              contentContainerStyle={{ paddingBottom: space.xl }}
            />
          </View>
        </View>
      </Modal>

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExerciseDetail}
        visible={exerciseDetailVisible}
        onClose={() => setExerciseDetailVisible(false)}
      />
    </SafeAreaView>
  );
}