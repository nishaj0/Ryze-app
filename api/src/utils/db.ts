import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const logQueries = process.env.NODE_ENV === "development";

const prisma = new PrismaClient(
  logQueries
    ? {
        log: [
          { emit: "event", level: "query" },
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ],
      }
    : {
        log: [
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ],
      }
);

if (logQueries) {
  prisma.$on("query" as never, (e: any) => {
    logger.debug(
      {
        module: "prisma",
        query: e.query,
        params: e.params,
        durationMs: Number(e.duration),
      },
      "prisma:query"
    );
  });
}

export { prisma };
