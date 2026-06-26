import { PrismaClient } from "@prisma/client";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { callGemini } from "../utils/gemini";
import axios from "axios";

const prisma = new PrismaClient();

const ADMIN_KEY = process.env.ADMIN_KEY || "ryze-admin-2024";

interface GeminiSuggestionResponse {
  suggestionType: "SWAP_EXERCISE" | "REDUCE_VOLUME" | "ADD_DELOAD" | "ADJUST_REST";
  alternativeExerciseName: string | null;
  reasoning: string;
}

const SUGGESTION_SCHEMA = {
  type: "object",
  properties: {
    suggestionType: {
      type: "string",
      enum: ["SWAP_EXERCISE", "REDUCE_VOLUME", "ADD_DELOAD", "ADJUST_REST"],
      description: "The type of suggestion to make",
    },
    alternativeExerciseName: {
      type: ["string", "null"],
      description:
        "If suggestionType is SWAP_EXERCISE, the name of the alternative exercise from the provided list. Otherwise null.",
    },
    reasoning: {
      type: "string",
      description: "Human-readable explanation for the suggestion in plain, encouraging language",
    },
  },
  required: ["suggestionType", "alternativeExerciseName", "reasoning"],
  additionalProperties: false,
};

async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: any
) {
  if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken")) {
    return;
  }
  try {
    await axios.post("https://exp.host/--/api/v2/push/send", {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
    });
  } catch (err) {
    console.error(`[Push Notification] Error sending to ${expoPushToken}:`, err);
  }
}

export async function evaluateForUser(userId: string): Promise<{
  suggestionsCreated: number;
  skipped: boolean;
  reason?: string;
}> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  if (settings && !settings.aiSuggestionsEnabled) {
    return { suggestionsCreated: 0, skipped: true, reason: "AI suggestions disabled" };
  }

  const activeSplit = await prisma.userSplit.findFirst({
    where: { userId, isActive: true },
    include: {
      split: {
        include: {
          days: {
            include: {
              exercises: {
                include: { exercise: true },
              },
            },
          },
        },
      },
    },
  });

  if (!activeSplit) {
    return { suggestionsCreated: 0, skipped: true, reason: "No active split" };
  }

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  if (activeSplit.startDate > twoWeeksAgo) {
    return { suggestionsCreated: 0, skipped: true, reason: "Split too new (< 2 weeks)" };
  }

  const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
  const struggledCheckIns = await prisma.checkIn.findMany({
    where: {
      userId,
      sentiment: "STRUGGLED",
      createdAt: { gte: threeWeeksAgo },
    },
  });

  if (struggledCheckIns.length < 3) {
    return {
      suggestionsCreated: 0,
      skipped: true,
      reason: `Only ${struggledCheckIns.length} STRUGGLED check-ins (need 3+)`,
    };
  }

  const exerciseGroups = new Map<
    string,
    { exerciseId: string; checkIns: typeof struggledCheckIns; splitDayId: string }
  >();
  const issueGroups = new Map<string, { keyword: string; checkIns: typeof struggledCheckIns; splitDayId: string }>();

  for (const checkIn of struggledCheckIns) {
    const session = await prisma.workoutSession.findUnique({
      where: { id: checkIn.sessionId },
    });
    if (!session) continue;

    if (checkIn.affectedExerciseId) {
      const existing = exerciseGroups.get(checkIn.affectedExerciseId);
      if (existing) {
        existing.checkIns.push(checkIn);
      } else {
        exerciseGroups.set(checkIn.affectedExerciseId, {
          exerciseId: checkIn.affectedExerciseId,
          checkIns: [checkIn],
          splitDayId: session.splitDayId,
        });
      }
    } else if (checkIn.extractedIssues.length > 0) {
      const keywords = extractBodyPartKeywords(checkIn.extractedIssues);
      for (const keyword of keywords) {
        const existing = issueGroups.get(keyword);
        if (existing) {
          existing.checkIns.push(checkIn);
        } else {
          issueGroups.set(keyword, {
            keyword,
            checkIns: [checkIn],
            splitDayId: session.splitDayId,
          });
        }
      }
    }
  }

  let suggestionsCreated = 0;

  for (const [exerciseId, group] of exerciseGroups) {
    if (group.checkIns.length < 2) continue;

    const existingPending = await prisma.splitSuggestion.findFirst({
      where: {
        userId,
        exerciseId,
        status: "PENDING",
      },
    });
    if (existingPending) continue;

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });
    if (!exercise) continue;

    const alternatives = await prisma.exerciseAlternative.findMany({
      where: { exerciseId },
      include: { alternative: true },
    });

    const splitDayExercise = await prisma.splitDayExercise.findFirst({
      where: {
        splitDayId: group.splitDayId,
        exerciseId,
      },
    });

    const canSwap = alternatives.length > 0;
    const alternativeNames = alternatives.map((a) => a.alternative.name);

    const allIssues = group.checkIns.flatMap((c) => c.extractedIssues);

    const systemPrompt = buildSuggestionPrompt(
      exercise.name,
      allIssues,
      alternativeNames,
      splitDayExercise?.targetSets || 3,
      splitDayExercise?.targetRepsMin || 8,
      splitDayExercise?.targetRepsMax || 12,
      canSwap
    );

    const userPrompt = `The user has reported the following issues across ${group.checkIns.length} workouts: ${group.checkIns
      .map((c) => c.extractedIssues.join(", "))
      .join("; ")}`;

    const result = await callGemini<GeminiSuggestionResponse>({
      systemPrompt,
      userPrompt,
      responseSchema: SUGGESTION_SCHEMA,
    });

    if (!result) {
      console.error(`[Suggestion] AI call failed for user ${userId}, exercise ${exerciseId}`);
      continue;
    }

    let suggestedAlternativeExerciseId: string | null = null;
    if (result.suggestionType === "SWAP_EXERCISE" && result.alternativeExerciseName) {
      const matched = alternatives.find(
        (a) => a.alternative.name.toLowerCase() === result.alternativeExerciseName!.toLowerCase()
      );
      if (!matched) {
        console.error(
          `[Suggestion] AI returned non-matching alternative: ${result.alternativeExerciseName}`
        );
        continue;
      }
      suggestedAlternativeExerciseId = matched.alternativeId;
    }

    await prisma.splitSuggestion.create({
      data: {
        userId,
        splitDayId: group.splitDayId,
        exerciseId,
        suggestionType: result.suggestionType,
        suggestedAlternativeExerciseId,
        reasoning: result.reasoning,
        basedOnCheckInIds: group.checkIns.map((c) => c.id),
      },
    });

    await createNotificationAndPush(userId, "AI Suggestion Available", "We noticed a pattern in your recent workouts — check out a suggestion.");

    suggestionsCreated++;
  }

  for (const [keyword, group] of issueGroups) {
    if (group.checkIns.length < 2) continue;

    const existingPending = await prisma.splitSuggestion.findFirst({
      where: {
        userId,
        splitDayId: group.splitDayId,
        exerciseId: null,
        status: "PENDING",
      },
    });
    if (existingPending) continue;

    const splitDayExercise = await prisma.splitDayExercise.findFirst({
      where: { splitDayId: group.splitDayId },
    });

    const systemPrompt = buildGeneralSuggestionPrompt(
      keyword,
      splitDayExercise?.targetSets || 3,
      false
    );

    const userPrompt = `The user has reported general issues related to "${keyword}" across ${group.checkIns.length} workouts: ${group.checkIns
      .map((c) => c.extractedIssues.join(", "))
      .join("; ")}`;

    const result = await callGemini<GeminiSuggestionResponse>({
      systemPrompt,
      userPrompt,
      responseSchema: SUGGESTION_SCHEMA,
    });

    if (!result) {
      console.error(`[Suggestion] AI call failed for user ${userId}, keyword ${keyword}`);
      continue;
    }

    if (result.suggestionType === "SWAP_EXERCISE") {
      console.error(`[Suggestion] AI incorrectly suggested SWAP for general issue`);
      continue;
    }

    await prisma.splitSuggestion.create({
      data: {
        userId,
        splitDayId: group.splitDayId,
        exerciseId: null,
        suggestionType: result.suggestionType,
        suggestedAlternativeExerciseId: null,
        reasoning: result.reasoning,
        basedOnCheckInIds: group.checkIns.map((c) => c.id),
      },
    });

    await createNotificationAndPush(userId, "AI Suggestion Available", "We noticed a pattern in your recent workouts — check out a suggestion.");

    suggestionsCreated++;
  }

  return { suggestionsCreated, skipped: false };
}

function extractBodyPartKeywords(issues: string[]): string[] {
  const keywords: string[] = [];
  const bodyParts = ["shoulder", "knee", "back", "wrist", "elbow", "hip", "ankle", "neck"];

  for (const issue of issues) {
    const lower = issue.toLowerCase();
    for (const part of bodyParts) {
      if (lower.includes(part)) {
        keywords.push(part);
      }
    }
  }

  return [...new Set(keywords)];
}

function buildSuggestionPrompt(
  exerciseName: string,
  issues: string[],
  alternativeNames: string[],
  targetSets: number,
  targetRepsMin: number,
  targetRepsMax: number,
  canSwap: boolean
): string {
  const allowedTypes = canSwap
    ? "SWAP_EXERCISE, REDUCE_VOLUME, ADD_DELOAD, or ADJUST_REST"
    : "REDUCE_VOLUME, ADD_DELOAD, or ADJUST_REST (no alternatives available for this exercise)";

  return `You are a fitness coach analyzing a user's workout data. The user has reported recurring discomfort with the exercise "${exerciseName}" across multiple workouts.

Issues reported: ${issues.join(", ")}

Current exercise parameters:
- Target sets: ${targetSets}
- Target reps: ${targetRepsMin}-${targetRepsMax}

${canSwap ? `Available alternative exercises: ${alternativeNames.join(", ")}` : "No alternative exercises are available for this exercise."}

You must choose ONE response:
- ${allowedTypes}

If you choose SWAP_EXERCISE, you MUST select one of the provided alternative exercise names exactly.

Provide your reasoning in plain, encouraging language (not clinical or alarming). Explain why you're making this suggestion and how it will help the user.`;
}

function buildGeneralSuggestionPrompt(
  keyword: string,
  targetSets: number,
  canSwap: boolean
): string {
  return `You are a fitness coach analyzing a user's workout data. The user has reported general discomfort related to "${keyword}" across multiple workouts, not tied to a specific exercise.

Current training parameters:
- Target sets: ${targetSets}

You must choose ONE response:
- REDUCE_VOLUME, ADD_DELOAD, or ADJUST_REST

Provide your reasoning in plain, encouraging language (not clinical or alarming). Explain why you're making this suggestion and how it will help the user.`;
}

async function createNotificationAndPush(userId: string, title: string, body: string) {
  await prisma.notification.create({
    data: { userId, type: "AI_SUGGESTION", title, body },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });

  if (user?.pushToken) {
    await sendPushNotification(user.pushToken, title, body, { screen: "Home" });
  }
}

export const generateSuggestions = async (req: AuthRequest, res: Response) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== ADMIN_KEY) {
    throw new AppError("Unauthorized", 401);
  }

  const users = await prisma.user.findMany({
    where: {
      userSplits: {
        some: { isActive: true },
      },
    },
    select: { id: true },
  });

  let evaluated = 0;
  let suggestionsCreated = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      const result = await evaluateForUser(user.id);
      evaluated++;
      suggestionsCreated += result.suggestionsCreated;
      if (result.skipped) skipped++;
    } catch (err) {
      console.error(`[Suggestion] Error evaluating user ${user.id}:`, err);
      skipped++;
    }
  }

  return res.json({ evaluated, suggestionsCreated, skipped });
};

export const getSuggestions = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const suggestions = await prisma.splitSuggestion.findMany({
    where: { userId, status: "PENDING" },
    include: {
      exercise: { select: { name: true } },
      suggestedAlternative: { select: { name: true } },
      splitDay: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ suggestions });
};

export const acceptSuggestion = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const suggestion = await prisma.splitSuggestion.findUnique({
    where: { id: id as string },
  });

  if (!suggestion) {
    throw new AppError("Suggestion not found", 404);
  }

  if (suggestion.userId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  if (suggestion.status !== "PENDING") {
    throw new AppError("Suggestion already resolved", 400);
  }

  if (suggestion.suggestionType === "SWAP_EXERCISE" && suggestion.suggestedAlternativeExerciseId && suggestion.exerciseId) {
    const splitDayExercise = await prisma.splitDayExercise.findFirst({
      where: {
        splitDayId: suggestion.splitDayId,
        exerciseId: suggestion.exerciseId,
      },
    });

    if (splitDayExercise) {
      await prisma.splitDayExercise.update({
        where: { id: splitDayExercise.id },
        data: { exerciseId: suggestion.suggestedAlternativeExerciseId },
      });
    }
  } else if (suggestion.suggestionType === "REDUCE_VOLUME" && suggestion.exerciseId) {
    const splitDayExercise = await prisma.splitDayExercise.findFirst({
      where: {
        splitDayId: suggestion.splitDayId,
        exerciseId: suggestion.exerciseId,
      },
    });

    if (splitDayExercise) {
      const newSets = Math.max(1, Math.round(splitDayExercise.targetSets * 0.8));
      await prisma.splitDayExercise.update({
        where: { id: splitDayExercise.id },
        data: { targetSets: newSets },
      });
    }
  } else if (suggestion.suggestionType === "ADD_DELOAD" && suggestion.exerciseId) {
    const splitDayExercise = await prisma.splitDayExercise.findFirst({
      where: {
        splitDayId: suggestion.splitDayId,
        exerciseId: suggestion.exerciseId,
      },
    });

    if (splitDayExercise) {
      const currentNotes = splitDayExercise.notes || "";
      await prisma.splitDayExercise.update({
        where: { id: splitDayExercise.id },
        data: { notes: currentNotes + "\nDeload week recommended" },
      });
    }
  } else if (suggestion.suggestionType === "ADJUST_REST" && suggestion.exerciseId) {
    const splitDayExercise = await prisma.splitDayExercise.findFirst({
      where: {
        splitDayId: suggestion.splitDayId,
        exerciseId: suggestion.exerciseId,
      },
    });

    if (splitDayExercise) {
      const currentNotes = splitDayExercise.notes || "";
      await prisma.splitDayExercise.update({
        where: { id: splitDayExercise.id },
        data: { notes: currentNotes + "\nIncrease rest between sets" },
      });
    }
  }

  await prisma.splitSuggestion.update({
    where: { id: id as string },
    data: { status: "ACCEPTED", resolvedAt: new Date() },
  });

  return res.json({ message: "Suggestion accepted" });
};

export const dismissSuggestion = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const suggestion = await prisma.splitSuggestion.findUnique({
    where: { id: id as string },
  });

  if (!suggestion) {
    throw new AppError("Suggestion not found", 404);
  }

  if (suggestion.userId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  if (suggestion.status !== "PENDING") {
    throw new AppError("Suggestion already resolved", 400);
  }

  await prisma.splitSuggestion.update({
    where: { id: id as string },
    data: { status: "DISMISSED", resolvedAt: new Date() },
  });

  return res.json({ message: "Suggestion dismissed" });
};
