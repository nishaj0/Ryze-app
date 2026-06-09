import { Router, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import * as recordController from "../controllers/recordController";

const router = Router();

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

router.get("/", authMiddleware, wrap(recordController.getRecords));
router.get("/exercise/:exerciseId", authMiddleware, wrap(recordController.getExerciseRecords));

export default router;
