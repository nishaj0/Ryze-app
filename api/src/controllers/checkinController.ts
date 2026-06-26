import { PrismaClient } from "@prisma/client";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { callGemini } from "../utils/gemini";

const prisma = new PrismaClient();

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
      description: "Short phrases describing any discomfort, pain, or notable issues",
    },
    affectedExerciseName: {
      type: ["string", "null"],
      description:
        "The name of the exercise from the provided list that is most associated with the issue, or null if none",
    },
  },
  required: ["sentiment", "extractedIssues", "affectedExerciseName"],
  additionalProperties: false,
};

async function processCheckIn(checkInId: string): Promise<void> {
  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
  });

  if (!checkIn) {
    console.error(`[CheckIn] CheckIn ${checkInId} not found`);
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
    console.error(`[CheckIn] Session ${checkIn.sessionId} has no exercises`);
    return;
  }

  const exerciseNames = sessionExercises.map((e) => e.name).join(", ");

  const systemPrompt = `You are analyzing a post-workout check-in from a gym-goer. Extract any discomfort, pain, or notable issues as short phrases. Classify the overall sentiment as GOOD (positive, productive), NEUTRAL (neutral, unremarkable), or STRUGGLED (difficult, painful, fatigued). If an issue clearly relates to one specific exercise from the session, identify which one by name.

The exercises performed in this session were: ${exerciseNames}

Respond with the exact schema provided. If no exercise is clearly associated with the issue, set affectedExerciseName to null.`;

  const userPrompt = checkIn.rawText;

  const result = await callGemini<GeminiCheckInResponse>({
    systemPrompt,
    userPrompt,
    responseSchema: CHECKIN_SCHEMA,
  });

  if (!result) {
    console.error(`[CheckIn] AI call failed for checkIn ${checkInId}`);
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

  void processCheckIn(checkIn.id).catch((err) => {
    console.error("[CheckIn] Background processing error:", err);
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

  const results = await Promise.allSettled(
    unprocessed.map((c) => processCheckIn(c.id))
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return res.json({ processed: succeeded, failed });
};
