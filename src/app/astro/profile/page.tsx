import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { ProfileEditor } from "@astro/core/react/editor";
import { UnverifiedTag, VerifiedBadge } from "@/components/verified-badge";
import { createAstroAccount, getAstroAccount, type AstroAccount } from "@astro/core/accounts";
import { astroConfigured } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ASTRO — profile connections",
  description: "One ASTRO account, one wallet, and a chip for every product you use.",
};

const DEMO_HANDLE = "koba";

/** Seeds the demo account on an empty database so the page is never a dead end. */
async function createDemoAccount() {
  "use server";

  try {
    await createAstroAccount({
      handle: DEMO_HANDLE,
      displayName: "Koba",
      headline: "building small games",
      startingCoins: 250,
    });
  } catch (error) {
    if (!(error instanceof AstroDataError && error.code === "DUPLICATE")) throw error;
  }

  revalidatePath("/astro/profile");
}

export default async function AstroProfilePage() {
  if (!astroConfigured()) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">ASTRO is not connected yet</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-400">
          Set <code className="text-neutral-200">DATABASE_URL</code> to a PostgreSQL connection string, then run{" "}
          <code className="text-neutral-200">npm run db:deploy</code> to apply the migrations. This page reads the account
          straight from the database.
        </p>
      </Shell>
    );
  }

  let account: AstroAccount;
  try {
    account = await getAstroAccount(DEMO_HANDLE);
  } catch (error) {
    if (error instanceof AstroDataError && error.code === "ACCOUNT_NOT_FOUND") {
      return (
        <Shell>
          <h1 className="text-2xl font-bold text-white">No account on this database yet</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-400">
            Create <span className="text-neutral-200">@{DEMO_HANDLE}</span> with a 250-coin wallet, then connect a handle
            from Bleek, Koba.games, SnagChat or KOBAbot.
          </p>
          <form action={createDemoAccount} className="mt-6">
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Create @{DEMO_HANDLE}
            </button>
          </form>
        </Shell>
      );
    }
    throw error;
  }

  return (
    <Shell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{account.displayName}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-neutral-400">
            <span>
              @{account.handle}
              {account.headline ? ` · ${account.headline}` : ""}
            </span>
            {account.handleVerifiedAt ? <VerifiedBadge size={14} /> : <UnverifiedTag />}
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-neutral-600">
            {account.astroId ?? "ASTROid pending"}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-[#111214] px-3 py-1.5 text-[12px] font-semibold tabular-nums text-neutral-300">
          {(account.wallet?.coins ?? 0).toLocaleString()} coins
        </span>
      </div>

      <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">Profiles</h2>
      <div className="mt-3">
        <ProfileEditor
          accountHandle={account.handle}
          connections={account.connections.map((connection) => ({
            id: connection.id,
            platform: connection.platform,
            handle: connection.handle,
            verified: connection.isVerified,
          }))}
        />
      </div>

      <p className="mt-10 text-xs leading-5 text-neutral-600">
        Every chip is a row in PostgreSQL. Connecting and removing a handle writes through{" "}
        <code className="text-neutral-400">/api/astro/accounts/[handle]/connections</code>.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-black px-5 py-10 text-neutral-200 sm:py-14">
      <div className="mx-auto w-full max-w-xl">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/astro-icon.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">ASTRO</p>
            <p className="text-sm text-neutral-400">One account across Bleek, Koba.games, SnagChat and KOBAbot</p>
          </div>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
