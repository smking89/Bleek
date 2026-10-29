import { getAstroAccount } from "@astro/core/accounts";
import { tryGenerateASTROLink } from "@astro/core/links";
import { withDeveloperApi } from "@/lib/dev/handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return withDeveloperApi(request, "connections:read", async (context) => {
    const account = await getAstroAccount(context.owner.handle);

    return Response.json(
      {
        connections: account.connections.map((connection) => ({
          platform: connection.platform,
          handle: connection.handle,
          url: tryGenerateASTROLink(connection.platform, connection.handle),
          primary: connection.isPrimary,
          verified: connection.isVerified,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
