import { actorId } from "@/lib/actor";
import {
  deleteChannel,
  errorResponse,
  renameChannel,
  setChannelDoc,
  setChannelLayout,
  setChannelTopic,
} from "@/lib/store";
import type { ChannelLayout } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Updates a channel: layout, shared document, name or topic. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const actor = await actorId();
    const body = (await request.json()) as { layout?: ChannelLayout; doc?: string; name?: string; topic?: string };
    if (typeof body.doc === "string") return Response.json(await setChannelDoc(actor, id, body.doc));
    if (body.layout) return Response.json(await setChannelLayout(actor, id, body.layout));
    if (typeof body.name === "string") return Response.json(await renameChannel(actor, id, body.name));
    if (typeof body.topic === "string") return Response.json(await setChannelTopic(actor, id, body.topic));
    return Response.json({ error: "layout, doc, name or topic is required" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Removes a channel and its messages. Owner only. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await deleteChannel(await actorId(), id));
  } catch (error) {
    return errorResponse(error);
  }
}
