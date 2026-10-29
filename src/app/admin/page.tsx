import { OverviewDashboard } from "@/components/admin/overview-dashboard";
import { loadOverview } from "@/lib/admin/metrics";
import { listAudit, listCases, listStaff } from "@/lib/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [metrics, cases, staff, audit] = await Promise.all([
    loadOverview(30),
    listCases(60),
    listStaff(),
    listAudit(10),
  ]);

  const queue = cases
    .filter((entry) => entry.status === "OPEN" || entry.status === "INVESTIGATING")
    .slice(0, 6);

  return <OverviewDashboard metrics={metrics} queue={queue} staff={staff} audit={audit} />;
}
