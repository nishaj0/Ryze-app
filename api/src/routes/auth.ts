import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
import { wrap } from "../utils/asyncHandler";
import * as authController from "../controllers/authController";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", validate(registerSchema), wrap(authController.register));
router.post("/login", validate(loginSchema), wrap(authController.login));
router.get("/me", authMiddleware, wrap(authController.me));
router.put("/me", authMiddleware, wrap(authController.updateProfile));
router.delete("/me", authMiddleware, wrap(authController.deleteAccount));

export default router;
