import { describe, it, expect, vi, beforeEach } from "vitest";
import * as splitSuggestionController from "../controllers/splitSuggestionController";
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

describe("splitSuggestionController", () => {
  beforeEach(() => {
    resetAllMocks();
    vi.mocked(callGemini).mockReset();
  });

  describe("evaluateForUser", () => {
    it("should skip if AI suggestions are disabled", async () => {
      mockPrismaClient.appSettings.findUnique.mockResolvedValue({
        id: "default",
        aiSuggestionsEnabled: false,
      });

      const result = await splitSuggestionController.evaluateForUser(TEST_USER.id);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("AI suggestions disabled");
    });

    it("should skip if no active split", async () => {
      mockPrismaClient.appSettings.findUnique.mockResolvedValue(null);
      mockPrismaClient.userSplit.findFirst.mockResolvedValue(null);

      const result = await splitSuggestionController.evaluateForUser(TEST_USER.id);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("No active split");
    });

    it("should skip if split is too new", async () => {
      mockPrismaClient.appSettings.findUnique.mockResolvedValue(null);
      mockPrismaClient.userSplit.findFirst.mockResolvedValue({
        id: "us-1",
        startDate: new Date(),
        split: { days: [] },
      });

      const result = await splitSuggestionController.evaluateForUser(TEST_USER.id);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("Split too new (< 2 weeks)");
    });

    it("should skip if not enough STRUGGLED check-ins", async () => {
      const twoWeeksAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      mockPrismaClient.appSettings.findUnique.mockResolvedValue(null);
      mockPrismaClient.userSplit.findFirst.mockResolvedValue({
        id: "us-1",
        startDate: twoWeeksAgo,
        split: { days: [] },
      });
      mockPrismaClient.checkIn.findMany.mockResolvedValue([]);

      const result = await splitSuggestionController.evaluateForUser(TEST_USER.id);

      expect(result.skipped).toBe(true);
      expect(result.reason).toContain("STRUGGLED check-ins");
    });

    it("should handle GeminiError gracefully and continue processing", async () => {
      const twoWeeksAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const threeWeeksAgo = new Date(Date.now() - 22 * 24 * 60 * 60 * 1000);

      mockPrismaClient.appSettings.findUnique.mockResolvedValue(null);
      mockPrismaClient.userSplit.findFirst.mockResolvedValue({
        id: "us-1",
        startDate: twoWeeksAgo,
        split: {
          days: [
            {
              id: "day-1",
              exercises: [
                {
                  id: "sde-1",
                  exerciseId: "ex-1",
                  exercise: { id: "ex-1", name: "Squat" },
                },
              ],
            },
          ],
        },
      });

      const struggledCheckIns = [
        {
          id: "ci-1",
          userId: TEST_USER.id,
          sessionId: "session-1",
          sentiment: "STRUGGLED" as const,
          extractedIssues: ["knee pain"],
          affectedExerciseId: "ex-1",
          createdAt: threeWeeksAgo,
        },
        {
          id: "ci-2",
          userId: TEST_USER.id,
          sessionId: "session-2",
          sentiment: "STRUGGLED" as const,
          extractedIssues: ["knee pain"],
          affectedExerciseId: "ex-1",
          createdAt: threeWeeksAgo,
        },
        {
          id: "ci-3",
          userId: TEST_USER.id,
          sessionId: "session-3",
          sentiment: "STRUGGLED" as const,
          extractedIssues: ["knee pain"],
          affectedExerciseId: "ex-1",
          createdAt: threeWeeksAgo,
        },
      ];

      mockPrismaClient.checkIn.findMany.mockResolvedValue(struggledCheckIns);
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue({
        id: "session-1",
        splitDayId: "day-1",
      });
      mockPrismaClient.exercise.findUnique.mockResolvedValue({
        id: "ex-1",
        name: "Squat",
      });
      mockPrismaClient.exerciseAlternative.findMany.mockResolvedValue([
        { alternativeId: "ex-2", alternative: { id: "ex-2", name: "Leg Press" } },
      ]);
      mockPrismaClient.splitSuggestion.findFirst.mockResolvedValue(null);
      mockPrismaClient.splitDayExercise.findFirst.mockResolvedValue({
        id: "sde-1",
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      });

      vi.mocked(callGemini).mockRejectedValue(new GeminiError("AI service timeout"));

      const result = await splitSuggestionController.evaluateForUser(TEST_USER.id);

      expect(result.suggestionsCreated).toBe(0);
      expect(mockPrismaClient.splitSuggestion.create).not.toHaveBeenCalled();
    });

    it("should create suggestion when AI returns valid response", async () => {
      const twoWeeksAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const threeWeeksAgo = new Date(Date.now() - 22 * 24 * 60 * 60 * 1000);

      mockPrismaClient.appSettings.findUnique.mockResolvedValue(null);
      mockPrismaClient.userSplit.findFirst.mockResolvedValue({
        id: "us-1",
        startDate: twoWeeksAgo,
        split: {
          days: [
            {
              id: "day-1",
              exercises: [
                {
                  id: "sde-1",
                  exerciseId: "ex-1",
                  exercise: { id: "ex-1", name: "Squat" },
                },
              ],
            },
          ],
        },
      });

      const struggledCheckIns = [
        {
          id: "ci-1",
          userId: TEST_USER.id,
          sessionId: "session-1",
          sentiment: "STRUGGLED" as const,
          extractedIssues: ["knee pain"],
          affectedExerciseId: "ex-1",
          createdAt: threeWeeksAgo,
        },
        {
          id: "ci-2",
          userId: TEST_USER.id,
          sessionId: "session-2",
          sentiment: "STRUGGLED" as const,
          extractedIssues: ["knee pain"],
          affectedExerciseId: "ex-1",
          createdAt: threeWeeksAgo,
        },
        {
          id: "ci-3",
          userId: TEST_USER.id,
          sessionId: "session-3",
          sentiment: "STRUGGLED" as const,
          extractedIssues: ["knee pain"],
          affectedExerciseId: "ex-1",
          createdAt: threeWeeksAgo,
        },
      ];

      mockPrismaClient.checkIn.findMany.mockResolvedValue(struggledCheckIns);
      mockPrismaClient.workoutSession.findUnique.mockResolvedValue({
        id: "session-1",
        splitDayId: "day-1",
      });
      mockPrismaClient.exercise.findUnique.mockResolvedValue({
        id: "ex-1",
        name: "Squat",
      });
      mockPrismaClient.exerciseAlternative.findMany.mockResolvedValue([
        { alternativeId: "ex-2", alternative: { id: "ex-2", name: "Leg Press" } },
      ]);
      mockPrismaClient.splitSuggestion.findFirst.mockResolvedValue(null);
      mockPrismaClient.splitDayExercise.findFirst.mockResolvedValue({
        id: "sde-1",
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
      });

      vi.mocked(callGemini).mockResolvedValue({
        suggestionType: "SWAP_EXERCISE",
        alternativeExerciseName: "Leg Press",
        reasoning: "Try leg press to reduce knee stress",
      });

      const result = await splitSuggestionController.evaluateForUser(TEST_USER.id);

      expect(result.suggestionsCreated).toBe(1);
      expect(mockPrismaClient.splitSuggestion.create).toHaveBeenCalled();
    });
  });
});
