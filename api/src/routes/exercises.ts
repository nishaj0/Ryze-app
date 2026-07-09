import { Router, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import * as exerciseController from "../controllers/exerciseController";
import * as exerciseRequestController from "../controllers/exerciseRequestController";
import multer from "multer";

const router = Router();

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

const upload = multer({ storage: multer.memoryStorage() });

router.get("/", authMiddleware, wrap(exerciseController.listExercises));
router.get("/muscles", authMiddleware, wrap(exerciseController.getDistinctMuscles));
router.get("/:id", authMiddleware, wrap(exerciseController.getExercise));
router.get("/:id/alternatives", authMiddleware, wrap(exerciseController.getAlternatives));
router.get("/:id/history", authMiddleware, wrap(exerciseController.getExerciseHistory));

// Exercise request routes
router.post("/request", authMiddleware, wrap(exerciseRequestController.requestExercise));
router.post("/request/upload-image", authMiddleware, upload.single("image"), wrap(exerciseRequestController.uploadExerciseImage));

export default router;
