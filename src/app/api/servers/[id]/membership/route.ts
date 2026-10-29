import { actorId } from "@/lib/actor";
import { errorResponse, leaveServer } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Leaves a server the account joined. Owners use DELETE /api/servers/:id instead. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return Response.json(await leaveServer(await actorId(), id));
  } catch (error) {
    return errorResponse(error);
  }
}
