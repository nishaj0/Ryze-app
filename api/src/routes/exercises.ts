import { Router, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import * as exerciseController from "../controllers/exerciseController";

const router = Router();

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

router.get("/", authMiddleware, wrap(exerciseController.listExercises));
router.get("/:id", authMiddleware, wrap(exerciseController.getExercise));
router.get("/:id/alternatives", authMiddleware, wrap(exerciseController.getAlternatives));
router.get("/:id/history", authMiddleware, wrap(exerciseController.getExerciseHistory));

export default router;
