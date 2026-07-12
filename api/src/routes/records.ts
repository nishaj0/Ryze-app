import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as recordController from "../controllers/recordController";

const router = Router();

router.get("/", authMiddleware, wrap(recordController.getRecords));
router.get("/exercise/:exerciseId", authMiddleware, wrap(recordController.getExerciseRecords));

export default router;
