"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PLAY_PLATFORMS, REGIONS } from "@/lib/astro/regions";
import { redirectOrigin, signInPopupMessage, signInReturnUrl } from "@/lib/astro/signin-url";

type Mode = "login" | "register";

const FIELD =
  "w-full rounded-lg border border-white/10 bg-[#111214] px-3.5 py-2.5 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus-visible:border-[#4F46E5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]";

const LABEL = "mb-1.5 block text-[12px] font-medium text-[#CBD5E1]";

export function SignInPanel({
  appName,
  redirectUri,
  state,
  popup,
}: {
  /** The app that sent the member here, when an integration started the sign-in. */
  appName: string | null;
  redirectUri: string | null;
  state: string | null;
  popup: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [identifier, setIdentifier] = useState("");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[0].value);
  const [platform, setPlatform] = useState<string>("PC");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [finishedHandle, setFinishedHandle] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "register" && confirm !== password) {
      setError("Those passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const endpoint = mode === "register" ? "/api/astro/auth/register" : "/api/astro/auth/login";
      const payload =
        mode === "register"
          ? { handle, displayName: displayName.trim() || handle, email, password, region, platform }
          : { identifier: identifier.trim(), password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        account?: { handle: string; astroId: string };
      };

      if (!response.ok || !data.account) {
        setError(data.error ?? "That did not work. Try again.");
        return;
      }

      const account = data.account;

      // An integration started this sign-in: hand the account back the way it asked for.
      if (redirectUri && state) {
        if (!popup) {
          window.location.assign(signInReturnUrl(redirectUri, state, account));
          return;
        }

        const origin = redirectOrigin(redirectUri);
        const opener = window.opener as Window | null;
        if (opener && origin) {
          opener.postMessage(signInPopupMessage(state, account), origin);
          window.close();
          return;
        }

        // No opener to answer (the window was opened without one, or the browser dropped it).
        setFinishedHandle(account.handle);
        return;
      }

      router.push("/astro");
      router.refresh();
    } catch {
      setError("Could not reach the ASTRO service.");
    } finally {
      setBusy(false);
    }
  }

  if (finishedHandle) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#06B6D4]">Signed in</p>
        <h2 className="mt-2 text-lg font-semibold text-[#F8FAFC]">@{finishedHandle}</h2>
        <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">
          The app that opened this window is no longer listening, so nothing was handed back. Close this window and start
          the sign-in again from the app.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
      <h1 className="text-lg font-semibold text-[#F8FAFC]">
        {appName ? `Sign in to continue to ${appName}` : "Sign in to Astrocan"}
      </h1>
      <p className="mt-1 text-[13px] leading-6 text-[#94A3B8]">
        {appName
          ? "One ASTRO account carries your handle, wallet and profile chips into every product."
          : "Your ASTRO account is the same identity across Bleek, Koba.games, SnagChat and KOBAbot."}
      </p>

      <div
        className="mt-5 flex rounded-full border border-white/10 bg-[#111214] p-1"
        role="tablist"
        aria-label="Astrocan access"
      >
        {(
          [
            { key: "login" as const, label: "Log in" },
            { key: "register" as const, label: "Create account" },
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

      <form onSubmit={submit} className="mt-5 space-y-3">
        {mode === "login" ? (
          <div>
            <label htmlFor="account-identifier" className={LABEL}>
              Email or handle
            </label>
            <input
              id="account-identifier"
              name="identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              className={FIELD}
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="account-handle" className={LABEL}>
                Handle
              </label>
              <input
                id="account-handle"
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

            <div>
              <label htmlFor="account-name" className={LABEL}>
                Display name
              </label>
              <input
                id="account-name"
                name="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Koba"
                autoComplete="nickname"
                className={FIELD}
              />
            </div>

            <div>
              <label htmlFor="account-email" className={LABEL}>
                Email
              </label>
              <input
                id="account-email"
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
                <label htmlFor="account-region" className={LABEL}>
                  Region
                </label>
                <select
                  id="account-region"
                  name="region"
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className={FIELD}
                >
                  {REGIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#111214]">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset>
                <legend className={LABEL}>You play on</legend>
                <div className="flex rounded-lg border border-white/10 bg-[#111214] p-1" role="radiogroup" aria-label="Platform">
                  {PLAY_PLATFORMS.map((option) => (
                    <label
                      key={option.value}
                      title={option.hint}
                      className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-[12px] font-semibold transition-colors ${
                        platform === option.value ? "bg-[#4F46E5] text-white" : "text-[#94A3B8] hover:text-[#F8FAFC]"
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
        )}

        <div>
          <label htmlFor="account-password" className={LABEL}>
            Password
          </label>
          <input
            id="account-password"
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
            <label htmlFor="account-confirm" className={LABEL}>
              Confirm password
            </label>
            <input
              id="account-confirm"
              name="confirmPassword"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Type it again"
              autoComplete="new-password"
              minLength={8}
              required
              aria-invalid={confirm.length > 0 && confirm !== password}
              className={FIELD}
            />
            {confirm.length > 0 && confirm !== password ? (
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
          className="w-full rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:bg-[#4F46E5]/40 disabled:text-white/60"
        >
          {busy ? "Working…" : mode === "register" ? "Create ASTRO account" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-[11px] leading-5 text-[#64748B]">
        New accounts start with 250 ASTRO Coins in their ASTRO wallet. Nothing about your account is shared with{" "}
        {appName ? appName : "a product"} until you finish signing in.
      </p>
    </div>
  );
}
