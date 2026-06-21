import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

// ─── App Settings ───────────────────────────────────────────────────────────

export const getAppSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: "default",
          bugReportingEnabled: true,
          helpRequestsEnabled: true,
          exerciseRequestsEnabled: true,
        },
      });
    }

    res.json({ settings });
  } catch (err) {
    next(err);
  }
};

export const updateAppSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bugReportingEnabled, helpRequestsEnabled, exerciseRequestsEnabled } = req.body;

    const settings = await prisma.appSettings.upsert({
      where: { id: "default" },
      update: {
        bugReportingEnabled,
        helpRequestsEnabled,
        exerciseRequestsEnabled,
      },
      create: {
        id: "default",
        bugReportingEnabled: bugReportingEnabled ?? true,
        helpRequestsEnabled: helpRequestsEnabled ?? true,
        exerciseRequestsEnabled: exerciseRequestsEnabled ?? true,
      },
    });

    res.json({ settings });
  } catch (err) {
    next(err);
  }
};

// ─── User Support Tickets ────────────────────────────────────────────────────

export const submitSupportTicket = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const { type, title, description } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ error: "Missing required fields: type, title, description" });
    }

    // Check if the feature is enabled in AppSettings
    const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    const isEnabled = !settings || 
      (type === "BUG" && settings.bugReportingEnabled) ||
      (type === "HELP" && settings.helpRequestsEnabled) ||
      (type === "EXERCISE_REQUEST" && settings.exerciseRequestsEnabled);

    if (!isEnabled) {
      return res.status(400).json({ error: `This ticket type (${type}) is currently disabled` });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        type,
        title,
        description,
      },
    });

    res.status(201).json({ ticket });
  } catch (err) {
    next(err);
  }
};

export const getMyTickets = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({ tickets });
  } catch (err) {
    next(err);
  }
};

// ─── Admin Support Tickets ───────────────────────────────────────────────────

export const listAllTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    res.json({
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

export const respondToTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { adminResponse, status } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: { id: id as string },
      data: {
        adminResponse,
        status: status || "RESOLVED",
      },
    });

    res.json({ ticket });
  } catch (err) {
    next(err);
  }
};
