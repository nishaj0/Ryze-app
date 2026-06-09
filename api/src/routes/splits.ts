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
router.get("/:id", authMiddleware, wrap(splitController.getSplit));
router.get("/user/active", authMiddleware, wrap(splitController.getActiveSplit));
router.put("/user/active", authMiddleware, wrap(splitController.setActiveSplit));
router.post("/", authMiddleware, wrap(splitController.createSplit));

export default router;
