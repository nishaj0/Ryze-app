import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWorkoutStore } from "../store/workoutStore";
import { Exercise, ExerciseQueueItem } from "../types";
import { mockMmkv } from "../__tests__/setup";

const TEST_EXERCISE: Exercise = {
  id: "ex-1",
  name: "Bench Press",
  force: "push",
  level: "beginner",
  mechanic: "compound",
  equipment: "barbell",
  category: "strength",
  instructions: "Press the bar up",
};

const TEST_EXERCISE_2: Exercise = {
  id: "ex-2",
  name: "Squat",
  force: "push",
  level: "beginner",
  mechanic: "compound",
  equipment: "barbell",
  category: "strength",
  instructions: "Squat down",
};

const TEST_SPLIT_DAY = {
  id: "day-1",
  name: "Push Day",
  exercises: [
    {
      id: "sde-1",
      exercise: TEST_EXERCISE,
      targetRepsMin: 8,
      targetRepsMax: 12,
    },
    {
      id: "sde-2",
      exercise: TEST_EXERCISE_2,
      targetRepsMin: 6,
      targetRepsMax: 10,
    },
  ],
};

describe("useWorkoutStore", () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      activeSession: null,
      isOffline: false,
    });
    vi.clearAllMocks();
  });

  describe("initPreStartSession", () => {
    it("should create a pre-start session with exercise queue", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY, "PPL", 1, 3);

      const state = useWorkoutStore.getState();
      expect(state.activeSession).not.toBeNull();
      expect(state.activeSession?.splitDayId).toBe("day-1");
      expect(state.activeSession?.splitDayName).toBe("Push Day");
      expect(state.activeSession?.splitName).toBe("PPL");
      expect(state.activeSession?.dayNumber).toBe(1);
      expect(state.activeSession?.totalDays).toBe(3);
      expect(state.activeSession?.exerciseQueue).toHaveLength(2);
      expect(state.activeSession?.hasStarted).toBe(false);
      expect(state.activeSession?.currentExerciseIndex).toBe(0);
      expect(state.activeSession?.currentSetNumber).toBe(1);
    });

    it("should handle split day with no exercises", () => {
      const emptyDay = { id: "day-2", name: "Rest Day", exercises: [] };
      useWorkoutStore.getState().initPreStartSession(emptyDay);

      const state = useWorkoutStore.getState();
      expect(state.activeSession?.exerciseQueue).toHaveLength(0);
    });

    it("should persist to mmkv", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);

      expect(mockMmkv.set).toHaveBeenCalledWith(
        "active_session",
        expect.any(String)
      );
    });
  });

  describe("beginSession", () => {
    it("should mark session as started", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);
      useWorkoutStore.getState().beginSession();

      const state = useWorkoutStore.getState();
      expect(state.activeSession?.hasStarted).toBe(true);
      expect(state.activeSession?.startedAt).toBeDefined();
    });

    it("should do nothing if no active session", () => {
      useWorkoutStore.getState().beginSession();

      expect(useWorkoutStore.getState().activeSession).toBeNull();
    });
  });

  describe("logSet", () => {
    beforeEach(() => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);
    });

    it("should add a set to the exercise queue item", () => {
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, 100, 8);

      const item = useWorkoutStore.getState().activeSession!.exerciseQueue[0];
      expect(item.loggedSets).toHaveLength(1);
      expect(item.loggedSets[0].weightKg).toBe(100);
      expect(item.loggedSets[0].reps).toBe(8);
      expect(item.loggedSets[0].setNumber).toBe(1);
    });

    it("should auto-increment set numbers", () => {
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, 100, 8);
      useWorkoutStore.getState().logSet(queueItemId, 100, 8);
      useWorkoutStore.getState().logSet(queueItemId, 105, 6);

      const item = useWorkoutStore.getState().activeSession!.exerciseQueue[0];
      expect(item.loggedSets).toHaveLength(3);
      expect(item.loggedSets[0].setNumber).toBe(1);
      expect(item.loggedSets[1].setNumber).toBe(2);
      expect(item.loggedSets[2].setNumber).toBe(3);
    });

    it("should mark exercise as complete when target sets reached", () => {
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, 100, 8);
      useWorkoutStore.getState().logSet(queueItemId, 100, 8);
      useWorkoutStore.getState().logSet(queueItemId, 100, 8);

      const item = useWorkoutStore.getState().activeSession!.exerciseQueue[0];
      expect(item.status).toBe("complete");
    });

    it("should mark exercise as skipped if all sets skipped", () => {
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, null, null, null, true);
      useWorkoutStore.getState().logSet(queueItemId, null, null, null, true);
      useWorkoutStore.getState().logSet(queueItemId, null, null, null, true);

      const item = useWorkoutStore.getState().activeSession!.exerciseQueue[0];
      expect(item.status).toBe("skipped");
    });

    it("should start rest timer for non-skipped sets", () => {
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, 100, 8);

      const state = useWorkoutStore.getState();
      expect(state.activeSession?.isRestTimerActive).toBe(true);
      expect(state.activeSession?.restStartedAt).toBeDefined();
    });

    it("should not start rest timer for skipped sets", () => {
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, null, null, null, true);

      const state = useWorkoutStore.getState();
      expect(state.activeSession?.isRestTimerActive).toBe(false);
    });

    it("should mark set as PR when isPR is true", () => {
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, 120, 5, null, false, false, null, true);

      const set = useWorkoutStore.getState().activeSession!.exerciseQueue[0].loggedSets[0];
      expect((set as any).isPR).toBe(true);
      expect(set.notes).toBe("PR");
    });
  });

  describe("deleteSet", () => {
    it("should remove set and renumber remaining sets", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, 100, 8);
      useWorkoutStore.getState().logSet(queueItemId, 100, 8);
      useWorkoutStore.getState().logSet(queueItemId, 105, 6);

      const sets = useWorkoutStore.getState().activeSession!.exerciseQueue[0].loggedSets;
      useWorkoutStore.getState().deleteSet(queueItemId, sets[1].id);

      const remaining = useWorkoutStore.getState().activeSession!.exerciseQueue[0].loggedSets;
      expect(remaining).toHaveLength(2);
      expect(remaining[0].setNumber).toBe(1);
      expect(remaining[1].setNumber).toBe(2);
    });

    it("should reset exercise status to pending when all sets deleted", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().logSet(queueItemId, 100, 8);
      const setId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].loggedSets[0].id;

      useWorkoutStore.getState().deleteSet(queueItemId, setId);

      const item = useWorkoutStore.getState().activeSession!.exerciseQueue[0];
      expect(item.loggedSets).toHaveLength(0);
      expect(item.status).toBe("pending");
    });
  });

  describe("reorderQueue", () => {
    it("should move exercise from one position to another", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);

      const before = useWorkoutStore.getState().activeSession!.exerciseQueue.map(e => e.exercise.name);
      useWorkoutStore.getState().reorderQueue(0, 1);
      const after = useWorkoutStore.getState().activeSession!.exerciseQueue.map(e => e.exercise.name);

      expect(after[0]).toBe(before[1]);
      expect(after[1]).toBe(before[0]);
    });
  });

  describe("addExerciseToQueue", () => {
    it("should add exercise to end of queue", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);

      const newExercise: Exercise = {
        id: "ex-3",
        name: "Tricep Pushdown",
        force: "push",
        level: "beginner",
        mechanic: "isolation",
        equipment: "cable",
        category: "strength",
        instructions: "Push down",
      };

      useWorkoutStore.getState().addExerciseToQueue(newExercise);

      const queue = useWorkoutStore.getState().activeSession!.exerciseQueue;
      expect(queue).toHaveLength(3);
      expect(queue[2].exercise.name).toBe("Tricep Pushdown");
      expect(queue[2].status).toBe("pending");
    });
  });

  describe("addExtraSet", () => {
    it("should increment target sets", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().addExtraSet(queueItemId);

      const item = useWorkoutStore.getState().activeSession!.exerciseQueue[0];
      expect(item.targetSets).toBe(4);
      expect(item.status).toBe("in_progress");
    });
  });

  describe("updateExerciseNotes", () => {
    it("should update notes for specific exercise", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);
      const queueItemId = useWorkoutStore.getState().activeSession!.exerciseQueue[0].id;

      useWorkoutStore.getState().updateExerciseNotes(queueItemId, "Felt strong");

      const item = useWorkoutStore.getState().activeSession!.exerciseQueue[0];
      expect(item.notes).toBe("Felt strong");
    });
  });

  describe("updateSessionNotes", () => {
    it("should update session-level notes", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);

      useWorkoutStore.getState().updateSessionNotes("Great workout!");

      expect(useWorkoutStore.getState().activeSession?.notes).toBe("Great workout!");
    });
  });

  describe("setCurrentExerciseIndex", () => {
    it("should update current exercise index and reset set number", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);

      useWorkoutStore.getState().setCurrentExerciseIndex(1);

      const state = useWorkoutStore.getState();
      expect(state.activeSession?.currentExerciseIndex).toBe(1);
      expect(state.activeSession?.currentSetNumber).toBe(1);
    });
  });

  describe("clearSession", () => {
    it("should clear active session and mmkv", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);

      useWorkoutStore.getState().clearSession();

      expect(useWorkoutStore.getState().activeSession).toBeNull();
      expect(mockMmkv.delete).toHaveBeenCalledWith("active_session");
    });
  });

  describe("setIsOffline", () => {
    it("should set offline flag", () => {
      useWorkoutStore.getState().setIsOffline(true);

      expect(useWorkoutStore.getState().isOffline).toBe(true);
    });
  });

  describe("setRestTimer", () => {
    it("should update rest timer state", () => {
      useWorkoutStore.getState().initPreStartSession(TEST_SPLIT_DAY);

      useWorkoutStore.getState().setRestTimer(true, Date.now());

      const state = useWorkoutStore.getState();
      expect(state.activeSession?.isRestTimerActive).toBe(true);
      expect(state.activeSession?.restStartedAt).toBeDefined();
    });
  });
});
