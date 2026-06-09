import { Router, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import * as progressController from "../controllers/progressController";

const router = Router();

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

router.get("/overview", authMiddleware, wrap(progressController.getOverview));
router.get("/exercise/:id", authMiddleware, wrap(progressController.getExerciseProgress));
router.get("/muscle-volume", authMiddleware, wrap(progressController.getMuscleVolume));
router.get("/heatmap", authMiddleware, wrap(progressController.getHeatmap));

export default router;
