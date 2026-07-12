import axios from "axios";
import { randomUUID } from "node:crypto";
import { prisma } from "./db";
import { createLogger, runWithContext } from "./logger";

const log = createLogger("scheduler");

const ADMIN_KEY = process.env.ADMIN_KEY || "ryze-admin-2024";
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

export async function initScheduler(): Promise<void> {
  const cron = (await import("node-cron")).default;

  log.info({ baseUrl: BASE_URL, retryCron: "*/10 * * * *" }, "scheduler:init");

  cron.schedule("*/10 * * * *", async () => {
    await runWithContext(
      { runId: randomUUID(), job: "retry-unprocessed" },
      async () => {
        log.debug("job:start");
        try {
          await axios.post(
            `${BASE_URL}/api/checkins/retry-unprocessed`,
            {},
            { headers: { "x-admin-key": ADMIN_KEY } }
          );
          log.debug("job:ok");
        } catch (error) {
          log.error({ err: error }, "job:fail");
        }
      }
    );
  });

  let cronExpression = "0 9 * * 0";
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });
    if (settings?.aiSuggestionScheduleCron) {
      cronExpression = settings.aiSuggestionScheduleCron;
    }
  } catch (error) {
    log.error({ err: error }, "scheduler:settings-load-fail");
  }

  cron.schedule(cronExpression, async () => {
    await runWithContext(
      { runId: randomUUID(), job: "generate-suggestions" },
      async () => {
        log.debug("job:start");
        try {
          await axios.post(
            `${BASE_URL}/api/suggestions/generate`,
            {},
            { headers: { "x-admin-key": ADMIN_KEY } }
          );
          log.debug("job:ok");
        } catch (error) {
          log.error({ err: error }, "job:fail");
        }
      }
    );
  });

  log.info({ aiSuggestionCron: cronExpression }, "scheduler:ready");
}
