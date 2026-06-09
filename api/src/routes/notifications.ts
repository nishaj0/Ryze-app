import { Router, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import * as notificationController from "../controllers/notificationController";

const router = Router();

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

router.post("/token", authMiddleware, wrap(notificationController.saveToken));
router.put("/preferences", authMiddleware, wrap(notificationController.updatePreferences));
router.get("/preferences", authMiddleware, wrap(notificationController.getPreferences));

export default router;
