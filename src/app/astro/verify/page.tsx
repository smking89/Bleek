import type { Metadata } from "next";
import Link from "next/link";
import { AstroMark } from "@/components/brand/astro-brand";
import { AstroDataError } from "@astro/core/errors";
import { confirmEmail } from "@/lib/astro/email-verification";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ASTRO — verify your email",
  robots: { index: false },
};

type Outcome = "verified" | "invalid" | "expired" | "missing";

const COPY: Record<Outcome, { title: string; body: string; tone: string }> = {
  verified: {
    title: "Email verified",
    body: "This address now receives account mail for your ASTRO account. You can close this tab.",
    tone: "text-[#23A55A]",
  },
  expired: {
    title: "That link expired",
    body: "Verification links last 24 hours. Sign in and request a new one from your ASTRO profile.",
    tone: "text-[#F0B232]",
  },
  invalid: {
    title: "That link is not valid",
    body: "It may already have been used, or replaced by a newer email. Request a fresh link from your ASTRO profile.",
    tone: "text-[#F23F43]",
  },
  missing: {
    title: "No token in that link",
    body: "Open the link from the verification email exactly as it was sent, or request a new one from your ASTRO profile.",
    tone: "text-[#94A3B8]",
  },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  let outcome: Outcome = "missing";
  let email: string | null = null;

  if (token) {
    try {
      const result = await confirmEmail(token);
      outcome = "verified";
      email = result.email;
    } catch (error) {
      if (!(error instanceof AstroDataError)) throw error;
      outcome = error.code === "TOKEN_EXPIRED" ? "expired" : "invalid";
    }
  }

  const copy = COPY[outcome];

  return (
    <main className="flex min-h-dvh items-center justify-center bg-black px-5 py-12 text-[#F8FAFC]">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
        <div className="flex items-center gap-3">
          <AstroMark size={26} />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">ASTRO</span>
        </div>

        <p className={`mt-6 text-[10.5px] font-bold uppercase tracking-[0.18em] ${copy.tone}`}>
          {outcome === "verified" ? "Verified" : "Email verification"}
        </p>
        <h1 className="mt-2 text-[22px] font-semibold tracking-tight">{copy.title}</h1>
        {outcome === "verified" && email ? (
          <p className="mt-2 break-all font-mono text-[12px] text-[#CBD5E1]">{email}</p>
        ) : null}
        <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">{copy.body}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/astro/profile"
            className="rounded-lg bg-[#F8FAFC] px-4 py-2 text-[13px] font-semibold text-black transition-colors hover:bg-[#E2E8F0]"
          >
            Go to your profile
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-white/15 px-4 py-2 text-[13px] font-medium text-[#CBD5E1] transition-colors hover:border-white/30 hover:text-white"
          >
            Bleek
          </Link>
        </div>

        <p className="mt-6 text-[11px] leading-5 text-[#6E7C93]">
          ASTRO never asks for your password by email, and this link never signs you in on its own.
        </p>
      </div>
    </main>
  );
}
