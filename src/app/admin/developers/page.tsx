import { DeveloperTable } from "@/components/admin/developer-table";
import { Limited } from "@/components/admin/limited";
import { staffContext } from "@/lib/admin/access";
import { can } from "@/lib/admin/roles";
import { listAllApps } from "@/lib/dev/apps";

export const dynamic = "force-dynamic";

export default async function AdminDevelopersPage() {
  const staff = await staffContext();
  if (!staff) return null;

  if (!can(staff.role, "dev.read")) {
    return (
      <Limited
        title="Developer apps need an admin"
        body="Moderators can read the account directory and work the case queue. Issued keys, usage and revocations are admin-only."
      />
    );
  }

  const apps = await listAllApps();

  return <DeveloperTable apps={apps} role={staff.role} />;
}
