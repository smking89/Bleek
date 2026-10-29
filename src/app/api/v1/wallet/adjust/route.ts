import { adjustWallet } from "@astro/core/accounts";
import { readJson } from "@astro/core/http";
import { withDeveloperApi } from "@/lib/dev/handler";

export const dynamic = "force-dynamic";

/** Moves coins in the key owner's wallet. Other accounts are never reachable. */
export async function POST(request: Request) {
  return withDeveloperApi(request, "wallet:write", async (context) => {
    const body = await readJson<{ delta?: unknown }>(request);
    const delta = Number(body.delta);

    const wallet = await adjustWallet(context.owner.handle, delta);

    return Response.json(
      { delta, wallet },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
