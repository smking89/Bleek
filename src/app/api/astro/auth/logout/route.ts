import { endSession } from "@/lib/astro/auth";
import { astroErrorResponse } from "@/lib/astro/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await endSession();
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
