-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "aiSuggestionsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aiSuggestionScheduleCron" TEXT NOT NULL DEFAULT '0 9 * * 0';

-- CreateTable
CREATE TABLE "SplitSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "splitDayId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "suggestionType" TEXT NOT NULL,
    "suggestedAlternativeExerciseId" TEXT,
    "reasoning" TEXT NOT NULL,
    "basedOnCheckInIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SplitSuggestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SplitSuggestion" ADD CONSTRAINT "SplitSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSuggestion" ADD CONSTRAINT "SplitSuggestion_splitDayId_fkey" FOREIGN KEY ("splitDayId") REFERENCES "SplitDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSuggestion" ADD CONSTRAINT "SplitSuggestion_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitSuggestion" ADD CONSTRAINT "SplitSuggestion_suggestedAlternativeExerciseId_fkey" FOREIGN KEY ("suggestedAlternativeExerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
