import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";


const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as any);
};

export const register = async (req: AuthRequest, res: Response) => {
  const { email, password, name } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already registered", 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const token = generateToken(user.id);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      onboardingDone: user.onboardingDone,
    },
  });
};

export const login = async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = generateToken(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      onboardingDone: user.onboardingDone,
    },
  });
};

export const me = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      name: true,
      gender: true,
      goal: true,
      experienceLevel: true,
      daysAvailable: true,
      equipmentAccess: true,
      sleepHours: true,
      currentWeight: true,
      height: true,
      units: true,
      onboardingDone: true,
      reminderTime: true,
      weeklyCheckin: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({ user });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const { name, goal, currentWeight, height, sleepHours, units, reminderTime, weeklyCheckin } =
    req.body;

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(goal !== undefined && { goal }),
      ...(currentWeight !== undefined && { currentWeight }),
      ...(height !== undefined && { height }),
      ...(sleepHours !== undefined && { sleepHours }),
      ...(units !== undefined && { units }),
      ...(reminderTime !== undefined && { reminderTime }),
      ...(weeklyCheckin !== undefined && { weeklyCheckin }),
    },
  });

  res.json({ user });
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  await prisma.user.delete({ where: { id: req.userId } });
  res.json({ message: "Account deleted" });
};
