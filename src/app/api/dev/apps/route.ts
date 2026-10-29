import { createApp, loadConsole } from "@/lib/dev/apps";
import { developerAccount } from "@/lib/dev/account";
import { readJson } from "@/lib/astro/http";
import { astroErrorResponse } from "@/lib/astro/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const account = await developerAccount();
    const consoleData = await loadConsole(account.id);
    return Response.json(consoleData, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return astroErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const account = await developerAccount();
    const body = await readJson<{
      name?: unknown;
      description?: unknown;
      environment?: unknown;
      scopes?: unknown;
      redirectUri?: unknown;
    }>(request);

    const created = await createApp(account.id, body);
    // The plaintext secret is returned exactly once and never stored.
    return Response.json(created, { status: 201 });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
