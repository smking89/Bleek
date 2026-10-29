import { deleteAstroAccount, getAstroAccount } from "@/lib/astro/accounts";
import { astroErrorResponse } from "@/lib/astro/http";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await context.params;
    return Response.json({ account: await getAstroAccount(handle) });
  } catch (error) {
    return astroErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await context.params;
    return Response.json({ deleted: await deleteAstroAccount(handle) });
  } catch (error) {
    return astroErrorResponse(error);
  }
}
