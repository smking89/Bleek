import { clientIp, requireStaff, staffErrorResponse } from "@/lib/admin/access";
import { updateCase } from "@/lib/admin/service";
import { readJson } from "@astro/core/http";

export const dynamic = "force-dynamic";

type Body = {
  action?: string;
  handle?: unknown;
  priority?: unknown;
  status?: unknown;
  resolution?: unknown;
  body?: unknown;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await readJson<Body>(request);
    const ip = clientIp(request);

    switch (body.action) {
      case "claim": {
        const actor = await requireStaff("cases.write");
        return Response.json({ case: await updateCase(actor, id, { action: "claim" }, ip) });
      }

      case "assign": {
        const actor = await requireStaff("cases.assign");
        return Response.json({ case: await updateCase(actor, id, { action: "assign", handle: body.handle }, ip) });
      }

      case "priority": {
        const actor = await requireStaff("cases.write");
        return Response.json({ case: await updateCase(actor, id, { action: "priority", priority: body.priority }, ip) });
      }

      case "status": {
        const actor = await requireStaff("cases.write");
        return Response.json({
          case: await updateCase(actor, id, { action: "status", status: body.status, resolution: body.resolution }, ip),
        });
      }

      case "note": {
        const actor = await requireStaff("cases.write");
        return Response.json({ case: await updateCase(actor, id, { action: "note", body: body.body }, ip) });
      }

      default:
        return Response.json(
          { error: "action must be claim, assign, priority, status or note.", code: "INVALID_ACTION" },
          { status: 422 },
        );
    }
  } catch (error) {
    return staffErrorResponse(error);
  }
}
