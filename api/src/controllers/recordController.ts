import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthRequest } from "../middleware/auth";


export const getRecords = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const records = await prisma.personalRecord.findMany({
    where: { userId },
    include: {
      exercise: { select: { name: true, muscles: { include: { muscle: true } } } },
    },
    orderBy: { achievedAt: "desc" },
  });

  const bestByExercise: Record<string, (typeof records)[0]> = {};
  for (const record of records) {
    if (
      !bestByExercise[record.exerciseId] ||
      record.estimated1rm > bestByExercise[record.exerciseId].estimated1rm
    ) {
      bestByExercise[record.exerciseId] = record;
    }
  }

  res.json({ records: Object.values(bestByExercise) });
};

export const getExerciseRecords = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const exerciseId = req.params.exerciseId as string;

  const records = await prisma.personalRecord.findMany({
    where: { userId, exerciseId },
    orderBy: { estimated1rm: "desc" },
    take: 10,
  });

  res.json({ records });
};
