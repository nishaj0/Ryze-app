import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../utils/db";
import { callGemini, GeminiError } from "../utils/gemini";
import { createLogger } from "../utils/logger";
import { CandidateExercise, buildExerciseMaps, resolveExercise } from "../utils/exerciseMatch";

const log = createLogger("split");

export const listSplits = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const splits = await prisma.split.findMany({
    where: {
      OR: [
        { isPrebuilt: true },
        { createdById: userId }
      ]
    },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
  res.json({ splits });
};

export const getSplit = async (req: AuthRequest, res: Response) => {
  const split = await prisma.split.findUnique({
    where: { id: req.params.id as string },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: {
              exercise: {
                include: {
                  muscles: { include: { muscle: true } },
                  images: { orderBy: { order: "asc" } },
                  alternativesFrom: {
                    include: { alternative: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!split) {
    throw new AppError("Split not found", 404);
  }

  res.json({ split });
};

export const createSplit = async (req: AuthRequest, res: Response) => {
  const { name, description, type, daysPerWeek, days } = req.body;

  const split = await prisma.split.create({
    data: {
      name,
      description,
      type,
      daysPerWeek,
      isPrebuilt: false,
      createdById: req.userId,
      days: {
        create: days.map(
          (day: {
            dayNumber: number;
            name: string;
            muscleGroups: string[];
            isRest: boolean;
            exercises?: {
              exerciseId: string;
              targetSets: number;
              targetRepsMin: number;
              targetRepsMax: number;
              notes?: string;
            }[];
          }) => ({
            dayNumber: day.dayNumber,
            name: day.name,
            muscleGroups: JSON.stringify(day.muscleGroups),
            isRest: day.isRest,
            exercises: day.exercises
              ? {
                  create: day.exercises.map((ex, idx) => ({
                    exerciseId: ex.exerciseId,
                    order: idx,
                    targetSets: ex.targetSets,
                    targetRepsMin: ex.targetRepsMin,
                    targetRepsMax: ex.targetRepsMax,
                    notes: ex.notes,
                  })),
                }
              : undefined,
          })
        ),
      },
    },
    include: { days: true },
  });

  res.status(201).json({ split });
};

export const setActiveSplit = async (req: AuthRequest, res: Response) => {
  const { splitId, phase } = req.body;
  const userId = req.userId!;

  const split = await prisma.split.findUnique({ where: { id: splitId } });
  if (!split) {
    throw new AppError("Split not found", 404);
  }

  await prisma.userSplit.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  const userSplit = await prisma.userSplit.create({
    data: {
      userId,
      splitId,
      isActive: true,
      phase: phase || null,
      startDate: new Date(),
    },
    include: { split: { include: { days: true } } },
  });

  res.json({ userSplit });
};

export const getActiveSplit = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const userSplit = await prisma.userSplit.findFirst({
    where: { userId, isActive: true },
    include: {
      split: {
        include: {
          days: {
            orderBy: { dayNumber: "asc" },
            include: {
              exercises: {
                orderBy: { order: "asc" },
                include: {
                  exercise: {
                    include: {
                      muscles: { include: { muscle: true } },
                      images: { orderBy: { order: "asc" } },
                      alternativesFrom: {
                        include: { alternative: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userSplit) {
    return res.json({ userSplit: null });
  }

  res.json({ userSplit });
};

export const updateSplit = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, daysPerWeek, days } = req.body;
  const userId = req.userId!;

  const split = await prisma.split.findUnique({
    where: { id: id as string },
    include: { days: true },
  });

  if (!split) {
    throw new AppError("Split not found", 404);
  }
  if (split.isPrebuilt) {
    throw new AppError("Cannot edit a prebuilt split", 403);
  }
  if (split.createdById !== userId) {
    throw new AppError("You can only edit splits you created", 403);
  }

  await prisma.$transaction(async (tx) => {
    const payloadDayIds = (days as any[]).filter((d) => d.id).map((d) => d.id);
    const daysToDelete = split.days.filter((d) => !payloadDayIds.includes(d.id));

    for (const day of daysToDelete) {
      const sessionCount = await tx.workoutSession.count({ where: { splitDayId: day.id } });
      if (sessionCount > 0) {
        await tx.workoutSession.deleteMany({ where: { splitDayId: day.id } });
      }
      await tx.splitDay.delete({ where: { id: day.id } });
    }

    await tx.split.update({
      where: { id: id as string },
      data: { name, description, daysPerWeek },
    });

    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      const dayNumber = dayIdx + 1;

      if (day.id) {
        await tx.splitDay.update({
          where: { id: day.id },
          data: {
            dayNumber,
            name: day.name,
            muscleGroups: JSON.stringify(day.muscleGroups),
            isRest: day.isRest,
          },
        });

        if (!day.isRest && day.exercises) {
          const payloadExIds = day.exercises.filter((e: any) => e.id).map((e: any) => e.id);
          await tx.splitDayExercise.deleteMany({
            where: { splitDayId: day.id, id: { notIn: payloadExIds } },
          });

          for (let i = 0; i < day.exercises.length; i++) {
            const ex = day.exercises[i];
            if (ex.id) {
              await tx.splitDayExercise.update({
                where: { id: ex.id },
                data: {
                  exerciseId: ex.exerciseId,
                  order: i,
                  targetSets: ex.targetSets,
                  targetRepsMin: ex.targetRepsMin,
                  targetRepsMax: ex.targetRepsMax,
                },
              });
            } else {
              await tx.splitDayExercise.create({
                data: {
                  splitDayId: day.id,
                  exerciseId: ex.exerciseId,
                  order: i,
                  targetSets: ex.targetSets,
                  targetRepsMin: ex.targetRepsMin,
                  targetRepsMax: ex.targetRepsMax,
                },
              });
            }
          }
        }

        if (day.isRest) {
          await tx.splitDayExercise.deleteMany({ where: { splitDayId: day.id } });
        }
      } else {
        await tx.splitDay.create({
          data: {
            splitId: id as string,
            dayNumber,
            name: day.name,
            muscleGroups: JSON.stringify(day.muscleGroups),
            isRest: day.isRest,
            exercises: !day.isRest && day.exercises && day.exercises.length > 0
              ? {
                  create: day.exercises.map((ex: any, i: number) => ({
                    exerciseId: ex.exerciseId,
                    order: i,
                    targetSets: ex.targetSets,
                    targetRepsMin: ex.targetRepsMin,
                    targetRepsMax: ex.targetRepsMax,
                  })),
                }
              : undefined,
          },
        });
      }
    }
  });

  const updated = await prisma.split.findUnique({
    where: { id: id as string },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: { exercise: { include: { muscles: { include: { muscle: true } } } } },
          },
        },
      },
    },
  });

  res.json({ split: updated });
};

export const updateSplitExercise = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { exerciseId } = req.body;

  const updated = await prisma.splitDayExercise.update({
    where: { id: id as string },
    data: { exerciseId },
    include: {
      exercise: {
        include: {
          muscles: { include: { muscle: true } },
          images: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  res.json({ splitDayExercise: updated });
};

// ---------------------------------------------------------------------------
// Types and helpers for AI split generation
// ---------------------------------------------------------------------------

/**
 * Shape the candidate exercise list for the AI prompt:
 * - For BEGINNER experience level, sort beginner-tagged exercises first
 *   (soft signal, no hard exclusion).
 * - If the list exceeds 200 exercises, cap at 15 per primary muscle group
 *   to keep the prompt focused and reduce token usage.
 */
function shapeCandidateList(
  exercises: CandidateExercise[],
  experienceLevel: string | undefined
): CandidateExercise[] {
  let shaped = [...exercises];

  // Soft-sort: beginner exercises first for BEGINNER users
  if (experienceLevel === "BEGINNER") {
    shaped.sort((a, b) => {
      const aIsBeginnerLevel = a.level?.toLowerCase() === "beginner" ? 0 : 1;
      const bIsBeginnerLevel = b.level?.toLowerCase() === "beginner" ? 0 : 1;
      if (aIsBeginnerLevel !== bIsBeginnerLevel) return aIsBeginnerLevel - bIsBeginnerLevel;
      return a.name.localeCompare(b.name);
    });
  }

  // Cap at 15 per primary muscle group if total > 200
  if (shaped.length > 200) {
    const muscleGroupCounts = new Map<string, number>();
    const capped: CandidateExercise[] = [];
    const CAP_PER_MUSCLE = 15;

    for (const ex of shaped) {
      const muscle = ex.muscles[0]?.muscle.name ?? "unknown";
      const count = muscleGroupCounts.get(muscle) ?? 0;
      if (count < CAP_PER_MUSCLE) {
        capped.push(ex);
        muscleGroupCounts.set(muscle, count + 1);
      }
    }
    shaped = capped;
  }

  return shaped;
}

// Map labels for onboarding context fields
const GOAL_LABELS: Record<string, string> = {
  MUSCLE_GAIN: "Build Muscle (hypertrophy focus)",
  WEIGHT_LOSS: "Lose Weight (fat loss, higher reps)",
  GET_FIT: "General Fitness",
  MAINTAIN: "Maintain current physique",
};
const EXPERIENCE_LABELS: Record<string, string> = {
  BEGINNER: "Beginner (less than 6 months)",
  INTERMEDIATE: "Intermediate (6 months–2 years)",
  ADVANCED: "Advanced (2+ years)",
};
const EQUIPMENT_LABELS: Record<string, string> = {
  FULL_GYM: "Full gym (barbells, machines, cables, dumbbells)",
  HOME: "Home gym (dumbbells, kettlebells, resistance bands)",
  LIMITED: "Limited / bodyweight only",
};
const GENDER_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
};

/**
 * Build the system and user prompts for AI split generation.
 * Exported for direct unit-testing of prompt construction without needing to
 * mock Gemini's response content.
 */
export function buildSplitGenerationPrompt(
  description: string,
  onboardingContext: Record<string, any> | undefined,
  candidateExercises: CandidateExercise[]
): { systemPrompt: string; userPrompt: string } {
  // Build user profile block
  let profileBlock = "";
  if (onboardingContext) {
    const ctx = onboardingContext;
    profileBlock = `
User profile (already collected — use this as ground truth, do NOT ask the user to re-confirm):
- Goal: ${GOAL_LABELS[ctx.goal] ?? ctx.goal ?? "Not specified"}
- Experience: ${EXPERIENCE_LABELS[ctx.experienceLevel] ?? ctx.experienceLevel ?? "Not specified"}
- Days available: ${ctx.daysAvailable ?? "Not specified"} per week
- Equipment: ${EQUIPMENT_LABELS[ctx.equipmentAccess] ?? ctx.equipmentAccess ?? "Not specified"}
- Gender: ${GENDER_LABELS[ctx.gender] ?? ctx.gender ?? "Not specified"}
`;
  }

  // Build exercise list — names only for the constraint block, with metadata inline
  const exerciseNameList = candidateExercises
    .map((ex) => {
      const primaryMuscle = ex.muscles[0]?.muscle.name ?? "unknown";
      return `${ex.name} (targets: ${primaryMuscle}, equipment: ${ex.equipment ?? "any"})`;
    })
    .join("\n");

  const systemPrompt = `You are a fitness coach creating a personalized workout split.${profileBlock}
PRIORITY RULES — read these before generating:
- onboardingContext fields are HARD CONSTRAINTS (experience level, equipment, days available, goal).
  They represent safety and structural limits that cannot be overridden.
- The user's free-text description is a PREFERENCE WITHIN those constraints.
  It can influence volume, intensity, exercise emphasis, or split structure,
  but must never override the hard constraints.

CONFLICT RESOLUTION:
If the user's description conflicts with their profile (for example, requesting high
intensity while marked as BEGINNER), do NOT ignore the request and do NOT ignore
the profile. Instead, satisfy the request in a way that respects the profile constraint,
and explain this tradeoff clearly in the generated split's description field.
Example: A beginner asking for an intensive program should receive increased training
frequency or volume within beginner-appropriate exercise selection — not advanced or
complex movements. The description field must acknowledge this reasoning explicitly.

EXERCISE CONSTRAINT — this is mandatory:
You MUST ONLY select exercise names from the provided list below, using the exact
spelling and casing given. Do not invent, rename, or rephrase any exercise name.
If an exercise you want to use is not in the list, choose the closest alternative
that IS in the list.

Available exercises:
${exerciseNameList}

Common split archetypes:
- PPL (Push/Pull/Legs): 3-6 days/week
- Upper/Lower: 4 days/week
- Full Body: 3 days/week
- Bro Split: 5 days/week (one muscle group per day)

Instructions:
1. Design a split that precisely matches the user profile above — respect days available and equipment
2. Use ONLY exercises from the provided list, with exact name spelling
3. Assign sets/reps matching the goal (strength: 3-5 sets 3-6 reps; hypertrophy: 3-4 sets 8-12 reps; endurance: 2-3 sets 15-20 reps)
4. Include rest days if daysPerWeek < 7
5. Return the complete split structure
6. The description field must summarize the split AND explicitly note any conflict-resolution decisions made`;

  return { systemPrompt, userPrompt: description };
}

// ---------------------------------------------------------------------------
// Retry schema for partial exercise replacement
// ---------------------------------------------------------------------------
const RETRY_EXERCISE_SCHEMA = {
  type: "object",
  properties: {
    replacements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          exerciseName: { type: "string" },
          targetSets: { type: "number" },
          targetRepsMin: { type: "number" },
          targetRepsMax: { type: "number" },
        },
        required: ["exerciseName", "targetSets", "targetRepsMin", "targetRepsMax"],
      },
    },
  },
  required: ["replacements"],
};

export const generateAISplit = async (req: AuthRequest, res: Response) => {
  const { description, onboardingContext } = req.body;

  if (!description || typeof description !== "string") {
    throw new AppError("Description is required", 400);
  }

  // Map equipmentAccess enum → exercise equipment filter
  const EQUIPMENT_MAP: Record<string, string[]> = {
    FULL_GYM: ["barbell", "dumbbell", "cable", "machine", "kettlebell", "bands", "e-z curl bar", "other"],
    HOME: ["dumbbell", "kettlebell", "bands", "body only"],
    LIMITED: ["body only", "bands"],
  };

  const exerciseWhere: any = {};
  const equipmentAccess = onboardingContext?.equipmentAccess as string | undefined;
  if (equipmentAccess && EQUIPMENT_MAP[equipmentAccess]) {
    exerciseWhere.equipment = { in: EQUIPMENT_MAP[equipmentAccess] };
  }

  const rawExercises = await prisma.exercise.findMany({
    where: exerciseWhere,
    include: {
      muscles: {
        where: { isPrimary: true },
        include: { muscle: true },
      },
    },
    orderBy: { name: "asc" },
  });

  if (rawExercises.length === 0) {
    throw new AppError("No exercises found matching your criteria", 400);
  }

  // Shape the candidate list based on experience level and size
  const experienceLevel = (onboardingContext as Record<string, any> | undefined)?.experienceLevel as string | undefined;
  const exercises = shapeCandidateList(rawExercises as CandidateExercise[], experienceLevel);

  log.debug(
    { rawCount: rawExercises.length, shapedCount: exercises.length, experienceLevel },
    "generateAISplit:candidates-shaped"
  );

  // Build lookup maps for 3-step exercise name resolution
  const { exactMap, caseInsensitiveMap, normalizedMap } = buildExerciseMaps(exercises);

  // Build prompts
  const { systemPrompt, userPrompt } = buildSplitGenerationPrompt(
    description,
    onboardingContext as Record<string, any> | undefined,
    exercises
  );

  const responseSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      description: {
        type: "string",
        description:
          "Summary of the split. Must reflect conflict-resolution reasoning if the user description and onboarding profile conflict.",
      },
      daysPerWeek: { type: "number" },
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            dayNumber: { type: "number" },
            name: { type: "string" },
            muscleGroups: { type: "array", items: { type: "string" } },
            isRest: { type: "boolean" },
            exercises: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  exerciseName: { type: "string" },
                  targetSets: { type: "number" },
                  targetRepsMin: { type: "number" },
                  targetRepsMax: { type: "number" },
                },
                required: ["exerciseName", "targetSets", "targetRepsMin", "targetRepsMax"],
              },
            },
          },
          required: ["dayNumber", "name", "muscleGroups", "isRest", "exercises"],
        },
      },
    },
    required: ["name", "description", "daysPerWeek", "days"],
  };

  let result: any;
  try {
    result = await callGemini<any>({
      systemPrompt,
      userPrompt,
      responseSchema,
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      throw new AppError(error.message, 502);
    }
    throw new AppError("Failed to generate split. Please try again.", 500);
  }

  // Validate and resolve exercise names to IDs using 3-step matching
  const warnings: string[] = [];

  const validatedDays = await Promise.all(
    result.days.map(async (day: any) => {
      const validatedExercises = [];
      const invalidExercises: typeof day.exercises = [];

      for (const ex of day.exercises) {
        const matched = resolveExercise(ex.exerciseName, exactMap, caseInsensitiveMap, normalizedMap);
        if (matched) {
          validatedExercises.push({
            exerciseId: matched.id,
            exerciseName: matched.name,
            targetSets: ex.targetSets,
            targetRepsMin: ex.targetRepsMin,
            targetRepsMax: ex.targetRepsMax,
          });
        } else {
          log.warn({ exerciseName: ex.exerciseName }, "generateAISplit:dropped-exercise");
          invalidExercises.push(ex);
        }
      }

      // Single-retry for partial failures (1–2 invalid exercises, at least 1 valid)
      if (invalidExercises.length > 0 && invalidExercises.length <= 2 && validatedExercises.length > 0) {
        log.debug(
          { invalidCount: invalidExercises.length, day: day.name },
          "generateAISplit:retry-partial"
        );

        const invalidNames = invalidExercises.map((e: any) => `"${e.exerciseName}"`).join(", ");
        const retrySystemPrompt = `${systemPrompt}

You previously suggested these exercises which could not be matched: ${invalidNames}.
Select replacement exercises from the provided exercise list only. Return exactly ${invalidExercises.length} replacement(s).`;

        const retryUserPrompt = `Replace these exercises for the "${day.name}" day: ${invalidNames}. Choose valid alternatives from the exercise list.`;

        try {
          const retryResult = await callGemini<{ replacements: any[] }>({
            systemPrompt: retrySystemPrompt,
            userPrompt: retryUserPrompt,
            responseSchema: RETRY_EXERCISE_SCHEMA,
          });

          for (const rep of retryResult.replacements) {
            const matched = resolveExercise(rep.exerciseName, exactMap, caseInsensitiveMap, normalizedMap);
            if (matched) {
              validatedExercises.push({
                exerciseId: matched.id,
                exerciseName: matched.name,
                targetSets: rep.targetSets,
                targetRepsMin: rep.targetRepsMin,
                targetRepsMax: rep.targetRepsMax,
              });
              log.debug({ original: invalidNames, replacement: matched.name }, "generateAISplit:retry-resolved");
            } else {
              // Retry also failed — fall back to warning
              log.warn({ exerciseName: rep.exerciseName }, "generateAISplit:retry-still-invalid");
              warnings.push(`Dropped exercise: "${rep.exerciseName}" (not found in database)`);
            }
          }
        } catch (retryError) {
          // Retry call failed — fall back to warnings for all invalid exercises
          log.warn({ err: retryError, day: day.name }, "generateAISplit:retry-failed");
          for (const ex of invalidExercises) {
            warnings.push(`Dropped exercise: "${ex.exerciseName}" (not found in database)`);
          }
        }
      } else {
        // No retry: either all valid, all invalid, or too many invalids (>2)
        for (const ex of invalidExercises) {
          warnings.push(`Dropped exercise: "${ex.exerciseName}" (not found in database)`);
        }
      }

      return {
        dayNumber: day.dayNumber,
        name: day.name,
        muscleGroups: day.muscleGroups,
        isRest: day.isRest,
        exercises: validatedExercises,
      };
    })
  );

  // Filter out empty days
  const nonEmptyDays = validatedDays.filter(
    (day: any) => day.isRest || day.exercises.length > 0
  );

  if (nonEmptyDays.length === 0) {
    log.warn({ warnings }, "generateAISplit:no-valid-exercises");
    throw new AppError("Generated split has no valid exercises. Please try again.", 400);
  }

  if (nonEmptyDays.length < validatedDays.length) {
    log.debug({ droppedDays: validatedDays.length - nonEmptyDays.length }, "generateAISplit:dropped-empty-days");
    warnings.push(
      `Dropped ${validatedDays.length - nonEmptyDays.length} empty day(s)`
    );
  }

  log.debug(
    {
      dayCount: nonEmptyDays.length,
      exerciseCount: nonEmptyDays.reduce(
        (sum: number, day: any) => sum + day.exercises.length,
        0
      ),
      warningCount: warnings.length,
    },
    "generateAISplit:resolved"
  );

  res.json({
    split: {
      name: result.name,
      description: result.description,
      type: "CUSTOM",
      daysPerWeek: result.daysPerWeek,
      days: nonEmptyDays,
    },
    warnings,
  });
};
