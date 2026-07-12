import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as metricsController from "../controllers/metricsController";
import * as nutritionController from "../controllers/nutritionController";

const router = Router();

const bodyMetricSchema = z.object({
  date: z.string().optional(),
  weightKg: z.number().positive(),
  notes: z.string().optional(),
});

router.post("/body", authMiddleware, validate(bodyMetricSchema), wrap(metricsController.logBodyMetric));
router.get("/body", authMiddleware, wrap(metricsController.getBodyMetrics));
router.delete("/body/:id", authMiddleware, wrap(metricsController.deleteBodyMetric));

router.post("/nutrition", authMiddleware, wrap(nutritionController.logNutrition));
router.get("/nutrition", authMiddleware, wrap(nutritionController.getNutritionLogs));

export default router;
