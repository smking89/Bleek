import { actorId } from "@/lib/actor";
import { errorResponse, giftItem } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { itemId?: string; toUserId?: string };
    if (!body.itemId || !body.toUserId) {
      return Response.json({ error: "itemId and toUserId are required" }, { status: 400 });
    }
    return Response.json(await giftItem(await actorId(), body.itemId, body.toUserId));
  } catch (error) {
    return errorResponse(error);
  }
}
