import type { Metadata } from "next";
import Link from "next/link";
import { DevHeader } from "@/components/dev/dev-header";
import { AppConsole, type RequestView } from "@/components/dev/app-console";
import { currentAccount } from "@/lib/session";
import { astroConfigured, astroDb } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";
import { loadConsole } from "@/lib/dev/apps";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ASTRO — developer console",
  description: "Create apps, rotate keys and watch metered API usage.",
  robots: { index: false, follow: false },
};

export default async function DeveloperConsolePage() {
  if (!astroConfigured()) {
    return (
      <Shell>
        <Gate
          title="The portal needs a database"
          body="Set DATABASE_URL to PostgreSQL and run npm run db:deploy, then create an ASTRO account to issue keys."
        />
      </Shell>
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
      <Shell>
        <Gate
          title="Sign in to issue keys"
          body="Developer apps belong to an ASTRO account, and their keys act on that account's wallet and profile chips."
          action={{ href: "/astro#access", label: "Sign in with ASTRO" }}
        />
      </Shell>
    );
  }

  if (account.status === "SUSPENDED") {
    return (
      <Shell>
        <Gate
          title="This account is suspended"
          body="Suspended accounts cannot read or rotate developer keys. Contact ASTRO support if you believe this is a mistake."
        />
      </Shell>
    );
  }

  const data = await loadConsole(account.id);
  const requests: RequestView[] = data.requests.map((entry) => ({
    id: entry.id,
    appId: entry.appId,
    method: entry.method,
    path: entry.path,
    status: entry.status,
    durationMs: entry.durationMs,
    createdAt: entry.createdAt.toISOString(),
  }));

  // Touch the account so "last seen" in the staff console reflects portal use.
  try {
    await astroDb().user.update({ where: { id: account.id }, data: { lastSeenAt: new Date() } });
  } catch (error) {
    console.error("[dev] could not touch lastSeenAt", error);
  }

  return (
    <Shell>
      <AppConsole apps={data.apps} usage={data.usage} requests={requests} handle={account.handle} />
      <p className="mt-6 text-[11px] leading-5 text-[#6E7C93]">
        Keys are shown once at creation and after rotation. Every call is metered and visible to ASTRO staff in the
        operations console.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-black text-[#F8FAFC]">
      <DevHeader />
      <div className="mx-auto w-full max-w-5xl px-5 py-8">{children}</div>
    </main>
  );
}

function Gate({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E7C93]">Developer console</p>
      <h1 className="mt-2 text-[19px] font-semibold text-[#F8FAFC]">{title}</h1>
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
          href="/developers/docs"
          className="rounded-lg border border-white/12 px-3.5 py-2 text-[12px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white"
        >
          API reference
        </Link>
      </div>
    </div>
  );
}
