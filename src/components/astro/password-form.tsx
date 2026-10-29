"use client";

import { useState } from "react";

/**
 * Password change with the current password as proof. The server re-checks
 * every rule; this form only saves a round trip on obvious mistakes.
 */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNote(null);

    if (next.length < 8) {
      setError("New passwords need at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Those new passwords do not match.");
      return;
    }
    if (next === current) {
      setError("Choose a password you have not used on this account.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/astro/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "That password could not be changed.");
        return;
      }

      setNote("Password changed. Use the new one the next time you sign in.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("Could not reach the ASTRO service.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-[13px] text-white outline-none transition-colors placeholder:text-[#5B6675] focus-visible:border-[#4F46E5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]";

  if (!hasPassword) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111214] p-4">
        <p className="text-[12.5px] font-semibold text-white">Password</p>
        <p className="mt-1 text-[12.5px] leading-5 text-neutral-400">
          This account signs in through Steam or Xbox, so there is no password to change.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 bg-[#111214] p-4">
      <p className="text-[12.5px] font-semibold text-white">Password</p>
      <p className="mt-1 text-[11.5px] leading-5 text-neutral-400">
        Changing it keeps you signed in here. Other devices stay signed in until their session expires.
      </p>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-neutral-300">Current</span>
          <input
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
            required
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-neutral-300">New</span>
          <input
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className={field}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-neutral-300">Confirm new</span>
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            className={field}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !current || !next || !confirm}
          className="rounded-lg bg-[#4F46E5] px-3.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Changing…" : "Change password"}
        </button>
        <p aria-live="polite" className="min-w-0 flex-1 text-[11.5px] leading-5 text-neutral-400">
          {error ? <span className="text-[#FCA5A5]">{error}</span> : note}
        </p>
      </div>
    </form>
  );
}
