import { registerAccount } from "@astro/core/auth";
import { startSession } from "@/lib/session";
import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse, readJson } from "@astro/core/http";

export const dynamic = "force-dynamic";

type RegisterBody = { handle: string; displayName: string; password: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<RegisterBody>(request);

    if (!body.handle) throw new AstroDataError("handle is required.", 400, "MISSING_HANDLE");
    if (!body.password) throw new AstroDataError("password is required.", 400, "MISSING_PASSWORD");

    const account = await registerAccount({
      handle: body.handle,
      displayName: body.displayName,
      password: body.password,
    });

    await startSession(account.id);
    return Response.json({ account }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
