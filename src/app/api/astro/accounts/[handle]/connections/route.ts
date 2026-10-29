import { connectPlatform } from "@/lib/astro/accounts";
import { AstroDataError } from "@/lib/astro/errors";
import { astroErrorResponse, readJson } from "@/lib/astro/http";
import type { PlatformType } from "@/lib/astro/links";

export const dynamic = "force-dynamic";

type ConnectBody = { platform: PlatformType; handle: string };

export async function POST(request: Request, context: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await context.params;
    const body = await readJson<ConnectBody>(request);

    if (!body.platform || !body.handle) {
      throw new AstroDataError("platform and handle are required.", 400, "MISSING_FIELDS");
    }

    const connection = await connectPlatform(handle, body.platform, body.handle);
    return Response.json({ connection }, { status: 201 });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
