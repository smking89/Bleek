import { clientIp, requireStaff, staffErrorResponse } from "@/lib/admin/access";
import { isStaffRole } from "@/lib/admin/roles";
import { moveCoins, setHandleVerification, setStaffRole, setSuspension } from "@/lib/admin/service";
import { readJson } from "@/lib/astro/http";

export const dynamic = "force-dynamic";

type Body = {
  action?: string;
  role?: unknown;
  reason?: unknown;
  delta?: unknown;
  note?: unknown;
};

/** One endpoint for every account action, discriminated by `action`. */
export async function PATCH(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params;
    const body = await readJson<Body>(request);
    const ip = clientIp(request);

    switch (body.action) {
      case "role": {
        const actor = await requireStaff("users.role");
        if (body.role !== null && !isStaffRole(body.role)) {
          return Response.json(
            { error: "role must be MODERATOR, ADMIN, SUPER_ADMIN or null.", code: "INVALID_ROLE" },
            { status: 422 },
          );
        }
        const result = await setStaffRole(actor, handle, body.role, ip);
        return Response.json({ user: result });
      }

      case "suspend": {
        const actor = await requireStaff("users.suspend");
        const result = await setSuspension(actor, handle, { suspend: true, reason: body.reason }, ip);
        return Response.json({ user: result });
      }

      case "restore": {
        const actor = await requireStaff("users.suspend");
        const result = await setSuspension(actor, handle, { suspend: false }, ip);
        return Response.json({ user: result });
      }

      case "wallet": {
        const actor = await requireStaff("users.wallet");
        const result = await moveCoins(actor, handle, { delta: body.delta, note: body.note }, ip);
        return Response.json(result);
      }

      case "verify":
      case "unverify": {
        const actor = await requireStaff("users.verify");
        const result = await setHandleVerification(actor, handle, body.action === "verify", ip);
        return Response.json({ user: result });
      }

      default:
        return Response.json(
          { error: "action must be role, suspend, restore or wallet.", code: "INVALID_ACTION" },
          { status: 422 },
        );
    }
  } catch (error) {
    return staffErrorResponse(error);
  }
}
