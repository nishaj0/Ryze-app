import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const logNutrition = async (req: AuthRequest, res: Response) => {
  const { calories, proteinG, date, notes } = req.body;
  const userId = req.userId!;

  // Normalize date to start of day in UTC
  const logDate = new Date(date || new Date());
  logDate.setUTCHours(0, 0, 0, 0);

  const entry = await prisma.dailyNutrition.upsert({
    where: {
      userId_date: {
        userId,
        date: logDate,
      },
    },
    update: {
      ...(calories !== undefined && { calories: calories === null ? null : Number(calories) }),
      ...(proteinG !== undefined && { proteinG: proteinG === null ? null : Number(proteinG) }),
      ...(notes !== undefined && { notes }),
    },
    create: {
      userId,
      date: logDate,
      calories: calories ? Number(calories) : null,
      proteinG: proteinG ? Number(proteinG) : null,
      notes,
    },
  });

  res.json({ entry });
};

export const getNutritionLogs = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const logs = await prisma.dailyNutrition.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100, // Limit to recent 100 logs
  });

  res.json({ logs });
};
