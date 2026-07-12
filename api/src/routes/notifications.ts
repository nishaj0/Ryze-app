import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as notificationController from "../controllers/notificationController";

const router = Router();

router.post("/token", authMiddleware, wrap(notificationController.saveToken));
router.put("/preferences", authMiddleware, wrap(notificationController.updatePreferences));
router.get("/preferences", authMiddleware, wrap(notificationController.getPreferences));
router.post("/trigger-reminders", wrap(notificationController.triggerReminders));

export default router;
