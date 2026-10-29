import { currentAccount } from "./session";
import { ApiError } from "./store";

/** The signed-in ASTRO account, as the chat layer uses it. */
export async function actorId(): Promise<string> {
  const account = await currentAccount().catch(() => null);
  if (!account) throw new ApiError(401, "Sign in to use Bleek.");
  if (account.status === "SUSPENDED") throw new ApiError(403, "This account is suspended.");
  return account.id;
}
