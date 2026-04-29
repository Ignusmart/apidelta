-- Add GITHUB to AlertChannel enum + per-rule GitHub auth/config columns.
ALTER TYPE "AlertChannel" ADD VALUE 'GITHUB';

ALTER TABLE "AlertRule" ADD COLUMN "githubToken" TEXT;
ALTER TABLE "AlertRule" ADD COLUMN "githubLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
