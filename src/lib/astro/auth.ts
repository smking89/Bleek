import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { ACCOUNT_SELECT, createAstroAccount, type AstroAccount } from "./accounts";
import { astroDb } from "./db";
import { AstroDataError } from "./errors";
import { normalizeAccountHandle } from "./links";

const scrypt = promisify(scryptCallback);

const SESSION_COOKIE = "astro_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  const secret = process.env.ASTRO_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new AstroDataError(
      "Sign-in is not configured: set ASTRO_AUTH_SECRET to a random string of at least 32 characters.",
      503,
      "AUTH_UNCONFIGURED",
    );
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("base64url")}:${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;

  const [scheme, salt, digest] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !digest) return false;

  const expected = Buffer.from(digest, "base64url");
  const derived = (await scrypt(password, Buffer.from(salt, "base64url"), expected.length)) as Buffer;
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expires, signature] = parts;
  const expected = Buffer.from(sign(`${userId}.${expires}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (!Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return null;

  return userId;
}

export async function startSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Resolves the signed-in ASTRO account, or null. Never throws for a missing cookie. */
export async function currentAccount(): Promise<AstroAccount | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = readSessionToken(token);
  if (!userId) return null;

  return astroDb().user.findUnique({ where: { id: userId }, select: ACCOUNT_SELECT });
}

function validatePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 8 || value.length > 200) {
    throw new AstroDataError("Passwords need 8 to 200 characters.", 422, "INVALID_PASSWORD");
  }
  return value;
}

/** Creates the account, its wallet and its password hash in one write. */
export async function registerAccount(input: {
  handle: string;
  displayName?: string;
  password: string;
}): Promise<AstroAccount> {
  if (!input.handle) throw new AstroDataError("handle is required.", 400, "MISSING_HANDLE");

  const password = validatePassword(input.password);
  const passwordHash = await hashPassword(password);

  return createAstroAccount({
    handle: input.handle,
    displayName: input.displayName,
    passwordHash,
    startingCoins: 250,
  });
}

/** Verifies handle + password. Unknown accounts and wrong passwords fail identically. */
export async function authenticate(handle: string, password: string): Promise<AstroAccount> {
  if (!handle || typeof password !== "string") {
    throw new AstroDataError("Handle and password are required.", 400, "MISSING_CREDENTIALS");
  }

  const normalized = normalizeAccountHandle(handle);
  const record = await astroDb().user.findUnique({
    where: { handle: normalized },
    select: { id: true, passwordHash: true, status: true, suspendedReason: true },
  });

  const valid = await verifyPassword(password, record?.passwordHash);

  if (!record || !valid) {
    throw new AstroDataError("That handle and password do not match.", 401, "INVALID_CREDENTIALS");
  }

  // Only reveal suspension to someone who proved the password.
  if (record.status === "SUSPENDED") {
    const reason = record.suspendedReason ? ` Reason: ${record.suspendedReason}` : "";
    throw new AstroDataError(`This ASTRO account is suspended.${reason}`, 403, "ACCOUNT_SUSPENDED");
  }

  const account = await astroDb().user.findUnique({ where: { id: record.id }, select: ACCOUNT_SELECT });
  if (!account) throw new AstroDataError("That account no longer exists.", 404, "ACCOUNT_NOT_FOUND");

  await astroDb().user.update({ where: { id: record.id }, data: { lastSeenAt: new Date() } });
  return account;
}
