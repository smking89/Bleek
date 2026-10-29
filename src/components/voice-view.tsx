"use client";

import type { Channel, Server, User } from "@/lib/types";
import { Avatar } from "./cosmetics/avatar";
import { Icon } from "./icons";

export function VoiceView({
  server,
  channel,
  me,
  joined,
  muted,
  deafened,
  onJoin,
  onLeave,
  onToggleMute,
  onToggleDeafen,
}: {
  server: Server;
  channel: Channel;
  me: User;
  joined: boolean;
  muted: boolean;
  deafened: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
}) {
  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[var(--bg-rail)]">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-chat)] px-4">
        <Icon name="volume" size={21} className="text-[var(--text-muted)]" />
        <h1 className="truncate text-[15px] font-semibold text-[var(--text-strong)]">{channel.name}</h1>
        <span className="ml-2 rounded bg-[var(--bg-active)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
          Voice
        </span>
        <span className="ml-auto text-xs text-[var(--text-muted)]">{server.name}</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-black">
            {joined ? (
              <>
                <div className="relative flex flex-col items-center gap-3">
                  <div
                    className={`rounded-full border p-1 ${
                      muted ? "border-white/10" : "speaking-ring border-[#06B6D4]"
                    }`}
                  >
                    <Avatar user={me} size={96} />
                  </div>
                  <div className="flex items-center gap-2 rounded bg-black/45 px-2.5 py-1 text-sm text-white">
                    {muted ? <Icon name="mic-off" size={14} /> : <Icon name="mic" size={14} />}
                    {me.name}
                  </div>
                </div>
                <span className="absolute left-3 top-3 rounded bg-black/40 px-2 py-0.5 text-[11px] font-medium text-white/80">
                  You
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-active)] text-[var(--text-muted)]">
                  <Icon name="volume" size={32} />
                </div>
                <div>
                  <div className="text-base font-semibold text-[var(--text-strong)]">{channel.name}</div>
                  <p className="mt-1 max-w-xs text-sm text-[var(--text-muted)]">
                    No one is connected. Join the room to appear here.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text-strong)]">Room details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Channel</dt>
                <dd className="text-[var(--text)]">#{channel.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Bitrate</dt>
                <dd className="text-[var(--text)]">64 kbps</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Region</dt>
                <dd className="text-[var(--text)]">Automatic</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">Connected</dt>
                <dd className="text-[var(--text)]">{joined ? "1" : "0"} / 25</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-lg bg-[var(--bg-rail)] p-3 text-xs leading-5 text-[var(--text-muted)]">
              Voice presence is tracked live in this app session. Audio transport would be wired to a
              media server such as LiveKit; no audio is captured or transmitted in this build.
            </p>
            {joined ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="flex items-center gap-2 rounded bg-[var(--bg-active)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:brightness-110"
                >
                  <Icon name={muted ? "mic-off" : "mic"} size={15} />
                  {muted ? "Unmute" : "Mute"}
                </button>
                <button
                  type="button"
                  onClick={onToggleDeafen}
                  className="flex items-center gap-2 rounded bg-[var(--bg-active)] px-3 py-1.5 text-xs font-medium text-[var(--text)] hover:brightness-110"
                >
                  <Icon name="headphones" size={15} />
                  {deafened ? "Undeafen" : "Deafen"}
                </button>
                <button
                  type="button"
                  onClick={onLeave}
                  className="flex items-center gap-2 rounded bg-[var(--red)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onJoin}
                className="mt-4 w-full rounded bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
              >
                Join Voice
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
