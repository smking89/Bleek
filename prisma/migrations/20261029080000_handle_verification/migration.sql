-- Handle verification for ASTRO accounts.
-- Set by staff when a handle is confirmed to belong to the account it claims,
-- which is what the blue check in Bleek renders.

ALTER TABLE "users" ADD COLUMN "handleVerifiedAt" TIMESTAMP(3);

CREATE INDEX "users_handleVerifiedAt_idx" ON "users"("handleVerifiedAt");
