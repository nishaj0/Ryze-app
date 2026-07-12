import { Response } from "express";
import { prisma } from "../utils/db";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";


export const logBodyMetric = async (req: AuthRequest, res: Response) => {
  const { date, weightKg, notes } = req.body;
  const userId = req.userId!;

  const metric = await prisma.bodyMetric.create({
    data: {
      userId,
      date: date ? new Date(date) : new Date(),
      weightKg,
      notes,
    },
  });

  res.status(201).json({ metric });
};

export const getBodyMetrics = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { from, to } = req.query;

  const where: any = { userId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from as string);
    if (to) where.date.lte = new Date(to as string);
  }

  const metrics = await prisma.bodyMetric.findMany({
    where,
    orderBy: { date: "asc" },
  });

  res.json({ metrics });
};

export const deleteBodyMetric = async (req: AuthRequest, res: Response) => {
  const metric = await prisma.bodyMetric.findUnique({
    where: { id: req.params.id as string },
  });

  if (!metric || metric.userId !== req.userId) {
    throw new AppError("Metric not found", 404);
  }

  await prisma.bodyMetric.delete({ where: { id: req.params.id as string } });
  res.json({ message: "Metric deleted" });
};
