import { UserTable } from "@/components/admin/user-table";
import { staffContext } from "@/lib/admin/access";
import { listDirectory } from "@/lib/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const staff = await staffContext();
  if (!staff) return null;

  const { q } = await searchParams;
  const users = await listDirectory();

  return <UserTable users={users} role={staff.role} meHandle={staff.handle} initialQuery={q ?? ""} />;
}
