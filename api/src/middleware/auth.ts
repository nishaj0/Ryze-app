import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { prisma } from "../utils/db";
import { createLogger } from "../utils/logger";

const log = createLogger("auth");

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    log.warn({ reason: "missing-token" }, "auth:fail");
    return next(new AppError("No token provided", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      userId: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true },
    });

    if (!user) {
      log.warn(
        { reason: "user-not-found", userId: decoded.userId },
        "auth:fail"
      );
      return next(new AppError("User no longer exists", 401));
    }

    req.userId = decoded.userId;
    log.debug(
      { userId: decoded.userId, durationMs: Date.now() - start },
      "auth:ok"
    );
    next();
  } catch {
    log.warn({ reason: "invalid-token" }, "auth:fail");
    next(new AppError("Invalid or expired token", 401));
  }
};
