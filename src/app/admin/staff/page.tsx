import { Limited } from "@/components/admin/limited";
import { StaffTable } from "@/components/admin/staff-table";
import { staffContext } from "@/lib/admin/access";
import { can } from "@/lib/admin/roles";
import { listStaff } from "@/lib/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const staff = await staffContext();
  if (!staff) return null;

  if (!can(staff.role, "staff.manage")) {
    return (
      <Limited
        title="Staff management is super-admin only"
        body="Admins can recruit moderators from the member drawer. Only a super admin can promote admins, demote staff, or remove a role here."
      />
    );
  }

  const roster = await listStaff();

  return <StaffTable staff={roster} role={staff.role} meHandle={staff.handle} />;
}
