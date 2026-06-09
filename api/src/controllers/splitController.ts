import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const prisma = new PrismaClient();

export const listSplits = async (_req: AuthRequest, res: Response) => {
  const splits = await prisma.split.findMany({
    where: { isPrebuilt: true },
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
    where: { id: req.params.id },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
            include: {
              exercise: {
                include: {
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
  const { splitId } = req.body;
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
