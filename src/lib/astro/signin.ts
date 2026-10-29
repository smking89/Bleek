import "server-only";

import { astroDb } from "@astro/core/db";
import { isFirstPartyRedirect, isRedirectAllowed } from "./signin-url";

/** The app that owns a redirect URI, in the shape the account page needs. */
export type SignInApp = { clientId: string; name: string; redirectUri: string };

/** Astrocan's own pages need no registry row, so they show up under this name. */
const FIRST_PARTY_APP = { clientId: "astrocan-first-party", name: "Astrocan" } as const;

/**
 * Resolves which app a sign-in is for. A registered app wins, matched exactly on
 * `redirectUri`: a revoked app is not found, and neither is a URI that merely
 * shares a prefix with a registered one. Pages this deployment serves itself,
 * under `/astro/`, are accepted as first-party without a row — they belong to
 * this origin, so there is nothing to protect the member from.
 */
export async function signInApp(redirectUri: string, hostOrigins: readonly string[] = []): Promise<SignInApp | null> {
  if (!isRedirectAllowed(redirectUri)) return null;

  const app = await astroDb().developerApp.findFirst({
    where: { redirectUri, status: "ACTIVE" },
    select: { clientId: true, name: true, redirectUri: true },
  });

  if (app?.redirectUri) return { clientId: app.clientId, name: app.name, redirectUri: app.redirectUri };
  if (isFirstPartyRedirect(redirectUri, hostOrigins)) return { ...FIRST_PARTY_APP, redirectUri };

  return null;
}
