import "server-only";

import { currentAccount } from "@/lib/session";
import { AstroDataError } from "@astro/core/errors";

/** The signed-in ASTRO account, required for every Astrocan route. */
export async function developerAccount() {
  const account = await currentAccount();

  if (!account) {
    throw new AstroDataError("Sign in with your ASTRO account to use the Astrocan developer portal.", 401, "AUTH_REQUIRED");
  }
  if (account.status === "SUSPENDED") {
    throw new AstroDataError("This ASTRO account is suspended.", 403, "ACCOUNT_SUSPENDED");
  }

  return account;
}
