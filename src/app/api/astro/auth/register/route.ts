import { registerAccount } from "@astro/core/auth";
import { astroDb } from "@astro/core/db";
import { startSession } from "@/lib/session";
import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse, readJson } from "@astro/core/http";
import { accountForEmail, createProfile, normalizeEmail, requirePlatform, requireRegion } from "@/lib/astro/account-profile";
import { issueEmailVerification, verificationUrl } from "@/lib/astro/email-verification";
import { sendVerificationEmail } from "@/lib/astro/mailer";

export const dynamic = "force-dynamic";

/** Best effort: a mail problem must never fail a completed registration. */
async function sendVerification(userId: string, origin: string) {
  try {
    const { token, email } = await issueEmailVerification(userId);
    const url = verificationUrl(origin, token);
    const delivery = await sendVerificationEmail({ to: email, url });

    return {
      email,
      sent: delivery.delivered,
      // Development only, like the resend route: a deployed sender never returns the token.
      url: delivery.delivered || process.env.NODE_ENV === "production" ? null : url,
    };
  } catch {
    return null;
  }
}

type RegisterBody = {
  handle: string;
  displayName: string;
  password: string;
  email: string;
  region: string;
  platform: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<RegisterBody>(request);

    if (!body.handle) throw new AstroDataError("handle is required.", 400, "MISSING_HANDLE");
    if (!body.password) throw new AstroDataError("password is required.", 400, "MISSING_PASSWORD");

    const email = normalizeEmail(body.email);
    const region = requireRegion(body.region);
    const platform = requirePlatform(body.platform);

    // Checked before the account exists so a taken address cannot leave a half-created user.
    if (await accountForEmail(email)) {
      throw new AstroDataError("That email address already has an ASTRO account.", 409, "EMAIL_TAKEN");
    }

    const account = await registerAccount({
      handle: body.handle,
      displayName: body.displayName,
      password: body.password,
    });

    try {
      await createProfile({ userId: account.id, email, region, platform });
    } catch (error) {
      // The account and wallet cascade away, so a failed profile write leaves nothing behind.
      await astroDb().user.delete({ where: { id: account.id } }).catch(() => undefined);
      throw error;
    }

    const verification = await sendVerification(account.id, new URL(request.url).origin);

    await startSession(account.id);
    return Response.json(
      { account, profile: { email, region, platform }, verification },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return astroErrorResponse(error);
  }
}
