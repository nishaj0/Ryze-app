import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthRequest } from "../middleware/auth";


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

  const activeUserSplit = await prisma.userSplit.findFirst({
    where: { userId, isActive: true },
    include: { split: true },
  });
  const daysPerWeek = activeUserSplit?.split.daysPerWeek || 3;

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const completedInLast4Weeks = await prisma.workoutSession.count({
    where: {
      userId,
      status: "COMPLETED",
      date: { gte: fourWeeksAgo },
    },
  });
  const consistencyScore = Math.min(Math.round((completedInLast4Weeks / (daysPerWeek * 4)) * 100), 100);

  res.json({
    overview: {
      totalWorkouts,
      totalPRs,
      currentStreak,
      thisWeekWorkouts,
      currentWeight: user?.currentWeight,
      goal: user?.goal,
      consistencyScore,
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
  const exerciseId = req.params.id as string;

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

  const progression = logs.map((log: any) => {
    const totalVolume = log.setLogs.reduce((sum: number, s: any) => sum + s.weightKg * s.reps, 0);
    const maxWeight = Math.max(...log.setLogs.map((s: any) => s.weightKg), 0);
    const totalReps = log.setLogs.reduce((sum: number, s: any) => sum + s.reps, 0);

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

type OverloadSet = { weightKg: number; reps: number };

const getTopSet = (sets: OverloadSet[]) =>
  sets.reduce<OverloadSet | null>((top, set) => {
    if (!top || set.weightKg > top.weightKg || (set.weightKg === top.weightKg && set.reps > top.reps)) {
      return set;
    }
    return top;
  }, null);

const estimate1RM = (weightKg: number, reps: number) => Math.round(weightKg * (1 + reps / 30));

export const getOverloadFilters = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const logs = await prisma.exerciseLog.findMany({
    where: {
      session: { userId, status: "COMPLETED" },
      setLogs: { some: {} },
    },
    select: {
      exercise: {
        select: {
          id: true,
          name: true,
          muscles: {
            where: { isPrimary: true },
            select: { muscle: { select: { name: true } } },
          },
        },
      },
      session: { select: { splitDayId: true, splitDayName: true } },
    },
  });

  const byMuscle = new Map<string, Map<string, { id: string; name: string }>>();
  const bySplitDay = new Map<string, { id: string; name: string; exercises: Map<string, { id: string; name: string }> }>();

  for (const log of logs) {
    const exercise = { id: log.exercise.id, name: log.exercise.name };
    for (const muscle of log.exercise.muscles) {
      const exercises = byMuscle.get(muscle.muscle.name) ?? new Map();
      exercises.set(exercise.id, exercise);
      byMuscle.set(muscle.muscle.name, exercises);
    }
    const splitDayKey = `${log.session.splitDayId}:${log.session.splitDayName}`;
    const splitDay = bySplitDay.get(splitDayKey) ?? {
      id: log.session.splitDayId,
      name: log.session.splitDayName,
      exercises: new Map(),
    };
    splitDay.exercises.set(exercise.id, exercise);
    bySplitDay.set(splitDayKey, splitDay);
  }

  const toMuscleOptions = (filters: Map<string, Map<string, { id: string; name: string }>>) =>
    [...filters.entries()]
      .map(([name, exercises]) => ({
        id: name,
        name,
        exercises: [...exercises.values()].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const splitDayOptions = [...bySplitDay.values()]
    .map((splitDay) => ({
      id: `${splitDay.id}:${splitDay.name}`,
      splitDayId: splitDay.id,
      name: splitDay.name,
      exercises: [...splitDay.exercises.values()].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json({
    hasHistory: logs.length > 0,
    muscles: toMuscleOptions(byMuscle),
    splitDays: splitDayOptions,
  });
};

export const getOverloadHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const exerciseId = req.params.id as string;
  const splitDayId = typeof req.query.splitDayId === "string" ? req.query.splitDayId : undefined;
  const splitDayName = typeof req.query.splitDayName === "string" ? req.query.splitDayName : undefined;
  const sessionWhere = {
    userId,
    status: "COMPLETED",
    ...(splitDayId ? { splitDayId } : {}),
    ...(splitDayName ? { splitDayName } : {}),
  };

  const [logs, records] = await Promise.all([
    prisma.exerciseLog.findMany({
      where: { exerciseId, session: sessionWhere, setLogs: { some: {} } },
      include: {
        setLogs: { orderBy: { setNumber: "asc" } },
        session: { select: { id: true, date: true } },
      },
      orderBy: { session: { date: "asc" } },
    }),
    prisma.personalRecord.findMany({
      where: { userId, exerciseId },
      orderBy: { achievedAt: "desc" },
      select: { id: true, weightKg: true, reps: true, estimated1rm: true, achievedAt: true },
    }),
  ]);

  const recordMatchesSession = (record: any, log: any) => {
    const topSet = getTopSet(log.setLogs);
    return topSet !== null
      && new Date(record.achievedAt).getTime() === new Date(log.session.date).getTime()
      && record.weightKg === topSet.weightKg
      && record.reps === topSet.reps;
  };
  const relevantRecords = splitDayId || splitDayName
    ? records.filter((record: any) => logs.some((log: any) => recordMatchesSession(record, log)))
    : records;

  const points = logs.map((log: any) => {
    const topSet = getTopSet(log.setLogs);
    const totalVolume = log.setLogs.reduce((sum: number, set: OverloadSet) => sum + set.weightKg * set.reps, 0);
    const isPR = relevantRecords.some((record: any) => recordMatchesSession(record, log));

    return {
      sessionId: log.session.id,
      date: log.session.date,
      topSet: topSet && { weightKg: topSet.weightKg, reps: topSet.reps },
      totalVolume: Math.round(totalVolume),
      estimated1rm: topSet ? estimate1RM(topSet.weightKg, topSet.reps) : 0,
      isPR,
    };
  });

  const latest = points[points.length - 1];
  res.json({
    latestTopSet: latest?.topSet
      ? { ...latest.topSet, estimated1rm: latest.estimated1rm }
      : null,
    history: points,
    prs: relevantRecords.map((record: any) => ({
      id: record.id,
      weightKg: record.weightKg,
      reps: record.reps,
      estimated1rm: Math.round(record.estimated1rm),
      achievedAt: record.achievedAt,
    })),
  });
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
          exercise: { select: { muscles: { include: { muscle: true } } } },
          setLogs: true,
        },
      },
    },
  });

  const muscleVolumes: Record<string, number> = {};

  for (const session of sessions) {
    for (const log of session.exerciseLogs) {
      const volume = log.setLogs.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
      const primaryMuscle = log.exercise.muscles.find((m) => m.isPrimary);
      const muscle = primaryMuscle?.muscle.name || "unknown";
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

export const getVolumeHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const weeks = Math.min(Math.max(parseInt(req.query.weeks as string) || 8, 1), 52);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);
  startDate.setHours(0, 0, 0, 0);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      status: "COMPLETED",
      date: { gte: startDate },
    },
    include: {
      exerciseLogs: { include: { setLogs: true } },
    },
    orderBy: { date: "asc" },
  });

  // Group by week
  const weekly: { week: string; volume: number; workouts: number }[] = [];
  for (let i = 0; i < weeks; i++) {
    const wStart = new Date(startDate);
    wStart.setDate(wStart.getDate() + i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const weekSessions = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= wStart && d < wEnd;
    });
    const volume = weekSessions.reduce((sum, s) => {
      const sessVol = s.exerciseLogs.reduce((logSum, log) => {
        return logSum + log.setLogs.reduce((setSum, set) => setSum + set.weightKg * set.reps, 0);
      }, 0);
      return sum + sessVol;
    }, 0);
    weekly.push({
      week: `W${i + 1}`,
      volume: Math.round(volume),
      workouts: weekSessions.length,
    });
  }

  // Daily workout count for the last 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const daily: { day: string; count: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dStr = d.toISOString().split("T")[0];
    const count = sessions.filter((s) => new Date(s.date).toISOString().split("T")[0] === dStr).length;
    daily.push({
      day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()],
      count,
    });
  }

  res.json({ weekly, daily });
};
