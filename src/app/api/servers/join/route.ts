import { actorId } from "@/lib/actor";
import { errorResponse, joinServer } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Joins a server with its eight-character invite code. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: string };
    const result = await joinServer(await actorId(), body.code ?? "");
    return Response.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
