import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No token provided", 401));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      userId: string;
    };
    
    // Ensure user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true }
    });

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    req.userId = decoded.userId;
    next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
};
