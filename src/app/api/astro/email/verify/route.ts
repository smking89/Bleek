import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse, readJson } from "@astro/core/http";
import { confirmEmail } from "@/lib/astro/email-verification";
import { currentAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

type VerifyBody = { token?: string };

/**
 * Consumes the token from a verification link. Signed out is fine: the link
 * proves control of the mailbox, and opening it on another device must work.
 */
export async function POST(request: Request) {
  try {
    const body = await readJson<VerifyBody>(request);
    const result = await confirmEmail(body.token ?? "");

    const account = await currentAccount().catch(() => null);

    return Response.json(
      { verified: true, email: result.email, current: account?.id === result.userId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof AstroDataError) return astroErrorResponse(error);
    throw error;
  }
}
