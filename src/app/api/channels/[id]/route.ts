import { errorResponse, setChannelDoc, setChannelLayout } from "@/lib/store";
import type { ChannelLayout } from "@/lib/types";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { layout?: ChannelLayout; doc?: string };
    if (typeof body.doc === "string") return Response.json(setChannelDoc(id, body.doc));
    if (body.layout) return Response.json(setChannelLayout(id, body.layout));
    return Response.json({ error: "layout or doc is required" }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
