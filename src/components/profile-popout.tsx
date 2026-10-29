"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@/lib/types";
import { ProfileCard } from "./profile-card";
import { Icon } from "./icons";

const WIDTH = 340;
const HEIGHT = 520;

export function ProfilePopout({
  user,
  rect,
  isMe,
  onClose,
  onOpenShop,
  onClearStatus,
}: {
  user: User;
  rect: DOMRect;
  isMe: boolean;
  onClose: () => void;
  onOpenShop: () => void;
  onClearStatus: () => Promise<void>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [position] = useState(() => {
    const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    let left = rect.left - WIDTH - 12;
    if (left < 12) left = Math.min(rect.right + 12, vw - WIDTH - 12);
    const top = Math.max(12, Math.min(rect.top - 40, vh - HEIGHT - 12));
    return { left: Math.max(12, left), top };
  });

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-50 animate-pop"
      style={{ left: position.left, top: position.top, width: WIDTH }}
    >
      <div className="relative">
        <ProfileCard user={user} isMe={isMe} />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur transition hover:bg-black/60 hover:text-white"
          aria-label="Close profile"
        >
          <Icon name="close" size={14} />
        </button>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={onOpenShop}
            className="flex-1 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text)] shadow-lg transition hover:border-[var(--accent)]"
          >
            Get this look
          </button>
        </div>

        {isMe && user.customStatus && (
          <div className="mt-2 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2 shadow-lg shadow-black/40">
            {confirmingClear ? (
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs text-[var(--text)]">Clear your status?</span>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="shrink-0 rounded px-1.5 py-1 text-[11px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={clearing}
                  onClick={async () => {
                    setClearing(true);
                    try {
                      await onClearStatus();
                      setConfirmingClear(false);
                    } finally {
                      setClearing(false);
                    }
                  }}
                  className="shrink-0 rounded bg-[var(--red)] px-2 py-1 text-[11px] font-semibold text-white transition disabled:opacity-60"
                >
                  {clearing ? "Clearing…" : "Clear"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:text-[var(--text)]"
              >
                <Icon name="close" size={12} /> Clear custom status
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
