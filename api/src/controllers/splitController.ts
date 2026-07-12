import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../utils/db";
import { callGemini, GeminiError } from "../utils/gemini";
import { createLogger } from "../utils/logger";

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

export const generateAISplit = async (req: AuthRequest, res: Response) => {
  const { description, equipmentFilter } = req.body;

  if (!description || typeof description !== "string") {
    throw new AppError("Description is required", 400);
  }

  // Fetch exercises, optionally filtered by equipment
  const exerciseWhere: any = {};
  if (equipmentFilter && Array.isArray(equipmentFilter) && equipmentFilter.length > 0) {
    exerciseWhere.equipment = { in: equipmentFilter };
  }

  const exercises = await prisma.exercise.findMany({
    where: exerciseWhere,
    include: {
      muscles: {
        where: { isPrimary: true },
        include: { muscle: true },
      },
    },
    orderBy: { name: "asc" },
  });

  if (exercises.length === 0) {
    throw new AppError("No exercises found matching your criteria", 400);
  }

  // Build exercise list for prompt
  const exerciseList = exercises
    .map((ex) => {
      const primaryMuscle = ex.muscles[0]?.muscle.name || "unknown";
      return `${ex.name} (${primaryMuscle}, ${ex.equipment || "any"})`;
    })
    .join("\n");

  const systemPrompt = `You are a fitness coach creating a personalized workout split. The user will describe their situation (days available, equipment access, injuries, goals).

Available exercises (ONLY use these exact names):
${exerciseList}

Common split archetypes:
- PPL (Push/Pull/Legs): 3-6 days/week
- Upper/Lower: 4 days/week
- Full Body: 3 days/week
- Bro Split: 5 days/week (one muscle group per day)

Instructions:
1. Design a split that matches the user's constraints
2. Use ONLY exercises from the provided list
3. Assign appropriate sets/reps based on goals (strength: 3-5 sets, 3-6 reps; hypertrophy: 3-4 sets, 8-12 reps; endurance: 2-3 sets, 15-20 reps)
4. Include rest days if daysPerWeek < 7
5. Return the complete split structure

If the user's description is vague, make reasonable assumptions (full gym access, 3-4 days, general fitness).`;

  const responseSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
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
      userPrompt: description,
      responseSchema,
    });
  } catch (error) {
    if (error instanceof GeminiError) {
      throw new AppError(error.message, 502);
    }
    throw new AppError("Failed to generate split. Please try again.", 500);
  }

  // Validate and resolve exercise names to IDs
  const warnings: string[] = [];
  const exerciseMap = new Map(exercises.map((ex) => [ex.name.toLowerCase(), ex]));

  const validatedDays = result.days.map((day: any) => {
    const validatedExercises = [];

    for (const ex of day.exercises) {
      const matched = exerciseMap.get(ex.exerciseName.toLowerCase());
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
  });

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
