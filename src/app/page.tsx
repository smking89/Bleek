import type { Metadata } from "next";
import Link from "next/link";
import { currentAccount } from "@/lib/session";
import { astroConfigured } from "@astro/core/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bleek — chat that feels like a place",
  description:
    "Realtime channels, switchable chat, gallery and canvas layouts, creator storefronts, a local guard and an animated cosmetic shop. Sign in with your ASTRO account.",
};

const PILLARS = [
  {
    title: "One timeline, not a server list",
    body: "The home feed merges every channel with history, ranks them by the last 24 hours of activity, and filters by text threads, audio rooms or trending words.",
    tag: "Home feed",
  },
  {
    title: "Chat, gallery or canvas per channel",
    body: "A linear stream when you want conversation, a masonry board for art drops, or a Notion-style document with markdown and a saved preview — switch it in the header.",
    tag: "Hybrid layouts",
  },
  {
    title: "Storefronts the creators own",
    body: "Mint a decoration, effect, nameplate or theme into your server's shop. Every sale records a 90/10 payout you can see, and gifting still pays the creator.",
    tag: "Creator economy",
  },
  {
    title: "Moderation that stays local",
    body: "Describe what to catch in plain language — scam terms, shouting, link floods. Every message is scanned in-process and hits land in a review queue.",
    tag: "Guard",
  },
] as const;

const LAYOUTS = [
  {
    name: "Chat",
    body: "Replies, reactions, edits, per-channel drafts and typing indicators.",
  },
  {
    name: "Gallery",
    body: "Messages become gradient cards in a board built for drops and links.",
  },
  {
    name: "Canvas",
    body: "A shared document with headings, lists and quotes, saved to the channel.",
  },
] as const;

export default async function BleekLandingPage() {
  let handle: string | null = null;

  if (astroConfigured()) {
    try {
      const account = await currentAccount();
      handle = account && account.status === "ACTIVE" ? account.handle : null;
    } catch {
      handle = null;
    }
  }

  return (
    <main className="min-h-dvh bg-black text-[#F8FAFC]">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bleek-icon.png" alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" />
            <span className="text-[13px] font-bold uppercase tracking-[0.22em]">Bleek</span>
          </Link>

          <nav aria-label="Bleek" className="hidden items-center gap-1 text-[13px] text-[#94A3B8] sm:flex">
            <a href="#inside" className="rounded-full px-3 py-1.5 transition-colors hover:text-[#F8FAFC]">
              What&apos;s inside
            </a>
            <a href="#cosmetics" className="rounded-full px-3 py-1.5 transition-colors hover:text-[#F8FAFC]">
              Cosmetics
            </a>
            <a href="#operations" className="rounded-full px-3 py-1.5 transition-colors hover:text-[#F8FAFC]">
              Operations
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={handle ? "/app" : "/astro?mode=login&next=/app#access"}
              className="hidden rounded-full px-3 py-1.5 text-[13px] font-medium text-[#94A3B8] transition-colors hover:text-[#F8FAFC] sm:block"
            >
              {handle ? `@${handle}` : "Log in"}
            </Link>
            <Link
              href={handle ? "/app" : "/astro?next=/app#access"}
              className="rounded-full bg-[#4F46E5] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#4338CA]"
            >
              Open Bleek
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-20">
        <div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" aria-hidden />
            Realtime chat · voice rooms · cosmetics
          </p>

          <h1 className="mt-5 max-w-xl text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">
            Chat that feels like a place, not a text box.
          </h1>

          <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#94A3B8]">
            Bleek is a social client with realtime channels, audio rooms, per-server storefronts and a cosmetic shop that
            animates across every avatar in the app. Sign in with your ASTRO handle — the same identity you carry into
            Koba.games, SnagChat and KOBAbot.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={handle ? "/app" : "/astro?next=/app#access"}
              className="rounded-full bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA]"
            >
              Open Bleek
            </Link>
            <Link
              href="/astro?mode=login&next=/app#access"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-[#F8FAFC] transition-colors hover:border-white/35"
            >
              Log in with ASTRO
            </Link>
          </div>

          <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/[0.06] pt-6">
            {[
              { value: "3", label: "channel layouts" },
              { value: "90/10", label: "creator split" },
              { value: "4", label: "cosmetic slots" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-2xl font-bold tabular-nums">{stat.value}</dt>
                <dd className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-[#64748B]">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-4">
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            <span className="text-lg text-[#64748B]" aria-hidden>
              #
            </span>
            <span className="text-sm font-semibold">welcome</span>
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[#64748B]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" aria-hidden />
              8 online
            </span>
          </div>

          <ul className="mt-4 space-y-4 text-[14px] leading-6">
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] text-[11px] font-bold">
                LU
              </span>
              <p className="text-[#CBD5E1]">
                <span className="font-semibold text-[#F8FAFC]">Luna</span> For the cosmetics, type <code className="rounded bg-white/[0.07] px-1 text-[12.5px] text-[#A5B4FC]">/shop</code> in #general.
              </p>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#06B6D4] to-[#23A55A] text-[11px] font-bold">
                PI
              </span>
              <p className="text-[#CBD5E1]">
                <span className="font-semibold text-[#F8FAFC]">Pixie</span> Joined for the vents. Stayed for the decorations.
              </p>
            </li>
          </ul>

          <div className="mt-4 flex items-center gap-2 rounded-full bg-[#111318] px-3 py-2 text-[13px] text-[#64748B]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[#94A3B8]" aria-hidden>
              +
            </span>
            Message #welcome
          </div>
        </div>
      </section>

      <section id="inside" className="scroll-mt-20 border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-14">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B]">What&apos;s inside</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-5">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#06B6D4]">{pillar.tag}</span>
                <h3 className="mt-2 text-[15px] font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">{pillar.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {LAYOUTS.map((layout) => (
              <div key={layout.name} className="rounded-xl border border-white/[0.06] p-4">
                <h3 className="text-[13px] font-semibold">{layout.name}</h3>
                <p className="mt-1.5 text-[12px] leading-5 text-[#64748B]">{layout.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cosmetics" className="scroll-mt-20 border-t border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B]">Cosmetics</h2>
            <p className="mt-3 max-w-md text-[22px] font-semibold leading-8">
              Twenty-six platform items and seven community mints, all generated in CSS and SVG.
            </p>
            <p className="mt-3 max-w-md text-[13px] leading-6 text-[#94A3B8]">
              Masked conic-gradient rings, orbiting nodes, clip-path shapes and gradient nameplates scale from a 16px
              reply avatar to a 96px call tile through one component. Buy for yourself or gift a cosmetic to someone
              else — the creator is paid either way.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { slot: "Decorations", count: "10 animated", tone: "from-[#4F46E5]/30 to-transparent" },
              { slot: "Profile effects", count: "6 ambient", tone: "from-[#06B6D4]/25 to-transparent" },
              { slot: "Nameplates", count: "4 shimmering", tone: "from-[#A855F7]/30 to-transparent" },
              { slot: "App themes", count: "6 palettes", tone: "from-[#23A55A]/25 to-transparent" },
            ].map((item) => (
              <div
                key={item.slot}
                className={`rounded-xl border border-white/[0.08] bg-gradient-to-br ${item.tone} p-4`}
              >
                <p className="text-[13px] font-semibold">{item.slot}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="operations" className="scroll-mt-20 border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-14">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B]">Operations</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Guard queue", body: "Review flagged messages, keep or delete, dry-run rules before they ship." },
              { title: "Role constructor", body: "Drag the hierarchy, set colours and permissions, persisted per server." },
              { title: "Staff console", body: "Moderators triage cases; admins move wallets and verify handles." },
              { title: "Audit trail", body: "Every privileged action writes one row with actor, target and IP." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-4">
                <h3 className="text-[13px] font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-[12px] leading-5 text-[#94A3B8]">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 py-12 sm:flex-row sm:items-center">
          <div>
            <p className="text-[20px] font-semibold">Ready when you are.</p>
            <p className="mt-1 text-[13px] text-[#94A3B8]">
              {handle ? `Signed in as @${handle}.` : "Your ASTRO handle is the only account you need."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/astro#access"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-white/35"
            >
              {handle ? "Manage ASTRO account" : "Create ASTRO account"}
            </Link>
            <Link
              href={handle ? "/app" : "/astro?next=/app#access"}
              className="rounded-full bg-[#4F46E5] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA]"
            >
              Open Bleek
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 text-xs text-[#64748B] sm:flex-row sm:items-center">
          <p>Bleek runs on the ASTRO identity layer — one handle, one wallet, one profile across products.</p>
          <div className="flex items-center gap-4">
            <Link href="/astro" className="transition-colors hover:text-[#F8FAFC]">
              ASTRO identity
            </Link>
            <Link href="/developers" className="transition-colors hover:text-[#F8FAFC]">
              Developers
            </Link>
            <Link href="/admin" className="transition-colors hover:text-[#F8FAFC]">
              Console
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
