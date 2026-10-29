import { actorId } from "@/lib/actor";
import { addMessage, errorResponse } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { channelId?: string; content?: string; replyTo?: string | null };
    if (!body.channelId) return Response.json({ error: "channelId is required" }, { status: 400 });
    const message = await addMessage(await actorId(), {
      channelId: body.channelId,
      content: body.content ?? "",
      replyTo: body.replyTo ?? null,
    });
    return Response.json({ message });
  } catch (error) {
    return errorResponse(error);
  }
}
