-- AlterTable: add optional sourceId FK to ChangeEntry
ALTER TABLE "ChangeEntry" ADD COLUMN "sourceId" TEXT;

-- Backfill sourceId from CrawlRun for all existing entries
UPDATE "ChangeEntry" ce
SET "sourceId" = cr."sourceId"
FROM "CrawlRun" cr
WHERE ce."crawlRunId" = cr."id";

-- CreateIndex
CREATE INDEX "ChangeEntry_sourceId_idx" ON "ChangeEntry"("sourceId");

-- AddForeignKey
ALTER TABLE "ChangeEntry" ADD CONSTRAINT "ChangeEntry_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ApiSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
