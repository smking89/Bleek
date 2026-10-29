import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { staffContext } from "@/lib/admin/access";
import { currentAccount } from "@/lib/session";
import { astroConfigured } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ASTRO — operations console",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!astroConfigured()) {
    return (
      <Gate
        title="The console needs a database"
        body="Set DATABASE_URL to PostgreSQL and run npm run db:deploy. Staff roles, cases and audit rows all live in Postgres."
      />
    );
  }

  let account: Awaited<ReturnType<typeof currentAccount>> = null;
  try {
    account = await currentAccount();
  } catch (error) {
    if (!(error instanceof AstroDataError)) throw error;
  }

  if (!account) {
    return (
      <Gate
        title="Sign in as staff"
        body="The operations console is restricted to ASTRO accounts with a staff role."
        action={{ href: "/#access", label: "Sign in with ASTRO" }}
      />
    );
  }

  if (account.status === "SUSPENDED") {
    return (
      <Gate
        title="This account is suspended"
        body={account.suspendedReason ?? "A staff member suspended this account. It cannot use the console."}
      />
    );
  }

  if (!account.staffRole) {
    return (
      <Gate
        title="No staff role on @{handle}"
        body="This ASTRO account is a normal member. Ask a super admin to grant a role, or bootstrap the first one from a terminal with npm run staff:grant."
        action={{ href: "/app", label: "Open Bleek" }}
        handle={account.handle}
      />
    );
  }

  const staff = await staffContext();
  if (!staff) {
    return <Gate title="Staff access unavailable" body="The console could not resolve your role. Try signing in again." />;
  }

  return (
    <AdminShell handle={staff.handle} displayName={staff.displayName} role={staff.role}>
      {children}
    </AdminShell>
  );
}

function Gate({
  title,
  body,
  action,
  handle,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
  handle?: string;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-black px-5 py-10 text-[#F8FAFC]">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/astro-icon.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#F8FAFC]">ASTRO</span>
          <span className="text-[10.5px] uppercase tracking-[0.16em] text-[#6E7C93]">Operations</span>
        </div>

        <h1 className="mt-4 text-[19px] font-semibold text-[#F8FAFC]">
          {handle ? title.replace("{handle}", handle) : title}
        </h1>
        <p className="mt-2 text-[12.5px] leading-6 text-[#94A3B8]">{body}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {action ? (
            <Link
              href={action.href}
              className="rounded-lg bg-[#4F46E5] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4338CA]"
            >
              {action.label}
            </Link>
          ) : null}
          <Link
            href="/developers"
            className="rounded-lg border border-white/12 px-3.5 py-2 text-[12px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white"
          >
            Developer portal
          </Link>
        </div>

        <code className="mt-5 block rounded-lg border border-white/[0.07] bg-[#111318] px-3 py-2 font-mono text-[10.5px] text-[#94A3B8]">
          npm run staff:grant -- &lt;handle&gt; SUPER_ADMIN
        </code>
      </div>
    </main>
  );
}
