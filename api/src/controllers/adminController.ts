import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      onboardedUsers,
      totalSessions,
      totalSplits,
      totalExercises,
      recentUsers,
      activeSplitCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { onboardingDone: true } }),
      prisma.workoutSession.count({ where: { status: "COMPLETED" } }),
      prisma.split.count(),
      prisma.exercise.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true, onboardingDone: true },
      }),
      prisma.userSplit.count({ where: { isActive: true } }),
    ]);

    // Sessions per day for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dailySessions = await prisma.workoutSession.groupBy({
      by: ["date"],
      where: { date: { gte: thirtyDaysAgo }, status: "COMPLETED" },
      _count: { id: true },
      orderBy: { date: "asc" },
    });

    res.json({
      stats: {
        totalUsers,
        onboardedUsers,
        totalSessions,
        totalSplits,
        totalExercises,
        activeSplitCount,
      },
      recentUsers,
      dailySessions: dailySessions.map((d) => ({
        date: d.date,
        count: d._count.id,
      })),
    });
  } catch (err) { next(err); }
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const listUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    const where = search
      ? { OR: [{ email: { contains: search, mode: "insensitive" as const } }, { name: { contains: search, mode: "insensitive" as const } }] }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, name: true, gender: true, goal: true,
          experienceLevel: true, onboardingDone: true, createdAt: true,
          _count: { select: { workoutSessions: true, personalRecords: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req.params.id as string) },
      include: {
        userSplits: { include: { split: { select: { id: true, name: true, type: true } } } },
        _count: { select: { workoutSessions: true, personalRecords: true, bodyMetrics: true, progressPhotos: true } },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    const { passwordHash: _, ...safe } = user;
    res.json({ user: safe });
  } catch (err) { next(err); }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, goal, gender, experienceLevel, onboardingDone } = req.body;
    const user = await prisma.user.update({
      where: { id: (req.params.id as string) },
      data: { name, email, goal, gender, experienceLevel, onboardingDone },
      select: { id: true, name: true, email: true, goal: true, gender: true, experienceLevel: true, onboardingDone: true },
    });
    res.json({ user });
  } catch (err) { next(err); }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.delete({ where: { id: (req.params.id as string) } });
    res.json({ message: "User deleted" });
  } catch (err) { next(err); }
};

export const resetOnboarding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: (req.params.id as string) },
      data: {
        onboardingDone: false,
        gender: null, goal: null, experienceLevel: null,
        daysAvailable: null, equipmentAccess: null, sleepHours: null,
        currentWeight: null, height: null,
      },
    });
    res.json({ message: "Onboarding reset" });
  } catch (err) { next(err); }
};

// ─── Splits ───────────────────────────────────────────────────────────────────
export const listAllSplits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const isPrebuilt = req.query.isPrebuilt === "true" ? true : req.query.isPrebuilt === "false" ? false : undefined;

    const where = isPrebuilt !== undefined ? { isPrebuilt } : {};

    const [splits, total] = await Promise.all([
      prisma.split.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { days: true, userSplits: true } },
          createdBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.split.count({ where }),
    ]);

    res.json({ splits, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const createPrebuiltSplit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, type, daysPerWeek, days } = req.body;
    const split = await prisma.split.create({
      data: {
        name, description, type, daysPerWeek,
        isPrebuilt: true,
        days: {
          create: days.map((day: any, i: number) => ({
            dayNumber: i + 1,
            name: day.name,
            muscleGroups: JSON.stringify(day.muscleGroups || []),
            isRest: day.isRest || false,
            exercises: day.exercises
              ? {
                  create: day.exercises.map((ex: any, j: number) => ({
                    exerciseId: ex.exerciseId,
                    order: j + 1,
                    targetSets: ex.targetSets || 3,
                    targetRepsMin: ex.targetRepsMin || 8,
                    targetRepsMax: ex.targetRepsMax || 12,
                    notes: ex.notes || null,
                  })),
                }
              : undefined,
          })),
        },
      },
      include: { days: { include: { exercises: true } } },
    });
    res.status(201).json({ split });
  } catch (err) { next(err); }
};

export const deleteSplit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.split.delete({ where: { id: (req.params.id as string) } });
    res.json({ message: "Split deleted" });
  } catch (err) { next(err); }
};

export const toggleSplitPrebuilt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const split = await prisma.split.findUnique({ where: { id: (req.params.id as string) } });
    if (!split) return res.status(404).json({ error: "Split not found" });
    const updated = await prisma.split.update({
      where: { id: (req.params.id as string) },
      data: { isPrebuilt: !split.isPrebuilt },
    });
    res.json({ split: updated });
  } catch (err) { next(err); }
};

// ─── Exercises ────────────────────────────────────────────────────────────────
export const listExercises = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const search = (req.query.search as string) || "";
    const skip = (page - 1) * limit;

    const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: { muscles: { include: { muscle: true } } },
      }),
      prisma.exercise.count({ where }),
    ]);

    res.json({ exercises, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ─── Sessions / Activity ──────────────────────────────────────────────────────
export const listSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.workoutSession.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          splitDay: { select: { name: true } },
          _count: { select: { exerciseLogs: true } },
        },
      }),
      prisma.workoutSession.count(),
    ]);

    res.json({ sessions, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const sendBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, body, type = "ADMIN_BROADCAST" } = req.body;
    const users = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, type, title, body })),
    });
    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (err) { next(err); }
};

// ─── Onboarding Stats ─────────────────────────────────────────────────────────
export const getOnboardingStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      onboardedCount,
      totalCount,
      genderStats,
      goalStats,
      experienceStats,
      equipmentStats,
      daysStats,
      averages,
    ] = await Promise.all([
      prisma.user.count({ where: { onboardingDone: true } }),
      prisma.user.count(),
      prisma.user.groupBy({ by: ["gender"], where: { onboardingDone: true }, _count: { id: true } }),
      prisma.user.groupBy({ by: ["goal"], where: { onboardingDone: true }, _count: { id: true } }),
      prisma.user.groupBy({ by: ["experienceLevel"], where: { onboardingDone: true }, _count: { id: true } }),
      prisma.user.groupBy({ by: ["equipmentAccess"], where: { onboardingDone: true }, _count: { id: true } }),
      prisma.user.groupBy({ by: ["daysAvailable"], where: { onboardingDone: true }, _count: { id: true } }),
      prisma.user.aggregate({
        where: { onboardingDone: true },
        _avg: { currentWeight: true, height: true, sleepHours: true },
      }),
    ]);

    res.json({
      onboardedCount,
      totalCount,
      genderStats: genderStats.map(g => ({ name: g.gender || "UNKNOWN", count: g._count.id })),
      goalStats: goalStats.map(g => ({ name: g.goal || "UNKNOWN", count: g._count.id })),
      experienceStats: experienceStats.map(e => ({ name: e.experienceLevel || "UNKNOWN", count: e._count.id })),
      equipmentStats: equipmentStats.map(e => ({ name: e.equipmentAccess || "UNKNOWN", count: e._count.id })),
      daysStats: daysStats.map(d => ({ days: d.daysAvailable || 0, count: d._count.id })),
      averages: averages._avg,
    });
  } catch (err) { next(err); }
};

// ─── Exercise Requests ────────────────────────────────────────────────────────
export const listExerciseRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || "";
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [requests, total] = await Promise.all([
      prisma.exerciseRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          requestedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.exerciseRequest.count({ where }),
    ]);

    res.json({ requests, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const updateExerciseRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, adminNotes } = req.body;
    const request = await prisma.exerciseRequest.findUnique({ where: { id: (req.params.id as string) } });
    if (!request) return res.status(404).json({ error: "Exercise request not found" });

    const updated = await prisma.exerciseRequest.update({
      where: { id: (req.params.id as string) },
      data: {
        status: status || request.status,
        adminNotes: adminNotes !== undefined ? adminNotes : request.adminNotes,
      },
    });

    res.json({ exerciseRequest: updated });
  } catch (err) { next(err); }
};

// ─── Create Exercise ──────────────────────────────────────────────────────────
export const createExercise = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      force,
      level,
      mechanic,
      equipment,
      category,
      instructions,
      primaryMuscles,
      secondaryMuscles,
      images,
    } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Exercise name is required" });
    }

    // Check if exercise already exists
    const existing = await prisma.exercise.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ error: "Exercise with this name already exists" });
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        force: force || null,
        level: level || null,
        mechanic: mechanic || null,
        equipment: equipment?.trim() || null,
        category: category || null,
        instructions: instructions?.trim() || null,
      },
    });

    // Add muscle relationships
    if (primaryMuscles && Array.isArray(primaryMuscles)) {
      for (const muscleName of primaryMuscles) {
        let muscle = await prisma.muscle.findUnique({ where: { name: muscleName } });
        if (!muscle) {
          muscle = await prisma.muscle.create({ data: { name: muscleName } });
        }
        await prisma.exerciseMuscle.create({
          data: {
            exerciseId: exercise.id,
            muscleId: muscle.id,
            isPrimary: true,
          },
        });
      }
    }

    if (secondaryMuscles && Array.isArray(secondaryMuscles)) {
      for (const muscleName of secondaryMuscles) {
        let muscle = await prisma.muscle.findUnique({ where: { name: muscleName } });
        if (!muscle) {
          muscle = await prisma.muscle.create({ data: { name: muscleName } });
        }
        await prisma.exerciseMuscle.create({
          data: {
            exerciseId: exercise.id,
            muscleId: muscle.id,
            isPrimary: false,
          },
        });
      }
    }

    // Add images
    if (images && Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        await prisma.exerciseImage.create({
          data: {
            exerciseId: exercise.id,
            url: images[i].url,
            publicId: images[i].publicId || "",
            order: i,
          },
        });
      }
    }

    const fullExercise = await prisma.exercise.findUnique({
      where: { id: exercise.id },
      include: {
        muscles: { include: { muscle: true } },
        images: true,
      },
    });

    res.status(201).json({ exercise: fullExercise });
  } catch (err) { next(err); }
};

