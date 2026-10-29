import type { Metadata } from "next";
import Link from "next/link";
import { ProfileEditor } from "@astro/core/react/editor";
import { EmailVerification } from "@/components/astro/email-verification";
import { PasswordForm } from "@/components/astro/password-form";
import { UnverifiedTag, VerifiedBadge } from "@/components/verified-badge";
import { profileForUser } from "@/lib/astro/account-profile";
import { playPlatformLabel, regionLabel } from "@/lib/astro/regions";
import { astroConfigured, astroDb } from "@astro/core/db";
import { emailVerificationState } from "@/lib/astro/email-verification";
import { currentAccount } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ASTRO — profile connections",
  description: "One ASTRO account, one wallet, and a chip for every product you use.",
};

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

  const account = await currentAccount().catch(() => null);

  if (!account) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white">Sign in to see your profile</h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-400">
          Your email, password, region and the chips for every product you use live on your own ASTRO account.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/astro?next=/astro/profile#access"
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-neutral-200"
          >
            Sign in with ASTRO
          </Link>
          <Link
            href="/astro?mode=register#access"
            className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-neutral-300 transition-colors hover:border-white/30 hover:text-white"
          >
            Create an account
          </Link>
        </div>
      </Shell>
    );
  }

  const profile = await profileForUser(account.id);
  const emailState = await emailVerificationState(account.id);
  const credential = await astroDb().user.findUnique({
    where: { id: account.id },
    select: { passwordHash: true },
  });

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
          {profile ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-neutral-300">
              <span className="rounded-full border border-white/10 bg-[#111214] px-2.5 py-1">{regionLabel(profile.region)}</span>
              <span className="rounded-full border border-white/10 bg-[#111214] px-2.5 py-1">{playPlatformLabel(profile.platform)}</span>
              <span className="text-neutral-500">{profile.email}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  emailState.verified
                    ? "border-[#06B6D4]/40 text-[#67E8F9]"
                    : "border-white/12 text-neutral-400"
                }`}
              >
                {emailState.verified ? "Email verified" : "Email unverified"}
              </span>
            </div>
          ) : null}
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

      <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">Security</h2>
      <div className="mt-3 space-y-3">
        <EmailVerification
          email={emailState.email}
          verified={emailState.verified}
          resendAt={emailState.resendAt}
        />
        <PasswordForm hasPassword={Boolean(credential?.passwordHash)} />
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
