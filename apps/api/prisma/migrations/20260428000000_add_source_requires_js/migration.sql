-- Add requiresJs flag to ApiSource. Set true for SPA-rendered changelogs
-- so the crawler routes them through Playwright instead of plain fetch().
ALTER TABLE "ApiSource" ADD COLUMN "requiresJs" BOOLEAN NOT NULL DEFAULT false;
