import { authenticate } from "@astro/core/auth";
import { startSession } from "@/lib/session";
import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse, readJson } from "@astro/core/http";

export const dynamic = "force-dynamic";

type LoginBody = { handle: string; password: string };

export async function POST(request: Request) {
  try {
    const body = await readJson<LoginBody>(request);

    if (!body.handle) throw new AstroDataError("handle is required.", 400, "MISSING_HANDLE");
    if (!body.password) throw new AstroDataError("password is required.", 400, "MISSING_PASSWORD");

    const account = await authenticate(body.handle, body.password);
    await startSession(account.id);

    return Response.json({ account }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
