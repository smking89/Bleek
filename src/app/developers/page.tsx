import type { Metadata } from "next";
import Link from "next/link";
import { DevHeader } from "@/components/dev/dev-header";
import { API_SCOPES, DAILY_QUOTA } from "@/lib/dev/keys";
import { API_VERSION, QUICKSTART_CURL } from "@/lib/dev/docs";

export const metadata: Metadata = {
  title: "ASTRO — developer platform",
  description:
    "Build on ASTRO: one account, one shared wallet and profile chips for Bleek, Koba.games, SnagChat and KOBAbot, behind a single metered API.",
};

const FEATURES = [
  {
    title: "Keys, not passwords",
    body: "Every app gets its own client id and a secret that is hashed at rest. Rotate or revoke it without touching the account.",
  },
  {
    title: "Scopes with teeth",
    body: "profile:read, connections:read, wallet:read and wallet:write are enforced per route, not per convention.",
  },
  {
    title: "Usage you can see",
    body: "Requests, errors, latency and per-day buckets are recorded on every call, so the portal chart is the real ledger.",
  },
];

export default function DevelopersPage() {
  return (
    <main className="min-h-dvh bg-black text-[#F8FAFC]">
      <DevHeader />

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 pt-12 lg:pt-16">
        <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#6E7C93]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" aria-hidden />
          API v1 · {API_VERSION}
        </p>

        <h1 className="mt-4 max-w-3xl text-[38px] font-semibold leading-[1.05] tracking-tight sm:text-[50px]">
          One ASTRO account, callable from anything you build.
        </h1>
        <p className="mt-4 max-w-2xl text-[14.5px] leading-7 text-[#94A3B8]">
          The same identity behind Bleek, Koba.games, SnagChat and KOBAbot is available as a metered HTTP API. Read a profile,
          list its chips, move coins in the shared wallet — all scoped to the account that owns the key.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          <Link
            href="/developers/console"
            className="rounded-lg bg-[#4F46E5] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#4338CA]"
          >
            Open the console
          </Link>
          <Link
            href="/developers/docs"
            className="rounded-lg border border-white/15 px-4 py-2.5 text-[13px] font-medium text-[#CBD5E1] transition-colors hover:border-white/30 hover:text-white"
          >
            Read the API reference
          </Link>
        </div>

        <div className="mt-9 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B0C0E]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]/70" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-[#F0B232]/70" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-[#23A55A]/70" aria-hidden />
            <span className="ml-2 font-mono text-[10.5px] text-[#6E7C93]">quickstart.sh</span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[11.5px] leading-6 text-[#CBD5E1]">
            <code>{QUICKSTART_CURL}</code>
          </pre>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-5 py-10 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-5">
              <h2 className="text-[13px] font-semibold text-[#F8FAFC]">{feature.title}</h2>
              <p className="mt-2 text-[12.5px] leading-6 text-[#94A3B8]">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-10">
          <h2 className="text-[16px] font-semibold text-[#F8FAFC]">Scopes</h2>
          <p className="mt-1 text-[12.5px] text-[#94A3B8]">
            Pick only what a key needs. A missing scope is a 403, never a silent downgrade.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#0B0C0E] text-[10px] uppercase tracking-[0.14em] text-[#6E7C93]">
                  <th scope="col" className="px-4 py-2.5 font-semibold">Scope</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">What it unlocks</th>
                </tr>
              </thead>
              <tbody>
                {API_SCOPES.map((scope) => (
                  <tr key={scope.key} className="border-t border-white/[0.06] bg-black">
                    <td className="px-4 py-2.5 font-mono text-[11.5px] text-[#A5B4FC]">{scope.key}</td>
                    <td className="px-4 py-2.5 text-[12px] leading-5 text-[#94A3B8]">{scope.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11.5px] text-[#6E7C93]">
            Each key is capped at {DAILY_QUOTA.toLocaleString()} requests per UTC day. The count is stored in Postgres,
            so a restart never resets it.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-[11.5px] text-[#6E7C93]">
          <p>ASTRO developer platform · keys are per account, never shared.</p>
          <div className="flex gap-4">
            <Link href="/astro" className="transition-colors hover:text-[#F8FAFC]">
              Profile
            </Link>
            <Link href="/app" className="transition-colors hover:text-[#F8FAFC]">
              Bleek
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
