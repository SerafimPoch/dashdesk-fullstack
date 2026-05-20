-- CreateEnum
CREATE TYPE "ScheduleAccent" AS ENUM ('GREEN', 'PURPLE');

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "accent" "ScheduleAccent" NOT NULL DEFAULT 'GREEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Schedule_startsAt_before_endsAt_check" CHECK ("startsAt" < "endsAt")
);

-- CreateIndex
CREATE INDEX "Schedule_userId_startsAt_idx" ON "Schedule"("userId", "startsAt");

-- AddForeignKey
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
