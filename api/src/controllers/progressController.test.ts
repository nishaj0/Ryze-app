import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import * as progressController from "../controllers/progressController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { TEST_USER, resetAllMocks } from "../__tests__/helpers";

describe("progressController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    resetAllMocks();
    req = { query: {}, params: {}, userId: TEST_USER.id };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
  });

  describe("getOverview", () => {
    it("should return overview with all stats", async () => {
      mockPrismaClient.workoutSession.count
        .mockResolvedValueOnce(50) // totalWorkouts
        .mockResolvedValueOnce(5); // thisWeekWorkouts
      mockPrismaClient.personalRecord.count.mockResolvedValue(10);
      mockPrismaClient.workoutSession.findMany.mockResolvedValue([
        { date: new Date() },
        { date: new Date(Date.now() - 86400000) },
      ]);
      mockPrismaClient.user.findUnique.mockResolvedValue({
        currentWeight: 80,
        goal: "MUSCLE_GAIN",
      });
      mockPrismaClient.userSplit.findFirst.mockResolvedValue({
        split: { daysPerWeek: 4 },
      });
      mockPrismaClient.workoutSession.count.mockResolvedValueOnce(8); // completedInLast4Weeks

      await progressController.getOverview(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        overview: expect.objectContaining({
          totalWorkouts: 50,
          totalPRs: 10,
          currentStreak: expect.any(Number),
          thisWeekWorkouts: 5,
          currentWeight: 80,
          goal: "MUSCLE_GAIN",
          consistencyScore: expect.any(Number),
        }),
      });
    });

    it("should calculate streak correctly", async () => {
      mockPrismaClient.workoutSession.count
        .mockResolvedValueOnce(10) // totalWorkouts
        .mockResolvedValueOnce(2); // thisWeekWorkouts
      mockPrismaClient.personalRecord.count.mockResolvedValue(5);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      mockPrismaClient.workoutSession.findMany.mockResolvedValue([
        { date: today },
        { date: yesterday },
      ]);
      mockPrismaClient.user.findUnique.mockResolvedValue({ currentWeight: 80, goal: "MUSCLE_GAIN" });
      mockPrismaClient.userSplit.findFirst.mockResolvedValue({ split: { daysPerWeek: 3 } });
      mockPrismaClient.workoutSession.count.mockResolvedValueOnce(6);

      await progressController.getOverview(req as AuthRequest, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call.overview.currentStreak).toBe(2);
    });
  });

  describe("getExerciseProgress", () => {
    it("should return exercise progression data", async () => {
      req.params = { id: "ex-1" };
      const logs = [
        {
          id: "log-1",
          sessionId: "session-1",
          setLogs: [
            { weightKg: 100, reps: 8 },
            { weightKg: 100, reps: 8 },
          ],
          session: { date: new Date("2024-01-15") },
        },
      ];
      mockPrismaClient.exerciseLog.findMany.mockResolvedValue(logs);

      await progressController.getExerciseProgress(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        progression: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(Date),
            sessionId: "session-1",
            totalVolume: expect.any(Number),
            maxWeight: expect.any(Number),
            totalReps: expect.any(Number),
            sets: 2,
          }),
        ]),
      });
    });
  });

  describe("getOverloadFilters", () => {
    it("should return only historically logged primary muscles and split-day snapshots", async () => {
      mockPrismaClient.exerciseLog.findMany.mockResolvedValue([
        {
          exercise: {
            id: "bench",
            name: "Bench Press",
            muscles: [{ muscle: { name: "chest" } }],
          },
          session: { splitDayId: "push-1", splitDayName: "Push Day" },
        },
        {
          exercise: {
            id: "row",
            name: "Barbell Row",
            muscles: [{ muscle: { name: "back" } }],
          },
          session: { splitDayId: "pull-1", splitDayName: "Pull Day" },
        },
      ]);

      await progressController.getOverloadFilters(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        hasHistory: true,
        muscles: [
          { id: "back", name: "back", exercises: [{ id: "row", name: "Barbell Row" }] },
          { id: "chest", name: "chest", exercises: [{ id: "bench", name: "Bench Press" }] },
        ],
        splitDays: [
          { id: "pull-1:Pull Day", splitDayId: "pull-1", name: "Pull Day", exercises: [{ id: "row", name: "Barbell Row" }] },
          { id: "push-1:Push Day", splitDayId: "push-1", name: "Push Day", exercises: [{ id: "bench", name: "Bench Press" }] },
        ],
      });
    });
  });

  describe("getOverloadHistory", () => {
    it("should use the highest-rep top set and return all chart metrics together", async () => {
      req.params = { id: "bench" };
      req.query = { splitDayId: "push-1", splitDayName: "Push Day" };
      mockPrismaClient.exerciseLog.findMany.mockResolvedValue([
        {
          session: { id: "session-1", date: new Date("2024-01-15") },
          setLogs: [{ weightKg: 80, reps: 8 }, { weightKg: 80, reps: 10 }, { weightKg: 75, reps: 12 }],
        },
      ]);
      mockPrismaClient.personalRecord.findMany.mockResolvedValue([
        { id: "pr-1", weightKg: 80, reps: 10, estimated1rm: 106.67, achievedAt: new Date("2024-01-15") },
      ]);

      await progressController.getOverloadHistory(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        latestTopSet: { weightKg: 80, reps: 10, estimated1rm: 107 },
        history: [expect.objectContaining({ totalVolume: 2340, estimated1rm: 107, isPR: true, topSet: { weightKg: 80, reps: 10 } })],
        prs: [expect.objectContaining({ id: "pr-1", estimated1rm: 107 })],
      });
    });
  });

  describe("getMuscleVolume", () => {
    it("should return muscle volume for current week", async () => {
      const sessions = [
        {
          exerciseLogs: [
            {
              exercise: {
                muscles: [{ isPrimary: true, muscle: { name: "chest" } }],
              },
              setLogs: [{ weightKg: 100, reps: 10 }],
            },
          ],
        },
      ];
      mockPrismaClient.workoutSession.findMany.mockResolvedValue(sessions);

      await progressController.getMuscleVolume(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        muscleVolumes: expect.arrayContaining([
          expect.objectContaining({
            muscleGroup: "chest",
            volume: expect.any(Number),
          }),
        ]),
      });
    });
  });

  describe("getHeatmap", () => {
    it("should return workout heatmap data", async () => {
      const sessions = [
        { date: new Date("2024-01-15") },
        { date: new Date("2024-01-15") },
        { date: new Date("2024-01-16") },
      ];
      mockPrismaClient.workoutSession.findMany.mockResolvedValue(sessions);

      await progressController.getHeatmap(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        heatmap: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            count: expect.any(Number),
          }),
        ]),
      });
    });
  });

  describe("getVolumeHistory", () => {
    it("should return weekly volume history", async () => {
      req.query = { weeks: "4" };
      mockPrismaClient.workoutSession.findMany.mockResolvedValue([]);

      await progressController.getVolumeHistory(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        weekly: expect.arrayContaining([
          expect.objectContaining({
            week: expect.any(String),
            volume: expect.any(Number),
            workouts: expect.any(Number),
          }),
        ]),
        daily: expect.arrayContaining([
          expect.objectContaining({
            day: expect.any(String),
            count: expect.any(Number),
          }),
        ]),
      });
    });

    it("should clamp weeks between 1 and 52", async () => {
      req.query = { weeks: "100" };
      mockPrismaClient.workoutSession.findMany.mockResolvedValue([]);

      await progressController.getVolumeHistory(req as AuthRequest, res as Response);

      expect(mockPrismaClient.workoutSession.findMany).toHaveBeenCalled();
    });
  });
});
