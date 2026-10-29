import { deleteMessage, editMessage, errorResponse } from "@/lib/store";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { content?: string };
    const message = editMessage(id, body.content ?? "");
    return Response.json({ message });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    deleteMessage(id);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
