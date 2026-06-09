import { create } from "zustand";
import { WorkoutSession, ExerciseLog, SetLog } from "../types";

interface WorkoutState {
  activeSession: WorkoutSession | null;
  lastSessionLogs: Record<string, { weightKg: number; reps: number }[]>;
  startTime: number | null;
  restTimerEnd: number | null;
  startSession: (session: WorkoutSession, lastLogs?: Record<string, any>) => void;
  updateSession: (updates: Partial<WorkoutSession>) => void;
  addSetToLog: (exerciseLogId: string, set: SetLog) => void;
  removeSetFromLog: (exerciseLogId: string, setId: string) => void;
  replaceExercise: (exerciseLogId: string, newExercise: any) => void;
  addExercise: (log: ExerciseLog) => void;
  setRestTimer: (end: number | null) => void;
  clearSession: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeSession: null,
  lastSessionLogs: {},
  startTime: null,
  restTimerEnd: null,

  startSession: (session, lastLogs = {}) => {
    set({
      activeSession: session,
      lastSessionLogs: lastLogs,
      startTime: Date.now(),
      restTimerEnd: null,
    });
  },

  updateSession: (updates) =>
    set((state) => ({
      activeSession: state.activeSession
        ? { ...state.activeSession, ...updates }
        : null,
    })),

  addSetToLog: (exerciseLogId, newSet) =>
    set((state) => {
      if (!state.activeSession) return state;
      const exerciseLogs = state.activeSession.exerciseLogs?.map((log) =>
        log.id === exerciseLogId
          ? { ...log, setLogs: [...log.setLogs, newSet] }
          : log
      );
      return {
        activeSession: { ...state.activeSession, exerciseLogs },
      };
    }),

  removeSetFromLog: (exerciseLogId, setId) =>
    set((state) => {
      if (!state.activeSession) return state;
      const exerciseLogs = state.activeSession.exerciseLogs?.map((log) =>
        log.id === exerciseLogId
          ? { ...log, setLogs: log.setLogs.filter((s) => s.id !== setId) }
          : log
      );
      return {
        activeSession: { ...state.activeSession, exerciseLogs },
      };
    }),

  replaceExercise: (exerciseLogId, newExercise) =>
    set((state) => {
      if (!state.activeSession) return state;
      const exerciseLogs = state.activeSession.exerciseLogs?.map((log) =>
        log.id === exerciseLogId
          ? { ...log, exercise: newExercise, setLogs: [] }
          : log
      );
      return {
        activeSession: { ...state.activeSession, exerciseLogs },
      };
    }),

  addExercise: (log) =>
    set((state) => {
      if (!state.activeSession) return state;
      return {
        activeSession: {
          ...state.activeSession,
          exerciseLogs: [...(state.activeSession.exerciseLogs || []), log],
        },
      };
    }),

  setRestTimer: (end) => set({ restTimerEnd: end }),

  clearSession: () =>
    set({
      activeSession: null,
      lastSessionLogs: {},
      startTime: null,
      restTimerEnd: null,
    }),
}));
