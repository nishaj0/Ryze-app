import { Router } from "express";
import { getAppSettings } from "../controllers/settingsController";

const router = Router();

router.get("/settings", getAppSettings);

export default router;
