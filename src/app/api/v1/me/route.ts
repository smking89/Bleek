import { getAstroAccount } from "@/lib/astro/accounts";
import { withDeveloperApi } from "@/lib/dev/handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withDeveloperApi(request, "profile:read", async (context) => {
    const account = await getAstroAccount(context.owner.handle);

    return Response.json(
      {
        account: {
          handle: account.handle,
          displayName: account.displayName,
          headline: account.headline,
          accentColor: account.accentColor,
          verified: Boolean(account.handleVerifiedAt),
          createdAt: account.createdAt,
        },
        app: {
          clientId: context.app.clientId,
          name: context.app.name,
          environment: context.app.environment,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
