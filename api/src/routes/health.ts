import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();
const startTime = Date.now();

router.get("/", async (_req: Request, res: Response) => {
  let dbStatus = "ok";
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "Unknown database error";
  }

  res.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    database: dbStatus,
    ...(dbError ? { error: dbError } : {}),
  });
});

export default router;
