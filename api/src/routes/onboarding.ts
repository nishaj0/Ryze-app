import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as onboardingController from "../controllers/onboardingController";

const router = Router();

const onboardingSchema = z.object({
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  goal: z.enum(["MUSCLE_GAIN", "WEIGHT_LOSS", "GET_FIT", "MAINTAIN"]),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  daysAvailable: z.number().int().min(1).max(7),
  equipmentAccess: z.enum(["FULL_GYM", "HOME", "LIMITED"]),
  currentWeight: z.number().positive(),
  height: z.number().positive(),
  sleepHours: z.number().min(0).max(24),
  dateOfBirth: z.string().optional(),
  splitId: z.string().optional(),
});

router.post(
  "/complete",
  authMiddleware,
  validate(onboardingSchema),
  wrap(onboardingController.completeOnboarding)
);

router.get(
  "/recommended-splits",
  authMiddleware,
  wrap(onboardingController.getRecommendedSplits)
);

export default router;
