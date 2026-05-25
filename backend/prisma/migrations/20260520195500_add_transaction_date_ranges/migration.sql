-- CreateTable
CREATE TABLE "TransactionDateRange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionDateRange_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TransactionDateRange_startsAt_before_endsAt_check" CHECK ("startsAt" <= "endsAt")
);

-- CreateIndex
CREATE INDEX "TransactionDateRange_userId_startsAt_idx" ON "TransactionDateRange"("userId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionDateRange_userId_startsAt_endsAt_key" ON "TransactionDateRange"("userId", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "TransactionDateRange" ADD CONSTRAINT "TransactionDateRange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
