import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as progressController from "../controllers/progressController";

const router = Router();

router.get("/overview", authMiddleware, wrap(progressController.getOverview));
router.get("/overload/filters", authMiddleware, wrap(progressController.getOverloadFilters));
router.get("/overload/:id", authMiddleware, wrap(progressController.getOverloadHistory));
router.get("/exercise/:id", authMiddleware, wrap(progressController.getExerciseProgress));
router.get("/muscle-volume", authMiddleware, wrap(progressController.getMuscleVolume));
router.get("/heatmap", authMiddleware, wrap(progressController.getHeatmap));
router.get("/volume-history", authMiddleware, wrap(progressController.getVolumeHistory));

export default router;
