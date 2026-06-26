import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as checkinController from "../controllers/checkinController";

const router = Router();

const wrap = (
  fn: (req: any, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

const checkInSchema = z.object({
  sessionId: z.string().min(1),
  rawText: z.string(),
});

router.post(
  "/",
  authMiddleware,
  validate(checkInSchema),
  wrap(checkinController.createCheckIn)
);

router.get(
  "/:sessionId",
  authMiddleware,
  wrap(checkinController.getCheckIn)
);

router.put(
  "/:sessionId",
  authMiddleware,
  validate(checkInSchema),
  wrap(checkinController.createCheckIn)
);

router.post(
  "/retry-unprocessed",
  wrap(checkinController.retryUnprocessed)
);

export default router;
