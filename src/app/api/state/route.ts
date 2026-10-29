import { actorId } from "@/lib/actor";
import { errorResponse, snapshot } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await snapshot(await actorId());
    return Response.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
