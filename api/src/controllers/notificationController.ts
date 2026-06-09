import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const saveToken = async (req: AuthRequest, res: Response) => {
  const { token } = req.body;

  await prisma.user.update({
    where: { id: req.userId },
    data: { pushToken: token },
  });

  res.json({ message: "Token saved" });
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  const { reminderTime, weeklyCheckin } = req.body;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(reminderTime !== undefined && { reminderTime }),
      ...(weeklyCheckin !== undefined && { weeklyCheckin }),
    },
  });

  res.json({ preferences: { reminderTime: user.reminderTime, weeklyCheckin: user.weeklyCheckin } });
};

export const getPreferences = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { reminderTime: true, weeklyCheckin: true },
  });

  res.json({ preferences: user });
};
