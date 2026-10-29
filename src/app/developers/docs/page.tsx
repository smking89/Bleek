import type { Metadata } from "next";
import Link from "next/link";
import { DevHeader } from "@/components/dev/dev-header";
import { API_BASE_URL, API_VERSION, DOC_ENDPOINTS, DOC_ERRORS } from "@/lib/dev/docs";
import { DAILY_QUOTA } from "@/lib/dev/keys";

export const metadata: Metadata = {
  title: "ASTRO — API reference",
  description: "Authentication, scopes, endpoints, errors and quotas for the ASTRO API v1.",
};

const ENDPOINT_NOTES: Record<string, string> = {
  "/api/v1/me": "Use this to verify a key after rotating it.",
  "/api/v1/connections": "Chips are ordered exactly as they render on the ASTRO profile.",
  "/api/v1/wallet": "The same balance every ASTRO product reads and writes.",
  "/api/v1/wallet/adjust": "Guarded by a wallet version, so concurrent calls retry instead of clobbering.",
};

export default function DeveloperDocsPage() {
  return (
    <main className="min-h-dvh bg-black text-[#F8FAFC]">
      <DevHeader />

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-20 space-y-1 text-[12px]">
            {[
              { href: "#auth", label: "Authentication" },
              { href: "#scopes", label: "Scopes" },
              { href: "#endpoints", label: "Endpoints" },
              { href: "#errors", label: "Errors" },
              { href: "#limits", label: "Quotas" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-md px-2 py-1.5 text-[#94A3B8] transition-colors hover:bg-white/[0.04] hover:text-[#F8FAFC]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#6E7C93]">API reference · v1</p>
          <h1 className="mt-2 text-[30px] font-semibold tracking-tight">ASTRO API</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-7 text-[#94A3B8]">
            Base URL <code className="rounded bg-[#111318] px-1.5 py-0.5 font-mono text-[12px] text-[#67E8F9]">{API_BASE_URL}</code>.
            Every request is authenticated with a key from the{" "}
            <Link href="/developers/console" className="text-[#A5B4FC] hover:underline">
              console
            </Link>
            , returns JSON, and is metered against a per-key daily quota.
          </p>

          <section id="auth" className="mt-8 scroll-mt-20">
            <h2 className="text-[16px] font-semibold">Authentication</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-[#94A3B8]">
              Send the secret as a bearer token. Keys start with <code className="font-mono text-[#CBD5E1]">astro_sk_</code>{" "}
              and are stored only as SHA-256 hashes; losing one means rotating it.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0B0C0E] px-4 py-3 font-mono text-[11.5px] leading-6 text-[#CBD5E1]">
              <code>{`Authorization: Bearer astro_sk_…`}</code>
            </pre>
            <p className="mt-2 text-[11.5px] leading-5 text-[#6E7C93]">
              A missing header is 401 MISSING_KEY. Unknown, revoked and rotated keys all return 401 INVALID_KEY, so a
              response never confirms whether a key exists.
            </p>
          </section>

          <section id="scopes" className="mt-8 scroll-mt-20">
            <h2 className="text-[16px] font-semibold">Scopes</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-[#94A3B8]">
              Each route names the scope it requires. A key without it gets 403 MISSING_SCOPE before any work runs.
              wallet:write only ever touches the wallet owned by the key.
            </p>
          </section>

          <section id="endpoints" className="mt-8 scroll-mt-20 space-y-4">
            <h2 className="text-[16px] font-semibold">Endpoints</h2>
            {DOC_ENDPOINTS.map((endpoint) => (
              <div key={endpoint.path} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B0C0E]">
                <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-4 py-2.5">
                  <span className="rounded border border-[#23A55A]/40 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#8BE0AD]">
                    {endpoint.method}
                  </span>
                  <code className="font-mono text-[12px] text-[#F8FAFC]">{endpoint.path}</code>
                  <span className="rounded-full border border-white/12 px-1.5 py-0.5 font-mono text-[9.5px] text-[#94A3B8]">
                    {endpoint.scope}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[12.5px] leading-6 text-[#94A3B8]">{endpoint.summary}</p>
                  {ENDPOINT_NOTES[endpoint.path] ? (
                    <p className="mt-1 text-[11.5px] leading-5 text-[#6E7C93]">{ENDPOINT_NOTES[endpoint.path]}</p>
                  ) : null}
                  {endpoint.request ? (
                    <>
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6E7C93]">
                        Request
                      </p>
                      <pre className="mt-1 overflow-x-auto rounded-lg border border-white/[0.07] bg-[#111318] px-3 py-2 font-mono text-[11px] leading-5 text-[#CBD5E1]">
                        <code>{endpoint.request}</code>
                      </pre>
                    </>
                  ) : null}
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6E7C93]">Response</p>
                  <pre className="mt-1 overflow-x-auto rounded-lg border border-white/[0.07] bg-[#111318] px-3 py-2 font-mono text-[11px] leading-5 text-[#CBD5E1]">
                    <code>{endpoint.response}</code>
                  </pre>
                </div>
              </div>
            ))}
          </section>

          <section id="errors" className="mt-8 scroll-mt-20">
            <h2 className="text-[16px] font-semibold">Errors</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-[#94A3B8]">
              Failures return <code className="font-mono text-[#CBD5E1]">{`{ error, code }`}</code> with a real status.
              Branch on <code className="font-mono text-[#CBD5E1]">code</code>, not the message.
            </p>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.08]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#0B0C0E] text-[10px] uppercase tracking-[0.14em] text-[#6E7C93]">
                    <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Code</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {DOC_ERRORS.map((entry) => (
                    <tr key={entry.code} className="border-t border-white/[0.06] bg-black">
                      <td className="px-3 py-2 font-mono text-[11px] text-[#FCA5A5]">{entry.status}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-[#A5B4FC]">{entry.code}</td>
                      <td className="px-3 py-2 text-[11.5px] leading-5 text-[#94A3B8]">{entry.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="limits" className="mt-8 scroll-mt-20">
            <h2 className="text-[16px] font-semibold">Quotas</h2>
            <p className="mt-1.5 text-[13px] leading-6 text-[#94A3B8]">
              Each key is capped at {DAILY_QUOTA.toLocaleString()} requests per UTC day. The counter lives in{" "}
              <code className="font-mono text-[#CBD5E1]">api_usage_daily</code>, written after every call, and resets at
              00:00 UTC. Crossing the cap returns 429 QUOTA_EXCEEDED; the call still appears in your portal history.
            </p>
            <p className="mt-2 text-[11.5px] leading-5 text-[#6E7C93]">
              Contract version {API_VERSION}. Breaking changes ship under a new version prefix, never in place.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
