-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "date" TIMESTAMP(3);

-- Preserve an operation date for any transactions created before this field existed.
UPDATE "Transaction" SET "date" = "createdAt" WHERE "date" IS NULL;

ALTER TABLE "Transaction" ALTER COLUMN "date" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- Keep the selector periods in sync for transactions that predate this migration.
INSERT INTO "TransactionDateRange" ("id", "userId", "startsAt", "endsAt", "createdAt", "updatedAt")
SELECT
    md5("userId" || ':' || date_trunc('month', "date")::text),
    "userId",
    date_trunc('month', "date"),
    date_trunc('month', "date") + INTERVAL '1 month' - INTERVAL '1 day',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Transaction"
GROUP BY "userId", date_trunc('month', "date")
ON CONFLICT ("userId", "startsAt", "endsAt") DO NOTHING;
