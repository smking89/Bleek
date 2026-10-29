import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse } from "@astro/core/http";
import { currentAccount } from "@/lib/session";
import { emailVerificationState, issueEmailVerification, verificationUrl } from "@/lib/astro/email-verification";
import { sendVerificationEmail } from "@/lib/astro/mailer";

export const dynamic = "force-dynamic";

/**
 * Sends (or resends) a verification link to the signed-in account's address.
 * Without a mail provider the response carries the link in development so the
 * flow can be completed, and never carries it in production.
 */
export async function POST(request: Request) {
  try {
    const account = await currentAccount();
    if (!account) throw new AstroDataError("Sign in to verify your email.", 401, "NOT_SIGNED_IN");

    const state = await emailVerificationState(account.id);
    if (!state.email) {
      throw new AstroDataError(
        "This account has no email address on file. Accounts created through Steam or Xbox sign in without one.",
        409,
        "EMAIL_MISSING",
      );
    }
    if (state.verified) {
      return Response.json(
        { verified: true, email: state.email },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (state.resendAt && state.resendAt > Date.now()) {
      const wait = Math.ceil((state.resendAt - Date.now()) / 1000);
      throw new AstroDataError(`Wait ${wait}s before requesting another email.`, 429, "RESEND_COOLDOWN");
    }

    const { token, email } = await issueEmailVerification(account.id);
    const url = verificationUrl(new URL(request.url).origin, token);
    const delivery = await sendVerificationEmail({ to: email, url, handle: account.handle });

    return Response.json(
      {
        sent: true,
        email,
        delivered: delivery.delivered,
        detail: delivery.detail ?? null,
        // Development only: a deployment with no provider must still be testable.
        url: delivery.delivered || process.env.NODE_ENV === "production" ? null : url,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return astroErrorResponse(error);
  }
}
