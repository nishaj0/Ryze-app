import { Router, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import * as metricsController from "../controllers/metricsController";

const router = Router();

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: any, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

const bodyMetricSchema = z.object({
  date: z.string().optional(),
  weightKg: z.number().positive(),
  notes: z.string().optional(),
});

router.post("/body", authMiddleware, validate(bodyMetricSchema), wrap(metricsController.logBodyMetric));
router.get("/body", authMiddleware, wrap(metricsController.getBodyMetrics));
router.delete("/body/:id", authMiddleware, wrap(metricsController.deleteBodyMetric));

export default router;
