import { actorId } from "@/lib/actor";
import { errorResponse, purchase } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { itemId?: string };
    if (!body.itemId) return Response.json({ error: "itemId is required" }, { status: 400 });
    return Response.json(await purchase(await actorId(), body.itemId));
  } catch (error) {
    return errorResponse(error);
  }
}
