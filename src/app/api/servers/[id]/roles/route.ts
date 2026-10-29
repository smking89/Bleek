import { createRole, deleteRole, errorResponse, reorderRoles, updateRole } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      create?: { name?: string; color?: string; permissions?: unknown };
      update?: { id?: string; name?: string; color?: string; permissions?: unknown; order?: number };
      delete?: string;
      order?: string[];
    };
    if (body.create) return Response.json(createRole(id, body.create));
    if (body.update) {
      if (!body.update.id) return Response.json({ error: "update.id is required" }, { status: 400 });
      return Response.json(updateRole(id, body.update.id, body.update));
    }
    if (typeof body.delete === "string") return Response.json(deleteRole(id, body.delete));
    if (Array.isArray(body.order)) return Response.json(reorderRoles(id, body.order));
    return Response.json({ error: "Provide create, update, delete or order" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
