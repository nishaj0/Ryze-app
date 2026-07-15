-- Create Conversation table
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Add conversationId to ChatMessage
ALTER TABLE "ChatMessage" ADD COLUMN "conversationId" TEXT;

-- Create indexes
CREATE INDEX "Conversation_userId_lastActiveAt_idx" ON "Conversation"("userId", "lastActiveAt");
CREATE INDEX "ChatMessage_userId_conversationId_createdAt_idx" ON "ChatMessage"("userId", "conversationId", "createdAt");

-- Backfill: create one conversation per user for existing messages
INSERT INTO "Conversation" ("id", "userId", "title", "createdAt", "lastActiveAt")
SELECT
    gen_random_uuid()::text,
    "userId",
    'Previous chat',
    MIN("createdAt"),
    MAX("createdAt")
FROM "ChatMessage"
WHERE "conversationId" IS NULL
GROUP BY "userId";

-- Update ChatMessage rows to point to the conversation we just created
UPDATE "ChatMessage" cm
SET "conversationId" = c."id"
FROM "Conversation" c
WHERE cm."userId" = c."userId"
  AND cm."conversationId" IS NULL;

-- Add foreign keys
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
