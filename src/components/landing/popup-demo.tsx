"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readSignInPopupMessage, type SignInAccount } from "@/lib/astro/signin-url";

/** The callback this demo registers itself: a first-party page on this host. */
const CALLBACK_PATH = "/astro/signin-demo/callback";
const POPUP_NAME = "astrocan-signin-demo";
const POPUP_FEATURES = "popup,width=460,height=740";

type Phase =
  | { kind: "idle" }
  | { kind: "waiting" }
  | { kind: "done"; account: SignInAccount }
  | { kind: "error"; message: string };

/**
 * A working copy of the popup handoff, on the landing page. It opens
 * `/account` with its own state, then accepts exactly one message back: the
 * source must be Astrocan, the origin this page, and the state the one it sent.
 * Anything else is ignored, which is the same check an integration has to make.
 */
export function PopupSignInDemo() {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [redirectHref, setRedirectHref] = useState<string | null>(null);
  const pendingState = useRef<string | null>(null);
  const popupWindow = useRef<Window | null>(null);
  const watcher = useRef<number | null>(null);

  const stopWatching = useCallback(() => {
    if (watcher.current !== null) {
      window.clearInterval(watcher.current);
      watcher.current = null;
    }
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // Only this page can answer: another origin is never our popup.
      if (event.origin !== window.location.origin) return;

      const account = readSignInPopupMessage(event.data, pendingState.current);
      if (!account) return;

      pendingState.current = null;
      stopWatching();
      setPhase({ kind: "done", account });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [stopWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  const start = useCallback(() => {
    const state = crypto.randomUUID();
    const callback = `${window.location.origin}${CALLBACK_PATH}`;
    const query = `redirect_uri=${encodeURIComponent(callback)}&state=${encodeURIComponent(state)}`;

    // The same handoff without a popup, for a browser that blocks them.
    setRedirectHref(`/account?${query}`);

    const opened = window.open(`/account?${query}&mode=popup`, POPUP_NAME, POPUP_FEATURES);
    if (!opened) {
      setPhase({
        kind: "error",
        message: "This browser blocked the popup. Use the link below to run the same handoff in this tab.",
      });
      return;
    }

    pendingState.current = state;
    popupWindow.current = opened;
    setPhase({ kind: "waiting" });

    stopWatching();
    watcher.current = window.setInterval(() => {
      if (!popupWindow.current || popupWindow.current.closed) {
        stopWatching();
        popupWindow.current = null;

        // A message would have cleared the state first, so a live state here means nothing came back.
        if (pendingState.current) {
          pendingState.current = null;
          setPhase({ kind: "error", message: "The window closed before it handed anything back, so nothing was signed in." });
        }
      }
    }, 400);
  }, [stopWatching]);

  return (
    <div className="mx-auto w-full max-w-sm text-left">
      <button
        type="button"
        onClick={start}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/12 px-4 text-[12.5px] font-semibold text-[#D4D4D8] transition-colors hover:border-white/30 hover:text-white"
      >
        Try the popup sign-in
        <span aria-hidden>→</span>
      </button>

      <div aria-live="polite" className="mt-3">
        {phase.kind === "waiting" ? (
          <p className="text-[12px] leading-5 text-[#8A8A94]">
            Waiting for the popup. Create or use an ASTRO account there and this card fills in on its own.
          </p>
        ) : null}

        {phase.kind === "error" ? (
          <div className="rounded-xl border border-white/10 bg-[#121214] p-4">
            <p className="text-[12.5px] leading-5 text-[#FCA5A5]">{phase.message}</p>
            {redirectHref ? (
              <a
                href={redirectHref}
                className="mt-3 inline-flex text-[12px] font-semibold text-[#C4B5FD] underline-offset-4 hover:underline"
              >
                Run the handoff in this tab
              </a>
            ) : null}
          </div>
        ) : null}

        {phase.kind === "done" ? (
          <div className="rounded-xl border border-[#7C3AED]/35 bg-[#121214] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#06B6D4]">Handoff complete</p>
            <p className="mt-1.5 text-sm font-semibold text-[#FAFAFA]">@{phase.account.handle}</p>
            <p className="mt-0.5 break-all font-mono text-[11px] text-[#8A8A94]">{phase.account.astroId}</p>
            <p className="mt-2 text-[11.5px] leading-5 text-[#A1A1AA]">
              The popup posted that to this page and closed itself. The state matched the value this page generated, so it
              is the sign-in it started — not a message from somewhere else.
            </p>
            <button
              type="button"
              onClick={start}
              className="mt-3 text-[12px] font-semibold text-[#C4B5FD] underline-offset-4 hover:underline"
            >
              Run it again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
