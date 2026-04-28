-- Add WEBHOOK to the AlertChannel enum.
ALTER TYPE "AlertChannel" ADD VALUE 'WEBHOOK';

-- Add per-rule webhook secret (used to HMAC-sign outbound webhook payloads).
-- Nullable: only WEBHOOK rules carry a secret; EMAIL/SLACK rules leave it NULL.
ALTER TABLE "AlertRule" ADD COLUMN "webhookSecret" TEXT;
