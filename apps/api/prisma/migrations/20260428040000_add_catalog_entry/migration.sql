-- CatalogEntry — public, curated list of monitorable APIs (V2 Phase 2.1 moat).

CREATE TABLE "CatalogEntry" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "changelogUrl" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "requiresJs" BOOLEAN NOT NULL DEFAULT false,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CatalogEntry_slug_key" ON "CatalogEntry"("slug");
CREATE INDEX "CatalogEntry_category_idx" ON "CatalogEntry"("category");
CREATE INDEX "CatalogEntry_popular_idx" ON "CatalogEntry"("popular");
