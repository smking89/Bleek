import { actorId } from "@/lib/actor";
import { errorResponse, previewGuard, updateGuard } from "@/lib/store";
import type { GuardConfig, GuardSensitivity } from "@/lib/types";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      enabled?: boolean;
      sensitivity?: GuardSensitivity;
      rules?: GuardConfig["rules"];
    };
    return Response.json(await updateGuard(await actorId(), id, body));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { content?: string };
    if (typeof body.content !== "string" || !body.content.trim()) {
      return Response.json({ error: "content is required" }, { status: 400 });
    }
    return Response.json(await previewGuard(await actorId(), id, body.content.slice(0, 4000)));
  } catch (error) {
    return errorResponse(error);
  }
}
