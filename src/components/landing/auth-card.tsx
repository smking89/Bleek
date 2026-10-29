"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLAY_PLATFORMS, REGIONS } from "@/lib/astro/regions";

type Mode = "register" | "login";

const FIELD =
  "w-full rounded-lg border border-white/10 bg-[#1A1A1E] px-3.5 py-2.5 text-sm text-[#FAFAFA] outline-none transition-colors placeholder:text-[#8A8A94] focus-visible:border-[#7C3AED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED]";

const AUTH_ERRORS: Record<string, string> = {
  steam_cancelled: "Steam sign-in was cancelled before it finished.",
  steam_failed: "Steam could not verify that sign-in. Try again.",
  xbox_cancelled: "Xbox sign-in was cancelled before it finished.",
  xbox_failed: "Microsoft could not complete that Xbox sign-in. Try again.",
  xbox_unconfigured: "Xbox sign-in is not configured on this deployment.",
};

export function AuthCard({
  available,
  signedInHandle,
  suspended = false,
  next,
  providers = { steam: true, xbox: false },
  authError = null,
  initialMode = "register",
}: {
  available: boolean;
  signedInHandle: string | null;
  suspended?: boolean;
  next?: string;
  providers?: { steam: boolean; xbox: boolean };
  authError?: string | null;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [region, setRegion] = useState<string>("NORTH_AMERICA");
  const [platform, setPlatform] = useState<string>("PC");
  const [error, setError] = useState<string | null>(authError ? AUTH_ERRORS[authError] ?? "That sign-in did not finish." : null);
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "register" && confirmPassword !== password) {
      setError("Those passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const endpoint = mode === "register" ? "/api/astro/auth/register" : "/api/astro/auth/login";
      const payload =
        mode === "register"
          ? { handle, displayName: displayName.trim() || handle, email, password, region, platform }
          : { identifier: handle.trim(), password };

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
    <div className="rounded-2xl border border-white/[0.08] bg-[#121214] p-6">
      {!available ? (
        <>
          <h2 className="text-lg font-semibold text-[#FAFAFA]">Sign-in needs a database</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#A1A1AA]">
            Set <code className="text-[#D4D4D8]">DATABASE_URL</code> and{" "}
            <code className="text-[#D4D4D8]">ASTRO_AUTH_SECRET</code>, then run{" "}
            <code className="text-[#D4D4D8]">npm run db:deploy</code>. Accounts, wallets and sessions live in PostgreSQL.
          </p>
          <Link
            href="/astro/profile"
            className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-1.5 text-[13px] font-medium text-[#FAFAFA] transition-colors hover:border-white/30"
          >
            See the profile preview
          </Link>
        </>
      ) : suspended ? (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FCA5A5]">Access paused</p>
          <h2 className="mt-2 text-lg font-semibold text-[#FAFAFA]">This account is suspended</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#A1A1AA]">
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
            className="mt-5 flex w-full items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-[#D4D4D8] transition-colors hover:border-white/30 hover:text-white disabled:opacity-50"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </>
      ) : signedInHandle ? (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#71717A]">Signed in</p>
          <h2 className="mt-2 text-lg font-semibold text-[#FAFAFA]">@{signedInHandle}</h2>
          <p className="mt-2 text-[13px] leading-6 text-[#A1A1AA]">
            Your ASTRO session is active. Jump back into the chat client, or review the profile chips your account is
            carrying.
          </p>
          <Link
            href="/app"
            className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6D28D9]"
          >
            Open Bleek
          </Link>
          <Link
            href="/astro/profile"
            className="mt-2 flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-[#D4D4D8] transition-colors hover:border-white/25 hover:text-white"
          >
            Manage profile
          </Link>
        </>
      ) : (
        <>
          <div className="flex rounded-full border border-white/10 bg-[#1A1A1E] p-1" role="tablist" aria-label="ASTRO access">
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
                  mode === tab.key ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <a
              href="/api/astro/auth/steam/start"
              aria-disabled={!providers.steam}
              title={providers.steam ? "Sign in with Steam" : "Steam sign-in is unavailable"}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1A1A1E] px-4 py-2.5 text-sm font-semibold text-[#FAFAFA] transition-colors hover:border-white/25"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1B2838] text-[9px] font-bold text-[#66C0F4]">
                S
              </span>
              Continue with Steam
            </a>
            <a
              href="/api/astro/auth/xbox/start"
              aria-disabled={!providers.xbox}
              title={providers.xbox ? "Sign in with Xbox" : "Add XBOX_CLIENT_ID and XBOX_CLIENT_SECRET to enable Xbox sign-in"}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#1A1A1E] px-4 py-2.5 text-sm font-semibold transition-colors ${
                providers.xbox ? "text-[#FAFAFA] hover:border-white/25" : "cursor-not-allowed text-[#8A8A94]"
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#107C10] text-[9px] font-bold text-white">
                X
              </span>
              Continue with Xbox
            </a>
            {!providers.xbox ? (
              <p className="text-center text-[11px] text-[#8A8A94]">
                Xbox needs an Entra app registration; email and Steam work today.
              </p>
            ) : null}
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[#8A8A94]">
            <span className="h-px flex-1 bg-white/10" />
            or use email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <h2 className="text-lg font-semibold text-[#FAFAFA]">
            {mode === "register" ? "Claim your ASTRO handle" : "Welcome back"}
          </h2>
          <p className="mt-1 text-[13px] leading-6 text-[#A1A1AA]">
            {mode === "register"
              ? "One handle, one wallet. It works in Bleek, Koba.games, SnagChat and KOBAbot from the moment you sign up."
              : "Sign in with your email address or your handle."}
          </p>

          {next === "/app" ? (
            <p className="mt-4 rounded-lg border border-[#7C3AED]/35 bg-[#7C3AED]/10 px-3 py-2 text-[12px] leading-5 text-[#DDD6FE]">
              Sign in to open Bleek with your ASTRO handle.
            </p>
          ) : null}

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <label htmlFor="auth-handle" className="mb-1.5 block text-[12px] font-medium text-[#D4D4D8]">
                {mode === "register" ? "Handle" : "Email or handle"}
              </label>
              <input
                id="auth-handle"
                name="handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder={mode === "register" ? "@koba" : "you@example.com"}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                className={FIELD}
              />
            </div>

            {mode === "register" ? (
              <>
                <div>
                  <label htmlFor="auth-name" className="mb-1.5 block text-[12px] font-medium text-[#D4D4D8]">
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

                <div>
                  <label htmlFor="auth-email" className="mb-1.5 block text-[12px] font-medium text-[#D4D4D8]">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className={FIELD}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="auth-region" className="mb-1.5 block text-[12px] font-medium text-[#D4D4D8]">
                      Region
                    </label>
                    <select
                      id="auth-region"
                      name="region"
                      value={region}
                      onChange={(event) => setRegion(event.target.value)}
                      className={FIELD}
                    >
                      {REGIONS.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[#1A1A1E]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <fieldset>
                    <legend className="mb-1.5 block text-[12px] font-medium text-[#D4D4D8]">You play on</legend>
                    <div className="flex rounded-lg border border-white/10 bg-[#1A1A1E] p-1" role="radiogroup" aria-label="Platform">
                      {PLAY_PLATFORMS.map((option) => (
                        <label
                          key={option.value}
                          title={option.hint}
                          className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-[12px] font-semibold transition-colors ${
                            platform === option.value
                              ? "bg-[#7C3AED] text-white"
                              : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="platform"
                            value={option.value}
                            checked={platform === option.value}
                            onChange={() => setPlatform(option.value)}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </>
            ) : null}

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-[12px] font-medium text-[#D4D4D8]">
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

            {mode === "register" ? (
              <div>
                <label htmlFor="auth-confirm" className="mb-1.5 block text-[12px] font-medium text-[#D4D4D8]">
                  Confirm password
                </label>
                <input
                  id="auth-confirm"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Type it again"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  aria-invalid={confirmPassword.length > 0 && confirmPassword !== password}
                  className={FIELD}
                />
                {confirmPassword.length > 0 && confirmPassword !== password ? (
                  <p className="mt-1 text-[11px] text-[#FCA5A5]">Those passwords do not match yet.</p>
                ) : null}
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-[12px] leading-5 text-[#FCA5A5]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:bg-[#7C3AED]/40 disabled:text-white/60"
            >
              {busy ? "Working…" : mode === "register" ? "Create ASTRO account" : "Log in"}
            </button>
          </form>

          <p className="mt-4 text-[11px] leading-5 text-[#71717A]">
            New accounts start with 250 ASTRO Coins in their ASTRO wallet. Your email and region stay on this deployment and are
            never sent to a third party.
          </p>
        </>
      )}
    </div>
  );
}
