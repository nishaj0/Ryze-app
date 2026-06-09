import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate";
import { authMiddleware } from "../middleware/auth";
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

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

router.post("/register", validate(registerSchema), wrap(authController.register));
router.post("/login", validate(loginSchema), wrap(authController.login));
router.get("/me", authMiddleware, wrap(authController.me));
router.put("/me", authMiddleware, wrap(authController.updateProfile));
router.delete("/me", authMiddleware, wrap(authController.deleteAccount));

export default router;
