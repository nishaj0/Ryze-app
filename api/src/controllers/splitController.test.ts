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
    it("should return the user's saved split library", async () => {
      const userSplits = [
        { id: "saved-1", userId: TEST_USER.id, isActive: true, split: { id: "split-1", name: "PPL", days: [] } },
        { id: "saved-2", userId: TEST_USER.id, isActive: false, split: { id: "split-2", name: "My Split", days: [] } },
      ];
      mockPrismaClient.userSplit.findMany.mockResolvedValue(userSplits);

      await splitController.listSplits(req as AuthRequest, res as Response);

      expect(mockPrismaClient.userSplit.findMany).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id },
        include: { split: { include: { days: { orderBy: { dayNumber: "asc" } } } } },
        orderBy: [{ isActive: "desc" }, { savedAt: "desc" }],
      });
      expect(res.json).toHaveBeenCalledWith({ userSplits });
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
        isPrebuilt: true,
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
      mockPrismaClient.userSplit.findUnique.mockResolvedValue(null);

      await expect(splitController.setActiveSplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Save this split to your library before activating it");
    });

    it("should deactivate other splits and set new active split", async () => {
      req.body = { splitId: "split-1", phase: "hypertrophy" };
      const split = { id: "split-1", name: "PPL" };
      mockPrismaClient.userSplit.findUnique.mockResolvedValue({ id: "saved-1", userId: TEST_USER.id, splitId: split.id });
      mockPrismaClient.userSplit.updateMany.mockResolvedValue({ count: 1 });
      
      const userSplit = { id: "us-1", userId: TEST_USER.id, splitId: "split-1", isActive: true };
      mockPrismaClient.userSplit.update.mockResolvedValue({
        ...userSplit,
        split: { ...split, days: [] },
      });

      await splitController.setActiveSplit(req as AuthRequest, res as Response);

      expect(mockPrismaClient.userSplit.updateMany).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id },
        data: { isActive: false },
      });
      expect(mockPrismaClient.userSplit.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_splitId: { userId: TEST_USER.id, splitId: "split-1" } },
          data: expect.objectContaining({
            isActive: true,
            phase: "hypertrophy",
          }),
        })
      );
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("publishSplit", () => {
    it("rejects publishing a training day with no exercises", async () => {
      req.params = { id: "split-1" };
      mockPrismaClient.split.findFirst.mockResolvedValue({
        id: "split-1",
        type: "PPL",
        creatorDisplayName: null,
        createdBy: { name: "Test User" },
        days: [{ isRest: false, exercises: [] }],
      });

      await expect(splitController.publishSplit(req as AuthRequest, res as Response))
        .rejects.toThrow("Add an exercise to every training day before publishing");
    });

    it("publishes an original split with community metadata", async () => {
      req.params = { id: "split-1" };
      const split = {
        id: "split-1",
        type: "PPL",
        creatorDisplayName: null,
        createdBy: { name: "Test User" },
        days: [{ isRest: false, exercises: [{ id: "exercise-1" }] }],
      };
      mockPrismaClient.split.findFirst.mockResolvedValue(split);
      mockPrismaClient.split.update.mockResolvedValue({ ...split, visibility: "COMMUNITY" });

      await splitController.publishSplit(req as AuthRequest, res as Response);

      expect(mockPrismaClient.split.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "split-1" },
        data: expect.objectContaining({ visibility: "COMMUNITY", splitTypeTag: "PPL" }),
      }));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ split: expect.anything() }));
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

      // The retry logic triggers (1 valid + 1 invalid). Mock the retry to also return an invalid
      // replacement so the warning falls through to the final response.
      const retryResponse = {
        replacements: [
          { exerciseName: "Still Nonexistent", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
        ],
      };

      vi.mocked(callGemini)
        .mockResolvedValueOnce(aiResponse)
        .mockResolvedValueOnce(retryResponse);

      await splitController.generateAISplit(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          warnings: expect.arrayContaining([
            expect.stringContaining("Still Nonexistent"),
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

    // -------------------------------------------------------------------------
    // New tests: buildSplitGenerationPrompt — prompt structure
    // -------------------------------------------------------------------------

    describe("buildSplitGenerationPrompt", () => {
      const candidateExercises = [
        {
          id: "ex-1",
          name: "Bench Press",
          equipment: "barbell",
          level: "beginner",
          muscles: [{ isPrimary: true, muscle: { name: "Chest" } }],
        },
        {
          id: "ex-2",
          name: "Squat",
          equipment: "barbell",
          level: "beginner",
          muscles: [{ isPrimary: true, muscle: { name: "Quads" } }],
        },
      ];

      it("should include the exercise-constraint instruction in systemPrompt", () => {
        const { systemPrompt } = splitController.buildSplitGenerationPrompt(
          "Build muscle",
          undefined,
          candidateExercises
        );

        expect(systemPrompt).toContain(
          "You MUST ONLY select exercise names from the provided list below"
        );
        expect(systemPrompt).toContain("Do not invent, rename, or rephrase any exercise name.");
      });

      it("should include all candidate exercise names in systemPrompt", () => {
        const { systemPrompt } = splitController.buildSplitGenerationPrompt(
          "Build muscle",
          undefined,
          candidateExercises
        );

        expect(systemPrompt).toContain("Bench Press");
        expect(systemPrompt).toContain("Squat");
      });

      it("should include conflict-resolution instruction in systemPrompt", () => {
        const { systemPrompt } = splitController.buildSplitGenerationPrompt(
          "i like to do intensive workout",
          { goal: "GET_FIT", experienceLevel: "BEGINNER", daysAvailable: 3, equipmentAccess: "FULL_GYM", gender: "MALE" },
          candidateExercises
        );

        expect(systemPrompt).toContain("CONFLICT RESOLUTION");
        expect(systemPrompt).toContain("HARD CONSTRAINTS");
        expect(systemPrompt).toContain("BEGINNER");
        expect(systemPrompt).toContain("intensive");
      });

      it("should include both onboarding profile and description context", () => {
        const description = "i like to do intensive workout";
        const onboardingContext = {
          goal: "GET_FIT",
          experienceLevel: "BEGINNER",
          daysAvailable: 3,
          equipmentAccess: "FULL_GYM",
          gender: "MALE",
        };

        const { systemPrompt, userPrompt } = splitController.buildSplitGenerationPrompt(
          description,
          onboardingContext,
          candidateExercises
        );

        // Profile fields appear in system prompt
        expect(systemPrompt).toContain("Beginner (less than 6 months)");
        expect(systemPrompt).toContain("General Fitness");
        expect(systemPrompt).toContain("3");
        expect(systemPrompt).toContain("Full gym");

        // Description is the user prompt
        expect(userPrompt).toBe(description);
      });
    });

    // -------------------------------------------------------------------------
    // New tests: exercise name matching fallbacks
    // -------------------------------------------------------------------------

    describe("exercise name matching fallbacks", () => {
      it("should match exercises case-insensitively (no warning)", async () => {
        req.body = { description: "Build muscle" };

        const exercises = [
          {
            id: "ex-1",
            name: "Bench Press",
            equipment: "barbell",
            level: "beginner",
            muscles: [{ isPrimary: true, muscle: { name: "Chest" } }],
          },
        ];
        mockPrismaClient.exercise.findMany.mockResolvedValue(exercises);

        // Gemini returns lowercase name
        const aiResponse = {
          name: "Test Split",
          description: "A test split",
          daysPerWeek: 1,
          days: [
            {
              dayNumber: 1,
              name: "Day 1",
              muscleGroups: ["Chest"],
              isRest: false,
              exercises: [
                { exerciseName: "bench press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
              ],
            },
          ],
        };
        vi.mocked(callGemini).mockResolvedValue(aiResponse);

        await splitController.generateAISplit(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ warnings: [] })
        );
      });

      it("should match exercises with normalized dash differences (no warning)", async () => {
        req.body = { description: "Build muscle" };

        const exercises = [
          {
            id: "ex-1",
            name: "Bench Press - Barbell",
            equipment: "barbell",
            level: "beginner",
            muscles: [{ isPrimary: true, muscle: { name: "Chest" } }],
          },
        ];
        mockPrismaClient.exercise.findMany.mockResolvedValue(exercises);

        // Gemini returns name without spaces around dash
        const aiResponse = {
          name: "Test Split",
          description: "A test split",
          daysPerWeek: 1,
          days: [
            {
              dayNumber: 1,
              name: "Day 1",
              muscleGroups: ["Chest"],
              isRest: false,
              exercises: [
                { exerciseName: "Bench Press-Barbell", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
              ],
            },
          ],
        };
        vi.mocked(callGemini).mockResolvedValue(aiResponse);

        await splitController.generateAISplit(req as AuthRequest, res as Response);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ warnings: [] })
        );
      });
    });

    // -------------------------------------------------------------------------
    // New tests: single-retry on partial exercise-match failure
    // -------------------------------------------------------------------------

    describe("partial exercise-match retry", () => {
      const exercises = [
        {
          id: "ex-1",
          name: "Bench Press",
          equipment: "barbell",
          level: "beginner",
          muscles: [{ isPrimary: true, muscle: { name: "Chest" } }],
        },
        {
          id: "ex-2",
          name: "Squat",
          equipment: "barbell",
          level: "beginner",
          muscles: [{ isPrimary: true, muscle: { name: "Quads" } }],
        },
        {
          id: "ex-3",
          name: "Deadlift",
          equipment: "barbell",
          level: "intermediate",
          muscles: [{ isPrimary: true, muscle: { name: "Back" } }],
        },
        {
          id: "ex-4",
          name: "Pull-Up",
          equipment: "body only",
          level: "intermediate",
          muscles: [{ isPrimary: true, muscle: { name: "Back" } }],
        },
      ];

      it("should retry once and resolve the replacement when retry succeeds", async () => {
        req.body = { description: "Build muscle" };
        mockPrismaClient.exercise.findMany.mockResolvedValue(exercises);

        // First call: 3 valid + 1 invalid exercise
        const initialResponse = {
          name: "Test Split",
          description: "A test split",
          daysPerWeek: 1,
          days: [
            {
              dayNumber: 1,
              name: "Day 1",
              muscleGroups: ["Chest", "Quads", "Back"],
              isRest: false,
              exercises: [
                { exerciseName: "Bench Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
                { exerciseName: "Squat", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
                { exerciseName: "Deadlift", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8 },
                { exerciseName: "Fake Overhead Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
              ],
            },
          ],
        };

        // Retry call: returns a valid replacement
        const retryResponse = {
          replacements: [
            { exerciseName: "Pull-Up", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
          ],
        };

        vi.mocked(callGemini)
          .mockResolvedValueOnce(initialResponse)
          .mockResolvedValueOnce(retryResponse);

        await splitController.generateAISplit(req as AuthRequest, res as Response);

        const jsonCall = vi.mocked(res.json).mock.calls[0][0] as any;

        // All 4 exercises should be in the result
        expect(jsonCall.split.days[0].exercises).toHaveLength(4);

        // No warnings for the replaced exercise
        const hasFakeWarning = jsonCall.warnings.some((w: string) =>
          w.includes("Fake Overhead Press")
        );
        expect(hasFakeWarning).toBe(false);

        // Pull-Up should appear in the exercises
        const hasPullUp = jsonCall.split.days[0].exercises.some(
          (e: any) => e.exerciseName === "Pull-Up"
        );
        expect(hasPullUp).toBe(true);

        // callGemini should have been called twice (initial + retry)
        expect(vi.mocked(callGemini)).toHaveBeenCalledTimes(2);
      });

      it("should preserve original warning when retry also fails to match", async () => {
        req.body = { description: "Build muscle" };
        mockPrismaClient.exercise.findMany.mockResolvedValue(exercises);

        // First call: 3 valid + 1 invalid
        const initialResponse = {
          name: "Test Split",
          description: "A test split",
          daysPerWeek: 1,
          days: [
            {
              dayNumber: 1,
              name: "Day 1",
              muscleGroups: ["Chest", "Quads", "Back"],
              isRest: false,
              exercises: [
                { exerciseName: "Bench Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
                { exerciseName: "Squat", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
                { exerciseName: "Deadlift", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8 },
                { exerciseName: "Fake Overhead Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
              ],
            },
          ],
        };

        // Retry call: also returns an invalid name
        const retryResponse = {
          replacements: [
            { exerciseName: "Also Fake Exercise", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 },
          ],
        };

        vi.mocked(callGemini)
          .mockResolvedValueOnce(initialResponse)
          .mockResolvedValueOnce(retryResponse);

        await splitController.generateAISplit(req as AuthRequest, res as Response);

        const jsonCall = vi.mocked(res.json).mock.calls[0][0] as any;

        // Original 3 valid exercises remain
        expect(jsonCall.split.days[0].exercises).toHaveLength(3);

        // Warning should be present for the retry-failed exercise
        expect(jsonCall.warnings).toEqual(
          expect.arrayContaining([
            expect.stringContaining("Also Fake Exercise"),
          ])
        );
      });
    });
  });
});
