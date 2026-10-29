import { actorId } from "@/lib/actor";
import { createChannel, errorResponse } from "@/lib/store";

/** Adds a channel to a server the account owns. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { name?: string; type?: "text" | "voice" };
    const result = await createChannel(await actorId(), id, {
      name: body.name ?? "",
      type: body.type === "voice" ? "voice" : "text",
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
