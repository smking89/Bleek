-- CreateEnum
CREATE TYPE "PlayPlatform" AS ENUM ('PC', 'CONSOLE', 'BOTH');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('NORTH_AMERICA', 'EUROPE', 'LATIN_AMERICA', 'MIDDLE_EAST_AFRICA', 'ASIA_PACIFIC', 'OCEANIA');

-- CreateEnum
CREATE TYPE "SignInProvider" AS ENUM ('STEAM', 'XBOX');

-- CreateTable
CREATE TABLE "account_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "platform" "PlayPlatform" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linked_sign_ins" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "SignInProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "providerHandle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "linked_sign_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_profiles_userId_key" ON "account_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_profiles_email_key" ON "account_profiles"("email");

-- CreateIndex
CREATE INDEX "account_profiles_region_idx" ON "account_profiles"("region");

-- CreateIndex
CREATE INDEX "account_profiles_platform_idx" ON "account_profiles"("platform");

-- CreateIndex
CREATE INDEX "linked_sign_ins_userId_idx" ON "linked_sign_ins"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "linked_sign_ins_provider_providerAccountId_key" ON "linked_sign_ins"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "account_profiles" ADD CONSTRAINT "account_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linked_sign_ins" ADD CONSTRAINT "linked_sign_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
