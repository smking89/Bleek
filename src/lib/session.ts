import { cookies } from "next/headers";
import { ACCOUNT_SELECT, type AstroAccount } from "@astro/core/accounts";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, readSessionToken } from "@astro/core/auth";
import { astroDb } from "@astro/core/db";

/**
 * The thin Next.js adapter around the ASTRO session primitives in @astro/core.
 * The package signs and verifies tokens; only the cookie mechanics live here.
 */
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
