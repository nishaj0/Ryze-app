import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";


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
        include: {
          exercise: {
            include: {
              muscles: { include: { muscle: true } },
              images: { orderBy: { order: "asc" } },
            },
          },
        },
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
      splitDayName: splitDay.name,
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
          exercise: {
            include: {
              muscles: { include: { muscle: true } },
              images: { orderBy: { order: "asc" } },
            },
          },
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
            exercise: { select: { name: true, muscles: { include: { muscle: true } } } },
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
    where: { id: req.params.id as string },
    include: {
      splitDay: true,
      exerciseLogs: {
        orderBy: { order: "asc" },
        include: {
          exercise: {
            include: {
              muscles: { include: { muscle: true } },
              images: { orderBy: { order: "asc" } },
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

  // Find PRs achieved on the same calendar day
  const startOfDay = new Date(session.date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(session.date);
  endOfDay.setHours(23, 59, 59, 999);

  const prs = await prisma.personalRecord.findMany({
    where: {
      userId: session.userId,
      achievedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      exercise: {
        include: {
          muscles: { include: { muscle: true } },
          images: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  res.json({ session, prs });
};

export const completeSession = async (req: AuthRequest, res: Response) => {
  const { notes, durationMinutes } = req.body;

  const session: any = await prisma.workoutSession.findUnique({
    where: { id: req.params.id as string },
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
            achievedAt: session.date,
          },
          include: {
            exercise: {
              include: {
                muscles: { include: { muscle: true } },
                images: { orderBy: { order: "asc" } },
              },
            },
          },
        });
        newPRs.push(pr);
      }
    }
  }

  const updated: any = await prisma.workoutSession.update({
    where: { id: req.params.id as string },
    data: {
      status: "COMPLETED",
      notes,
      durationMinutes,
    },
    include: {
      exerciseLogs: {
        orderBy: { order: "asc" },
        include: {
          exercise: {
            include: {
              muscles: { include: { muscle: true } },
              images: { orderBy: { order: "asc" } },
            },
          },
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

  const splitDay = await prisma.splitDay.findUnique({
    where: { id: splitDayId },
    select: { name: true },
  });

  if (!splitDay) {
    throw new AppError("Split day not found", 404);
  }

  const session = await prisma.workoutSession.create({
    data: {
      userId,
      splitDayId,
      splitDayName: splitDay.name,
      date: sessionDate,
      status: "SKIPPED",
      restReason: reason,
    },
  });

  res.status(201).json({ session });
};

export const addExerciseToSession = async (req: AuthRequest, res: Response) => {
  const { exerciseId } = req.body;
  const sessionId = req.params.id as string;

  const session: any = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: { exerciseLogs: true },
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  const maxOrder = session.exerciseLogs.reduce(
    (max: number, log: any) => Math.max(max, log.order),
    -1
  );

  const exerciseLog = await prisma.exerciseLog.create({
    data: {
      sessionId,
      exerciseId,
      order: maxOrder + 1,
    },
    include: {
      exercise: {
        include: {
          muscles: { include: { muscle: true } },
          images: { orderBy: { order: "asc" } },
        },
      },
      setLogs: true,
    },
  });

  res.status(201).json({ exerciseLog });
};

export const swapExercise = async (req: AuthRequest, res: Response) => {
  const { newExerciseId } = req.body;
  const sessionId = req.params.id as string;
  const exerciseLogId = req.params.exerciseLogId as string;

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
      exercise: {
        include: {
          muscles: { include: { muscle: true } },
          images: { orderBy: { order: "asc" } },
        },
      },
      setLogs: true,
    },
  });

  res.json({ exerciseLog: updated });
};

export const logSet = async (req: AuthRequest, res: Response) => {
  const { weightKg, reps, rpe, notes } = req.body;
  const exerciseLogId = req.params.exerciseLogId as string;

  const exerciseLog: any = await prisma.exerciseLog.findUnique({
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
  const setId = req.params.setId as string;

  await prisma.setLog.delete({ where: { id: setId } });
  res.json({ message: "Set deleted" });
};

export const syncSession = async (req: AuthRequest, res: Response) => {
  const { splitDayId, date, durationMinutes, notes, exercises } = req.body;
  const userId = req.userId!;

  const sessionDate = new Date(date || new Date());

  const splitDay = await prisma.splitDay.findUnique({
    where: { id: splitDayId },
    select: { name: true },
  });

  if (!splitDay) {
    throw new AppError("Split day not found", 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.workoutSession.create({
      data: {
        userId,
        splitDayId,
        splitDayName: splitDay.name,
        date: sessionDate,
        status: "COMPLETED",
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        notes: notes || null,
      },
    });

    const newPRs: any[] = [];
    let totalVolume = 0;
    let totalSets = 0;

    if (exercises && Array.isArray(exercises)) {
      for (let i = 0; i < exercises.length; i++) {
        const exData = exercises[i];
        const exerciseLog = await tx.exerciseLog.create({
          data: {
            sessionId: session.id,
            exerciseId: exData.exerciseId,
            order: i,
            notes: exData.notes || null,
          },
        });

        if (exData.setLogs && Array.isArray(exData.setLogs)) {
          for (let j = 0; j < exData.setLogs.length; j++) {
            const setData = exData.setLogs[j];
            const weightKg = Number(setData.weightKg);
            const reps = Number(setData.reps);

            await tx.setLog.create({
              data: {
                exerciseLogId: exerciseLog.id,
                setNumber: j + 1,
                weightKg,
                reps,
                notes: setData.notes || null,
                completedAt: setData.completedAt ? new Date(setData.completedAt) : new Date(),
              },
            });

            totalVolume += weightKg * reps;
            totalSets++;

            const estimated1rm = calculate1RM(weightKg, reps);
            const previousPR = await tx.personalRecord.findFirst({
              where: {
                userId,
                exerciseId: exData.exerciseId,
              },
              orderBy: { estimated1rm: "desc" },
            });

            if (!previousPR || estimated1rm > previousPR.estimated1rm) {
              const pr = await tx.personalRecord.create({
                data: {
                  userId,
                  exerciseId: exData.exerciseId,
                  weightKg,
                  reps,
                  estimated1rm,
                  achievedAt: sessionDate,
                },
                include: {
                  exercise: {
                    include: {
                      muscles: { include: { muscle: true } },
                      images: { orderBy: { order: "asc" } },
                    },
                  },
                },
              });
              newPRs.push(pr);
            }
          }
        }
      }
    }

    return {
      session,
      summary: {
        totalVolume: Math.round(totalVolume),
        totalSets,
        exercisesCompleted: exercises ? exercises.length : 0,
        newPRs,
      },
    };
  }, { timeout: 30000 });

  const populatedSession = await prisma.workoutSession.findUnique({
    where: { id: result.session.id },
    include: {
      exerciseLogs: {
        orderBy: { order: "asc" },
        include: {
          exercise: {
            include: {
              muscles: { include: { muscle: true } },
              images: { orderBy: { order: "asc" } },
            },
          },
          setLogs: { orderBy: { setNumber: "asc" } },
        },
      },
      splitDay: true,
    },
  });

  res.status(201).json({
    session: populatedSession,
    summary: result.summary,
  });
};

export const updateExerciseNotes = async (req: AuthRequest, res: Response) => {
  const { notes } = req.body;
  const exerciseLogId = req.params.exerciseLogId as string;

  const exerciseLog = await prisma.exerciseLog.update({
    where: { id: exerciseLogId },
    data: { notes },
  });

  res.json({ exerciseLog });
};

export const getCalendarSessions = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { start, end } = req.query;

  if (!start || !end) {
    throw new AppError("start and end query params are required", 400);
  }

  const startDate = new Date(start as string);
  const endDate = new Date(end as string);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const sessions = await prisma.workoutSession.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
      status: { in: ["COMPLETED", "SKIPPED"] },
    },
    orderBy: { date: "asc" },
    include: {
      splitDay: { select: { name: true, muscleGroups: true, isRest: true } },
      exerciseLogs: {
        include: {
          exercise: { select: { name: true, muscles: { include: { muscle: true } } } },
          setLogs: true,
        },
      },
    },
  });

  const calendar = sessions.map((s: any) => {
    const totalVolume = s.exerciseLogs.reduce((sum: number, log: any) => {
      return sum + log.setLogs.reduce((setSum: number, set: any) => setSum + set.weightKg * set.reps, 0);
    }, 0);

    return {
      id: s.id,
      date: s.date,
      status: s.status,
      splitDayName: s.splitDay.name,
      muscleGroups: s.splitDay.muscleGroups,
      restReason: s.restReason,
      durationMinutes: s.durationMinutes,
      exerciseCount: s.exerciseLogs.length,
      totalVolume: Math.round(totalVolume),
      notes: s.notes,
      exerciseLogs: s.exerciseLogs.map((log: any) => ({
        id: log.id,
        exerciseName: log.exercise.name,
        sets: log.setLogs.map((set: any) => ({
          id: set.id,
          setNumber: set.setNumber,
          weightKg: set.weightKg,
          reps: set.reps,
        })),
      })),
    };
  });

  res.json({ sessions: calendar });
};

export const updateSession = async (req: AuthRequest, res: Response) => {
  const { restReason, notes } = req.body;
  const sessionId = req.params.id as string;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new AppError("Session not found", 404);
  }

  if (session.userId !== req.userId) {
    throw new AppError("Unauthorized", 403);
  }

  const data: any = {};
  if (restReason !== undefined) data.restReason = restReason;
  if (notes !== undefined) data.notes = notes;

  const updated = await prisma.workoutSession.update({
    where: { id: sessionId },
    data,
    include: {
      splitDay: { select: { name: true, muscleGroups: true } },
    },
  });

  res.json({ session: updated });
};
