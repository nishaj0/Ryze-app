-- Keep the split-day label that was in effect when the workout was performed.
-- The live SplitDay relation can be renamed later, so it is not safe for history.
ALTER TABLE "WorkoutSession" ADD COLUMN "splitDayName" TEXT;

UPDATE "WorkoutSession"
SET "splitDayName" = "SplitDay"."name"
FROM "SplitDay"
WHERE "WorkoutSession"."splitDayId" = "SplitDay"."id";

ALTER TABLE "WorkoutSession" ALTER COLUMN "splitDayName" SET NOT NULL;

CREATE INDEX "WorkoutSession_userId_status_splitDayName_date_idx"
ON "WorkoutSession"("userId", "status", "splitDayName", "date");
