import { CaseBoard } from "@/components/admin/case-board";
import { staffContext } from "@/lib/admin/access";
import { listCases } from "@/lib/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ case?: string; subject?: string }>;
}) {
  const staff = await staffContext();
  if (!staff) return null;

  const [params, cases] = await Promise.all([searchParams, listCases()]);

  return (
    <CaseBoard
      cases={cases}
      role={staff.role}
      meHandle={staff.handle}
      initialCaseId={params.case}
      initialSubject={params.subject ?? ""}
    />
  );
}
