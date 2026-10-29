import { getAstroAccount } from "@/lib/astro/accounts";
import { withDeveloperApi } from "@/lib/dev/handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withDeveloperApi(request, "wallet:read", async (context) => {
    const account = await getAstroAccount(context.owner.handle);

    return Response.json(
      {
        wallet: account.wallet ?? { coins: 0, lifetimeEarned: 0, lifetimeSpent: 0, version: 0 },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
