import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../utils/db";
import { callGemini, GeminiError } from "../utils/gemini";
import { createLogger } from "../utils/logger";
import { evaluateForUser } from "./splitSuggestionController";

const log = createLogger("checkin");

interface GeminiCheckInResponse {
  sentiment: "GOOD" | "NEUTRAL" | "STRUGGLED";
  extractedIssues: string[];
  affectedExerciseName: string | null;
}

const CHECKIN_SCHEMA = {
  type: "object",
  properties: {
    sentiment: {
      type: "string",
      enum: ["GOOD", "NEUTRAL", "STRUGGLED"],
      description: "Overall sentiment of the check-in",
    },
    extractedIssues: {
      type: "array",
      items: { type: "string" },
      description:
        "Short phrases describing any discomfort, pain, or notable issues",
    },
    affectedExerciseName: {
      anyOf: [{ type: "string" }, { type: "null" }],
      description:
        "The name of the exercise from the provided list that is most associated with the issue, or null if none",
    },
  },
  required: ["sentiment", "extractedIssues", "affectedExerciseName"],
  additionalProperties: false,
};

export async function processCheckIn(checkInId: string): Promise<void> {
  log.debug({ checkInId }, "processCheckIn:start");
  const start = Date.now();

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
  });

  if (!checkIn) {
    log.warn({ checkInId }, "processCheckIn:not-found");
    return;
  }

  const exerciseLogs = await prisma.exerciseLog.findMany({
    where: { sessionId: checkIn.sessionId },
    select: {
      exercise: {
        select: { id: true, name: true },
      },
    },
  });

  const sessionExercises = exerciseLogs.map((log) => ({
    id: log.exercise.id,
    name: log.exercise.name,
  }));

  if (sessionExercises.length === 0) {
    log.warn({ checkInId, sessionId: checkIn.sessionId }, "processCheckIn:no-exercises");
    return;
  }

  const exerciseNames = sessionExercises.map((e) => e.name).join(", ");

  const systemPrompt = `You are analyzing a post-workout check-in from a gym-goer. Extract any discomfort, pain, or notable issues as short phrases. Classify the overall sentiment as GOOD (positive, productive), NEUTRAL (neutral, unremarkable), or STRUGGLED (difficult, painful, fatigued). If an issue clearly relates to one specific exercise from the session, identify which one by name.

The exercises performed in this session were: ${exerciseNames}

Respond with the exact schema provided. If no exercise is clearly associated with the issue, set affectedExerciseName to null.`;

  const userPrompt = checkIn.rawText;

  let result: GeminiCheckInResponse;
  try {
    result = await callGemini<GeminiCheckInResponse>({
      systemPrompt,
      userPrompt,
      responseSchema: CHECKIN_SCHEMA,
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      log.error({ checkInId, error: error.message }, "processCheckIn:ai-fail");
    } else {
      log.error({ checkInId, err: error }, "processCheckIn:ai-unexpected");
    }
    return;
  }

  let affectedExerciseId: string | null = null;

  if (result.affectedExerciseName) {
    const matched = sessionExercises.find(
      (e) =>
        e.name.toLowerCase() === result.affectedExerciseName!.toLowerCase()
    );
    if (matched) {
      affectedExerciseId = matched.id;
      log.debug({ checkInId, affectedExerciseId, name: matched.name }, "processCheckIn:matched-exercise");
    } else {
      log.warn({ checkInId, affectedExerciseName: result.affectedExerciseName }, "processCheckIn:exercise-not-matched");
    }
  }

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: {
      sentiment: result.sentiment,
      extractedIssues: result.extractedIssues,
      affectedExerciseId,
      aiProcessed: true,
    },
  });

  log.debug(
    {
      checkInId,
      sentiment: result.sentiment,
      issuesCount: result.extractedIssues.length,
      affectedExerciseId,
      durationMs: Date.now() - start,
    },
    "processCheckIn:updated"
  );

  if (result.sentiment === "STRUGGLED") {
    const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
    const struggledCount = await prisma.checkIn.count({
      where: {
        userId: checkIn.userId,
        sentiment: "STRUGGLED",
        createdAt: { gte: threeWeeksAgo },
      },
    });

    log.debug({ checkInId, struggledCount }, "processCheckIn:struggled-count");

    if (struggledCount >= 3) {
      log.debug({ checkInId, userId: checkIn.userId }, "processCheckIn:trigger-suggestion-eval");
      void evaluateForUser(checkIn.userId).catch((err) => {
        log.error({ checkInId, userId: checkIn.userId, err }, "processCheckIn:suggestion-eval-error");
      });
    }
  }

  log.debug({ checkInId, durationMs: Date.now() - start }, "processCheckIn:ok");
}

export const createCheckIn = async (req: AuthRequest, res: Response) => {
  const { sessionId, rawText } = req.body;
  const userId = req.userId!;

  const trimmed = rawText.trim();
  if (!trimmed) {
    return res.status(204).end();
  }

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (session.userId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  const checkIn = await prisma.checkIn.upsert({
    where: { sessionId },
    create: {
      sessionId,
      userId,
      rawText: trimmed,
    },
    update: {
      rawText: trimmed,
      sentiment: "NEUTRAL",
      aiProcessed: false,
    },
  });

  log.debug({ checkInId: checkIn.id, sessionId, userId }, "createCheckIn:trigger-background");

  void processCheckIn(checkIn.id).catch((err) => {
    log.error({ checkInId: checkIn.id, err }, "createCheckIn:background-error");
  });

  return res.status(201).json({ checkIn });
};

export const getCheckIn = async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const userId = req.userId!;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (session.userId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  const checkIn = await prisma.checkIn.findUnique({
    where: { sessionId },
  });

  if (!checkIn) {
    return res.status(204).end();
  }

  return res.json({ checkIn });
};

export const listCheckInHistory = async (req: AuthRequest, res: Response) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);
  const checkIns = await prisma.checkIn.findMany({
    where: { userId: req.userId!, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    select: { id: true, rawText: true, extractedIssues: true, sentiment: true, aiProcessed: true, createdAt: true, sessionId: true },
  });
  const summary = checkIns.reduce<Record<string, number>>((counts, checkIn) => {
    counts[checkIn.sentiment] = (counts[checkIn.sentiment] || 0) + 1;
    return counts;
  }, { GOOD: 0, NEUTRAL: 0, STRUGGLED: 0 });
  res.json({ checkIns, summary, days });
};

export const retryUnprocessed = async (req: AuthRequest, res: Response) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== (process.env.ADMIN_KEY || "ryze-admin-2024")) {
    throw new AppError("Unauthorized", 401);
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const unprocessed = await prisma.checkIn.findMany({
    where: {
      aiProcessed: false,
      createdAt: { lt: fiveMinutesAgo },
    },
    select: { id: true },
  });

  log.debug({ count: unprocessed.length }, "retryUnprocessed:start");

  const results = await Promise.allSettled(
    unprocessed.map((c) => processCheckIn(c.id))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  log.debug({ succeeded, failed }, "retryUnprocessed:done");

  return res.json({ processed: succeeded, failed });
};
