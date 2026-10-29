"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "register" | "login";

const FIELD =
  "w-full rounded-lg border border-white/10 bg-[#111318] px-3.5 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#5B6675] focus-visible:border-[#4F46E5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]";

export function AuthCard({
  available,
  signedInHandle,
  suspended = false,
  next,
}: {
  available: boolean;
  signedInHandle: string | null;
  suspended?: boolean;
  next?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const endpoint = mode === "register" ? "/api/astro/auth/register" : "/api/astro/auth/login";
      const payload =
        mode === "register"
          ? { handle, displayName: displayName.trim() || handle, password }
          : { handle, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "That did not work. Try again.");
        return;
      }

      // Only same-origin paths are honoured, so ?next can never bounce off-site.
      const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
      router.push(destination);
      router.refresh();
    } catch {
      setError("Could not reach the ASTRO service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
      {!available ? (
        <>
          <h2 className="text-lg font-semibold text-[#F8FAFC]">Sign-in needs a database</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">
            Set <code className="text-[#CBD5E1]">DATABASE_URL</code> and{" "}
            <code className="text-[#CBD5E1]">ASTRO_AUTH_SECRET</code>, then run{" "}
            <code className="text-[#CBD5E1]">npm run db:deploy</code>. Accounts, wallets and sessions live in PostgreSQL.
          </p>
          <Link
            href="/astro"
            className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-1.5 text-[13px] font-medium text-[#F8FAFC] transition-colors hover:border-white/30"
          >
            See the profile preview
          </Link>
        </>
      ) : suspended ? (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FCA5A5]">Access paused</p>
          <h2 className="mt-2 text-lg font-semibold text-[#F8FAFC]">This account is suspended</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">
            Bleek, the operations console and developer keys are unavailable while the suspension is in place. Sign out
            to use a different ASTRO account, or contact support if you believe this is a mistake.
          </p>
          <button
            type="button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try {
                await fetch("/api/astro/auth/logout", { method: "POST" });
                router.push("/");
                router.refresh();
              } finally {
                setSigningOut(false);
              }
            }}
            className="mt-5 flex w-full items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </>
      ) : signedInHandle ? (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#64748B]">Signed in</p>
          <h2 className="mt-2 text-lg font-semibold text-[#F8FAFC]">@{signedInHandle}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">
            Your ASTRO session is active. Jump back into the chat client, or review the profile chips your account is
            carrying.
          </p>
          <Link
            href="/app"
            className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA]"
          >
            Open Bleek
          </Link>
          <Link
            href="/astro"
            className="mt-2 flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white"
          >
            Manage profile
          </Link>
        </>
      ) : (
        <>
          <div className="flex rounded-full border border-white/10 bg-[#111318] p-1" role="tablist" aria-label="ASTRO access">
            {(
              [
                { key: "register" as const, label: "Create account" },
                { key: "login" as const, label: "Log in" },
              ]
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={mode === tab.key}
                onClick={() => {
                  setMode(tab.key);
                  setError(null);
                }}
                className={`flex-1 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  mode === tab.key ? "bg-[#4F46E5] text-white" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <h2 className="mt-5 text-lg font-semibold text-[#F8FAFC]">
            {mode === "register" ? "Claim your ASTRO handle" : "Welcome back"}
          </h2>
          <p className="mt-1 text-[13px] leading-6 text-[#94A3B8]">
            {mode === "register"
              ? "One handle, one wallet. It works in Bleek, Koba.games, SnagChat and KOBAbot from the moment you sign up."
              : "Sign in with the handle and password you registered."}
          </p>

          {next === "/app" ? (
            <p className="mt-4 rounded-lg border border-[#4F46E5]/35 bg-[#4F46E5]/10 px-3 py-2 text-[12px] leading-5 text-[#C7D2FE]">
              Sign in to open Bleek with your ASTRO handle.
            </p>
          ) : null}

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <label htmlFor="auth-handle" className="mb-1.5 block text-[12px] font-medium text-[#CBD5E1]">
                Handle
              </label>
              <input
                id="auth-handle"
                name="handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder="@koba"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                className={FIELD}
              />
            </div>

            {mode === "register" ? (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-[12px] font-medium text-[#CBD5E1]">
                  Display name
                </label>
                <input
                  id="auth-name"
                  name="displayName"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Koba"
                  autoComplete="nickname"
                  className={FIELD}
                />
              </div>
            ) : null}

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-[12px] font-medium text-[#CBD5E1]">
                Password
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                minLength={8}
                required
                className={FIELD}
              />
            </div>

            {error ? (
              <p role="alert" className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-[12px] leading-5 text-[#FCA5A5]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:bg-[#4F46E5]/40 disabled:text-white/60"
            >
              {busy ? "Working…" : mode === "register" ? "Create ASTRO account" : "Log in"}
            </button>
          </form>

          <p className="mt-4 text-[11px] leading-5 text-[#64748B]">
            Handles are lowercase and unique per ASTRO. New accounts start with 250 coins in the shared wallet.
          </p>
        </>
      )}
    </div>
  );
}
