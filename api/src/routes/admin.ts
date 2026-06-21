import { Router, Request, Response, NextFunction } from "express";
import * as admin from "../controllers/adminController";
import * as settings from "../controllers/settingsController";


const router = Router();

// Simple admin key middleware
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["x-admin-key"] || req.query.adminKey;
  if (key !== (process.env.ADMIN_KEY || "ryze-admin-2024")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
};

const wrap = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

router.use(adminAuth);

// Dashboard
router.get("/dashboard", wrap(admin.getDashboardStats));

// Users
router.get("/users", wrap(admin.listUsers));
router.get("/users/:id", wrap(admin.getUser));
router.put("/users/:id", wrap(admin.updateUser));
router.delete("/users/:id", wrap(admin.deleteUser));
router.post("/users/:id/reset-onboarding", wrap(admin.resetOnboarding));

// Splits
router.get("/splits", wrap(admin.listAllSplits));
router.post("/splits", wrap(admin.createPrebuiltSplit));
router.delete("/splits/:id", wrap(admin.deleteSplit));
router.patch("/splits/:id/toggle-prebuilt", wrap(admin.toggleSplitPrebuilt));

// Exercises
router.get("/exercises", wrap(admin.listExercises));
router.post("/exercises", wrap(admin.createExercise));

// Exercise Requests
router.get("/exercise-requests", wrap(admin.listExerciseRequests));
router.patch("/exercise-requests/:id", wrap(admin.updateExerciseRequest));

// Sessions / Activity
router.get("/sessions", wrap(admin.listSessions));

// Notifications
router.post("/notifications/broadcast", wrap(admin.sendBroadcast));

// Onboarding Stats
router.get("/onboarding/stats", wrap(admin.getOnboardingStats));

// App Settings & Support Tickets
router.get("/settings", wrap(settings.getAppSettings));
router.put("/settings", wrap(settings.updateAppSettings));
router.get("/support/tickets", wrap(settings.listAllTickets));
router.put("/support/tickets/:id", wrap(settings.respondToTicket));

export default router;
