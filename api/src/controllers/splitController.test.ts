import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import * as splitController from "../controllers/splitController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { TEST_USER, resetAllMocks } from "../__tests__/helpers";
import { GeminiError, callGemini } from "../utils/gemini";

vi.mock("../utils/gemini", () => ({
  callGemini: vi.fn(),
  GeminiError: class GeminiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "GeminiError";
    }
  },
}));

describe("splitController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    resetAllMocks();
    req = { body: {}, params: {}, userId: TEST_USER.id };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
  });

  describe("listSplits", () => {
    it("should return all prebuilt and user-created splits", async () => {
      const splits = [
        { id: "split-1", name: "PPL", isPrebuilt: true, days: [] },
        { id: "split-2", name: "My Split", isPrebuilt: false, createdById: TEST_USER.id, days: [] },
      ];
      mockPrismaClient.split.findMany.mockResolvedValue(splits);

      await splitController.listSplits(req as AuthRequest, res as Response);

      expect(mockPrismaClient.split.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { isPrebuilt: true },
            { createdById: TEST_USER.id },
          ],
        },
        include: { days: { orderBy: { dayNumber: "asc" } } },
        orderBy: { name: "asc" },
      });
      expect(res.json).toHaveBeenCalledWith({ splits });
    });
  });

  describe("getSplit", () => {
    it("should return 404 if split not found", async () => {
      req.params = { id: "nonexistent" };
      mockPrismaClient.split.findUnique.mockResolvedValue(null);

      await expect(splitController.getSplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Split not found");
    });

    it("should return split with days and exercises", async () => {
      req.params = { id: "split-1" };
      const split = {
        id: "split-1",
        name: "PPL",
        days: [{ id: "day-1", dayNumber: 1, exercises: [] }],
      };
      mockPrismaClient.split.findUnique.mockResolvedValue(split);

      await splitController.getSplit(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ split });
    });
  });

  describe("createSplit", () => {
    it("should create a new split with days and exercises", async () => {
      req.body = {
        name: "My Split",
        description: "Test split",
        type: "PPL",
        daysPerWeek: 3,
        days: [
          {
            dayNumber: 1,
            name: "Push Day",
            muscleGroups: ["chest", "shoulders"],
            isRest: false,
            exercises: [
              {
                exerciseId: "ex-1",
                targetSets: 3,
                targetRepsMin: 8,
                targetRepsMax: 12,
              },
            ],
          },
        ],
      };

      const createdSplit = { id: "split-new", ...req.body };
      mockPrismaClient.split.create.mockResolvedValue(createdSplit);

      await splitController.createSplit(req as AuthRequest, res as Response);

      expect(mockPrismaClient.split.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "My Split",
            isPrebuilt: false,
            createdById: TEST_USER.id,
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ split: createdSplit });
    });
  });

  describe("setActiveSplit", () => {
    it("should return 404 if split not found", async () => {
      req.body = { splitId: "nonexistent" };
      mockPrismaClient.split.findUnique.mockResolvedValue(null);

      await expect(splitController.setActiveSplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Split not found");
    });

    it("should deactivate other splits and set new active split", async () => {
      req.body = { splitId: "split-1", phase: "hypertrophy" };
      const split = { id: "split-1", name: "PPL" };
      mockPrismaClient.split.findUnique.mockResolvedValue(split);
      mockPrismaClient.userSplit.updateMany.mockResolvedValue({ count: 1 });
      
      const userSplit = { id: "us-1", userId: TEST_USER.id, splitId: "split-1", isActive: true };
      mockPrismaClient.userSplit.create.mockResolvedValue({
        ...userSplit,
        split: { ...split, days: [] },
      });

      await splitController.setActiveSplit(req as AuthRequest, res as Response);

      expect(mockPrismaClient.userSplit.updateMany).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id },
        data: { isActive: false },
      });
      expect(mockPrismaClient.userSplit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: TEST_USER.id,
            splitId: "split-1",
            isActive: true,
            phase: "hypertrophy",
          }),
        })
      );
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getActiveSplit", () => {
    it("should return null if no active split", async () => {
      mockPrismaClient.userSplit.findFirst.mockResolvedValue(null);

      await splitController.getActiveSplit(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ userSplit: null });
    });

    it("should return active split with full details", async () => {
      const userSplit = {
        id: "us-1",
        userId: TEST_USER.id,
        split: {
          id: "split-1",
          name: "PPL",
          days: [{ id: "day-1", exercises: [] }],
        },
      };
      mockPrismaClient.userSplit.findFirst.mockResolvedValue(userSplit);

      await splitController.getActiveSplit(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith({ userSplit });
    });
  });

  describe("updateSplit", () => {
    it("should return 404 if split not found", async () => {
      req.params = { id: "nonexistent" };
      mockPrismaClient.split.findUnique.mockResolvedValue(null);

      await expect(splitController.updateSplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Split not found");
    });

    it("should return 403 if trying to update prebuilt split", async () => {
      req.params = { id: "split-1" };
      const split = { id: "split-1", isPrebuilt: true, createdById: TEST_USER.id, days: [] };
      mockPrismaClient.split.findUnique.mockResolvedValue(split);

      await expect(splitController.updateSplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Cannot edit a prebuilt split");
    });

    it("should return 403 if user doesn't own the split", async () => {
      req.params = { id: "split-1" };
      const split = { id: "split-1", isPrebuilt: false, createdById: "other-user", days: [] };
      mockPrismaClient.split.findUnique.mockResolvedValue(split);

      await expect(splitController.updateSplit(req as AuthRequest, res as Response))
        .rejects.toThrow("You can only edit splits you created");
    });

    it("should update split with transaction", async () => {
      req.params = { id: "split-1" };
      req.body = {
        name: "Updated Split",
        description: "Updated",
        daysPerWeek: 4,
        days: [
          { id: "day-1", dayNumber: 1, name: "Push", muscleGroups: ["chest"], isRest: false, exercises: [] },
        ],
      };

      const split = { id: "split-1", isPrebuilt: false, createdById: TEST_USER.id, days: [] };
      mockPrismaClient.split.findUnique.mockResolvedValue(split);
      mockPrismaClient.$transaction.mockImplementation(async (fn: any) => fn(mockPrismaClient));
      
      const updatedSplit = { id: "split-1", name: "Updated Split", days: [] };
      mockPrismaClient.split.update.mockResolvedValue(updatedSplit);
      mockPrismaClient.split.findUnique.mockResolvedValueOnce(split).mockResolvedValueOnce(updatedSplit);

      await splitController.updateSplit(req as AuthRequest, res as Response);

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("generateAISplit", () => {
    beforeEach(() => {
      vi.mocked(callGemini).mockReset();
    });

    const mockExercises = [
      {
        id: "ex-1",
        name: "Bench Press",
        equipment: "barbell",
        muscles: [{ isPrimary: true, muscle: { name: "Chest" } }],
      },
      {
        id: "ex-2",
        name: "Squat",
        equipment: "barbell",
        muscles: [{ isPrimary: true, muscle: { name: "Quads" } }],
      },
    ];

    it("should return 400 if description is missing", async () => {
      req.body = { equipmentFilter: [] };

      await expect(splitController.generateAISplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Description is required");
    });

    it("should return 400 if no exercises found", async () => {
      req.body = { description: "Build muscle" };
      mockPrismaClient.exercise.findMany.mockResolvedValue([]);

      await expect(splitController.generateAISplit(req as AuthRequest, res as Response))
        .rejects.toThrow("No exercises found matching your criteria");
    });

    it("should generate split successfully with valid Gemini response", async () => {
      req.body = { description: "Build muscle, 4 days per week" };
      mockPrismaClient.exercise.findMany.mockResolvedValue(mockExercises);

      const aiResponse = {
        name: "4-Day Muscle Builder",
        description: "A 4-day split for muscle gain",
        daysPerWeek: 4,
        days: [
          {
            dayNumber: 1,
            name: "Push Day",
            muscleGroups: ["Chest", "Shoulders"],
            isRest: false,
            exercises: [
              { exerciseName: "Bench Press", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12 },
            ],
          },
          {
            dayNumber: 2,
            name: "Rest Day",
            muscleGroups: [],
            isRest: true,
            exercises: [],
          },
        ],
      };

      vi.mocked(callGemini).mockResolvedValue(aiResponse);

      await splitController.generateAISplit(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          split: expect.objectContaining({
            name: "4-Day Muscle Builder",
            daysPerWeek: 4,
          }),
          warnings: [],
        })
      );
    });

    it("should throw AppError with message when GeminiError occurs", async () => {
      req.body = { description: "Build muscle" };
      mockPrismaClient.exercise.findMany.mockResolvedValue(mockExercises);

      vi.mocked(callGemini).mockRejectedValue(new GeminiError("AI service timeout. Please try again."));

      await expect(splitController.generateAISplit(req as AuthRequest, res as Response))
        .rejects.toThrow("AI service timeout. Please try again.");
    });

    it("should throw AppError when Gemini returns unknown error", async () => {
      req.body = { description: "Build muscle" };
      mockPrismaClient.exercise.findMany.mockResolvedValue(mockExercises);

      vi.mocked(callGemini).mockRejectedValue(new Error("Unknown failure"));

      await expect(splitController.generateAISplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Failed to generate split. Please try again.");
    });

    it("should add warnings for exercises not found in database", async () => {
      req.body = { description: "Build muscle" };
      mockPrismaClient.exercise.findMany.mockResolvedValue(mockExercises);

      const aiResponse = {
        name: "Test Split",
        description: "Test",
        daysPerWeek: 3,
        days: [
          {
            dayNumber: 1,
            name: "Day 1",
            muscleGroups: ["Chest"],
            isRest: false,
            exercises: [
              { exerciseName: "Bench Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
              { exerciseName: "Nonexistent Exercise", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
            ],
          },
        ],
      };

      vi.mocked(callGemini).mockResolvedValue(aiResponse);

      await splitController.generateAISplit(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          warnings: expect.arrayContaining([
            expect.stringContaining("Nonexistent Exercise"),
          ]),
        })
      );
    });

    it("should throw error when all days are empty after validation", async () => {
      req.body = { description: "Build muscle" };
      mockPrismaClient.exercise.findMany.mockResolvedValue(mockExercises);

      const aiResponse = {
        name: "Bad Split",
        description: "All invalid exercises",
        daysPerWeek: 3,
        days: [
          {
            dayNumber: 1,
            name: "Day 1",
            muscleGroups: ["Chest"],
            isRest: false,
            exercises: [
              { exerciseName: "Fake Exercise 1", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
            ],
          },
        ],
      };

      vi.mocked(callGemini).mockResolvedValue(aiResponse);

      await expect(splitController.generateAISplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Generated split has no valid exercises. Please try again.");
    });
  });
});
