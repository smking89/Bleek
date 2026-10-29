import { createHash, randomBytes } from "node:crypto";
import { astroDb } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";

/** How long a verification link stays usable. */
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

/** Minimum gap between two verification emails for one account. */
export const RESEND_COOLDOWN_MS = 1000 * 60;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A dev server bound to 0.0.0.0 must still produce a link a browser can open. */
function usableOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    if (url.hostname === "0.0.0.0" || url.hostname === "::" || url.hostname === "[::]") {
      url.hostname = "localhost";
    }
    return url.origin;
  } catch {
    return origin;
  }
}

/**
 * The link a member opens. APP_ORIGIN wins when set, so a proxy or preview host
 * cannot be spoofed through the incoming Host header.
 */
export function verificationUrl(origin: string, token: string): string {
  const base = process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? usableOrigin(origin);
  return `${base.replace(/\/+$/, "")}/astro/verify?token=${encodeURIComponent(token)}`;
}

export type EmailVerificationState = {
  email: string | null;
  verified: boolean;
  /** A token is live and unused. */
  pending: boolean;
  /** Epoch milliseconds before which a resend is refused, or null. */
  resendAt: number | null;
};

export async function emailVerificationState(userId: string): Promise<EmailVerificationState> {
  const profile = await astroDb().accountProfile.findUnique({
    where: { userId },
    select: { email: true, emailVerifiedAt: true, emailTokenHash: true, emailTokenExpiresAt: true, emailTokenSentAt: true },
  });

  if (!profile) return { email: null, verified: false, pending: false, resendAt: null };

  const now = Date.now();
  return {
    email: profile.email,
    verified: Boolean(profile.emailVerifiedAt),
    pending: Boolean(profile.emailTokenHash && profile.emailTokenExpiresAt && profile.emailTokenExpiresAt.getTime() > now),
    resendAt: profile.emailTokenSentAt ? profile.emailTokenSentAt.getTime() + RESEND_COOLDOWN_MS : null,
  };
}

/**
 * Issues a fresh token for the account, replacing any previous one. The plain
 * token is returned once so the caller can put it in an email; only its SHA-256
 * hash is persisted.
 */
export async function issueEmailVerification(userId: string): Promise<{ email: string; token: string }> {
  const profile = await astroDb().accountProfile.findUnique({
    where: { userId },
    select: { email: true, emailVerifiedAt: true },
  });

  if (!profile) {
    throw new AstroDataError("This account has no email address to verify.", 409, "EMAIL_MISSING");
  }
  if (profile.emailVerifiedAt) {
    throw new AstroDataError("That email address is already verified.", 409, "EMAIL_ALREADY_VERIFIED");
  }

  const token = randomBytes(32).toString("base64url");
  const now = new Date();

  await astroDb().accountProfile.update({
    where: { userId },
    data: {
      emailTokenHash: hashToken(token),
      emailTokenExpiresAt: new Date(now.getTime() + TOKEN_TTL_MS),
      emailTokenSentAt: now,
    },
  });

  return { email: profile.email, token };
}

/** Consumes a token. Unknown, expired and already-used links are refused. */
export async function confirmEmail(token: string): Promise<{ userId: string; email: string }> {
  if (typeof token !== "string" || token.trim().length < 20) {
    throw new AstroDataError("That verification link is not valid. Request a new one.", 400, "TOKEN_INVALID");
  }

  const profile = await astroDb().accountProfile.findFirst({
    where: { emailTokenHash: hashToken(token.trim()) },
    select: { id: true, userId: true, email: true, emailTokenExpiresAt: true },
  });

  if (!profile) {
    throw new AstroDataError("That verification link is not valid. Request a new one.", 400, "TOKEN_INVALID");
  }

  if (!profile.emailTokenExpiresAt || profile.emailTokenExpiresAt.getTime() < Date.now()) {
    throw new AstroDataError("That verification link has expired. Request a new one.", 410, "TOKEN_EXPIRED");
  }

  await astroDb().accountProfile.update({
    where: { id: profile.id },
    data: { emailVerifiedAt: new Date(), emailTokenHash: null, emailTokenExpiresAt: null },
  });

  return { userId: profile.userId, email: profile.email };
}
