import { clientIp, requireStaff, staffErrorResponse } from "@/lib/admin/access";
import { setDeveloperAppStatus } from "@/lib/admin/service";
import { readJson } from "@astro/core/http";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireStaff("dev.revoke");
    const { id } = await params;
    const body = await readJson<{ action?: string }>(request);

    if (body.action !== "revoke" && body.action !== "restore") {
      return Response.json(
        { error: "action must be revoke or restore.", code: "INVALID_ACTION" },
        { status: 422 },
      );
    }

    const app = await setDeveloperAppStatus(
      actor,
      id,
      body.action === "revoke" ? "REVOKED" : "ACTIVE",
      clientIp(request),
    );
    return Response.json({ app });
  } catch (error) {
    return staffErrorResponse(error);
  }
}
