import { create } from "zustand";
import { SetLog, Exercise, ActiveSession, ExerciseQueueItem } from "../types";
import { mmkv } from "../utils/mmkv";

interface WorkoutState {
  activeSession: ActiveSession | null;
  isOffline: boolean;
  
  initPreStartSession: (splitDay: any, splitName?: string, dayNumber?: number, totalDays?: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  beginSession: () => void;
  logSet: (
    queueItemId: string,
    weightKg: number | null,
    reps: number | null,
    durationSeconds?: number | null,
    wasSkipped?: boolean,
    wasAlternative?: boolean,
    alternativeId?: string | null,
    isPR?: boolean
  ) => void;
  deleteSet: (queueItemId: string, setId: string) => void;
  replaceExercise: (queueItemId: string, newExercise: Exercise, isPermanent: boolean) => Promise<void>;
  addExerciseToQueue: (exercise: Exercise) => void;
  updateExerciseNotes: (queueItemId: string, notes: string) => void;
  updateSessionNotes: (notes: string) => void;
  setRestTimer: (isActive: boolean, startedAt: number | null) => void;
  clearSession: () => void;
  completeSession: () => Promise<any>;
  resumeSession: (sessionData: ActiveSession) => void;
  discardSession: () => void;
  setIsOffline: (offline: boolean) => void;
  syncOfflineSessions: () => Promise<void>;
  setCurrentExerciseIndex: (index: number) => void;
  setCurrentSetNumber: (num: number) => void;
  addExtraSet: (queueItemId: string) => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  activeSession: null,
  isOffline: false,

  initPreStartSession: (splitDay: any, splitName?: string, dayNumber?: number, totalDays?: number) => {
    const queue: ExerciseQueueItem[] = splitDay.exercises?.map((ex: any, idx: number) => ({
      id: "log-" + Date.now() + "-" + idx + "-" + Math.random().toString(36).substring(2, 9),
      splitDayExerciseId: ex.id,
      exercise: ex.exercise,
      targetSets: 3,
      targetRepsMin: ex.targetRepsMin || 8,
      targetRepsMax: ex.targetRepsMax || 12,
      loggedSets: [],
      status: "pending",
      wasReplaced: false,
      replacedWithExerciseId: null,
    })) || [];

    const session: ActiveSession = {
      sessionId: "session-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
      splitDayId: splitDay.id,
      splitDayName: splitDay.name,
      splitName: splitName || "",
      dayNumber: dayNumber || 0,
      totalDays: totalDays || 0,
      startedAt: Date.now(),
      exerciseQueue: queue,
      currentExerciseIndex: 0,
      currentSetNumber: 1,
      isRestTimerActive: false,
      restStartedAt: null,
      notes: "",
      hasStarted: false,
    };

    set({ activeSession: session });
    mmkv.set("active_session", JSON.stringify(session));
  },

  reorderQueue: (fromIndex, toIndex) => {
    set((state) => {
      if (!state.activeSession) return {};
      const queue = [...state.activeSession.exerciseQueue];
      const [moved] = queue.splice(fromIndex, 1);
      queue.splice(toIndex, 0, moved);
      const activeSession = {
        ...state.activeSession,
        exerciseQueue: queue,
      };
      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  beginSession: () => {
    set((state) => {
      if (!state.activeSession) return {};
      const activeSession = {
        ...state.activeSession,
        startedAt: Date.now(), // set to actual workout start time
        currentExerciseIndex: 0,
        currentSetNumber: 1,
        hasStarted: true,
      };
      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  logSet: (queueItemId, weightKg, reps, durationSeconds = null, wasSkipped = false, wasAlternative = false, alternativeId = null, isPR = false) => {
    set((state) => {
      if (!state.activeSession) return {};
      
      const exerciseQueue = state.activeSession.exerciseQueue.map((item) => {
        if (item.id === queueItemId) {
          const setNumber = item.loggedSets.length + 1;
          const newSet: SetLog = {
            id: "set-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
            exerciseLogId: queueItemId,
            setNumber,
            weightKg,
            reps,
            durationSeconds,
            wasSkipped,
            wasAlternative,
            alternativeExerciseId: alternativeId,
            rpe: isPR ? 1 : null, // we can use rpe or map it to notes or add it to types, wait: we can just add isPR field or use rpe as a indicator, let's keep isPR: isPR as we modified SetLog to allow extra fields!
            notes: isPR ? "PR" : null,
            completedAt: new Date().toISOString(),
          };
          // Set extra field
          (newSet as any).isPR = isPR;
          const loggedSets = [...item.loggedSets, newSet];
          
          // Determine status
          let status: ExerciseQueueItem["status"] = "in_progress";
          if (loggedSets.length >= item.targetSets) {
            const allSkipped = loggedSets.every(s => s.wasSkipped);
            status = allSkipped ? "skipped" : "complete";
          }

          return {
            ...item,
            loggedSets,
            status,
          };
        }
        return item;
      });

      const currentItem = exerciseQueue.find(item => item.id === queueItemId);
      const targetSets = currentItem ? currentItem.targetSets : 3;
      const loggedCount = currentItem ? currentItem.loggedSets.length : 0;
      
      let nextSetNumber = loggedCount + 1;
      let isRestTimerActive = false;
      let restStartedAt = null;

      if (loggedCount < targetSets && !wasSkipped) {
        // Only start rest timer for real (non-skipped) completed sets
        isRestTimerActive = true;
        restStartedAt = Date.now();
      } else if (loggedCount >= targetSets) {
        nextSetNumber = 1;
      }

      const activeSession = {
        ...state.activeSession,
        exerciseQueue,
        currentSetNumber: nextSetNumber,
        isRestTimerActive,
        restStartedAt,
      };

      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  deleteSet: (queueItemId, setId) => {
    set((state) => {
      if (!state.activeSession) return {};
      
      const exerciseQueue = state.activeSession.exerciseQueue.map((item) => {
        if (item.id === queueItemId) {
          const loggedSets = item.loggedSets.filter((s) => s.id !== setId)
            .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
          
          let status: ExerciseQueueItem["status"] = "pending";
          if (loggedSets.length > 0) {
            status = "in_progress";
          }

          return {
            ...item,
            loggedSets,
            status,
          };
        }
        return item;
      });

      const currentItem = exerciseQueue.find(item => item.id === queueItemId);
      const nextSetNumber = currentItem ? currentItem.loggedSets.length + 1 : 1;

      const activeSession = {
        ...state.activeSession,
        exerciseQueue,
        currentSetNumber: nextSetNumber,
      };

      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  replaceExercise: async (queueItemId, newExercise, isPermanent) => {
    const { activeSession } = get();
    if (!activeSession) return;

    const queueItem = activeSession.exerciseQueue.find(item => item.id === queueItemId);
    if (!queueItem) return;

    if (isPermanent && queueItem.splitDayExerciseId) {
      try {
        const { updateSplitExercise } = require("../api/splits");
        await updateSplitExercise(queueItem.splitDayExerciseId, newExercise.id);
      } catch (err) {
        console.error("Failed to permanently replace split exercise:", err);
      }
    }

    set((state) => {
      if (!state.activeSession) return {};
      const exerciseQueue = state.activeSession.exerciseQueue.map((item) => {
        if (item.id === queueItemId) {
          return {
            ...item,
            exercise: newExercise,
            wasReplaced: true,
            replacedWithExerciseId: newExercise.id,
            loggedSets: [], 
            status: "pending" as const,
          };
        }
        return item;
      });

      const activeSession = {
        ...state.activeSession,
        exerciseQueue,
        currentSetNumber: 1,
      };

      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  addExerciseToQueue: (exercise) => {
    set((state) => {
      if (!state.activeSession) return {};
      const newItem: ExerciseQueueItem = {
        id: "log-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
        exercise,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
        loggedSets: [],
        status: "pending",
        wasReplaced: false,
        replacedWithExerciseId: null,
      };

      const activeSession = {
        ...state.activeSession,
        exerciseQueue: [...state.activeSession.exerciseQueue, newItem],
      };

      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  updateExerciseNotes: (queueItemId, notes) => {
    set((state) => {
      if (!state.activeSession) return {};
      const exerciseQueue = state.activeSession.exerciseQueue.map((item) => {
        if (item.id === queueItemId) {
          return { ...item, notes };
        }
        return item;
      });

      const activeSession = {
        ...state.activeSession,
        exerciseQueue,
      };

      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  updateSessionNotes: (notes) => {
    set((state) => {
      if (!state.activeSession) return {};
      const activeSession = {
        ...state.activeSession,
        notes,
      };
      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  setRestTimer: (isActive, startedAt) => {
    set((state) => {
      if (!state.activeSession) return {};
      const activeSession = {
        ...state.activeSession,
        isRestTimerActive: isActive,
        restStartedAt: startedAt,
      };
      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  clearSession: () => {
    set({ activeSession: null });
    mmkv.delete("active_session");
  },

  resumeSession: (sessionData) => {
    set({ activeSession: sessionData });
  },

  discardSession: () => {
    set({ activeSession: null });
    mmkv.delete("active_session");
  },

  setIsOffline: (offline) => set({ isOffline: offline }),

  setCurrentExerciseIndex: (index) => {
    set((state) => {
      if (!state.activeSession) return {};
      const activeSession = {
        ...state.activeSession,
        currentExerciseIndex: index,
        currentSetNumber: 1, 
      };
      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  setCurrentSetNumber: (num) => {
    set((state) => {
      if (!state.activeSession) return {};
      const activeSession = {
        ...state.activeSession,
        currentSetNumber: num,
      };
      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  addExtraSet: (queueItemId) => {
    set((state) => {
      if (!state.activeSession) return {};
      const exerciseQueue = state.activeSession.exerciseQueue.map((item) => {
        if (item.id === queueItemId) {
          return {
            ...item,
            targetSets: item.targetSets + 1,
            status: "in_progress" as const,
          };
        }
        return item;
      });
      const activeSession = {
        ...state.activeSession,
        exerciseQueue,
      };
      mmkv.set("active_session", JSON.stringify(activeSession));
      return { activeSession };
    });
  },

  completeSession: async () => {
    const { activeSession, isOffline } = get();
    if (!activeSession) return null;

    const elapsedSeconds = Math.floor((Date.now() - activeSession.startedAt) / 1000);
    const durationMinutes = Math.floor(elapsedSeconds / 60) || 1;

    const exercisesPayload = activeSession.exerciseQueue.map((item) => ({
      exerciseId: item.exercise.id,
      notes: (item as any).notes || null,
      setLogs: item.loggedSets
        .filter((set) => !set.wasSkipped)
        .map((set) => ({
          weightKg: set.weightKg ?? 0,
          reps: set.durationSeconds !== null && set.durationSeconds !== undefined ? set.durationSeconds : (set.reps ?? 0),
          notes: set.notes || null,
          completedAt: set.completedAt || new Date().toISOString(),
        })),
    }));

    const sessionData = {
      splitDayId: activeSession.splitDayId,
      date: new Date(activeSession.startedAt).toISOString(),
      durationMinutes,
      notes: activeSession.notes || null,
      exercises: exercisesPayload,
    };

    if (isOffline) {
      const { addToPendingQueue } = require("../utils/storage");
      await addToPendingQueue("session", sessionData);
      set({ activeSession: null });
      mmkv.delete("active_session");
      return { session: sessionData, prs: [], isOffline: true };
    }

    try {
      const { syncSession } = require("../api/sessions");
      const res = await syncSession(sessionData);
      set({ activeSession: null });
      mmkv.delete("active_session");
      return { ...res, isOffline: false };
    } catch (err) {
      console.error("Failed to sync session, saving offline:", err);
      const { addToPendingQueue } = require("../utils/storage");
      await addToPendingQueue("session", sessionData);
      set({ activeSession: null });
      mmkv.delete("active_session");
      return { session: sessionData, prs: [], isOffline: true };
    }
  },

  syncOfflineSessions: async () => {
    const { getPendingQueue } = require("../utils/storage");
    const { syncSession } = require("../api/sessions");
    
    const queue = await getPendingQueue();
    if (queue.length === 0) return;

    console.log(`[WorkoutStore] Syncing ${queue.length} offline sessions...`);
    const remaining = [];

    for (const item of queue) {
      try {
        await syncSession(item.data);
      } catch (err) {
        console.error("[WorkoutStore] Failed to sync offline session:", err);
        remaining.push(item);
      }
    }

    const { Platform } = require("react-native");
    const { PENDING_SESSIONS_KEY } = require("../utils/storage");
    const SecureStore = require("expo-secure-store");
    const value = JSON.stringify(remaining);

    if (Platform.OS === "web") {
      localStorage.setItem(PENDING_SESSIONS_KEY, value);
    } else {
      await SecureStore.setItemAsync(PENDING_SESSIONS_KEY, value);
    }
  },
}));
