-- AlterTable
ALTER TABLE "ExerciseLog" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "DailyNutrition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calories" INTEGER,
    "proteinG" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyNutrition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyNutrition_userId_date_key" ON "DailyNutrition"("userId", "date");

-- AddForeignKey
ALTER TABLE "DailyNutrition" ADD CONSTRAINT "DailyNutrition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
