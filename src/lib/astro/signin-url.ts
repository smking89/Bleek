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
