import { hashPassword, verifyPassword } from "@astro/core/auth";
import { astroDb } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse, readJson } from "@astro/core/http";
import { currentAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

type ChangeBody = { currentPassword?: string; newPassword?: string };

/**
 * Changes the password only after the current one proves the request. The
 * session cookie survives, so the member is not signed out of other products.
 */
export async function POST(request: Request) {
  try {
    const account = await currentAccount();
    if (!account) throw new AstroDataError("Sign in to change your password.", 401, "NOT_SIGNED_IN");

    const body = await readJson<ChangeBody>(request);
    const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const next = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!current) throw new AstroDataError("Enter your current password.", 400, "MISSING_CURRENT_PASSWORD");
    if (next.length < 8 || next.length > 200) {
      throw new AstroDataError("New passwords need 8 to 200 characters.", 422, "INVALID_PASSWORD");
    }
    if (next === current) {
      throw new AstroDataError("Choose a password you have not used on this account.", 422, "PASSWORD_UNCHANGED");
    }

    const record = await astroDb().user.findUnique({
      where: { id: account.id },
      select: { passwordHash: true },
    });

    if (!record?.passwordHash) {
      throw new AstroDataError(
        "This account signs in through Steam or Xbox and has no password to change.",
        409,
        "NO_PASSWORD",
      );
    }

    if (!(await verifyPassword(current, record.passwordHash))) {
      throw new AstroDataError("Your current password is not correct.", 401, "WRONG_PASSWORD");
    }

    await astroDb().user.update({
      where: { id: account.id },
      data: { passwordHash: await hashPassword(next) },
    });

    return Response.json({ changed: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
