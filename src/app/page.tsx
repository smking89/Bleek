import type { Metadata } from "next";
import Link from "next/link";
import { astroConfigured } from "@astro/core/db";
import { CharacterArt } from "@/components/cosmetics/character";
import { Icon } from "@/components/icons";
import { currentAccount } from "@/lib/session";
import type { CharacterKey } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bleek — chat that actually feels like a space",
  description:
    "Real-time text channels, drop-in voice rooms, chat/gallery/canvas layouts, creator shops and animated cosmetics. Sign in with your ASTRO handle.",
};

const VIEWS = [
  {
    name: "Chat view",
    body: "A clean, lightning-fast stream built for rapid-fire messaging.",
  },
  {
    name: "Gallery view",
    body: "A clean grid designed specifically for dropping art, links, and media.",
  },
  {
    name: "Canvas view",
    body: "A shared document space with markdown support for writing notes or guidelines together.",
  },
] as const;

const COSMETICS = [
  { slot: "Decorations", detail: "Animated frames on your avatar", tone: "from-[#7C3AED]/35 via-[#7C3AED]/5 to-transparent" },
  { slot: "Profile effects", detail: "Ambient motion on your card", tone: "from-[#06B6D4]/30 via-[#06B6D4]/5 to-transparent" },
  { slot: "Nameplates", detail: "Shimmering treatment for your name", tone: "from-[#A855F7]/30 via-[#A855F7]/5 to-transparent" },
  { slot: "App themes", detail: "Recolour the whole client", tone: "from-[#23A55A]/25 via-[#23A55A]/5 to-transparent" },
] as const;

/** Decorative roster art for the voice illustration. No member names or counts. */
const VOICE_MEMBERS: CharacterKey[] = ["comet", "tide", "sprout", "static"];

/** The API and its keys are documented with ASTRO, not with Bleek. */
const ASTRO_DEVELOPER_DOCS = "https://github.com/smking89/Astro/blob/main/DEVELOPERS.md";

type FooterLink = { label: string; href?: string; soon?: boolean };

const FOOTER: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Open Web App", href: "/app" },
      { label: "Integration API", href: ASTRO_DEVELOPER_DOCS },
      { label: "Desktop Client", soon: true },
    ],
  },
  {
    title: "Ecosystem",
    links: [
      { label: "ASTRO Identity Layer", href: "/astro" },
      { label: "Community Directory", href: "/app" },
      { label: "Creator Shops", href: "/app" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API Documentation", href: ASTRO_DEVELOPER_DOCS },
      { label: "Style Guide", href: "/astro/brand" },
      { label: "Server Security Setup", href: "/app" },
    ],
  },
  {
    title: "Terms",
    links: [{ label: "Platform Rules", soon: true }, { label: "Data Transparency Log", soon: true }],
  },
];

function SectionHead({ title, body }: { title: string; body?: string }) {
  return (
    <>
      <h2 className="max-w-2xl text-[26px] font-semibold leading-[1.2] tracking-tight text-[#FAFAFA] sm:text-[32px]">
        {title}
      </h2>
      {body ? <p className="mt-3 max-w-2xl text-[14.5px] leading-7 text-[#A1A1AA]">{body}</p> : null}
    </>
  );
}

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

  const openHref = handle ? "/app" : "/astro?next=/app#access";

  return (
    <main className="min-h-dvh bg-black text-[#FAFAFA]">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Bleek home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bleek-icon.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
            <span className="text-[12px] font-bold uppercase tracking-[0.22em]">Bleek</span>
          </Link>

          <div className="flex items-center gap-2">
            {handle ? (
              <span className="hidden text-[12px] text-[#71717A] sm:block">@{handle}</span>
            ) : null}
            <Link
              href={openHref}
              className="rounded-full bg-[#7C3AED] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#6D28D9]"
            >
              Open Bleek
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-4xl px-5 pb-20 pt-20 text-center sm:pt-28">
        <h1 className="mx-auto max-w-3xl text-[38px] font-bold leading-[1.06] tracking-tight text-[#FAFAFA] sm:text-[58px]">
          Chat that actually feels like a space, not a boring text box.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-[#A1A1AA]">
          Bleek gives your community real-time text channels, voice chat, and built-in shops where creators can sell
          their own custom items. Sign in with your ASTRO handle to keep your exact profile, wallet, and history across
          every app and game we plug into.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={openHref}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#7C3AED] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#6D28D9] sm:w-auto"
          >
            Open Bleek
          </Link>
          <Link
            href="/astro?mode=login&next=/app#access"
            className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-white/15 bg-black px-7 text-[15px] font-semibold text-[#FAFAFA] transition-colors hover:border-white/35 sm:w-auto"
          >
            Log in with ASTRO
          </Link>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <SectionHead
            title="Pick how you want to talk."
            body="You can switch your channel view right from the header depending on what you're doing. No clutter, just the format that fits the moment."
          />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {VIEWS.map((view) => (
              <article key={view.name} className="rounded-xl border border-white/[0.08] bg-[#121214] p-5">
                <h3 className="text-[15px] font-semibold">{view.name}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#A1A1AA]">{view.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHead
              title="Just drop in. No invites needed."
              body="Stop dealing with group calls that break up the second someone hangs up. Bleek's voice chat channels are permanent fixtures in your server. See who's hanging out, click to join, and bounce whenever you want. The channel stays alive before, during, and long after your session ends."
            />
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-4">
            <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#71717A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" aria-hidden />
              Koba Studio
            </div>

            <div className="mt-3 rounded-lg bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#FAFAFA]">
                <Icon name="volume" size={15} className="text-[#A1A1AA]" />
                voice-general
                <span className="ml-auto rounded-full bg-[#06B6D4]/15 px-2 py-0.5 text-[10px] font-bold text-[#67E8F9]">
                  Live
                </span>
              </div>

              <ul className="mt-3 grid grid-cols-2 gap-2">
                {VOICE_MEMBERS.map((member, index) => (
                  <li
                    key={member}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black px-2 py-1.5"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
                      style={{
                        background:
                          index % 2 === 0
                            ? "linear-gradient(145deg, #7C3AED, #06B6D4)"
                            : "linear-gradient(145deg, #0EA5E9, #23A55A)",
                      }}
                    >
                      <CharacterArt kind={member} size={32} />
                    </span>
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#06B6D4]" aria-hidden />
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-[11px] text-[#8A8A94]">The room stays open. Join and leave whenever.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cosmetics" className="scroll-mt-20 border-t border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHead
              title="Make your profile completely your own."
              body="Stand out in chat without using the exact same basic emojis as everyone else. Design or buy custom profile decorations, background effects, and text nameplates directly from server shops. Everything scales perfectly and looks incredibly sharp, whether it's sitting on a tiny 16px avatar or a massive profile card."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {COSMETICS.map((item) => (
              <div
                key={item.slot}
                className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#121214]"
              >
                <div className={`h-20 bg-gradient-to-br ${item.tone}`} aria-hidden />
                <div className="px-3.5 py-3">
                  <p className="text-[12.5px] font-semibold">{item.slot}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#71717A]">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <SectionHead
            title="See exactly who's around to link up."
            body="Never guess if your group is online or busy. Check your server sidebar to see instantly who is active, what games they're playing, or if they're just lurking in a channel. For integrated titles, you can look up their live match details or join their lobby with a single click."
          />
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <SectionHead
            title="Never sit around waiting for a conversation."
            body="Keep the group active. Drop video links to sync layouts, queue audio streams directly in your channel, or review real-time media galleries side-by-side. Bleek handles live text threads, permanent voice connections, and community media sharing right inside a single chat window."
          />
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[1fr_auto]">
          <SectionHead
            title="Your shop, your rules."
            body="Design your own profile decorations, background effects, or text nameplates and sell them directly in your server's shop. Every sale is a straight 90/10 split to the creator — even if someone buys it as a gift."
          />

          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "90", unit: "%", label: "to the creator" },
              { value: "10", unit: "%", label: "to the platform" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.08] bg-[#121214] px-5 py-4 text-center"
              >
                <p className="text-[34px] font-bold leading-none tabular-nums text-[#FAFAFA]">
                  {stat.value}
                  <span className="text-[18px] text-[#71717A]">{stat.unit}</span>
                </p>
                <p className="mt-2 text-[10.5px] uppercase tracking-[0.14em] text-[#71717A]">{stat.label}</p>
              </div>
            ))}
            <p className="col-span-2 text-right text-[11px] uppercase tracking-[0.14em] text-[#7C3AED]">
              Creator split on every sale
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <SectionHead
            title="Keep the garbage out of your server."
            body="Just type out what you want to catch in plain language — like spam links or caps-lock floods. Bleek scans messages instantly and drops them into a queue for your mods to review."
          />
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16">
          <SectionHead
            title="Access your communities from anywhere."
            body="Jump between devices seamlessly without losing your place. Whether you are browsing feeds on your phone, managing files from your desktop client, or connecting your identity via web links, Bleek keeps your active notifications and settings perfectly aligned across platforms."
          />
        </div>
      </section>

      <section className="border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-5 py-20 text-center">
          <h2 className="max-w-2xl text-[28px] font-semibold leading-[1.2] tracking-tight sm:text-[36px]">
            That is the end of the page. Time to join a server.
          </h2>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href={openHref}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-[#7C3AED] px-7 text-[15px] font-semibold text-white transition-colors hover:bg-[#6D28D9]"
            >
              Open Bleek
            </Link>
            <Link
              href="/app"
              className="text-[13px] font-medium text-[#A1A1AA] underline-offset-4 transition-colors hover:text-[#FAFAFA] hover:underline"
            >
              Check out the community directory
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-5 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {FOOTER.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#71717A]">{column.title}</h2>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href ? (
                        <Link
                          href={link.href}
                          className="text-[12.5px] text-[#A1A1AA] transition-colors hover:text-[#FAFAFA]"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#6B6B75]">
                          {link.label}
                          <span className="rounded border border-white/10 px-1 py-px text-[9px] font-semibold uppercase tracking-[0.08em]">
                            Soon
                          </span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 text-[11.5px] text-[#71717A] sm:flex-row sm:items-center">
            <p>Bleek runs on the ASTRO identity layer — one handle, one wallet, one profile across products.</p>
            <Link href="/astro" className="transition-colors hover:text-[#FAFAFA]">
              ASTRO identity
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
