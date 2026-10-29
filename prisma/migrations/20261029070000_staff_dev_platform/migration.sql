-- ASTRO operations console + developer platform.
-- Adds staff roles and suspension state to users, developer apps with daily usage
-- metering, the moderation case queue and the append-only staff audit log.

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('MODERATOR', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "AppEnvironment" AS ENUM ('DEVELOPMENT', 'PRODUCTION');
CREATE TYPE "DeveloperAppStatus" AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterTable
ALTER TABLE "users"
  ADD COLUMN "staffRole" "StaffRole",
  ADD COLUMN "staffTitle" TEXT,
  ADD COLUMN "staffSince" TIMESTAMP(3),
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "suspendedAt" TIMESTAMP(3),
  ADD COLUMN "suspendedReason" TEXT,
  ADD COLUMN "lastSeenAt" TIMESTAMP(3);

CREATE INDEX "users_staffRole_idx" ON "users"("staffRole");
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateTable
CREATE TABLE "developer_apps" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "clientId" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "lastFour" TEXT NOT NULL,
  "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "environment" "AppEnvironment" NOT NULL DEFAULT 'DEVELOPMENT',
  "status" "DeveloperAppStatus" NOT NULL DEFAULT 'ACTIVE',
  "redirectUri" TEXT,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  "errorCount" INTEGER NOT NULL DEFAULT 0,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "developer_apps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "developer_apps_clientId_key" ON "developer_apps"("clientId");
CREATE UNIQUE INDEX "developer_apps_keyHash_key" ON "developer_apps"("keyHash");
CREATE INDEX "developer_apps_ownerId_createdAt_idx" ON "developer_apps"("ownerId", "createdAt");
CREATE INDEX "developer_apps_status_idx" ON "developer_apps"("status");

ALTER TABLE "developer_apps"
  ADD CONSTRAINT "developer_apps_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "api_usage_daily" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "requests" INTEGER NOT NULL DEFAULT 0,
  "errors" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "api_usage_daily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "api_usage_daily_appId_day_key" ON "api_usage_daily"("appId", "day");
CREATE INDEX "api_usage_daily_day_idx" ON "api_usage_daily"("day");

ALTER TABLE "api_usage_daily"
  ADD CONSTRAINT "api_usage_daily_appId_fkey"
  FOREIGN KEY ("appId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "api_requests" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "status" INTEGER NOT NULL,
  "durationMs" INTEGER NOT NULL,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "api_requests_appId_createdAt_idx" ON "api_requests"("appId", "createdAt");
CREATE INDEX "api_requests_createdAt_idx" ON "api_requests"("createdAt");

ALTER TABLE "api_requests"
  ADD CONSTRAINT "api_requests_appId_fkey"
  FOREIGN KEY ("appId") REFERENCES "developer_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "moderation_cases" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "subjectId" TEXT,
  "subjectHandle" TEXT NOT NULL,
  "reporterHandle" TEXT,
  "reason" TEXT NOT NULL,
  "detail" TEXT,
  "channel" TEXT,
  "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "CasePriority" NOT NULL DEFAULT 'NORMAL',
  "assigneeId" TEXT,
  "resolution" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "moderation_cases_reference_key" ON "moderation_cases"("reference");
CREATE INDEX "moderation_cases_status_priority_idx" ON "moderation_cases"("status", "priority");
CREATE INDEX "moderation_cases_createdAt_idx" ON "moderation_cases"("createdAt");
CREATE INDEX "moderation_cases_assigneeId_idx" ON "moderation_cases"("assigneeId");

ALTER TABLE "moderation_cases"
  ADD CONSTRAINT "moderation_cases_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "moderation_cases"
  ADD CONSTRAINT "moderation_cases_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "case_notes" (
  "id" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "authorId" TEXT,
  "authorHandle" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "case_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "case_notes_caseId_createdAt_idx" ON "case_notes"("caseId", "createdAt");

ALTER TABLE "case_notes"
  ADD CONSTRAINT "case_notes_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "moderation_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_notes"
  ADD CONSTRAINT "case_notes_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "staff_audit" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorHandle" TEXT NOT NULL,
  "actorRole" "StaffRole",
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "targetLabel" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "ip" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "staff_audit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "staff_audit_createdAt_idx" ON "staff_audit"("createdAt");
CREATE INDEX "staff_audit_actorId_idx" ON "staff_audit"("actorId");
CREATE INDEX "staff_audit_action_idx" ON "staff_audit"("action");

ALTER TABLE "staff_audit"
  ADD CONSTRAINT "staff_audit_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
