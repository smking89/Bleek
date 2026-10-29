import { astroDb } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";
import { isPlayPlatform, isRegion, type PlayPlatformValue, type RegionValue } from "./regions";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AstroDataError("An email address is required.", 400, "MISSING_EMAIL");
  }

  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) {
    throw new AstroDataError("That email address does not look right.", 422, "INVALID_EMAIL");
  }
  return email;
}

export function requireRegion(value: unknown): RegionValue {
  if (!isRegion(value)) {
    throw new AstroDataError("Pick a region for your account.", 422, "INVALID_REGION");
  }
  return value;
}

export function requirePlatform(value: unknown): PlayPlatformValue {
  if (!isPlayPlatform(value)) {
    throw new AstroDataError("Pick PC, console or both.", 422, "INVALID_PLATFORM");
  }
  return value;
}

/** The account behind an email address, or null. Used to accept email at sign-in. */
export async function accountForEmail(email: string) {
  return astroDb().accountProfile.findUnique({
    where: { email },
    select: { userId: true, user: { select: { handle: true } } },
  });
}

export async function profileForUser(userId: string) {
  return astroDb().accountProfile.findUnique({
    where: { userId },
    select: { email: true, region: true, platform: true },
  });
}

/**
 * Writes the Bleek-only sign-up facts. The email column is unique, so a race
 * between two registrations surfaces as a 409 rather than a second account.
 */
export async function createProfile(input: {
  userId: string;
  email: string;
  region: RegionValue;
  platform: PlayPlatformValue;
}) {
  try {
    return await astroDb().accountProfile.create({
      data: { userId: input.userId, email: input.email, region: input.region, platform: input.platform },
      select: { email: true, region: true, platform: true },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
      throw new AstroDataError("That email address already has an ASTRO account.", 409, "EMAIL_TAKEN");
    }
    throw error;
  }
}
