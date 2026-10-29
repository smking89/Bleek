import { createAstroAccount } from "@astro/core/accounts";
import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse, readJson } from "@astro/core/http";

export const dynamic = "force-dynamic";

type CreateBody = {
  handle: string;
  displayName: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  accentColor: string;
  startingCoins: number;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<CreateBody>(request);
    if (!body.handle) throw new AstroDataError("handle is required.", 400, "MISSING_HANDLE");

    const account = await createAstroAccount({
      handle: body.handle,
      displayName: body.displayName,
      headline: body.headline,
      bio: body.bio,
      avatarUrl: body.avatarUrl,
      accentColor: body.accentColor,
      startingCoins: body.startingCoins,
    });

    return Response.json({ account }, { status: 201 });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
