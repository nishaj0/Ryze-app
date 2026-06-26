import axios from "axios";
import { PrismaClient } from "@prisma/client";

const ADMIN_KEY = process.env.ADMIN_KEY || "ryze-admin-2024";
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();

export async function initScheduler(): Promise<void> {
  const cron = (await import("node-cron")).default;

  cron.schedule("*/10 * * * *", async () => {
    try {
      await axios.post(
        `${BASE_URL}/api/checkins/retry-unprocessed`,
        {},
        { headers: { "x-admin-key": ADMIN_KEY } }
      );
    } catch (error) {
      console.error("[Scheduler] Check-in retry failed:", error);
    }
  });

  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  const cronExpression = settings?.aiSuggestionScheduleCron || "0 9 * * 0";

  cron.schedule(cronExpression, async () => {
    try {
      await axios.post(
        `${BASE_URL}/api/suggestions/generate`,
        {},
        { headers: { "x-admin-key": ADMIN_KEY } }
      );
    } catch (error) {
      console.error("[Scheduler] AI suggestion generation failed:", error);
    }
  });

  console.log(`[Scheduler] Initialized (AI suggestions: ${cronExpression})`);
}
