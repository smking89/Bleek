import { AuditLog } from "@/components/admin/audit-log";
import { Limited } from "@/components/admin/limited";
import { staffContext } from "@/lib/admin/access";
import { can } from "@/lib/admin/roles";
import { listAudit } from "@/lib/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const staff = await staffContext();
  if (!staff) return null;

  if (!can(staff.role, "audit.read")) {
    return (
      <Limited
        title="The audit log is staff-only"
        body="Every privileged action is recorded with its actor, target and IP. Reading it requires a staff role."
      />
    );
  }

  const entries = await listAudit(300);

  return <AuditLog entries={entries} />;
}
