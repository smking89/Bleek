-- Password sign-in for ASTRO accounts. Nullable so accounts created before
-- these credentials existed keep working until they claim a password.
ALTER TABLE "users" ADD COLUMN "passwordHash" TEXT;
