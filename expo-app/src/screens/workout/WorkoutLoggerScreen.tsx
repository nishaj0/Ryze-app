import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, ScrollView, TextInput, Alert, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { useWorkoutStore } from "../../store/workoutStore";
import { logSet, deleteSet, completeSession, swapExercise, addExercise } from "../../api/sessions";
import { listExercises } from "../../api/exercises";
import { Exercise, ExerciseLog, SetLog } from "../../types";
import { Typography, Card, Button, Icon, Input } from "../../components";
import { lightTheme } from "../../theme/colors";
import { space, radius } from "../../theme/spacing";

type Props = NativeStackScreenProps<HomeStackParamList, "WorkoutLogger">;

export default function WorkoutLoggerScreen({ navigation, route }: Props) {
  const { splitDayName } = route.params;
  const { activeSession, lastSessionLogs, addSetToLog, removeSetFromLog, replaceExercise, addExercise: addExerciseToStore, clearSession, startTime } = useWorkoutStore();
  const [elapsed, setElapsed] = useState(0);
  const [swapModal, setSwapModal] = useState<{ visible: boolean; exerciseLogId: string; exerciseId: string } | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newSetInputs, setNewSetInputs] = useState<Record<string, { weight: string; reps: string }>>({});
  const [finishModal, setFinishModal] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (startTime) setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleLogSet = async (exerciseLogId: string, exerciseId: string) => {
    const input = newSetInputs[exerciseLogId] || { weight: "", reps: "" };
    const weight = parseFloat(input.weight);
    const reps = parseInt(input.reps);
    if (!weight || !reps) {
      Alert.alert("Error", "Enter weight and reps");
      return;
    }

    try {
      const res = await logSet(exerciseLogId, weight, reps);
      addSetToLog(exerciseLogId, res.setLog);
      setNewSetInputs((prev) => ({ ...prev, [exerciseLogId]: { weight: "", reps: "" } }));
    } catch (err) {
      Alert.alert("Error", "Failed to log set");
    }
  };

  const handleDeleteSet = async (exerciseLogId: string, setId: string) => {
    try {
      await deleteSet(exerciseLogId, setId);
      removeSetFromLog(exerciseLogId, setId);
    } catch (err) {
      Alert.alert("Error", "Failed to delete set");
    }
  };

  const handleSwap = async (newExerciseId: string) => {
    if (!swapModal || !activeSession) return;
    try {
      const res = await swapExercise(activeSession.id, swapModal.exerciseLogId, newExerciseId);
      replaceExercise(swapModal.exerciseLogId, res.exerciseLog.exercise);
      setSwapModal(null);
    } catch (err) {
      Alert.alert("Error", "Failed to swap exercise");
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!activeSession) return;
    try {
      const res = await addExercise(activeSession.id, exercise.id);
      addExerciseToStore(res.exerciseLog);
      setAddModal(false);
    } catch (err) {
      Alert.alert("Error", "Failed to add exercise");
    }
  };

  const handleFinish = async () => {
    if (!activeSession) return;
    setFinishing(true);
    try {
      const duration = Math.floor(elapsed / 60);
      await completeSession(activeSession.id, undefined, duration);
      clearSession();
      navigation.replace("WorkoutSummary", { sessionId: activeSession.id });
    } catch (err) {
      Alert.alert("Error", "Failed to finish workout");
    } finally {
      setFinishing(false);
    }
  };

  const getLastSetData = (exerciseId: string) => {
    const logs = lastSessionLogs[exerciseId];
    if (!logs || logs.length === 0) return null;
    return logs[0];
  };

  const openSwapModal = (exerciseLogId: string, exerciseId: string) => {
    setSwapModal({ visible: true, exerciseLogId, exerciseId });
    loadExercises();
  };

  const loadExercises = async () => {
    try {
      const res = await listExercises();
      setExercises(res.exercises);
    } catch (err) {}
  };

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!activeSession) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg, justifyContent: "center", alignItems: "center" }}>
        <Typography variant="body" color={lightTheme.textMuted}>
          No active session
        </Typography>
      </SafeAreaView>
    );
  }

  // Total volume
  const totalVolume = activeSession.exerciseLogs?.reduce((sum, log) => {
    return sum + log.setLogs.reduce((s, set) => s + set.weightKg * set.reps, 0);
  }, 0) || 0;
  const totalSets = activeSession.exerciseLogs?.reduce((sum, log) => sum + log.setLogs.length, 0) || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: lightTheme.bg }} edges={["top"]}>
      {/* Sticky Header */}
      <View
        style={{
          backgroundColor: lightTheme.surface,
          borderBottomWidth: 1,
          borderBottomColor: lightTheme.border,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Typography variant="caption" color={lightTheme.textMuted} weight="600">
              WORKOUT
            </Typography>
            <Typography variant="heading2" color={lightTheme.textPrimary}>
              {splitDayName}
            </Typography>
          </View>
          <View
            style={{
              backgroundColor: lightTheme.primaryLight,
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
              borderRadius: radius.md,
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
            }}
          >
            <Icon name="Timer" size={16} color={lightTheme.primary} />
            <Typography variant="body" color={lightTheme.primary} weight="700">
              {formatTime(elapsed)}
            </Typography>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: space.lg, marginTop: space.sm }}>
          <View>
            <Typography variant="caption" color={lightTheme.textMuted}>SETS</Typography>
            <Typography variant="body" color={lightTheme.textPrimary} weight="700">
              {totalSets}
            </Typography>
          </View>
          <View>
            <Typography variant="caption" color={lightTheme.textMuted}>VOLUME</Typography>
            <Typography variant="body" color={lightTheme.textPrimary} weight="700">
              {totalVolume.toLocaleString()}kg
            </Typography>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.lg, paddingBottom: 100 }}>
        {activeSession.exerciseLogs?.map((log) => {
          const lastData = getLastSetData(log.exerciseId);
          const input = newSetInputs[log.id] || { weight: "", reps: "" };

          return (
            <Card key={log.id} shadow="sm" style={{ marginBottom: space.lg, padding: space.lg }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: space.md }}>
                <View style={{ flex: 1 }}>
                  <Typography variant="heading3" color={lightTheme.textPrimary}>
                    {log.exercise.name}
                  </Typography>
                  <Typography variant="caption" color={lightTheme.textMuted} style={{ textTransform: "capitalize", marginTop: 2 }}>
                    {log.exercise.muscleGroup}
                  </Typography>
                </View>
                <TouchableOpacity
                  onPress={() => openSwapModal(log.id, log.exerciseId)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    paddingHorizontal: space.sm,
                    paddingVertical: space.xs,
                  }}
                >
                  <Icon name="Repeat" size={14} color={lightTheme.primary} />
                  <Typography variant="caption" color={lightTheme.primary} weight="600">
                    SWAP
                  </Typography>
                </TouchableOpacity>
              </View>

              {/* Set list */}
              {log.setLogs.length > 0 && (
                <View style={{ marginBottom: space.md, gap: space.xs }}>
                  {log.setLogs.map((set) => (
                    <View
                      key={set.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: lightTheme.surfaceSecondary,
                        borderRadius: radius.md,
                        padding: space.md,
                        gap: space.md,
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: lightTheme.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography variant="bodySmall" color={lightTheme.primaryText} weight="700">
                          {set.setNumber}
                        </Typography>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                          {set.weightKg}kg × {set.reps}
                        </Typography>
                      </View>
                      <TouchableOpacity onPress={() => handleDeleteSet(log.id, set.id)}>
                        <Icon name="Trash2" size={18} color={lightTheme.danger.DEFAULT} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Last session data */}
              {lastData && (
                <View
                  style={{
                    backgroundColor: lightTheme.surfaceSecondary,
                    borderRadius: radius.md,
                    padding: space.sm,
                    marginBottom: space.md,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                  }}
                >
                  <Icon name="Clock" size={14} color={lightTheme.textMuted} />
                  <Typography variant="caption" color={lightTheme.textMuted}>
                    {`Last: ${lastData.weightKg}kg × ${lastData.reps}`}
                  </Typography>
                </View>
              )}

              {/* Input row */}
              <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Input
                    value={input.weight}
                    onChangeText={(t) => setNewSetInputs((p) => ({ ...p, [log.id]: { ...p[log.id], weight: t, reps: p[log.id]?.reps || "" } }))}
                    placeholder="kg"
                    keyboardType="decimal-pad"
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    value={input.reps}
                    onChangeText={(t) => setNewSetInputs((p) => ({ ...p, [log.id]: { weight: p[log.id]?.weight || "", reps: t } }))}
                    placeholder="reps"
                    keyboardType="number-pad"
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleLogSet(log.id, log.exerciseId)}
                  style={{
                    backgroundColor: lightTheme.success.DEFAULT,
                    borderRadius: radius.md,
                    width: 48,
                    height: 48,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Icon name="Check" size={20} color={lightTheme.primaryText} strokeWidth={3} />
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        {/* Add exercise button */}
        <TouchableOpacity
          onPress={() => { setAddModal(true); loadExercises(); }}
          style={{
            borderRadius: radius.lg,
            padding: space.lg,
            alignItems: "center",
            borderWidth: 1.5,
            borderColor: lightTheme.border,
            borderStyle: "dashed",
            flexDirection: "row",
            justifyContent: "center",
            gap: space.sm,
          }}
        >
          <Icon name="Plus" size={18} color={lightTheme.primary} />
          <Typography variant="body" color={lightTheme.primary} weight="600">
            Add Exercise
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Finish Button */}
      <View
        style={{
          backgroundColor: lightTheme.surface,
          borderTopWidth: 1,
          borderTopColor: lightTheme.border,
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
        }}
      >
        <Button
          title="Finish Workout"
          onPress={() => setFinishModal(true)}
          variant="danger"
          size="lg"
          icon={<Icon name="CheckCircle2" size={20} color={lightTheme.primaryText} />}
        />
      </View>

      {/* Swap Modal */}
      <Modal visible={swapModal?.visible || false} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <View
            style={{
              backgroundColor: lightTheme.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
              maxHeight: "70%",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.lg }}>
              <Typography variant="heading2" color={lightTheme.textPrimary}>
                Swap Exercise
              </Typography>
              <TouchableOpacity onPress={() => setSwapModal(null)}>
                <Icon name="X" size={24} color={lightTheme.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {exercises.slice(0, 20).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => handleSwap(ex.id)}
                  style={{
                    backgroundColor: lightTheme.surfaceSecondary,
                    borderRadius: radius.md,
                    padding: space.md,
                    marginBottom: space.sm,
                    borderWidth: 1,
                    borderColor: lightTheme.border,
                  }}
                >
                  <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                    {ex.name}
                  </Typography>
                  <Typography variant="caption" color={lightTheme.textMuted} style={{ textTransform: "capitalize", marginTop: 2 }}>
                    {ex.muscleGroup}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: lightTheme.bgOverlay }}>
          <View
            style={{
              backgroundColor: lightTheme.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: space.lg,
              maxHeight: "70%",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.lg }}>
              <Typography variant="heading2" color={lightTheme.textPrimary}>
                Add Exercise
              </Typography>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <Icon name="X" size={24} color={lightTheme.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: space.md }}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search exercises..."
              />
            </View>
            <ScrollView>
              {filteredExercises.slice(0, 30).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => handleAddExercise(ex)}
                  style={{
                    backgroundColor: lightTheme.surfaceSecondary,
                    borderRadius: radius.md,
                    padding: space.md,
                    marginBottom: space.sm,
                    borderWidth: 1,
                    borderColor: lightTheme.border,
                  }}
                >
                  <Typography variant="body" color={lightTheme.textPrimary} weight="600">
                    {ex.name}
                  </Typography>
                  <Typography variant="caption" color={lightTheme.textMuted} style={{ textTransform: "capitalize", marginTop: 2 }}>
                    {ex.muscleGroup}
                  </Typography>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Finish Confirmation Modal */}
      <Modal visible={finishModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: lightTheme.bgOverlay, padding: space.lg }}>
          <Card padding="lg" shadow="none" border={false} style={{ width: "100%" }}>
            <View style={{ alignItems: "center", marginBottom: space.lg }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: lightTheme.successBg,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: space.md,
                }}
              >
                <Icon name="CheckCircle2" size={32} color={lightTheme.success.DEFAULT} />
              </View>
              <Typography variant="heading2" color={lightTheme.textPrimary} align="center">
                Finish Workout?
              </Typography>
              <Typography variant="body" color={lightTheme.textSecondary} align="center" style={{ marginTop: space.sm }}>
                Duration: {formatTime(elapsed)} · {totalSets} sets · {totalVolume.toLocaleString()}kg
              </Typography>
            </View>
            <View style={{ flexDirection: "row", gap: space.md }}>
              <Button
                title="Keep Going"
                onPress={() => setFinishModal(false)}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title={finishing ? "Saving..." : "Finish"}
                onPress={handleFinish}
                disabled={finishing}
                loading={finishing}
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
