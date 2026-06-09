import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

const prisma = new PrismaClient();

const calculate1RM = (weight: number, reps: number): number => {
  return Math.round(weight * (1 + reps / 30) * 100) / 100;
};

export const createSession = async (req: AuthRequest, res: Response) => {
  const { splitDayId, date } = req.body;
  const userId = req.userId!;

  const today = new Date(date || new Date());
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existing = await prisma.workoutSession.findFirst({
    where: {
      userId,
      splitDayId,
      date: { gte: today, lt: tomorrow },
      status: { in: ["COMPLETED", "IN_PROGRESS"] },
    },
  });

  if (existing) {
    throw new AppError("Session already exists for this day", 409);
  }

  const splitDay = await prisma.splitDay.findUnique({
    where: { id: splitDayId },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true },
      },
    },
  });

  if (!splitDay) {
    throw new AppError("Split day not found", 404);
  }

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      splitDayId,
      date: today,
      status: "IN_PROGRESS",
      exerciseLogs: {
        create: splitDay.exercises.map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          order: idx,
        })),
      },
    },
    include: {
      exerciseLogs: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          setLogs: { orderBy: { setNumber: "asc" } },
        },
      },
      splitDay: true,
    },
  });

  const lastSessionLogs = await getLastSessionLogs(userId, splitDayId, session.id);

  res.status(201).json({ session, lastSessionLogs });
};

const getLastSessionLogs = async (
  userId: string,
  splitDayId: string,
  currentSessionId: string
) => {
  const currentSession = await prisma.workoutSession.findUnique({
    where: { id: currentSessionId },
    select: { date: true },
  });

  const lastSession = await prisma.workoutSession.findFirst({
    where: {
      userId,
      splitDayId,
      status: "COMPLETED",
      date: { lt: currentSession?.date },
    },
    orderBy: { date: "desc" },
  });

  if (!lastSession) return {};

  const logs = await prisma.exerciseLog.findMany({
    where: { sessionId: lastSession.id },
    include: {
      setLogs: { orderBy: { setNumber: "asc" } },
    },
  });

  const result: Record<string, { weightKg: number; reps: number }[]> = {};
  for (const log of logs) {
    result[log.exerciseId] = log.setLogs.map((s) => ({
      weightKg: s.weightKg,
      reps: s.reps,
    }));
  }
  return result;
};

export const listSessions = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { page = "1", limit = "20" } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [sessions, total] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      skip,
      take: Number(limit),
      include: {
        splitDay: { select: { name: true, muscleGroups: true } },
        exerciseLogs: {
          include: {
            exercise: { select: { name: true, muscleGroup: true } },
            setLogs: true,
          },
        },
      },
    }),
    prisma.workoutSession.count({ where: { userId } }),
  ]);

  res.json({ sessions, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
};

export const getSession = async (req: AuthRequest, res: Response) => {
  const session = await prisma.workoutSession.findUnique({
    where: { id: req.params.id },
    include: {
      splitDay: true,
      exerciseLogs: {
        orderBy: { order: "asc" },
        include: {
          exercise: {
            include: {
              alternativesFrom: { include: { alternative: true } },
            },
          },
          setLogs: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  res.json({ session });
};

export const completeSession = async (req: AuthRequest, res: Response) => {
  const { notes, durationMinutes } = req.body;

  const session = await prisma.workoutSession.findUnique({
    where: { id: req.params.id },
    include: {
      exerciseLogs: {
        include: { setLogs: true },
      },
    },
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const newPRs: any[] = [];

  for (const log of session.exerciseLogs) {
    for (const set of log.setLogs) {
      const estimated1rm = calculate1RM(set.weightKg, set.reps);

      const previousPR = await prisma.personalRecord.findFirst({
        where: {
          userId: session.userId,
          exerciseId: log.exerciseId,
        },
        orderBy: { estimated1rm: "desc" },
      });

      if (!previousPR || estimated1rm > previousPR.estimated1rm) {
        const pr = await prisma.personalRecord.create({
          data: {
            userId: session.userId,
            exerciseId: log.exerciseId,
            weightKg: set.weightKg,
            reps: set.reps,
            estimated1rm,
          },
        });
        newPRs.push(pr);
      }
    }
  }

  const updated = await prisma.workoutSession.update({
    where: { id: req.params.id },
    data: {
      status: "COMPLETED",
      notes,
      durationMinutes,
    },
    include: {
      exerciseLogs: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          setLogs: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });

  let totalVolume = 0;
  let totalSets = 0;
  for (const log of updated.exerciseLogs) {
    for (const set of log.setLogs) {
      totalVolume += set.weightKg * set.reps;
      totalSets++;
    }
  }

  res.json({
    session: updated,
    summary: {
      totalVolume: Math.round(totalVolume),
      totalSets,
      exercisesCompleted: updated.exerciseLogs.length,
      newPRs,
    },
  });
};

export const markRestDay = async (req: AuthRequest, res: Response) => {
  const { splitDayId, date, reason } = req.body;
  const userId = req.userId!;

  const sessionDate = new Date(date || new Date());
  sessionDate.setHours(0, 0, 0, 0);

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      splitDayId,
      date: sessionDate,
      status: "SKIPPED",
      restReason: reason,
    },
  });

  res.status(201).json({ session });
};

export const addExerciseToSession = async (req: AuthRequest, res: Response) => {
  const { exerciseId } = req.body;
  const sessionId = req.params.id;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { exerciseLogs: true },
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const maxOrder = session.exerciseLogs.reduce(
    (max, log) => Math.max(max, log.order),
    -1
  );

  const exerciseLog = await prisma.exerciseLog.create({
    data: {
      sessionId,
      exerciseId,
      order: maxOrder + 1,
    },
    include: {
      exercise: true,
      setLogs: true,
    },
  });

  res.status(201).json({ exerciseLog });
};

export const swapExercise = async (req: AuthRequest, res: Response) => {
  const { newExerciseId } = req.body;
  const { id: sessionId, exerciseLogId } = req.params;

  const exerciseLog = await prisma.exerciseLog.findUnique({
    where: { id: exerciseLogId },
    include: { session: true },
  });

  if (!exerciseLog || exerciseLog.sessionId !== sessionId) {
    throw new AppError("Exercise log not found", 404);
  }

  await prisma.setLog.deleteMany({ where: { exerciseLogId } });

  const updated = await prisma.exerciseLog.update({
    where: { id: exerciseLogId },
    data: { exerciseId: newExerciseId },
    include: {
      exercise: true,
      setLogs: true,
    },
  });

  res.json({ exerciseLog: updated });
};

export const logSet = async (req: AuthRequest, res: Response) => {
  const { weightKg, reps, rpe, notes } = req.body;
  const { exerciseLogId } = req.params;

  const exerciseLog = await prisma.exerciseLog.findUnique({
    where: { id: exerciseLogId },
    include: { setLogs: { orderBy: { setNumber: "desc" }, take: 1 } },
  });

  if (!exerciseLog) {
    throw new AppError("Exercise log not found", 404);
  }

  const setNumber = exerciseLog.setLogs.length > 0
    ? exerciseLog.setLogs[0].setNumber + 1
    : 1;

  const setLog = await prisma.setLog.create({
    data: {
      exerciseLogId,
      setNumber,
      weightKg,
      reps,
      rpe,
      notes,
    },
  });

  let previousSetData: { weightKg: number; reps: number } | null = null;

  const session = await prisma.workoutSession.findUnique({
    where: { id: exerciseLog.sessionId },
  });

  if (session) {
    const prevSession = await prisma.workoutSession.findFirst({
      where: {
        userId: session.userId,
        splitDayId: session.splitDayId,
        status: "COMPLETED",
        date: { lt: session.date },
      },
      orderBy: { date: "desc" },
    });

    if (prevSession) {
      const prevLog = await prisma.exerciseLog.findFirst({
        where: {
          sessionId: prevSession.id,
          exerciseId: exerciseLog.exerciseId,
        },
        include: { setLogs: { orderBy: { setNumber: "desc" }, take: 1 } },
      });

      if (prevLog && prevLog.setLogs.length > 0) {
        previousSetData = {
          weightKg: prevLog.setLogs[0].weightKg,
          reps: prevLog.setLogs[0].reps,
        };
      }
    }
  }

  let progression: "up" | "down" | "same" | null = null;
  if (previousSetData) {
    const currentVolume = weightKg * reps;
    const prevVolume = previousSetData.weightKg * previousSetData.reps;
    if (currentVolume > prevVolume * 1.05) progression = "up";
    else if (currentVolume < prevVolume * 0.95) progression = "down";
    else progression = "same";
  }

  res.status(201).json({ setLog, previousSetData, progression });
};

export const deleteSet = async (req: AuthRequest, res: Response) => {
  const { setId } = req.params;

  await prisma.setLog.delete({ where: { id: setId } });
  res.json({ message: "Set deleted" });
};
