import { errorResponse, mintCosmetic } from "@/lib/store";
import type { ShopItem } from "@/lib/types";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      slot?: ShopItem["slot"];
      key?: string;
      price?: number;
    };
    if (!body.name || !body.slot || !body.key) {
      return Response.json({ error: "name, slot and key are required" }, { status: 400 });
    }
    return Response.json(
      mintCosmetic(id, {
        name: body.name,
        description: body.description,
        slot: body.slot,
        key: body.key,
        price: Number(body.price ?? 0),
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
