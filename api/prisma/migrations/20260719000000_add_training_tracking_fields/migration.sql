-- Forward-only: existing logged sets remain working sets and retain current behaviour.
ALTER TABLE "User"
  ADD COLUMN "trainingLimitations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "WorkoutSession"
  ALTER COLUMN "splitDayId" DROP NOT NULL,
  ALTER COLUMN "splitDayName" SET DEFAULT 'Freestyle',
  ADD COLUMN "isDeload" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "SetLog"
  ADD COLUMN "isWarmup" BOOLEAN NOT NULL DEFAULT false,
  ALTER COLUMN "rpe" TYPE INTEGER USING CASE
    WHEN "rpe" IS NULL THEN NULL
    ELSE ROUND("rpe")::INTEGER
  END;

ALTER TABLE "SetLog"
  ADD CONSTRAINT "SetLog_rpe_range" CHECK ("rpe" IS NULL OR ("rpe" >= 1 AND "rpe" <= 10));
