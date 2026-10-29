import { currentAccount } from "@/lib/session";
import { astroErrorResponse } from "@astro/core/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ account: await currentAccount() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
