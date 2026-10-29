"use client";

import { useEffect, useState } from "react";
import { redirectOrigin, signInPopupMessage, signInReturnUrl } from "@/lib/astro/signin-url";

/**
 * The popup half of the sign-in handoff, for a member who was already signed in
 * when the popup opened. It posts one message to the opener and closes the
 * window; when there is no opener to answer, it offers the redirect instead of
 * leaving a dead window on screen.
 */
export function SignInHandoff({
  appName,
  redirectUri,
  state,
  handle,
  astroId,
}: {
  appName: string;
  redirectUri: string;
  state: string;
  handle: string;
  astroId: string;
}) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const origin = redirectOrigin(redirectUri);
    const opener = window.opener as Window | null;

    if (!opener || !origin) {
      setBlocked(true);
      return;
    }

    opener.postMessage(signInPopupMessage(state, { handle, astroId }), origin);
    window.close();
  }, [redirectUri, state, handle, astroId]);

  if (blocked) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#06B6D4]">Signed in</p>
        <h1 className="mt-2 text-lg font-semibold text-[#F8FAFC]">@{handle}</h1>
        <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">
          {appName} did not leave a window to answer, so continue there directly. You are already signed in.
        </p>
        <a
          href={signInReturnUrl(redirectUri, state, { handle, astroId })}
          className="mt-5 flex w-full items-center justify-center rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA]"
        >
          Continue to {appName}
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0B0C0E] p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#64748B]">Signed in</p>
      <h1 className="mt-2 text-lg font-semibold text-[#F8FAFC]">@{handle}</h1>
      <p className="mt-2 text-[13px] leading-6 text-[#94A3B8]">Handing you back to {appName}…</p>
    </div>
  );
}
