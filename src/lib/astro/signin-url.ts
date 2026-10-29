/**
 * The client-safe half of the Astrocan sign-in handoff.
 *
 * These shapes are the contract DEVELOPERS.md publishes, so the page that
 * produces them and the integration that consumes them cannot drift apart.
 * Nothing here touches Prisma, so a popup can import it.
 */

/** Marks a popup message as ours; the opener rejects anything else. */
export const SIGN_IN_SOURCE = "astrocan";

export type SignInAccount = { handle: string; astroId: string };

/** https everywhere except loopback, which is how local development runs. */
export function isRedirectAllowed(redirectUri: string): boolean {
  let url: URL;
  try {
    url = new URL(redirectUri);
  } catch {
    return false;
  }

  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
}

/**
 * First-party pages live under this path on the Astrocan host itself. They may
 * start a sign-in without a registry row because they belong to this origin;
 * anything else still has to be registered against the app.
 */
export const FIRST_PARTY_PATH_PREFIX = "/astro/";

/** True when the URI is one of this host's own pages, under the first-party path. */
export function isFirstPartyRedirect(redirectUri: string, hostOrigins: readonly string[]): boolean {
  if (!isRedirectAllowed(redirectUri)) return false;

  const url = new URL(redirectUri);
  return url.pathname.startsWith(FIRST_PARTY_PATH_PREFIX) && hostOrigins.includes(url.origin);
}

/** The registered origin a popup posts to, or null when the URI is unusable. */
export function redirectOrigin(redirectUri: string): string | null {
  return isRedirectAllowed(redirectUri) ? new URL(redirectUri).origin : null;
}

/** Where the browser returns after a redirect sign-in. */
export function signInReturnUrl(redirectUri: string, state: string, account: SignInAccount): string {
  const url = new URL(redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("handle", account.handle);
  url.searchParams.set("astroId", account.astroId);
  return url.toString();
}

/** The single message a popup sends its opener before it closes itself. */
export function signInPopupMessage(state: string, account: SignInAccount) {
  return {
    source: SIGN_IN_SOURCE,
    state,
    account: { handle: account.handle, astroId: account.astroId },
  };
}

/**
 * The consuming half of the contract: the account in a popup message, or null
 * when the message did not come from this sign-in. A caller still has to check
 * `event.origin` itself, because only the browser knows it.
 */
export function readSignInPopupMessage(data: unknown, expectedState: string | null): SignInAccount | null {
  if (!expectedState || typeof data !== "object" || data === null) return null;

  const payload = data as { source?: unknown; state?: unknown; account?: { handle?: unknown; astroId?: unknown } };
  if (payload.source !== SIGN_IN_SOURCE) return null;
  if (payload.state !== expectedState) return null;

  const handle = payload.account?.handle;
  const astroId = payload.account?.astroId;
  if (typeof handle !== "string" || typeof astroId !== "string" || !handle || !astroId) return null;

  return { handle, astroId };
}
