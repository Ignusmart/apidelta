-- CreateEnum
CREATE TYPE "TriageStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED');

-- AlterTable
ALTER TABLE "ChangeEntry" ADD COLUMN "triageStatus" "TriageStatus" NOT NULL DEFAULT 'OPEN';
ALTER TABLE "ChangeEntry" ADD COLUMN "triageAssigneeId" TEXT;

-- CreateIndex
CREATE INDEX "ChangeEntry_triageStatus_idx" ON "ChangeEntry"("triageStatus");

-- AddForeignKey
ALTER TABLE "ChangeEntry" ADD CONSTRAINT "ChangeEntry_triageAssigneeId_fkey" FOREIGN KEY ("triageAssigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
