"use client";

import Link from "next/link";
import { ROLE_META } from "@/lib/admin/roles";
import type { User } from "@/lib/types";
import { Avatar } from "./cosmetics/avatar";
import { Icon } from "./icons";
import { VerifiedBadge } from "./verified-badge";

export function UserPanel({
  me,
  micMuted,
  deafened,
  inVoice,
  onToggleMic,
  onToggleDeafen,
  onOpenSettings,
  onOpenProfile,
}: {
  me: User;
  micMuted: boolean;
  deafened: boolean;
  inVoice: boolean;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
  onOpenSettings: () => void;
  onOpenProfile: (rect: DOMRect) => void;
}) {
  const statusLine = inVoice
    ? "Voice connected"
    : me.status === "offline"
      ? "Invisible"
      : me.handle
        ? `@${me.handle}`
        : `#${me.tag}`;

  return (
    <div className="shrink-0 p-2">
      <div
        className="relative flex items-center gap-1 overflow-hidden rounded-xl px-1 py-1 ring-1 ring-white/10"
        style={{ background: `linear-gradient(100deg, ${me.banner[0]}, ${me.banner[1]})` }}
      >
        <span aria-hidden className="absolute inset-0 bg-black/40" />

        <button
          type="button"
          onClick={(event) => onOpenProfile(event.currentTarget.getBoundingClientRect())}
          className="relative flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-white/10"
        >
          <Avatar user={me} size={30} showStatus statusBorder="rgba(0,0,0,0.45)" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="flex min-w-0 items-center gap-1">
              <span className="block truncate text-[13px] font-semibold text-white">{me.name}</span>
              {me.verified ? <VerifiedBadge size={13} /> : null}
            </span>
            <span className="block truncate text-[11px] text-white/70">{statusLine}</span>
          </span>
        </button>

        {me.staffRole ? (
          <Link
            href="/admin"
            title={`ASTRO ${ROLE_META[me.staffRole].label} — open the operations console`}
            className="relative flex h-8 items-center gap-1 rounded-full bg-black/30 px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#67E8F9] ring-1 ring-inset ring-[#06B6D4]/45 transition-colors hover:bg-black/50"
          >
            <Icon name="shield" size={13} />
            {ROLE_META[me.staffRole].badge}
            <span className="sr-only">Open the operations console</span>
          </Link>
        ) : null}

        <button
          type="button"
          onClick={onToggleMic}
          title={micMuted ? "Unmute" : "Mute"}
          aria-label={micMuted ? "Unmute microphone" : "Mute microphone"}
          aria-pressed={micMuted}
          className={`relative flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10 ${
            micMuted ? "text-[var(--red)]" : "text-white/80"
          }`}
        >
          <Icon name={micMuted ? "mic-off" : "mic"} size={17} />
        </button>
        <button
          type="button"
          onClick={onToggleDeafen}
          title={deafened ? "Undeafen" : "Deafen"}
          aria-label={deafened ? "Undeafen" : "Deafen"}
          aria-pressed={deafened}
          className={`relative flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10 ${
            deafened ? "text-[var(--red)]" : "text-white/80"
          }`}
        >
          <Icon name="headphones" size={17} />
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          title="User settings"
          aria-label="User settings"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10"
        >
          <Icon name="settings" size={17} />
        </button>
      </div>
    </div>
  );
}
