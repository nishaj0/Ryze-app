import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const getOverview = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const [totalWorkouts, totalPRs, currentStreak, thisWeekWorkouts] = await Promise.all([
    prisma.workoutSession.count({
      where: { userId, status: "COMPLETED" },
    }),
    prisma.personalRecord.count({ where: { userId } }),
    calculateStreak(userId),
    getThisWeekWorkouts(userId),
  ]);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentWeight: true, goal: true },
  });

  res.json({
    overview: {
      totalWorkouts,
      totalPRs,
      currentStreak,
      thisWeekWorkouts,
      currentWeight: user?.currentWeight,
      goal: user?.goal,
    },
  });
};

const calculateStreak = async (userId: string): Promise<number> => {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { date: "desc" },
    select: { date: true },
    take: 365,
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionDates = new Set(
    sessions.map((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  const checkDate = new Date(today);
  if (!sessionDates.has(checkDate.getTime())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (sessionDates.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
};

const getThisWeekWorkouts = async (userId: string): Promise<number> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return prisma.workoutSession.count({
    where: {
      userId,
      status: "COMPLETED",
      date: { gte: startOfWeek },
    },
  });
};

export const getExerciseProgress = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const exerciseId = req.params.id;

  const logs = await prisma.exerciseLog.findMany({
    where: {
      exerciseId,
      session: { userId, status: "COMPLETED" },
    },
    include: {
      setLogs: { orderBy: { setNumber: "asc" } },
      session: { select: { date: true } },
    },
    orderBy: { session: { date: "asc" } },
  });

  const progression = logs.map((log) => {
    const totalVolume = log.setLogs.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
    const maxWeight = Math.max(...log.setLogs.map((s) => s.weightKg), 0);
    const totalReps = log.setLogs.reduce((sum, s) => sum + s.reps, 0);

    return {
      date: log.session.date,
      sessionId: log.sessionId,
      totalVolume: Math.round(totalVolume),
      maxWeight,
      totalReps,
      sets: log.setLogs.length,
    };
  });

  res.json({ progression });
};

export const getMuscleVolume = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      status: "COMPLETED",
      date: { gte: startOfWeek },
    },
    include: {
      exerciseLogs: {
        include: {
          exercise: { select: { muscleGroup: true } },
          setLogs: true,
        },
      },
    },
  });

  const muscleVolumes: Record<string, number> = {};

  for (const session of sessions) {
    for (const log of session.exerciseLogs) {
      const volume = log.setLogs.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
      const muscle = log.exercise.muscleGroup;
      muscleVolumes[muscle] = (muscleVolumes[muscle] || 0) + volume;
    }
  }

  const result = Object.entries(muscleVolumes).map(([muscleGroup, volume]) => ({
    muscleGroup,
    volume: Math.round(volume),
  }));

  res.json({ muscleVolumes: result });
};

export const getHeatmap = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      status: "COMPLETED",
      date: { gte: ninetyDaysAgo },
    },
    select: { date: true },
  });

  const dateCounts: Record<string, number> = {};
  for (const session of sessions) {
    const dateStr = session.date.toISOString().split("T")[0];
    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
  }

  const heatmap = Object.entries(dateCounts).map(([date, count]) => ({
    date,
    count,
  }));

  res.json({ heatmap });
};
