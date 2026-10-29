import { actorId } from "@/lib/actor";
import { errorResponse, mintCosmetic } from "@/lib/store";
import type { ShopItem } from "@/lib/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      slot?: ShopItem["slot"];
      price?: number;
    };
    if (!body.name || !body.slot) {
      return Response.json({ error: "name and slot are required" }, { status: 400 });
    }
    return Response.json(
      await mintCosmetic(await actorId(), id, {
        name: body.name,
        description: body.description,
        slot: body.slot,
        price: Number(body.price ?? 0),
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
