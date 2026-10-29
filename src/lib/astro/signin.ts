import "server-only";

import { astroDb } from "@astro/core/db";
import { isRedirectAllowed } from "./signin-url";

/** The app that owns a redirect URI, in the shape the account page needs. */
export type SignInApp = { clientId: string; name: string; redirectUri: string };

/**
 * Exact-match registry lookup. A revoked app is not found, and neither is a
 * URI that merely shares a prefix with a registered one, so the account page
 * never forwards an account to a target the developer did not register.
 */
export async function signInApp(redirectUri: string): Promise<SignInApp | null> {
  if (!isRedirectAllowed(redirectUri)) return null;

  const app = await astroDb().developerApp.findFirst({
    where: { redirectUri, status: "ACTIVE" },
    select: { clientId: true, name: true, redirectUri: true },
  });

  if (!app?.redirectUri) return null;
  return { clientId: app.clientId, name: app.name, redirectUri: app.redirectUri };
}
