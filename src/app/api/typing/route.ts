import { actorId } from "@/lib/actor";
import { errorResponse, setTyping } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { channelId?: string };
    if (!body.channelId) return Response.json({ error: "channelId is required" }, { status: 400 });
    setTyping(await actorId(), body.channelId);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
