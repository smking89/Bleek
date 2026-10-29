import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { astroConfigured } from "@astro/core/db";
import { SignInHandoff } from "@/components/account/sign-in-handoff";
import { SignInPanel } from "@/components/account/sign-in-panel";
import { deploymentOrigins } from "@/lib/astro/origin";
import { signInApp, type SignInApp } from "@/lib/astro/signin";
import { signInReturnUrl } from "@/lib/astro/signin-url";
import { currentAccount } from "@/lib/session";

export const metadata: Metadata = {
  title: "Astrocan — sign in to your ASTRO account",
  description: "Sign in or create an ASTRO account at astrocan.io/account, then return to the app that sent you.",
};

type Search = { redirect_uri?: string; state?: string; mode?: string };

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-black text-[#F8FAFC]">
      <header className="border-b border-white/[0.06] bg-black">
        <div className="mx-auto flex h-16 w-full max-w-md items-center justify-between gap-4 px-5">
          <Link href="https://astrocan.io" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/astro-icon.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
            <span className="text-[12px] font-bold uppercase tracking-[0.22em]">Astrocan</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-[#64748B]">Account</span>
          </Link>
          <Link
            href="/astro/profile"
            className="rounded-full px-3 py-1.5 text-[12px] font-medium text-[#94A3B8] transition-colors hover:text-[#F8FAFC]"
          >
            Profile
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-md px-5 py-10 sm:py-14">{children}</section>

      <footer className="mx-auto w-full max-w-md px-5 pb-10 text-[11px] leading-5 text-[#64748B]">
        <p>
          Astrocan is the developer platform for ASTRO. Sign-in stays on this host; no other app receives your password.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/astro" className="transition-colors hover:text-[#F8FAFC]">
            Identity
          </Link>
          <a href="https://developer.astrocan.io" className="transition-colors hover:text-[#F8FAFC]">
            Developer portal
          </a>
          <Link href="/app" className="transition-colors hover:text-[#F8FAFC]">
            Open Bleek
          </Link>
        </div>
      </footer>
    </main>
  );
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { redirect_uri: rawRedirect, state: rawState, mode } = await searchParams;
  const redirectUri = rawRedirect?.trim() || null;
  const state = rawState?.trim() || null;
  const popup = mode === "popup";

  const configured = astroConfigured();
  const account = configured ? await currentAccount().catch(() => null) : null;

  // An integration started this sign-in only after its URI matched a registered app.
  let app: SignInApp | null = null;
  let problem: string | null = null;

  if (redirectUri) {
    if (!configured) {
      problem = "This deployment has no account database, so an integration sign-in cannot finish here.";
    } else if (!state) {
      problem = "This link is missing its state value, so the sign-in was not started here. Start it again from the app.";
    } else {
      app = await signInApp(redirectUri, await deploymentOrigins());
      if (!app) {
        problem =
          "That redirect_uri is not registered to an active app, so nothing was forwarded. Check the URI registered for your app in the developer portal.";
      }
    }
  }

  const suspended = account?.status === "SUSPENDED";

  // Derived up front so each gate is a plain, fully-narrowed value.
  const callback = app?.redirectUri ?? null;
  const appName = app?.name ?? null;
  const signInState = state ?? null;
  const signedIn = account?.astroId ? { handle: account.handle, astroId: account.astroId } : null;

  if (callback && appName && signInState && signedIn && !suspended) {
    if (popup) {
      return (
        <Shell>
          <SignInHandoff
            appName={appName}
            redirectUri={callback}
            state={signInState}
            handle={signedIn.handle}
            astroId={signedIn.astroId}
          />
        </Shell>
      );
    }

    redirect(signInReturnUrl(callback, signInState, signedIn));
  }

  if (problem) {
    return (
      <Shell>
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FCA5A5]">Sign-in stopped</p>
          <h1 className="mt-2 text-lg font-semibold text-[#F8FAFC]">This sign-in could not start</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">{problem}</p>
          <Link
            href="/account"
            className="mt-5 flex w-full items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-white/30 hover:text-white"
          >
            Sign in to Astrocan instead
          </Link>
        </div>
      </Shell>
    );
  }

  if (suspended) {
    return (
      <Shell>
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FCA5A5]">Access paused</p>
          <h1 className="mt-2 text-lg font-semibold text-[#F8FAFC]">This ASTRO account is suspended</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">
            No app receives a suspended account, so nothing was handed back. Contact support if you believe this is a
            mistake.
          </p>
          <Link
            href="/astro"
            className="mt-5 flex w-full items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-white/30 hover:text-white"
          >
            Back to ASTRO
          </Link>
        </div>
      </Shell>
    );
  }

  if (callback && appName && signInState) {
    return (
      <Shell>
        <SignInPanel appName={appName} redirectUri={callback} state={signInState} popup={popup} />
      </Shell>
    );
  }

  if (account) {
    return (
      <Shell>
        <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#64748B]">Signed in</p>
          <h1 className="mt-2 text-lg font-semibold text-[#F8FAFC]">@{account.handle}</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">{account.displayName}</p>
          <p className="mt-3 font-mono text-[11px] text-[#64748B]">{account.astroId}</p>
          <Link
            href="/astro/profile"
            className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA]"
          >
            Manage profile
          </Link>
          <Link
            href="/app"
            className="mt-2 flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white"
          >
            Open Bleek
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <SignInPanel appName={null} redirectUri={null} state={null} popup={false} />
    </Shell>
  );
}
