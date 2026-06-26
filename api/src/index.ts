import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import onboardingRoutes from "./routes/onboarding";
import splitRoutes from "./routes/splits";
import exerciseRoutes from "./routes/exercises";
import sessionRoutes from "./routes/sessions";
import metricsRoutes from "./routes/metrics";
import photoRoutes from "./routes/photos";
import progressRoutes from "./routes/progress";
import recordRoutes from "./routes/records";
import notificationRoutes from "./routes/notifications";
import adminRoutes from "./routes/admin";
import appRoutes from "./routes/app";
import supportRoutes from "./routes/support";
import checkinRoutes from "./routes/checkins";
import suggestionRoutes from "./routes/suggestions";
import { initScheduler } from "./utils/scheduler";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/splits", splitRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/app", appRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/checkins", checkinRoutes);
app.use("/api/suggestions", suggestionRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Ryze API running on port ${PORT}`);
  initScheduler();
});

export default app;
