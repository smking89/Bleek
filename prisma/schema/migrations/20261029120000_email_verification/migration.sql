-- Email verification: a hashed, expiring token on the profile row plus the
-- timestamp that marks the address as proven. The token itself is never stored.
ALTER TABLE "account_profiles"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "emailTokenHash" TEXT,
  ADD COLUMN "emailTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "emailTokenSentAt" TIMESTAMP(3);

CREATE INDEX "account_profiles_emailVerifiedAt_idx" ON "account_profiles"("emailVerifiedAt");
