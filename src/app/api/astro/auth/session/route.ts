import { currentAccount } from "@/lib/astro/auth";
import { astroErrorResponse } from "@/lib/astro/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ account: await currentAccount() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
