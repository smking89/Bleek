import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/landing/auth-card";
import { currentAccount } from "@/lib/session";
import { astroConfigured } from "@astro/core/db";

export const metadata: Metadata = {
  title: "ASTRO — one account for Bleek, Koba.games, SnagChat and KOBAbot",
  description: "Sign up once. Chat in Bleek, play in Koba.games, post in SnagChat, run KOBAbot — one handle, one wallet.",
};

const PRODUCTS = [
  { name: "Bleek", role: "Chat, voice & cosmetics", badge: "BK" },
  { name: "Koba.games", role: "Play & publish games", badge: "KG" },
  { name: "SnagChat", role: "Mobile media feed", badge: "SC" },
  { name: "KOBAbot", role: "Discord bot for your servers", badge: "KB" },
] as const;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const configured = astroConfigured();
  let account: Awaited<ReturnType<typeof currentAccount>> = null;

  if (configured) {
    try {
      account = await currentAccount();
    } catch {
      account = null;
    }
  }

  const suspended = account?.status === "SUSPENDED";
  const handle = account && account.status === "ACTIVE" ? account.handle : null;

  return (
    <main className="min-h-dvh bg-black text-[#F8FAFC]">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/astro-icon.png" alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" />
            <span className="text-[13px] font-bold uppercase tracking-[0.22em] text-[#F8FAFC]">ASTRO</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/astro"
              className="hidden rounded-full px-3 py-1.5 text-[13px] font-medium text-[#94A3B8] transition-colors hover:text-[#F8FAFC] sm:block"
            >
              Profile
            </Link>
            <a
              href="#access"
              className="rounded-full border border-white/15 px-4 py-1.5 text-[13px] font-semibold text-[#F8FAFC] transition-colors hover:border-[#4F46E5] hover:bg-[#4F46E5]"
            >
              Sign in
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-20">
        <div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" aria-hidden />
            One identity · four worlds
          </p>

          <h1 className="mt-5 max-w-xl text-[40px] font-bold leading-[1.05] tracking-tight text-[#F8FAFC] sm:text-[56px]">
            One account across every world you play in.
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#94A3B8]">
            Bleek for chat and voice rooms. Koba.games for the games you build. SnagChat for the feed. KOBAbot for the
            Discord servers you run. A single ASTRO handle signs you in everywhere, carries one coin balance, and keeps
            your profile chips in sync.
          </p>

          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {PRODUCTS.map((product) => (
              <div
                key={product.name}
                className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-[10px] font-bold tracking-wide text-[#CBD5E1] ring-1 ring-inset ring-white/10">
                    {product.badge}
                  </span>
                  <span className="text-sm font-semibold text-[#F8FAFC]">{product.name}</span>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#64748B]">{product.role}</p>
              </div>
            ))}
          </div>

          <dl className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-white/[0.06] pt-6">
            {[
              { value: "1", label: "shared wallet" },
              { value: "4", label: "products" },
              { value: "0", label: "re-signups" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-bold tabular-nums text-[#F8FAFC]">{stat.value}</dt>
                <dd className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-[#64748B]">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div id="access" className="scroll-mt-24">
          <AuthCard available={configured} signedInHandle={handle} suspended={suspended} next={next} />
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-5 py-14 sm:grid-cols-3">
          {[
            {
              title: "One wallet",
              body: "Coins earned in a Koba match spend the same in the Bleek cosmetic shop. One balance, one ledger, no transfers.",
            },
            {
              title: "Chips that travel",
              body: "Link your Bleek, Koba.games, SnagChat and KOBAbot handles once. Every profile row renders from the same ASTRO record.",
            },
            {
              title: "Sessions that hold",
              body: "A signed, http-only ASTRO session keeps you signed in across products — no third-party identity provider.",
            },
          ].map((feature) => (
            <article key={feature.title} className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-5">
              <h2 className="text-sm font-semibold text-[#F8FAFC]">{feature.title}</h2>
              <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 text-xs text-[#64748B] sm:flex-row sm:items-center">
          <p>ASTRO is the account layer for Bleek, Koba.games, SnagChat and KOBAbot.</p>
          <div className="flex items-center gap-4">
            <Link href="/astro" className="transition-colors hover:text-[#F8FAFC]">
              Profile preview
            </Link>
            <Link href="/app" className="transition-colors hover:text-[#F8FAFC]">
              Open Bleek
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
