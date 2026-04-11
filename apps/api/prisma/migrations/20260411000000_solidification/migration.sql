-- AlterTable
ALTER TABLE "ChangeEntry" ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "contentHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Alert_alertRuleId_changeEntryId_key" ON "Alert"("alertRuleId", "changeEntryId");

-- CreateIndex
CREATE INDEX "ChangeEntry_contentHash_idx" ON "ChangeEntry"("contentHash");
