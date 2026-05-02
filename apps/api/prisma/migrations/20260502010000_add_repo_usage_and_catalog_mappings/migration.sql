-- V3.1 — RepoUsage table + catalog enrichment for the code scanner.

-- Catalog enrichment: package + hostname mappings used by the scanner
-- to attribute repo usage to a catalog entry.
ALTER TABLE "CatalogEntry"
    ADD COLUMN "npmPackages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN "urlHostnames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Per-repo scan metadata.
ALTER TABLE "GithubRepo"
    ADD COLUMN "lastScannedSha" TEXT,
    ADD COLUMN "lastScanError" TEXT;

-- RepoUsage enum + table.
CREATE TYPE "RepoUsageKind" AS ENUM (
    'SDK_CALL',
    'HTTP_HOSTNAME',
    'HTTP_PATH',
    'OPENAPI_PATH'
);

CREATE TABLE "RepoUsage" (
    "id" TEXT NOT NULL,
    "githubRepoId" TEXT NOT NULL,
    "catalogSlug" TEXT NOT NULL,
    "kind" "RepoUsageKind" NOT NULL,
    "surface" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepoUsage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RepoUsage_githubRepoId_idx" ON "RepoUsage"("githubRepoId");
CREATE INDEX "RepoUsage_catalogSlug_idx" ON "RepoUsage"("catalogSlug");
CREATE INDEX "RepoUsage_githubRepoId_catalogSlug_idx" ON "RepoUsage"("githubRepoId", "catalogSlug");

ALTER TABLE "RepoUsage" ADD CONSTRAINT "RepoUsage_githubRepoId_fkey"
    FOREIGN KEY ("githubRepoId") REFERENCES "GithubRepo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
