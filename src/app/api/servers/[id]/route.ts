import { actorId } from "@/lib/actor";
import { deleteServer, errorResponse, renameServer, rotateInvite } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Renames a server or retires its invite code. Owner only. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const actor = await actorId();
    const body = (await request.json()) as { name?: string; rotateInvite?: boolean };

    if (body.rotateInvite) return Response.json(await rotateInvite(actor, id));
    if (typeof body.name === "string") return Response.json(await renameServer(actor, id, body.name));
    return Response.json({ error: "Provide name or rotateInvite" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Deletes a server and everything under it. Owner only. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await deleteServer(await actorId(), id));
  } catch (error) {
    return errorResponse(error);
  }
}
