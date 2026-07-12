import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";


export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  const {
    gender,
    goal,
    experienceLevel,
    daysAvailable,
    equipmentAccess,
    currentWeight,
    height,
    sleepHours,
    dateOfBirth,
    splitId,
  } = req.body;

  const userId = req.userId!;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      gender,
      goal,
      experienceLevel,
      daysAvailable,
      equipmentAccess,
      currentWeight,
      height,
      sleepHours,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      onboardingDone: true,
    },
  });

  if (splitId) {
    await prisma.userSplit.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    await prisma.userSplit.create({
      data: {
        userId,
        splitId,
        isActive: true,
        startDate: new Date(),
      },
    });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      onboardingDone: user.onboardingDone,
    },
  });
};

export const getRecommendedSplits = async (req: AuthRequest, res: Response) => {
  const { experienceLevel, daysAvailable } = req.query;

  let recommendedType: string | null = null;

  if (experienceLevel === "BEGINNER" && daysAvailable && Number(daysAvailable) <= 3) {
    recommendedType = "FULL_BODY";
  } else if (
    experienceLevel === "INTERMEDIATE" &&
    daysAvailable &&
    Number(daysAvailable) >= 6
  ) {
    recommendedType = "PPL";
  } else if (daysAvailable && Number(daysAvailable) >= 5) {
    recommendedType = "BRO_SPLIT";
  }

  const splits = await prisma.split.findMany({
    where: { isPrebuilt: true },
    include: {
      days: {
        where: { isRest: false },
        orderBy: { dayNumber: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const sorted = splits.sort((a, b) => {
    const aRec = a.type === recommendedType ? -1 : 0;
    const bRec = b.type === recommendedType ? -1 : 0;
    return aRec - bRec;
  });

  res.json({ splits: sorted, recommendedType });
};
