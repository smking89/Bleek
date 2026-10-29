import { disconnectPlatform } from "@/lib/astro/accounts";
import { astroErrorResponse } from "@/lib/astro/http";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ handle: string; connectionId: string }> },
) {
  try {
    const { handle, connectionId } = await context.params;
    return Response.json({ removed: (await disconnectPlatform(handle, connectionId)).removed });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
