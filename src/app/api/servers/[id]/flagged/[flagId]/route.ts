import { errorResponse, resolveFlag } from "@/lib/store";

export async function POST(request: Request, context: { params: Promise<{ id: string; flagId: string }> }) {
  try {
    const { id, flagId } = await context.params;
    const body = (await request.json()) as { action?: "approve" | "delete" };
    if (body.action !== "approve" && body.action !== "delete") {
      return Response.json({ error: "action must be approve or delete" }, { status: 400 });
    }
    return Response.json(resolveFlag(id, flagId, body.action));
  } catch (error) {
    return errorResponse(error);
  }
}
