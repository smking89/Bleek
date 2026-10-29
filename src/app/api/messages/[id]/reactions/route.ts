import { errorResponse, toggleReaction } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { emoji?: string };
    const message = toggleReaction(id, body.emoji ?? "");
    return Response.json({ message });
  } catch (error) {
    return errorResponse(error);
  }
}
