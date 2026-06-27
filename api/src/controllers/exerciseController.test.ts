import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import * as exerciseController from "../controllers/exerciseController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { TEST_USER, resetAllMocks } from "../__tests__/helpers";

describe("exerciseController", () => {
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

  describe("listExercises", () => {
    it("should return all exercises without filters", async () => {
      const exercises = [{ id: "ex-1", name: "Bench Press" }];
      mockPrismaClient.exercise.findMany.mockResolvedValue(exercises);

      await exerciseController.listExercises(req as AuthRequest, res as Response);

      expect(mockPrismaClient.exercise.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          muscles: { include: { muscle: true } },
          images: { orderBy: { order: "asc" } },
          alternativesFrom: { include: { alternative: true } },
        },
        orderBy: { name: "asc" },
      });
      expect(res.json).toHaveBeenCalledWith({ exercises });
    });

    it("should filter by muscle", async () => {
      req.query = { muscle: "chest" };
      mockPrismaClient.exercise.findMany.mockResolvedValue([]);

      await exerciseController.listExercises(req as AuthRequest, res as Response);

      expect(mockPrismaClient.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { muscles: { some: { muscle: { name: "chest" } } } },
        })
      );
    });

    it("should filter by equipment", async () => {
      req.query = { equipment: "barbell" };
      mockPrismaClient.exercise.findMany.mockResolvedValue([]);

      await exerciseController.listExercises(req as AuthRequest, res as Response);

      expect(mockPrismaClient.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { equipment: "barbell" },
        })
      );
    });

    it("should filter by search term", async () => {
      req.query = { search: "bench" };
      mockPrismaClient.exercise.findMany.mockResolvedValue([]);

      await exerciseController.listExercises(req as AuthRequest, res as Response);

      expect(mockPrismaClient.exercise.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: "bench", mode: "insensitive" } },
        })
      );
    });
  });

  describe("getExercise", () => {
    it("should return 404 if exercise not found", async () => {
      req.params = { id: "nonexistent" };
      mockPrismaClient.exercise.findUnique.mockResolvedValue(null);

      await exerciseController.getExercise(req as AuthRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Exercise not found" });
    });

    it("should return exercise with muscles and images", async () => {
      req.params = { id: "ex-1" };
      const exercise = { id: "ex-1", name: "Bench Press", muscles: [], images: [] };
      mockPrismaClient.exercise.findUnique.mockResolvedValue(exercise);

      await exerciseController.getExercise(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ exercise });
    });
  });

  describe("getAlternatives", () => {
    it("should return exercise alternatives", async () => {
      req.params = { id: "ex-1" };
      const alternatives = [{ id: "alt-1", alternative: { name: "Dumbbell Press" } }];
      mockPrismaClient.exerciseAlternative.findMany.mockResolvedValue(alternatives);

      await exerciseController.getAlternatives(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ alternatives });
    });
  });

  describe("getExerciseHistory", () => {
    it("should return user's exercise history", async () => {
      req.params = { id: "ex-1" };
      const logs = [{ id: "log-1", setLogs: [] }];
      mockPrismaClient.exerciseLog.findMany.mockResolvedValue(logs);

      await exerciseController.getExerciseHistory(req as AuthRequest, res as Response);

      expect(mockPrismaClient.exerciseLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { exerciseId: "ex-1", session: { userId: TEST_USER.id } },
        })
      );
      expect(res.json).toHaveBeenCalledWith({ logs });
    });
  });
});
