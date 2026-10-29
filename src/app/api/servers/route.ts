import { actorId } from "@/lib/actor";
import { createServer, errorResponse } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Creates a server for the signed-in account, with a text and a voice channel. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const server = await createServer(await actorId(), { name: body.name ?? "" });
    return Response.json({ server }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
