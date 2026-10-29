"use client";

import { ROLE_META } from "@/lib/admin/roles";
import type { User } from "@/lib/types";
import { Icon } from "./icons";
import { Avatar } from "./cosmetics/avatar";
import { Nameplate } from "./cosmetics/nameplate";
import { ProfileEffect } from "./cosmetics/profile-effect";
import { VerifiedBadge } from "./verified-badge";

const STATUS_LABEL: Record<User["status"], string> = {
  online: "Online",
  idle: "Idle",
  dnd: "Do Not Disturb",
  offline: "Offline",
};

export function ProfileCard({
  user,
  onMessage,
  isMe,
  className = "",
}: {
  user: User;
  onMessage?: () => void;
  isMe?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl bg-[var(--bg-elevated)] shadow-2xl shadow-black/50 ring-1 ring-black/40 ${className}`}
    >
      <div
        className="relative h-[104px] w-full"
        style={{ background: `linear-gradient(135deg, ${user.banner[0]}, ${user.banner[1]})` }}
      >
        <ProfileEffect kind={user.cosmetics.effect} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      <div className="relative px-4 pb-3">
        <div className="-mt-10 flex items-end justify-between">
          <div className="rounded-full p-0.5">
            <Avatar user={user} size={80} showStatus statusBorder="var(--bg-elevated)" />
          </div>
          {onMessage && !isMe && (
            <button
              type="button"
              onClick={onMessage}
              className="mb-1 rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)] transition hover:bg-[var(--accent-hover)]"
            >
              Message
            </button>
          )}
          {isMe && (
            <span className="mb-1 rounded bg-[var(--accent-soft)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-2)]">
              This is you
            </span>
          )}
        </div>

        <div className="mt-2.5 rounded-lg bg-[var(--bg-float)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5 text-xl font-bold leading-6">
                <span className="truncate">
                  <Nameplate kind={user.cosmetics.nameplate}>{user.name}</Nameplate>
                </span>
                {user.verified ? <VerifiedBadge size={16} /> : null}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-[var(--text)]">
                <span className="truncate">
                  {user.handle ? `@${user.handle}` : `${user.name.toLowerCase().replace(/\s+/g, "")}#${user.tag}`}
                </span>
                {user.staffRole ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.08em] ${ROLE_META[user.staffRole].tone}`}
                  >
                    <Icon name="shield" size={9} /> ASTRO {ROLE_META[user.staffRole].label}
                  </span>
                ) : null}
              </div>
              {user.customStatus && (
                <div className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-4 text-[var(--text)]">
                  <span
                    aria-hidden
                    className="mt-px flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border border-[var(--text-faint)] text-[9px] leading-none text-[var(--text-muted)]"
                  >
                    +
                  </span>
                  <span className="min-w-0 break-words">{user.customStatus}</span>
                </div>
              )}
            </div>
            <div className="shrink-0 text-right text-[11px] leading-4">
              <div className="font-semibold text-[var(--text-strong)]">{STATUS_LABEL[user.status]}</div>
              {user.activity && <div className="max-w-[110px] truncate text-[var(--text-muted)]">{user.activity}</div>}
            </div>
          </div>

          <div className="my-3 h-px bg-[var(--border-subtle)]" />

          {user.bio && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-strong)]">
                About me
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-[18px] text-[var(--text)]">{user.bio}</p>
              <div className="my-3 h-px bg-[var(--border-subtle)]" />
            </>
          )}

          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-strong)]">
            Member since
          </div>
          <p className="mt-1 text-[13px] text-[var(--text)]">{user.joined}</p>

          {user.pronouns && (
            <>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-strong)]">
                Pronouns
              </div>
              <p className="mt-1 text-[13px] text-[var(--text)]">{user.pronouns}</p>
            </>
          )}

          {user.roles.length > 0 && (
            <>
              <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[var(--text-strong)]">
                Roles
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <span
                    key={role.name}
                    className="flex items-center gap-1 rounded bg-[var(--bg-active)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--text)]"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: role.color }} />
                    {role.name}
                  </span>
                ))}
              </div>
            </>
          )}

          {user.cosmetics.nameplate && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Animated nameplate equipped
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
