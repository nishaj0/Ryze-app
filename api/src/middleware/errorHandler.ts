import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const log = (req as any).log || logger.child({ module: "errorHandler" });

  if (err instanceof AppError) {
    log.warn({ statusCode: err.statusCode, message: err.message }, "AppError");
    return res.status(err.statusCode).json({ error: err.message });
  }

  const dev = process.env.NODE_ENV === "development";
  log.error(
    {
      message: err.message,
      stack: dev ? err.stack : undefined,
    },
    "Unhandled error"
  );
  return res.status(500).json({ error: "Internal server error" });
};
