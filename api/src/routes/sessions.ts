import { Router, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import * as sessionController from "../controllers/sessionController";

const router = Router();

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

router.post("/", authMiddleware, wrap(sessionController.createSession));
router.get("/", authMiddleware, wrap(sessionController.listSessions));
router.get("/:id", authMiddleware, wrap(sessionController.getSession));
router.patch("/:id/complete", authMiddleware, wrap(sessionController.completeSession));
router.post("/rest", authMiddleware, wrap(sessionController.markRestDay));
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

export default router;
