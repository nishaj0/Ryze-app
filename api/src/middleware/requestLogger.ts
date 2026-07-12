import pinoHttp from "pino-http";
import { logger } from "../utils/logger";

const DEV = process.env.NODE_ENV === "development";
const MAX_BODY_LENGTH = 500;

const SENSITIVE_KEYS = [
  "password",
  "oldpassword",
  "newpassword",
  "token",
  "pushtoken",
  "authorization",
  "apikey",
  "apisecret",
];

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) =>
    (req.headers["x-request-id"] as string) || crypto.randomUUID(),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${
      err?.message || "unknown error"
    }`;
  },
  serializers: {
    req: (req) => {
      const raw = req.raw as any;
      const body = DEV
        ? truncateBody(redactBody(raw.body ?? req.body))
        : undefined;
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        userId: raw.userId ?? (req as any).userId,
        body,
      };
    },
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

function redactBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  if (Array.isArray(body)) return body.map(redactBody);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      result[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      result[key] = redactBody(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function truncateBody(body: unknown): string {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  if (text.length <= MAX_BODY_LENGTH) return text;
  return `${text.slice(0, MAX_BODY_LENGTH)}... (${
    text.length - MAX_BODY_LENGTH
  } chars truncated)`;
}
