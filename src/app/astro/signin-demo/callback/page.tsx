import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Astrocan — sign-in handoff",
  description: "Where a redirect sign-in lands on this deployment.",
  robots: { index: false, follow: false },
};

type Search = { handle?: string; astroId?: string; state?: string };

/**
 * The redirect half of the demo. A popup returns the same three values by
 * postMessage; this page is where the browser lands when the handoff is done
 * as a redirect instead, so both shapes are visible side by side.
 */
export default async function SignInDemoCallbackPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { handle, astroId, state } = await searchParams;
  const handedBack = Boolean(handle && astroId);

  return (
    <main className="min-h-dvh bg-black text-[#F8FAFC]">
      <header className="border-b border-white/[0.06] bg-black">
        <div className="mx-auto flex h-16 w-full max-w-md items-center gap-3 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/astro-icon.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
          <span className="text-[12px] font-bold uppercase tracking-[0.22em]">Astrocan</span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-[#64748B]">Handoff</span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-md px-5 py-10 sm:py-14">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
          {handedBack ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#06B6D4]">Signed in</p>
              <h1 className="mt-2 text-lg font-semibold text-[#F8FAFC]">@{handle}</h1>
              <p className="mt-1 break-all font-mono text-[11px] text-[#64748B]">{astroId}</p>
              <p className="mt-3 text-[13px] leading-6 text-[#94A3B8]">
                The sign-in came back as a redirect, with the same three values a popup posts to its opener. This one
                arrived as <code className="text-[#CBD5E1]">state</code>,{" "}
                <code className="text-[#CBD5E1]">handle</code> and <code className="text-[#CBD5E1]">astroId</code> on the
                query string.
              </p>
              <dl className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4 text-[12px]">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[#64748B]">state</dt>
                  <dd className="break-all font-mono text-[11px] text-[#94A3B8]">{state ?? "—"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[#64748B]">astroId</dt>
                  <dd className="break-all font-mono text-[11px] text-[#94A3B8]">{astroId}</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FCA5A5]">Nothing handed back</p>
              <h1 className="mt-2 text-lg font-semibold text-[#F8FAFC]">This address is where a sign-in finishes</h1>
              <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">
                It expects <code className="text-[#CBD5E1]">state</code>, <code className="text-[#CBD5E1]">handle</code>{" "}
                and <code className="text-[#CBD5E1]">astroId</code> from Astrocan. Start the handoff from the landing page
                instead of opening this URL directly.
              </p>
            </>
          )}

          <Link
            href="/"
            className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA]"
          >
            Back to Bleek
          </Link>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-[#64748B]">
          First-party pages under <code className="text-[#94A3B8]">/astro/</code> are accepted by the account screen
          without a registry row because they belong to this origin. Every other app registers its exact{" "}
          <code className="text-[#94A3B8]">redirect_uri</code> in the developer portal.
        </p>
      </section>
    </main>
  );
}
