import { astroDb } from "@astro/core/db";
import { astroErrorResponse } from "@astro/core/http";
import { normalizeAstroId } from "@astro/core/id";

export const dynamic = "force-dynamic";

/**
 * Validates an ASTROid for any product. The signature is checked first, so a
 * forged or edited value never reaches the database.
 */
export async function GET(_request: Request, context: { params: Promise<{ astroId: string }> }) {
  try {
    const { astroId } = await context.params;

    const normalized = normalizeAstroId(astroId);
    if (!normalized) {
      return Response.json(
        { valid: false, reason: "That ASTROid was not issued by ASTRO." },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }

    const account = await astroDb().user.findUnique({
      where: { astroId: normalized },
      select: { handle: true, displayName: true, status: true, handleVerifiedAt: true },
    });

    if (!account) {
      return Response.json(
        { valid: false, reason: "The signature is genuine, but no account holds this ASTROid." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      {
        valid: true,
        astroId: normalized,
        account: {
          handle: account.handle,
          displayName: account.displayName,
          status: account.status,
          verified: Boolean(account.handleVerifiedAt),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return astroErrorResponse(error);
  }
}
