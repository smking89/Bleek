import { adjustWallet } from "@astro/core/accounts";
import { AstroDataError } from "@astro/core/errors";
import { astroErrorResponse, readJson } from "@astro/core/http";

export const dynamic = "force-dynamic";

type WalletBody = { delta: number };

export async function POST(request: Request, context: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await context.params;
    const body = await readJson<WalletBody>(request);

    if (typeof body.delta !== "number") {
      throw new AstroDataError("delta is required and must be a number.", 400, "MISSING_DELTA");
    }

    return Response.json({ wallet: await adjustWallet(handle, body.delta) });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
