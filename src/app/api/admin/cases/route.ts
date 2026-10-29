import { clientIp, requireStaff, staffErrorResponse } from "@/lib/admin/access";
import { listCases, openCase } from "@/lib/admin/service";
import { readJson } from "@astro/core/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStaff("cases.read");
    return Response.json({ cases: await listCases() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return staffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireStaff("cases.write");
    const body = await readJson<{
      subjectHandle?: unknown;
      reason?: unknown;
      detail?: unknown;
      channel?: unknown;
      priority?: unknown;
    }>(request);

    const created = await openCase(actor, body, clientIp(request));
    return Response.json({ case: created }, { status: 201 });
  } catch (error) {
    return staffErrorResponse(error);
  }
}
