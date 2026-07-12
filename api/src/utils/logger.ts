import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import fs from "node:fs";

export type LogContext = {
  reqId?: string;
  runId?: string;
  userId?: string;
  [key: string]: unknown;
};

const logContext = new AsyncLocalStorage<LogContext>();

export function getLogContext(): LogContext | undefined {
  return logContext.getStore();
}

export function runWithContext<T>(context: LogContext, fn: () => T): T {
  return logContext.run(context, fn);
}

const NODE_ENV = process.env.NODE_ENV || "development";
const LOG_LEVEL =
  process.env.LOG_LEVEL ||
  (NODE_ENV === "development" ? "debug" : NODE_ENV === "test" ? "silent" : "info");
const LOG_DIR = process.env.LOG_DIR || "logs";
const LOG_FILE_MAX_SIZE = process.env.LOG_FILE_MAX_SIZE || "10m";
const LOG_FILE_MAX_FILES = Number(process.env.LOG_FILE_MAX_FILES || "7");

const REDACTED = "[REDACTED]";
const REDACT_PATHS = [
  "req.headers.authorization",
  "body.password",
  "body.oldPassword",
  "body.newPassword",
  "body.token",
  "body.pushToken",
  "body.authorization",
  "password",
  "token",
  "pushToken",
  "authorization",
  "apiKey",
  "apiSecret",
];

function buildTransport():
  | pino.TransportSingleOptions
  | pino.TransportMultiOptions
  | undefined {
  if (NODE_ENV === "test") {
    return undefined;
  }

  if (NODE_ENV === "development") {
    return {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "hostname",
        singleLine: false,
        levelFirst: true,
      },
    };
  }

  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {
    // ignore mkdir errors; pino-roll will also try with mkdir:true
  }

  return {
    targets: [
      {
        target: "pino/file",
        options: { destination: 1 },
        level: LOG_LEVEL as pino.Level,
      },
      {
        target: "pino-roll",
        options: {
          file: path.join(LOG_DIR, "api.log"),
          size: LOG_FILE_MAX_SIZE,
          frequency: "daily",
          mkdir: true,
          symlink: false,
          limit: { count: LOG_FILE_MAX_FILES },
        },
        level: LOG_LEVEL as pino.Level,
      },
    ],
  };
}

const options: pino.LoggerOptions = {
  level: LOG_LEVEL as pino.Level,
  mixin: () => getLogContext() || {},
  redact: {
    paths: REDACT_PATHS,
    censor: REDACTED,
    remove: false,
  },
  base: {
    pid: process.pid,
    env: NODE_ENV,
  },
  formatters: {
    log: (obj) => {
      if (
        obj &&
        typeof obj === "object" &&
        "err" in obj &&
        obj.err instanceof Error
      ) {
        return {
          ...obj,
          err: pino.stdSerializers.err(obj.err),
        };
      }
      return obj;
    },
  },
};

const transport = buildTransport();
if (transport) {
  options.transport = transport;
}

export const logger = pino(options);

export function createLogger(module: string): pino.Logger {
  return logger.child({ module });
}

export async function trace<T>(
  log: pino.Logger,
  name: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const start = Date.now();
  log.debug(meta || {}, `${name}:start`);
  try {
    const result = await fn();
    log.debug({ durationMs: Date.now() - start }, `${name}:ok`);
    return result;
  } catch (error) {
    log.error({ err: error, durationMs: Date.now() - start }, `${name}:fail`);
    throw error;
  }
}
