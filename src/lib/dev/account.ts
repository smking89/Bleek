import "server-only";

import { currentAccount } from "@/lib/astro/auth";
import { AstroDataError } from "@/lib/astro/errors";

/** The signed-in ASTRO account, required for every developer-portal route. */
export async function developerAccount() {
  const account = await currentAccount();

  if (!account) {
    throw new AstroDataError("Sign in with your ASTRO account to use the developer portal.", 401, "AUTH_REQUIRED");
  }
  if (account.status === "SUSPENDED") {
    throw new AstroDataError("This ASTRO account is suspended.", 403, "ACCOUNT_SUSPENDED");
  }

  return account;
}
