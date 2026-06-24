import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const prisma = new PrismaClient();

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
