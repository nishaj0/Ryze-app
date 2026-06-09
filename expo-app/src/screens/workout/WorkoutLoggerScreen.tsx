import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../../navigation/types";
import { useWorkoutStore } from "../../store/workoutStore";
import { logSet, deleteSet, completeSession, swapExercise, addExercise } from "../../api/sessions";
import { listExercises } from "../../api/exercises";
import { Exercise, ExerciseLog, SetLog } from "../../types";

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
      const res = await completeSession(activeSession.id, undefined, duration);
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" }}>
        <Text style={{ color: "#94A3B8" }}>No active session</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <View style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1E293B" }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>{splitDayName}</Text>
        <Text style={{ color: "#6366F1", fontSize: 16, fontWeight: "600" }}>{formatTime(elapsed)}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {activeSession.exerciseLogs?.map((log) => {
          const lastData = getLastSetData(log.exerciseId);
          const input = newSetInputs[log.id] || { weight: "", reps: "" };

          return (
            <View key={log.id} style={{ backgroundColor: "#1E293B", borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", flex: 1 }}>{log.exercise.name}</Text>
                <TouchableOpacity onPress={() => openSwapModal(log.id, log.exerciseId)} style={{ padding: 4 }}>
                  <Text style={{ color: "#6366F1", fontSize: 12 }}>Swap</Text>
                </TouchableOpacity>
              </View>

              {log.setLogs.map((set) => (
                <View key={set.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, backgroundColor: "#0F172A", borderRadius: 8, padding: 12 }}>
                  <Text style={{ color: "#6366F1", fontWeight: "600", width: 30 }}>#{set.setNumber}</Text>
                  <Text style={{ color: "#fff", flex: 1 }}>{set.weightKg}kg x {set.reps}</Text>
                  <TouchableOpacity onPress={() => handleDeleteSet(log.id, set.id)}>
                    <Text style={{ color: "#EF4444", fontSize: 12 }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {lastData && (
                <Text style={{ color: "#475569", fontSize: 12, marginBottom: 8 }}>
                  Last: {lastData.weightKg}kg x {lastData.reps}
                </Text>
              )}

              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  style={{ flex: 1, backgroundColor: "#0F172A", borderRadius: 8, padding: 12, color: "#fff", fontSize: 16 }}
                  value={input.weight}
                  onChangeText={(t) => setNewSetInputs((p) => ({ ...p, [log.id]: { ...p[log.id], weight: t, reps: p[log.id]?.reps || "" } }))}
                  placeholder="kg"
                  placeholderTextColor="#475569"
                  keyboardType="decimal-pad"
                />
                <Text style={{ color: "#475569" }}>x</Text>
                <TextInput
                  style={{ flex: 1, backgroundColor: "#0F172A", borderRadius: 8, padding: 12, color: "#fff", fontSize: 16 }}
                  value={input.reps}
                  onChangeText={(t) => setNewSetInputs((p) => ({ ...p, [log.id]: { weight: p[log.id]?.weight || "", reps: t } }))}
                  placeholder="reps"
                  placeholderTextColor="#475569"
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  onPress={() => handleLogSet(log.id, log.exerciseId)}
                  style={{ backgroundColor: "#10B981", borderRadius: 8, width: 44, height: 44, justifyContent: "center", alignItems: "center" }}
                >
                  <Text style={{ color: "#fff", fontSize: 20 }}>✓</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          onPress={() => { setAddModal(true); loadExercises(); }}
          style={{ backgroundColor: "#334155", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 }}
        >
          <Text style={{ color: "#6366F1", fontSize: 16, fontWeight: "600" }}>+ Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={{ padding: 16, backgroundColor: "#1E293B" }}>
        <TouchableOpacity
          onPress={() => setFinishModal(true)}
          style={{ backgroundColor: "#EF4444", borderRadius: 12, padding: 16, alignItems: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Finish Workout</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={swapModal?.visible || false} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#1E293B", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "70%" }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Swap Exercise</Text>
            <ScrollView>
              {exercises.slice(0, 20).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => handleSwap(ex.id)}
                  style={{ backgroundColor: "#334155", borderRadius: 12, padding: 14, marginBottom: 8 }}
                >
                  <Text style={{ color: "#fff", fontSize: 16 }}>{ex.name}</Text>
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>{ex.muscleGroup}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setSwapModal(null)} style={{ marginTop: 12, padding: 14, alignItems: "center" }}>
              <Text style={{ color: "#94A3B8" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={addModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: "#1E293B", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "70%" }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>Add Exercise</Text>
            <TextInput
              style={{ backgroundColor: "#0F172A", borderRadius: 8, padding: 12, color: "#fff", marginBottom: 12 }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor="#475569"
            />
            <ScrollView>
              {filteredExercises.slice(0, 30).map((ex) => (
                <TouchableOpacity
                  key={ex.id}
                  onPress={() => handleAddExercise(ex)}
                  style={{ backgroundColor: "#334155", borderRadius: 12, padding: 14, marginBottom: 8 }}
                >
                  <Text style={{ color: "#fff", fontSize: 16 }}>{ex.name}</Text>
                  <Text style={{ color: "#94A3B8", fontSize: 12 }}>{ex.muscleGroup}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setAddModal(false)} style={{ marginTop: 12, padding: 14, alignItems: "center" }}>
              <Text style={{ color: "#94A3B8" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={finishModal} transparent animationType="fade">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)", padding: 24 }}>
          <View style={{ backgroundColor: "#1E293B", borderRadius: 20, padding: 24, width: "100%" }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>Finish Workout?</Text>
            <Text style={{ color: "#94A3B8", textAlign: "center", marginBottom: 24 }}>Duration: {formatTime(elapsed)}</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setFinishModal(false)} style={{ flex: 1, backgroundColor: "#334155", borderRadius: 12, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#94A3B8", fontSize: 16 }}>Keep Going</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFinish} disabled={finishing} style={{ flex: 1, backgroundColor: "#EF4444", borderRadius: 12, padding: 14, alignItems: "center" }}>
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{finishing ? "Saving..." : "Finish"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
