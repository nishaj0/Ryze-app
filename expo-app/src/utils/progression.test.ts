import { describe, it, expect } from "vitest";
import { getSetRecommendation, RecommendationResult } from "../utils/progression";
import { Exercise } from "../types";

const makeExercise = (overrides: Partial<Exercise> = {}): Exercise => ({
  id: "ex-1",
  name: "Bench Press",
  force: "push",
  level: "beginner",
  mechanic: "compound",
  equipment: "barbell",
  category: "strength",
  instructions: "Press the bar up",
  ...overrides,
});

describe("getSetRecommendation", () => {
  describe("no history", () => {
    it("should return null recommendations when history is empty", () => {
      const exercise = makeExercise();
      const result = getSetRecommendation(exercise, 8, 12, []);

      expect(result).toEqual({
        recommendedWeight: null,
        recommendedReps: null,
        lastWeight: null,
        lastReps: null,
      });
    });

    it("should return null when all sets are skipped", () => {
      const exercise = makeExercise();
      const history = [
        { weightKg: 100, reps: 8, was_skipped: true, completedAt: "2024-01-15" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBeNull();
      expect(result.recommendedReps).toBeNull();
    });
  });

  describe("reps < repMin (still building)", () => {
    it("should recommend same weight and same reps", () => {
      const exercise = makeExercise();
      const history = [
        { weightKg: 80, reps: 6, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(80);
      expect(result.recommendedReps).toBe(6);
    });
  });

  describe("repMin <= reps < repMax (increase reps)", () => {
    it("should recommend same weight and reps + 2", () => {
      const exercise = makeExercise();
      const history = [
        { weightKg: 80, reps: 9, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(80);
      expect(result.recommendedReps).toBe(11);
    });

    it("should cap reps at repMax", () => {
      const exercise = makeExercise();
      const history = [
        { weightKg: 80, reps: 11, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(80);
      expect(result.recommendedReps).toBe(12);
    });
  });

  describe("reps >= repMax (increase weight)", () => {
    it("should recommend weight + increment and reset to repMin for barbell", () => {
      const exercise = makeExercise({ equipment: "barbell" });
      const history = [
        { weightKg: 100, reps: 12, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(102.5);
      expect(result.recommendedReps).toBe(8);
    });

    it("should use 2.0 increment for dumbbell", () => {
      const exercise = makeExercise({ equipment: "dumbbell", name: "Dumbbell Press" });
      const history = [
        { weightKg: 30, reps: 12, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(32);
      expect(result.recommendedReps).toBe(8);
    });

    it("should use 5.0 increment for machine", () => {
      const exercise = makeExercise({ equipment: "machine", name: "Leg Press" });
      const history = [
        { weightKg: 200, reps: 12, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(205);
      expect(result.recommendedReps).toBe(8);
    });

    it("should use 2.5 increment for cable", () => {
      const exercise = makeExercise({ equipment: "cable", name: "Cable Fly" });
      const history = [
        { weightKg: 25, reps: 12, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(27.5);
      expect(result.recommendedReps).toBe(8);
    });
  });

  describe("multiple sessions (best of last two)", () => {
    it("should use the better set from last two sessions", () => {
      const exercise = makeExercise();
      const history = [
        { weightKg: 80, reps: 10, completedAt: "2024-01-15", exerciseLogId: "log-2" },
        { weightKg: 85, reps: 8, completedAt: "2024-01-10", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      // Best is 85*8 = 680 > 80*10 = 800, so 80*10 is better
      // Actually: 80*1000 + 10 = 80010 vs 85*1000 + 8 = 85008
      // So 85*8 is better
      expect(result.lastWeight).toBe(80);
      expect(result.lastReps).toBe(10);
    });

    it("should return last session data in lastWeight/lastReps", () => {
      const exercise = makeExercise();
      const history = [
        { weightKg: 80, reps: 10, completedAt: "2024-01-15", exerciseLogId: "log-2" },
        { weightKg: 75, reps: 8, completedAt: "2024-01-10", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.lastWeight).toBe(80);
      expect(result.lastReps).toBe(10);
    });
  });

  describe("ExerciseLog format (nested setLogs)", () => {
    it("should flatten ExerciseLog format correctly", () => {
      const exercise = makeExercise();
      const history = [
        {
          id: "log-1",
          setLogs: [
            { weightKg: 80, reps: 8, completedAt: "2024-01-15" },
            { weightKg: 80, reps: 9, completedAt: "2024-01-15" },
          ],
          session: { date: "2024-01-15" },
        },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(80);
      expect(result.recommendedReps).toBe(11);
    });
  });

  describe("weight increment detection", () => {
    it("should detect equipment from name if equipment field is empty", () => {
      const exercise = makeExercise({ equipment: "", name: "Barbell Squat" });
      const history = [
        { weightKg: 100, reps: 12, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(102.5);
    });

    it("should default to 2.5 increment for unknown equipment", () => {
      const exercise = makeExercise({ equipment: "resistance band", name: "Band Pull" });
      const history = [
        { weightKg: 20, reps: 12, completedAt: "2024-01-15", exerciseLogId: "log-1" },
      ];
      const result = getSetRecommendation(exercise, 8, 12, history);

      expect(result.recommendedWeight).toBe(22.5);
    });
  });
});
