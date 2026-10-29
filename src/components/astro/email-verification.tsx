"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function secondsUntil(at: number | null): number {
  if (!at) return 0;
  return Math.max(0, Math.ceil((at - Date.now()) / 1000));
}

/**
 * Email state for the signed-in account, with a resend that never relies on a
 * mail provider being configured: the API reports whether it delivered.
 */
export function EmailVerification({
  email,
  verified,
  resendAt,
}: {
  email: string | null;
  verified: boolean;
  resendAt: number | null;
}) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(verified);
  const [cooldown, setCooldown] = useState(() => secondsUntil(resendAt));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function send() {
    setBusy(true);
    setError(null);
    setNote(null);
    setLink(null);

    try {
      const response = await fetch("/api/astro/email/resend", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        verified?: boolean;
        delivered?: boolean;
        email?: string;
        url?: string | null;
      };

      if (response.status === 429) setCooldown(60);
      if (!response.ok) {
        setError(data.error ?? "That email could not be sent.");
        return;
      }
      if (data.verified) {
        setIsVerified(true);
        return;
      }

      setCooldown(60);
      setNote(
        data.delivered
          ? `Verification email sent to ${data.email}.`
          : "No mail sender is configured on this deployment, so use the link below.",
      );
      setLink(data.url ?? null);
      router.refresh();
    } catch {
      setError("Could not reach the ASTRO service.");
    } finally {
      setBusy(false);
    }
  }

  if (!email) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111214] p-4">
        <p className="text-[12.5px] font-semibold text-white">Email</p>
        <p className="mt-1 text-[12.5px] leading-5 text-neutral-400">
          This account was created through Steam or Xbox and has no address on file.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#111214] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-white">Email</p>
          <p className="mt-1 break-all font-mono text-[12px] text-neutral-300">{email}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] leading-5 text-neutral-400">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${isVerified ? "bg-[#06B6D4]" : "bg-[#F0B232]"}`}
            />
            {isVerified ? "Verified address" : "Not verified yet"}
          </p>
        </div>

        {isVerified ? (
          <span className="rounded-full border border-[#06B6D4]/40 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#67E8F9]">
            Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void send()}
            disabled={busy || cooldown > 0}
            className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-[12px] font-semibold text-[#F8FAFC] transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Send verification email"}
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-3 text-[11.5px] leading-5 text-neutral-400">
        {error ? <span className="text-[#FCA5A5]">{error}</span> : note}
      </p>

      {link ? (
        <a
          href={link}
          className="mt-2 block break-all rounded-lg border border-white/10 bg-black px-3 py-2 font-mono text-[11px] text-[#A5B4FC] hover:underline"
        >
          {link}
        </a>
      ) : null}
    </div>
  );
}
