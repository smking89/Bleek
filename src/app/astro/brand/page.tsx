import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ASTRO_ICON,
  ASTRO_MARK_BLACK,
  ASTRO_MARK_RED,
  ASTRO_MARK_WHITE,
  ASTRO_SIGNIN_HTML,
  ASTRO_SIGNIN_LABEL,
  AstroLockup,
  AstroMark,
  AstroSignInButton,
} from "@/components/brand/astro-brand";

/** Keys and the API are documented with ASTRO now, not in a product portal. */
const ASTRO_DEVELOPER_DOCS = "https://github.com/smking89/Astro/blob/main/DEVELOPERS.md";

export const metadata: Metadata = {
  title: "ASTRO — brand guidelines",
  description:
    "The ASTRO mark, wordmark, colour, type, sign-in button, naming and ASTROid rules, plus what partners may and may not do with the identity.",
};

const SECTIONS = [
  { href: "#mark", label: "The mark" },
  { href: "#lockup", label: "Wordmark & lockup" },
  { href: "#colour", label: "Colour" },
  { href: "#type", label: "Typography" },
  { href: "#signin", label: "Sign in with ASTRO" },
  { href: "#naming", label: "Naming & voice" },
  { href: "#astroid", label: "ASTROid & verification" },
  { href: "#rules", label: "Rules & permissions" },
  { href: "#assets", label: "Assets" },
];

const COLOURS = [
  {
    token: "Space Black",
    hex: "#000000",
    role: "The application canvas and the mark’s home field. The only background the full-colour mark sits on unchanged.",
    caution: "Not a text colour on other surfaces.",
  },
  {
    token: "Abyss Charcoal",
    hex: "#0B0C0E",
    role: "Panels, sidebars and elevated cards. One step off black for depth, never a gradient.",
    caution: "Keep type at Muted Slate or brighter.",
  },
  {
    token: "Astro Red",
    hex: "#FF0000",
    role: "The mark, and nothing else. Reserved so the identity stays a single recognisable note.",
    caution: "Never UI text, buttons, banners or borders.",
  },
  {
    token: "Beek Indigo",
    hex: "#4F46E5",
    role: "Product interaction: primary buttons, mentions, notifications.",
    caution: "Never a substitute fill for the mark.",
  },
  {
    token: "Electric Cyan",
    hex: "#06B6D4",
    role: "Active and live states: speaking rings, verified handles, premium accents.",
    caution: "Not a decorative glow.",
  },
  {
    token: "Static White",
    hex: "#F8FAFC",
    role: "Primary text and the light sign-in fill.",
    caution: "Never #FFFFFF on black for body copy.",
  },
  {
    token: "Muted Slate",
    hex: "#64748B",
    role: "Secondary metadata: timestamps, descriptions, offline labels.",
    caution: "Darkest permitted is #6E7C93 on Space Black.",
  },
];

const TYPE_SCALE = [
  ["Display", "40–56px / 1.05", "700", "−0.02em", "Landing headlines, one per page."],
  ["Section", "20px / 28px", "600", "−0.01em", "Page and panel titles."],
  ["Body", "13px / 24px", "400", "0", "Explanatory copy, form labels."],
  ["Chat", "16px / 22px", "400", "0", "Message content in Bleek."],
  ["Label", "11–12px / 16px", "500", "0.14em uppercase", "Eyebrows, table heads, captions."],
  ["Mono", "11.5–12px / 20px", "500", "0", "ASTROid, keys, code. Tabular numbers for balances."],
];

const NAMING = [
  ["ASTRO", "Astro, astro, ASTRO™ — the name is set in caps, no symbol."],
  ["Sign in with ASTRO", "Login with ASTRO, Log in with Astro, Sign in with Astro."],
  ["an ASTRO account", "an Astro account, an Astro login, ASTRO login."],
  ["ASTROid", "AstroID, Astro ID, ASTRO ID, astro-id, Astro-id."],
  ["@koba", "koba, @Koba, @ koba."],
  ["Bleek · Koba.games · SnagChat · KOBAbot", "Beek, Koba Games, KobaGames, Snagchat, Kobabot."],
  ["coins, wallet", "credits, tokens, ASTRO coins, ASTRO wallet."],
];

const ALLOWED = [
  "Show the mark unchanged to link to ASTRO, or to say your app signs people in with an ASTRO account.",
  "Use the supplied sign-in button, in one of its two approved surfaces, on your own sign-in screen.",
  "Show unmodified screenshots and screen recordings of ASTRO products, including the console.",
  "State factual compatibility in plain words: “Works with ASTRO accounts.”",
  "Link to astro’s profile and developer pages from documentation and release notes.",
];

const DENIED = [
  "Redraw, recolour, rotate, crop, outline, animate or re-proportion the mark, or rebuild the wordmark in another typeface.",
  "Use the mark, the word ASTRO, or a confusingly similar name in your product name, app icon, domain, package name or social handle.",
  "Imply partnership, endorsement, certification or “powered by ASTRO” without written approval.",
  "Render the cyan verification check, or describe a handle as “ASTRO verified”, unless ASTRO staff verified it.",
  "Register the mark, or a near copy, as a trademark, and do not sell merchandise carrying it.",
  "Present ASTRO as the operator of your product, or your product as an ASTRO product.",
  "Alter, extend or invent an ASTROid, or present one as a password, proof of ownership or secret.",
];

function Section({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24 border-t border-white/[0.07] pt-9">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#6E7C93]">{kicker}</p>
      <h2 className="mt-2 text-[21px] font-semibold tracking-tight text-[#F8FAFC]">{title}</h2>
      <div className="mt-3 space-y-3 text-[13px] leading-[24px] text-[#94A3B8]">{children}</div>
    </section>
  );
}

function SubHead({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-7 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#CBD5E1]">{children}</h3>
  );
}

function Specimen({
  label,
  background = "#000000",
  note,
  children,
}: {
  label: string;
  background?: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <figure className="min-w-0">
      <div
        className="flex h-[132px] items-center justify-center rounded-xl border border-white/[0.08] p-4"
        style={{ background }}
      >
        {children}
      </div>
      <figcaption className="mt-2 text-[11px] leading-5 text-[#6E7C93]">
        {label}
        {note ? <span className="block text-[#55606F]">{note}</span> : null}
      </figcaption>
    </figure>
  );
}

function Verdict({
  ok,
  background = "#000000",
  caption,
  children,
}: {
  ok: boolean;
  background?: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B0C0E]">
      <div className="flex h-[118px] items-center justify-center overflow-hidden" style={{ background }}>
        {children}
      </div>
      <figcaption className="flex items-start gap-2 border-t border-white/[0.06] px-3 py-2.5">
        <span
          className={`mt-px shrink-0 rounded border px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] ${
            ok ? "border-[#23A55A]/40 text-[#8BE0AD]" : "border-[#F23F43]/40 text-[#FCA5A5]"
          }`}
        >
          {ok ? "Do" : "Don’t"}
        </span>
        <span className="text-[11.5px] leading-5 text-[#94A3B8]">{caption}</span>
      </figcaption>
    </figure>
  );
}

function SpecTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
      <table className="w-full border-collapse text-left">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-white/[0.06] last:border-0">
              <th scope="row" className="w-[42%] bg-[#0B0C0E] px-4 py-2.5 align-top text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E7C93]">
                {label}
              </th>
              <td className="px-4 py-2.5 align-top text-[12.5px] leading-5 text-[#CBD5E1]">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RuleList({ items, tone }: { items: string[]; tone: "allow" | "deny" }) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-[12.5px] leading-[22px] text-[#94A3B8]">
          <span
            aria-hidden
            className={`mt-[3px] shrink-0 text-[11px] font-bold ${tone === "allow" ? "text-[#23A55A]" : "text-[#F23F43]"}`}
          >
            {tone === "allow" ? "✓" : "✕"}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BrandGuidelinesPage() {
  return (
    <main className="min-h-dvh bg-black text-[#F8FAFC]">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/astro" className="flex items-center gap-3">
            <AstroMark size={22} />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">ASTRO</span>
            <span className="hidden text-[10px] uppercase tracking-[0.16em] text-[#6E7C93] sm:inline">Brand</span>
          </Link>

          <nav aria-label="ASTRO brand" className="flex items-center gap-1 text-[12px]">
            <Link href="/astro" className="rounded-md px-2.5 py-1.5 text-[#94A3B8] transition-colors hover:text-[#F8FAFC]">
              Identity
            </Link>
            <a
              href={ASTRO_DEVELOPER_DOCS}
              className="hidden rounded-md px-2.5 py-1.5 text-[#94A3B8] transition-colors hover:text-[#F8FAFC] sm:block"
            >
              Developers
            </a>
            <Link
              href="/astro/brand"
              aria-current="page"
              className="rounded-md bg-white/[0.06] px-2.5 py-1.5 font-semibold text-[#F8FAFC]"
            >
              Guidelines
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[196px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <nav aria-label="On this page" className="sticky top-20 space-y-0.5 text-[12px]">
            {SECTIONS.map((section) => (
              <a
                key={section.href}
                href={section.href}
                className="block rounded-md px-2 py-1.5 text-[#94A3B8] transition-colors hover:bg-white/[0.04] hover:text-[#F8FAFC]"
              >
                {section.label}
              </a>
            ))}
            <a
              href="#assets"
              className="mt-3 block rounded-md border border-white/10 px-2 py-1.5 text-center text-[11.5px] font-semibold text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white"
            >
              Download marks
            </a>
          </nav>
        </aside>

        <article className="min-w-0">
          <div className="flex items-center gap-3">
            <AstroLockup markSize={30} />
            <span className="rounded-full border border-white/12 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#6E7C93]">
              v1.0
            </span>
          </div>

          <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-[42px]">
            One mark. One name. Every world.
          </h1>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-7 text-[#94A3B8]">
            ASTRO is the identity layer behind Bleek, Koba.games, SnagChat and KOBAbot. These guidelines keep it
            recognisable: how the mark is drawn, where it may sit, what the sign-in control looks like, and what you may
            and may not say about the account you are connecting to.
          </p>

          <dl className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Mark", "The two-stroke A, Astro Red on Space Black"],
              ["Wordmark", "ASTRO, Inter 700, 0.22em tracking"],
              ["Label", `“${ASTRO_SIGNIN_LABEL}”`],
              ["Account id", "ASTROid, minted once, never edited"],
            ].map(([term, description]) => (
              <div key={term} className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E7C93]">{term}</dt>
                <dd className="mt-1.5 text-[12px] leading-5 text-[#CBD5E1]">{description}</dd>
              </div>
            ))}
          </dl>

          <Section id="mark" kicker="01 · Identity" title="The mark">
            <p>
              The ASTRO mark is the two-stroke A. It is drawn once and never redrawn: the strokes taper, the apex stays
              open, and the counter is a clean vertical channel. Production ships the opaque app icon on Space Black;
              the transparent knockouts are for layout where the surface has to show through.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Specimen label="Full colour · Space Black" note="The default. App icon and metadata.">
                <AstroMark src={ASTRO_ICON} size={64} />
              </Specimen>
              <Specimen label="Full colour · Abyss Charcoal" background="#0B0C0E">
                <AstroMark src={ASTRO_MARK_RED} size={64} />
              </Specimen>
              <Specimen label="Knockout · white on black">
                <AstroMark src={ASTRO_MARK_WHITE} size={64} />
              </Specimen>
              <Specimen label="Knockout · black on Static White" background="#F8FAFC">
                <AstroMark src={ASTRO_MARK_BLACK} size={64} />
              </Specimen>
            </div>

            <SubHead>Clear space</SubHead>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative inline-flex w-fit items-center justify-center rounded-lg border border-dashed border-[#06B6D4]/60 p-7">
                <AstroMark src={ASTRO_MARK_RED} size={56} />
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-black px-1.5 font-mono text-[9.5px] text-[#06B6D4]">
                  x = ½ mark height
                </span>
              </div>
              <p className="max-w-md text-[12.5px] leading-6">
                Leave at least half the mark’s height free on all four sides. Nothing enters that margin — no text, no
                rule, no icon, no crop edge. The margin scales with the mark, so a 20px mark keeps 10px of air and a
                96px mark keeps 48px.
              </p>
            </div>

            <SubHead>Minimum size</SubHead>
            <div className="mt-4 flex flex-wrap items-end gap-6 rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-5">
              {[
                { size: 56, label: "56px — comfortable" },
                { size: 24, label: "20px — smallest icon" },
                { size: 14, label: "14px — too small" },
              ].map((sample) => (
                <figure key={sample.size} className="flex flex-col items-center gap-2">
                  <AstroMark src={ASTRO_MARK_RED} size={sample.size} />
                  <figcaption
                    className={`text-[10.5px] ${sample.size === 14 ? "text-[#FCA5A5]" : "text-[#6E7C93]"}`}
                  >
                    {sample.label}
                  </figcaption>
                </figure>
              ))}
            </div>
            <SpecTable
              rows={[
                ["Digital icon", "20px minimum, square, never squashed"],
                ["Horizontal lockup", "88px minimum width, mark 24px"],
                ["Print", "8mm minimum height"],
                ["Engraving and embroidery", "12mm minimum, single-colour knockout only"],
              ]}
            />
            <p>
              Below the minimum, drop the mark and set the wordmark on its own. Never shrink the mark to fit a margin,
              and never squeeze it into a square that is not the original 1:1.
            </p>

            <SubHead>Backgrounds</SubHead>
            <p>
              The full-colour mark belongs on Space Black. It also reads on Abyss Charcoal. On any lighter surface use
              the black knockout, and on a dark photograph-free panel use the white knockout. It never sits on a
              gradient, a photograph, a video still, another logo, glass, or a translucent overlay — the strokes lose
              their edge and the identity stops reading as ASTRO.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Verdict ok caption="Mark as supplied, centred on Space Black, with clear space intact.">
                <AstroMark src={ASTRO_MARK_RED} size={56} />
              </Verdict>
              <Verdict ok caption="A single palette colour behind the knockout, still flat and still clear.">
                <div className="flex h-full w-full items-center justify-center" style={{ background: "#0B0C0E" }}>
                  <AstroMark src={ASTRO_MARK_WHITE} size={56} />
                </div>
              </Verdict>
              <Verdict ok={false} caption="Don’t rotate, skew or mirror the mark.">
                <div className="rotate-[14deg]">
                  <AstroMark src={ASTRO_MARK_RED} size={56} />
                </div>
              </Verdict>
              <Verdict ok={false} caption="Don’t recolour, tint or place the mark on a gradient.">
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #06B6D4)" }}
                >
                  <AstroMark src={ASTRO_MARK_WHITE} size={56} className="mix-blend-screen" />
                </div>
              </Verdict>
              <Verdict ok={false} caption="Don’t add a glow, outline or drop shadow.">
                <AstroMark
                  src={ASTRO_MARK_RED}
                  size={56}
                  className="[filter:drop-shadow(0_0_16px_#06B6D4)]"
                />
              </Verdict>
              <Verdict ok={false} caption="Don’t stretch or condense the proportions.">
                <span style={{ transform: "scaleX(1.7)" }}>
                  <AstroMark src={ASTRO_MARK_RED} size={56} />
                </span>
              </Verdict>
              <Verdict ok={false} caption="Don’t box the mark in another shape or another brand’s colour.">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4F46E5]">
                  <AstroMark src={ASTRO_MARK_WHITE} size={40} />
                </span>
              </Verdict>
              <Verdict ok={false} caption="Don’t crop the strokes or let type run into the clear space.">
                <div className="relative h-[56px] w-[42px] overflow-hidden border border-[#F23F43]/40">
                  <AstroMark src={ASTRO_MARK_RED} size={56} />
                </div>
              </Verdict>
            </div>
          </Section>

          <Section id="lockup" kicker="02 · Identity" title="Wordmark, lockup and product names">
            <p>
              The wordmark is <strong className="font-semibold text-[#F8FAFC]">ASTRO</strong> set in Inter Bold, uppercase,
              with 0.22em tracking — the same treatment as the product headers. The default lockup is horizontal: mark at
              26px, 12px gap, wordmark at 13px. Set it once, and reuse it.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Specimen label="Horizontal lockup · on Space Black" note="Default everywhere.">
                <AstroLockup markSize={32} />
              </Specimen>
              <Specimen label="Horizontal lockup · on Static White" background="#F8FAFC">
                <span className="inline-flex items-center gap-3">
                  <AstroMark src={ASTRO_MARK_BLACK} size={32} />
                  <span className="text-[15px] font-bold uppercase tracking-[0.22em] text-black">ASTRO</span>
                </span>
              </Specimen>
            </div>

            <SpecTable
              rows={[
                ["Lockup", "Mark + 12px gap + wordmark, optically centred on the cap height"],
                ["Wordmark", "Inter 700, uppercase, letter-spacing 0.22em, no tagline attached"],
                ["Icon only", "Below 88px of available width, or as the app icon. Never a partial lockup"],
                ["Product names", "Set in the product’s own type, untouched, beside — not inside — the lockup"],
              ]}
            />

            <RuleList
              tone="deny"
              items={[
                "Don’t set the wordmark in title case, another typeface, or a different tracking inside the lockup.",
                "Don’t attach a tagline, a URL or a “®” to the lockup.",
                "Don’t enclose the lockup in a pill, a badge or a coloured plate.",
                "Don’t letterspace Bleek, Koba.games, SnagChat or KOBAbot to match the wordmark.",
                "Don’t rebuild the lockup at a different mark-to-wordmark ratio than 26:13.",
              ]}
            />
          </Section>

          <Section id="colour" kicker="03 · Visual language" title="Colour">
            <p>
              Black is the canvas, charcoal is the depth, and colour is a signal rather than decoration. Six tokens carry
              the product; Astro Red is reserved for the mark so the identity never competes with a button.
            </p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {COLOURS.map((colour) => (
                <li key={colour.hex} className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B0C0E]">
                  <div
                    className="h-12 w-full border-b border-white/[0.06]"
                    style={{ background: colour.hex }}
                    aria-hidden
                  />
                  <div className="p-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-[#F8FAFC]">{colour.token}</span>
                      <code className="font-mono text-[11px] text-[#94A3B8]">{colour.hex}</code>
                    </div>
                    <p className="mt-1.5 text-[11.5px] leading-5 text-[#94A3B8]">{colour.role}</p>
                    <p className="mt-1 text-[10.5px] leading-4 text-[#6E7C93]">{colour.caution}</p>
                  </div>
                </li>
              ))}
            </ul>

            <RuleList
              tone="deny"
              items={[
                "Don’t add glows, fog or blur to brand surfaces; flat colour only.",
                "Don’t put Astro Red on text, buttons, banners, charts or borders.",
                "Don’t theme the mark; it is #FF0000 in every product at every size.",
                "Don’t run body copy below 4.5:1, or large text below 3:1, against its surface.",
              ]}
            />
          </Section>

          <Section id="type" kicker="04 · Visual language" title="Typography">
            <p>
              Inter only, self-hosted, weights 400, 500, 600 and 700. One family across marketing, product and console —
              no condensed cuts, no display faces, no per-product substitutions. Numbers that people compare (coin
              balances, reaction counts, quotas) are set with tabular numerals.
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#0B0C0E] text-[10px] uppercase tracking-[0.14em] text-[#6E7C93]">
                    <th scope="col" className="px-3 py-2 font-semibold">Role</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Size / line</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Weight</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Tracking</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Where</th>
                  </tr>
                </thead>
                <tbody>
                  {TYPE_SCALE.map((row) => (
                    <tr key={row[0]} className="border-t border-white/[0.06]">
                      {row.map((cell, index) => (
                        <td
                          key={`${row[0]}-${index}`}
                          className={`px-3 py-2 align-top text-[11.5px] leading-5 ${
                            index === 0 ? "font-semibold text-[#F8FAFC]" : "text-[#94A3B8]"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <RuleList
              tone="deny"
              items={[
                "Don’t letterspace body copy or messages; tracking belongs to the wordmark and to uppercase label text.",
                "Don’t centre paragraphs, and don’t set text below 11px in product UI.",
                "Don’t substitute the operating system’s default sans when Inter fails to load — ship the font.",
              ]}
            />
          </Section>

          <Section id="signin" kicker="05 · Controls" title={`“${ASTRO_SIGNIN_LABEL}”`}>
            <p>
              One label, one control. Use it wherever an account can be created or resumed with ASTRO, and nowhere else.
              The mark stays in full colour inside the button; the fill carries the surface it sits on.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Specimen label="On Space Black and Abyss Charcoal" background="#0B0C0E" note="Static White fill, black label.">
                <AstroSignInButton href="/astro" surface="dark" />
              </Specimen>
              <Specimen label="On Static White" background="#F8FAFC" note="Space Black fill, Static White label.">
                <AstroSignInButton href="/astro" surface="light" />
              </Specimen>
              <Specimen label="Compact · dense toolbars only" background="#0B0C0E">
                <AstroSignInButton href="/astro" surface="dark" size="sm" />
              </Specimen>
              <Specimen label="Unavailable" background="#0B0C0E" note="40% opacity, no hover, not focusable.">
                <AstroSignInButton href="/astro" surface="dark" disabled />
              </Specimen>
            </div>

            <SpecTable
              rows={[
                ["Label", `${ASTRO_SIGNIN_LABEL} — sentence case, always with the mark`],
                ["Height", "40px standard, 32px compact. Never below 32px"],
                ["Fill and radius", "8px radius; Static White on dark surfaces, Space Black on light ones"],
                ["Mark", "18px at standard, 15px compact, full colour, 10px from the label"],
                ["Label type", "Inter 600, 13px (12px compact), no letter-spacing"],
                ["Hover", "Fill shifts one step; the mark never moves or animates"],
                ["Focus", "2px Electric Cyan outline, 2px offset"],
                ["Pressed", "Fill returns to the resting colour; no scale or bounce"],
                ["Busy", "Label reads “Signing in…” and the control stays the same width"],
                ["Width", "Content width, or full width of the form column — never taller to fill a box"],
              ]}
            />

            <SubHead>Copy-paste markup</SubHead>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0B0C0E] px-4 py-3 font-mono text-[11px] leading-6 text-[#CBD5E1]">
              <code>{ASTRO_SIGNIN_HTML}</code>
            </pre>
            <p className="text-[11.5px] leading-5 text-[#6E7C93]">
              The mark resolves to <code className="font-mono text-[#94A3B8]">/brand/astro-mark-red.png</code>. Ship it
              yourself rather than hotlinking another deployment.
            </p>

            <SubHead>Do and don’t</SubHead>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Verdict ok caption="Exact label, supplied mark, one of the two approved surfaces." background="#0B0C0E">
                <AstroSignInButton href="/astro" surface="dark" />
              </Verdict>
              <Verdict ok={false} caption="Don’t rewrite the label: “Login with Astro” fails the naming rules." background="#0B0C0E">
                <span className="inline-flex h-10 items-center gap-2.5 rounded-lg bg-[#F8FAFC] px-4 text-[13px] font-semibold text-black">
                  <AstroMark src={ASTRO_MARK_RED} size={18} />
                  Login with Astro
                </span>
              </Verdict>
              <Verdict ok={false} caption="Don’t tint the mark, or swap the fill for product indigo." background="#0B0C0E">
                <span className="inline-flex h-10 items-center gap-2.5 rounded-lg bg-[#4F46E5] px-4 text-[13px] font-semibold text-white">
                  <AstroMark
                    src={ASTRO_MARK_WHITE}
                    size={18}
                    className="[filter:drop-shadow(0_0_0_#fff)]"
                  />
                  Sign in with ASTRO
                </span>
              </Verdict>
              <Verdict ok={false} caption="Don’t drop the mark, or set the label in another typeface." background="#0B0C0E">
                <span className="inline-flex h-10 items-center rounded-lg bg-[#F8FAFC] px-4 font-serif text-[13px] font-semibold text-black">
                  Sign in with ASTRO
                </span>
              </Verdict>
              <Verdict ok={false} caption="Don’t shrink below 32px or stretch the height." background="#0B0C0E">
                <span style={{ transform: "scaleY(0.6)" }}>
                  <AstroSignInButton href="/astro" surface="dark" />
                </span>
              </Verdict>
              <Verdict ok={false} caption="Don’t add badges, taglines, prices or “new” flags inside the control." background="#0B0C0E">
                <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 text-[13px] font-semibold text-black">
                  <AstroMark src={ASTRO_MARK_RED} size={18} />
                  Sign in with ASTRO
                  <span className="rounded-full bg-[#4F46E5] px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>
                </span>
              </Verdict>
            </div>

            <p className="mt-4">
              Give the control the same weight as your other sign-in options, and put it inside your own form rather than
              inside another brand’s card. Never present the button as an ASTRO endorsement of your product, and never
              show it to someone who cannot actually complete the flow.
            </p>
          </Section>

          <Section id="naming" kicker="06 · Words" title="Naming and voice">
            <p>
              The name is four letters in caps. Products carry their own casing exactly as written, and handles are always
              lowercase with an <span className="text-[#F8FAFC]">@</span>. A reader should be able to tell ASTRO, the
              products and a handle apart from a single line of text.
            </p>

            <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.08]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#0B0C0E] text-[10px] uppercase tracking-[0.14em] text-[#6E7C93]">
                    <th scope="col" className="px-3 py-2 font-semibold">Correct</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Not permitted</th>
                  </tr>
                </thead>
                <tbody>
                  {NAMING.map(([good, bad]) => (
                    <tr key={good} className="border-t border-white/[0.06]">
                      <td className="px-3 py-2 align-top text-[12px] font-medium text-[#F8FAFC]">{good}</td>
                      <td className="px-3 py-2 align-top text-[11.5px] leading-5 text-[#94A3B8]">
                        <span aria-hidden className="mr-1.5 text-[#F23F43]">
                          ✕
                        </span>
                        {bad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SubHead>Voice</SubHead>
            <RuleList
              tone="allow"
              items={[
                "Plain and declarative: say what the account carries, then stop.",
                "Second person, present tense: “Your handle works in every product.”",
                "Numerals for counts and money, tabular where they are compared.",
                "“Suspended” for a paused account, “unverified” for a handle without staff review.",
              ]}
            />
            <RuleList
              tone="deny"
              items={[
                "No exclamation marks, no “seamless”, “revolutionary”, “supercharged”.",
                "No invented compounds such as ASTROChat, ASTROverse or ASTRO-verified partner.",
                "No calling coins “credits” or “tokens”, and no calling the ASTROid a “key” or an “ID number”.",
                "No unqualified security claims: the ASTROid is public and verifiable, not secret.",
              ]}
            />
          </Section>

          <Section id="astroid" kicker="07 · Trust" title="The ASTROid and the verified badge">
            <p>
              Every account carries one ASTROid, minted at registration and never edited. It is 80 random bits plus a
              40-bit HMAC signature over those bits, so any product can verify it locally. Edited, extended or invented
              values fail the signature without a round trip to ASTRO.
            </p>

            <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E7C93]">Display form</p>
              <code className="mt-2 block overflow-x-auto font-mono text-[12.5px] tracking-[0.04em] text-[#CBD5E1]">
                ASTRO-4K7Q-9WTM-2XHB-8NDR-3FVC-6PZS
              </code>
              <p className="mt-2 text-[11.5px] leading-5 text-[#6E7C93]">
                Prefix, then six groups of four from Crockford base32. Uppercase, mono, hyphens where shown. Look-alikes
                normalise on input (I and L to 1, O to 0), so a pasted value can be checked without being “fixed”.
              </p>
            </div>

            <RuleList
              tone="allow"
              items={[
                "Show the whole string, grouped in fours, in a monospace face.",
                "Offer a copy control that copies the full, ungrouped value and confirms it in an aria-live region.",
                "Verify locally with the shared secret, and treat a failed signature as “not an ASTRO account”.",
              ]}
            />
            <RuleList
              tone="deny"
              items={[
                "Don’t re-group, lowercase, truncate mid-group or ellipsise the interior. If space runs out, hide trailing groups and keep the full value in the copy action.",
                "Don’t treat the ASTROid as a password, a session token, a reset code or proof of ownership. It is public.",
                "Don’t ask a person to paste one into chat to prove they own an account.",
                "Don’t mint, patch or “repair” one; only ASTRO mints ASTROids.",
                "Don’t rename it Astro ID, ASTRO ID or AstroID in any interface string.",
              ]}
            />

            <SubHead>The verified badge</SubHead>
            <p>
              The cyan check means one thing: ASTRO staff reviewed the handle behind this account. Only the ASTRO host,
              or a product reading the account’s verified timestamp, may render it — beside the handle it belongs to, at
              the same size as the name it follows.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0B0C0E] px-4 py-3.5">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#F8FAFC]">
                @koba
                <svg viewBox="0 0 24 24" width="14" height="14" aria-label="Verified handle" fill="#06B6D4">
                  <path d="M12 1.6l2.6 2 3.2-.2.9 3.1 2.7 1.8-1.3 3 1.3 3-2.7 1.8-.9 3.1-3.2-.2-2.6 2-2.6-2-3.2.2-.9-3.1L2.6 14.9l1.3-3-1.3-3 2.7-1.8.9-3.1 3.2.2z" />
                  <path
                    d="M8.4 12.2l2.4 2.4 4.8-4.9"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="text-[11.5px] leading-5 text-[#6E7C93]">
                Staff-verified handle. Never for sale, never self-issued, never art.
              </span>
            </div>
          </Section>

          <Section id="rules" kicker="08 · Permission" title="Rules and permissions">
            <p>
              You may use the ASTRO mark to refer to the identity service and to sign people in with it. Everything below
              is the line: the first list is permitted without asking, the second needs written approval or is not
              permitted at all.
            </p>

            <SubHead>Permitted</SubHead>
            <RuleList tone="allow" items={ALLOWED} />

            <SubHead>Not permitted</SubHead>
            <RuleList tone="deny" items={DENIED} />

            <SubHead>If permission ends</SubHead>
            <p>
              These permissions end when an integration stops following these rules, or when ASTRO asks it to stop. On
              request, remove the mark, the sign-in control and any ASTRO naming from live surfaces and store listings
              within 30 days. Nothing here grants a trademark licence beyond the uses listed above, and nothing transfers
              ownership of the mark.
            </p>
            <p>
              Vector originals, co-marketing requests and approval questions go through the{" "}
              <a href={ASTRO_DEVELOPER_DOCS} className="text-[#A5B4FC] hover:underline">
                ASTRO developer platform
              </a>
              . If a use is not described on this page, it is not permitted yet — ask first.
            </p>
          </Section>

          <Section id="assets" kicker="09 · Files" title="Assets">
            <p>
              Four files cover every approved use. They are the only marks to ship; do not trace, recolour or export your
              own from a screenshot.
            </p>

            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                {
                  file: ASTRO_ICON,
                  name: "App icon",
                  detail: "512 × 512 PNG, opaque Space Black field.",
                  use: "App icon, favicon, store metadata.",
                },
                {
                  file: ASTRO_MARK_RED,
                  name: "Mark — full colour",
                  detail: "512 × 512 PNG, transparent, #FF0000.",
                  use: "On Space Black and Abyss Charcoal.",
                },
                {
                  file: ASTRO_MARK_WHITE,
                  name: "Mark — white knockout",
                  detail: "512 × 512 PNG, transparent, #F8FAFC.",
                  use: "Dark flat surfaces and single-colour print.",
                },
                {
                  file: ASTRO_MARK_BLACK,
                  name: "Mark — black knockout",
                  detail: "512 × 512 PNG, transparent, #000000.",
                  use: "Static White and other light surfaces.",
                },
              ].map((asset) => (
                <li key={asset.file} className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#F8FAFC]">{asset.name}</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#6E7C93]">{asset.detail}</p>
                      <p className="mt-2 text-[11px] leading-5 text-[#94A3B8]">{asset.use}</p>
                    </div>
                    <a
                      href={asset.file}
                      download
                      className="shrink-0 rounded-md border border-white/12 px-2.5 py-1.5 text-[11px] font-semibold text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white"
                    >
                      Download
                    </a>
                  </div>
                  <p className="mt-3 truncate font-mono text-[10.5px] text-[#55606F]">{asset.file}</p>
                </li>
              ))}
            </ul>

            <SubHead>Tokens</SubHead>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#0B0C0E] px-4 py-3 font-mono text-[11px] leading-6 text-[#CBD5E1]">
              <code>{`--astro-space-black: #000000;
--astro-abyss: #0B0C0E;
--astro-red: #FF0000;   /* mark only */
--astro-indigo: #4F46E5;
--astro-cyan: #06B6D4;
--astro-white: #F8FAFC;
--astro-slate: #64748B;`}</code>
            </pre>
          </Section>

          <footer className="mt-12 border-t border-white/[0.07] pt-6 text-[11.5px] leading-5 text-[#6E7C93]">
            <p>
              Guidelines v1.0 · October 2026. ASTRO is the identity layer for Bleek, Koba.games, SnagChat and KOBAbot.
              When these rules and a shipped screen disagree, the rules win and the screen gets fixed.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href="/astro" className="transition-colors hover:text-[#F8FAFC]">
                Identity
              </Link>
              <a href={ASTRO_DEVELOPER_DOCS} className="transition-colors hover:text-[#F8FAFC]">
                Developers
              </a>
              <Link href="/astro/profile" className="transition-colors hover:text-[#F8FAFC]">
                Profile preview
              </Link>
              <Link href="/app" className="transition-colors hover:text-[#F8FAFC]">
                Open Bleek
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </main>
  );
}
