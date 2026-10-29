import { authenticate } from "@astro/core/auth";
import { startSession } from "@/lib/session";
import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse, readJson } from "@astro/core/http";
import { accountForEmail, normalizeEmail } from "@/lib/astro/account-profile";

export const dynamic = "force-dynamic";

type LoginBody = { handle?: string; identifier?: string; email?: string; password: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<LoginBody>(request);
    const identifier = (body.identifier ?? body.email ?? body.handle ?? "").trim();

    if (!identifier) throw new AstroDataError("An email or handle is required.", 400, "MISSING_HANDLE");
    if (!body.password) throw new AstroDataError("password is required.", 400, "MISSING_PASSWORD");

    let handle = identifier;
    if (identifier.includes("@")) {
      // An unknown address fails exactly like a wrong password, so the form cannot enumerate accounts.
      const owner = await accountForEmail(normalizeEmail(identifier));
      if (!owner) throw new AstroDataError("That email and password do not match.", 401, "INVALID_CREDENTIALS");
      handle = owner.user.handle;
    }

    const account = await authenticate(handle, body.password);
    await startSession(account.id);

    return Response.json({ account }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
