-- Drop the non-unique index
DROP INDEX "ChangeEntry_contentHash_idx";

-- Create unique constraint (replaces the index)
CREATE UNIQUE INDEX "ChangeEntry_contentHash_key" ON "ChangeEntry"("contentHash");
