import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import * as splitController from "../controllers/splitController";

const router = Router();

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

router.get("/", authMiddleware, wrap(splitController.listSplits));
router.post("/ai-generate", authMiddleware, wrap(splitController.generateAISplit));
router.get("/user/active", authMiddleware, wrap(splitController.getActiveSplit));
router.put("/user/active", authMiddleware, wrap(splitController.setActiveSplit));
router.post("/", authMiddleware, wrap(splitController.createSplit));
router.patch("/exercises/:id", authMiddleware, wrap(splitController.updateSplitExercise));
router.get("/:id", authMiddleware, wrap(splitController.getSplit));

const updateSplitSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  daysPerWeek: z.number().int().min(1).max(14),
  days: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    isRest: z.boolean(),
    muscleGroups: z.array(z.string()).default([]),
    exercises: z.array(z.object({
      id: z.string().optional(),
      exerciseId: z.string(),
      targetSets: z.number().int().min(1),
      targetRepsMin: z.number().int().min(1),
      targetRepsMax: z.number().int().min(1),
    })).default([]),
  })),
});

router.put("/:id", authMiddleware, validate(updateSplitSchema), wrap(splitController.updateSplit));

export default router;
