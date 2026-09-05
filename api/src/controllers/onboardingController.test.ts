import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import * as onboardingController from "../controllers/onboardingController";
import { AuthRequest } from "../middleware/auth";
import { mockPrismaClient } from "../__tests__/prisma-mock";
import { TEST_USER, resetAllMocks } from "../__tests__/helpers";

describe("onboardingController", () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    resetAllMocks();
    req = { body: {}, query: {}, userId: TEST_USER.id };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
  });

  describe("completeOnboarding", () => {
    it("should complete onboarding with all fields", async () => {
      req.body = {
        gender: "male",
        goal: "MUSCLE_GAIN",
        experienceLevel: "INTERMEDIATE",
        daysAvailable: 4,
        equipmentAccess: "full_gym",
        currentWeight: 80,
        height: 180,
        sleepHours: 8,
        dateOfBirth: "1990-01-01",
        splitId: "split-1",
      };

      const updatedUser = { ...TEST_USER, onboardingDone: true };
      mockPrismaClient.user.update.mockResolvedValue(updatedUser);
      mockPrismaClient.userSplit.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaClient.userSplit.upsert.mockResolvedValue({});

      await onboardingController.completeOnboarding(req as AuthRequest, res as Response);

      expect(mockPrismaClient.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: TEST_USER.id },
          data: expect.objectContaining({
            onboardingDone: true,
            gender: "male",
            goal: "MUSCLE_GAIN",
          }),
        })
      );
      expect(res.json).toHaveBeenCalled();
    });

    it("should set active split if splitId provided", async () => {
      req.body = {
        gender: "male",
        goal: "MUSCLE_GAIN",
        experienceLevel: "INTERMEDIATE",
        daysAvailable: 4,
        equipmentAccess: "full_gym",
        currentWeight: 80,
        height: 180,
        sleepHours: 8,
        splitId: "split-1",
      };

      mockPrismaClient.user.update.mockResolvedValue(TEST_USER);
      mockPrismaClient.userSplit.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.userSplit.upsert.mockResolvedValue({});

      await onboardingController.completeOnboarding(req as AuthRequest, res as Response);

      expect(mockPrismaClient.userSplit.updateMany).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id },
        data: { isActive: false },
      });
      expect(mockPrismaClient.userSplit.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            userId: TEST_USER.id,
            splitId: "split-1",
            isActive: true,
          }),
        })
      );
    });

    it("should not set active split if splitId not provided", async () => {
      req.body = {
        gender: "male",
        goal: "MUSCLE_GAIN",
        experienceLevel: "INTERMEDIATE",
        daysAvailable: 4,
        equipmentAccess: "full_gym",
        currentWeight: 80,
        height: 180,
        sleepHours: 8,
      };

      mockPrismaClient.user.update.mockResolvedValue(TEST_USER);

      await onboardingController.completeOnboarding(req as AuthRequest, res as Response);

      expect(mockPrismaClient.userSplit.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.userSplit.upsert).not.toHaveBeenCalled();
    });
  });

  describe("getRecommendedSplits", () => {
    it("should recommend FULL_BODY for beginners with <= 3 days", async () => {
      req.query = { experienceLevel: "BEGINNER", daysAvailable: "3" };
      const splits = [{ id: "split-1", type: "FULL_BODY", days: [] }];
      mockPrismaClient.split.findMany.mockResolvedValue(splits);

      await onboardingController.getRecommendedSplits(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          recommendedType: "FULL_BODY",
        })
      );
    });

    it("should recommend PPL for intermediates with >= 6 days", async () => {
      req.query = { experienceLevel: "INTERMEDIATE", daysAvailable: "6" };
      const splits = [{ id: "split-1", type: "PPL", days: [] }];
      mockPrismaClient.split.findMany.mockResolvedValue(splits);

      await onboardingController.getRecommendedSplits(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          recommendedType: "PPL",
        })
      );
    });

    it("should recommend BRO_SPLIT for >= 5 days", async () => {
      req.query = { daysAvailable: "5" };
      const splits = [{ id: "split-1", type: "BRO_SPLIT", days: [] }];
      mockPrismaClient.split.findMany.mockResolvedValue(splits);

      await onboardingController.getRecommendedSplits(req as AuthRequest, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          recommendedType: "BRO_SPLIT",
        })
      );
    });

    it("should return splits sorted by recommendation", async () => {
      req.query = { experienceLevel: "BEGINNER", daysAvailable: "3" };
      const splits = [
        { id: "split-1", type: "PPL", days: [] },
        { id: "split-2", type: "FULL_BODY", days: [] },
      ];
      mockPrismaClient.split.findMany.mockResolvedValue(splits);

      await onboardingController.getRecommendedSplits(req as AuthRequest, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call.splits[0].type).toBe("FULL_BODY");
    });
  });
});
