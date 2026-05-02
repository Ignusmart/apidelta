-- V3.0 — GitHub App installations. One row per team-side install of the
-- APIDelta GitHub App; each install carries a list of authorized repos.

CREATE TABLE "GithubInstallation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "installationId" INTEGER NOT NULL,
    "accountType" TEXT NOT NULL,
    "accountLogin" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    "lastWebhookAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GithubInstallation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GithubInstallation_installationId_key" ON "GithubInstallation"("installationId");
CREATE INDEX "GithubInstallation_teamId_idx" ON "GithubInstallation"("teamId");
CREATE INDEX "GithubInstallation_accountLogin_idx" ON "GithubInstallation"("accountLogin");

ALTER TABLE "GithubInstallation" ADD CONSTRAINT "GithubInstallation_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GithubRepo" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "repoId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "private" BOOLEAN NOT NULL DEFAULT false,
    "removedAt" TIMESTAMP(3),
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GithubRepo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GithubRepo_repoId_key" ON "GithubRepo"("repoId");
CREATE INDEX "GithubRepo_installationId_idx" ON "GithubRepo"("installationId");
CREATE INDEX "GithubRepo_fullName_idx" ON "GithubRepo"("fullName");

ALTER TABLE "GithubRepo" ADD CONSTRAINT "GithubRepo_installationId_fkey"
    FOREIGN KEY ("installationId") REFERENCES "GithubInstallation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
