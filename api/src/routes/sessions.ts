import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as sessionController from "../controllers/sessionController";

const router = Router();

router.post("/", authMiddleware, wrap(sessionController.createSession));
router.post("/sync", authMiddleware, wrap(sessionController.syncSession));
router.post("/rest", authMiddleware, wrap(sessionController.markRestDay));
router.get("/calendar", authMiddleware, wrap(sessionController.getCalendarSessions));
router.get("/", authMiddleware, wrap(sessionController.listSessions));
router.get("/:id", authMiddleware, wrap(sessionController.getSession));
router.patch("/:id", authMiddleware, wrap(sessionController.updateSession));
router.patch("/:id/complete", authMiddleware, wrap(sessionController.completeSession));
router.post("/:id/exercises", authMiddleware, wrap(sessionController.addExerciseToSession));
router.patch(
  "/:id/exercises/:exerciseLogId/swap",
  authMiddleware,
  wrap(sessionController.swapExercise)
);
router.post(
  "/exercises/:exerciseLogId/sets",
  authMiddleware,
  wrap(sessionController.logSet)
);
router.delete(
  "/exercises/:exerciseLogId/sets/:setId",
  authMiddleware,
  wrap(sessionController.deleteSet)
);
router.patch(
  "/exercise-logs/:exerciseLogId/notes",
  authMiddleware,
  wrap(sessionController.updateExerciseNotes)
);

export default router;
