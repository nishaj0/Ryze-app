-- A split can be kept privately, published to the community, or forked as an
-- independent copy. `createdById` remains the owner field for compatibility
-- with existing data and APIs.
ALTER TABLE "Split"
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "forkedFromSplitId" TEXT,
  ADD COLUMN "creatorDisplayName" TEXT,
  ADD COLUMN "splitTypeTag" TEXT NOT NULL DEFAULT 'CUSTOM',
  ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "saveCount" INTEGER NOT NULL DEFAULT 0;

-- Keep the existing `type` as the canonical tag for historical/prebuilt data.
UPDATE "Split" SET "splitTypeTag" = "type" WHERE "type" IN ('PPL', 'BRO_SPLIT', 'FULL_BODY', 'UPPER_LOWER', 'CUSTOM');

ALTER TABLE "UserSplit"
  ADD COLUMN "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "isActive" SET DEFAULT false;

-- Old versions allowed multiple active rows. Retain the most recently started
-- row for each user before enforcing one saved row per split.
WITH ranked_active AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "userId"
    ORDER BY "startDate" DESC, "id" DESC
  ) AS row_number
  FROM "UserSplit"
  WHERE "isActive" = true
)
UPDATE "UserSplit" AS user_split
SET "isActive" = false
FROM ranked_active
WHERE user_split."id" = ranked_active."id"
  AND ranked_active.row_number > 1;

-- De-duplicate legacy library rows before adding the unique constraint.
WITH ranked_saved AS (
  SELECT "id", ROW_NUMBER() OVER (
    PARTITION BY "userId", "splitId"
    ORDER BY "isActive" DESC, "startDate" DESC, "id" DESC
  ) AS row_number
  FROM "UserSplit"
)
DELETE FROM "UserSplit" AS user_split
USING ranked_saved
WHERE user_split."id" = ranked_saved."id"
  AND ranked_saved.row_number > 1;

CREATE TABLE "SplitLike" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "splitId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SplitLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSplit_userId_splitId_key" ON "UserSplit"("userId", "splitId");
CREATE INDEX "UserSplit_userId_isActive_idx" ON "UserSplit"("userId", "isActive");
CREATE UNIQUE INDEX "SplitLike_userId_splitId_key" ON "SplitLike"("userId", "splitId");
CREATE INDEX "SplitLike_splitId_idx" ON "SplitLike"("splitId");
CREATE INDEX "Split_visibility_publishedAt_idx" ON "Split"("visibility", "publishedAt");
CREATE INDEX "Split_visibility_likeCount_idx" ON "Split"("visibility", "likeCount");
CREATE INDEX "Split_visibility_saveCount_idx" ON "Split"("visibility", "saveCount");

ALTER TABLE "Split"
  ADD CONSTRAINT "Split_forkedFromSplitId_fkey"
  FOREIGN KEY ("forkedFromSplitId") REFERENCES "Split"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SplitLike"
  ADD CONSTRAINT "SplitLike_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "SplitLike_splitId_fkey"
  FOREIGN KEY ("splitId") REFERENCES "Split"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
