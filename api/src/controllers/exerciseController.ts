import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthRequest } from "../middleware/auth";


export const listExercises = async (req: AuthRequest, res: Response) => {
  const { muscle, search, equipment, category, level, mechanic, page, limit } = req.query;

  const where: any = {};
  if (muscle) {
    where.muscles = { some: { muscle: { name: String(muscle) } } };
  }
  if (equipment) where.equipment = equipment;
  if (category) where.category = category;
  if (level) where.level = level;
  if (mechanic) where.mechanic = mechanic;
  if (search) {
    where.name = { contains: String(search), mode: "insensitive" };
  }

  const pageNum = Math.max(1, parseInt(String(page)) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(String(limit)) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      include: {
        muscles: { include: { muscle: true } },
        images: { orderBy: { order: "asc" } },
        alternativesFrom: {
          include: { alternative: true },
        },
      },
      orderBy: { name: "asc" },
      skip,
      take: limitNum,
    }),
    prisma.exercise.count({ where }),
  ]);

  res.json({ exercises, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
};

export const getDistinctMuscles = async (_req: AuthRequest, res: Response) => {
  const muscles = await prisma.exerciseMuscle.findMany({
    where: { isPrimary: true },
    select: { muscle: { select: { name: true } } },
    distinct: ["muscleId"],
    orderBy: { muscle: { name: "asc" } },
  });

  res.json({ muscles: muscles.map((m) => m.muscle.name) });
};

export const getExercise = async (req: AuthRequest, res: Response) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: req.params.id as string },
    include: {
      muscles: { include: { muscle: true } },
      images: { orderBy: { order: "asc" } },
      alternativesFrom: {
        include: { alternative: true },
      },
    },
  });

  if (!exercise) {
    return res.status(404).json({ error: "Exercise not found" });
  }

  res.json({ exercise });
};

export const getAlternatives = async (req: AuthRequest, res: Response) => {
  const alternatives = await prisma.exerciseAlternative.findMany({
    where: { exerciseId: req.params.id as string },
    include: { alternative: true },
  });

  res.json({ alternatives });
};

export const getExerciseHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const exerciseId = req.params.id as string;

  const logs = await prisma.exerciseLog.findMany({
    where: {
      exerciseId,
      session: { userId },
    },
    include: {
      setLogs: { orderBy: { setNumber: "asc" } },
      session: {
        select: { date: true, id: true },
      },
    },
    orderBy: { session: { date: "desc" } },
    take: 50,
  });

  res.json({ logs });
};
