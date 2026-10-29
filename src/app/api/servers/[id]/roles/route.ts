import { actorId } from "@/lib/actor";
import { createRole, deleteRole, errorResponse, reorderRoles, updateRole } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const actor = await actorId();
    const body = (await request.json()) as {
      create?: { name?: string; color?: string; permissions?: unknown };
      update?: { id?: string; name?: string; color?: string; permissions?: unknown; order?: number };
      delete?: string;
      order?: string[];
    };
    if (body.create) return Response.json(await createRole(actor, id, body.create));
    if (body.update) {
      if (!body.update.id) return Response.json({ error: "update.id is required" }, { status: 400 });
      return Response.json(await updateRole(actor, id, body.update.id, body.update));
    }
    if (typeof body.delete === "string") return Response.json(await deleteRole(actor, id, body.delete));
    if (Array.isArray(body.order)) return Response.json(await reorderRoles(actor, id, body.order));
    return Response.json({ error: "Provide create, update, delete or order" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
