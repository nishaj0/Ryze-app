import type { Request, Response, NextFunction } from "express";
import type { Logger } from "pino";
import { runWithContext, getLogContext } from "./logger";

const DEV = process.env.NODE_ENV === "development";

type Handler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function wrap(handler: Handler): Handler {
  return async (req, res, next) => {
    const context = {
      ...getLogContext(),
      reqId: (req as any).id,
      userId: (req as any).userId,
    };

    return runWithContext(context, async () => {
      const start = Date.now();
      const log = (req as any).log as Logger | undefined;
      const handlerName = handler.name || "anonymous";

      if (DEV && log) {
        log.debug(
          {
            handler: handlerName,
            params: redactObject(req.params),
            queryKeys: Object.keys(req.query || {}),
            bodyKeys: Object.keys(req.body || {}),
            userId: (req as any).userId,
          },
          `${handlerName}:start`
        );
      }

      try {
        const result = await handler(req, res, next);
        if (DEV && log && !res.headersSent) {
          log.debug(
            {
              handler: handlerName,
              statusCode: res.statusCode,
              durationMs: Date.now() - start,
            },
            `${handlerName}:ok`
          );
        }
        return result;
      } catch (error) {
        if (log) {
          log.error(
            {
              handler: handlerName,
              durationMs: Date.now() - start,
              err: error,
            },
            `${handlerName}:fail`
          );
        }
        next(error);
      }
    });
  };
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  if (!obj || typeof obj !== "object") return obj;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = isSensitiveKey(key) ? "[REDACTED]" : value;
  }
  return result;
}

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes("password") ||
    lower.includes("token") ||
    lower.includes("secret") ||
    lower.includes("authorization") ||
    lower.includes("apikey")
  );
}
