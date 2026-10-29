"use client";

import type { Status, User } from "@/lib/types";
import { Avatar } from "./cosmetics/avatar";
import { Nameplate } from "./cosmetics/nameplate";
import { Icon } from "./icons";
import { VerifiedBadge } from "./verified-badge";

const GROUPS: { status: Status[]; label: string }[] = [
  { status: ["online"], label: "Online" },
  { status: ["idle"], label: "Idle" },
  { status: ["dnd"], label: "Do Not Disturb" },
  { status: ["offline"], label: "Offline" },
];

export function MemberList({
  users,
  onOpenProfile,
  onClose,
}: {
  users: User[];
  onOpenProfile: (user: User, rect: DOMRect) => void;
  onClose?: () => void;
}) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden bg-[var(--bg-sidebar)]">
      <div className="flex h-12 shrink-0 items-center justify-between px-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Members — {users.filter((u) => u.status !== "offline").length}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)] xl:hidden"
            aria-label="Hide member list"
          >
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto px-2 pb-4">
        {GROUPS.map((group) => {
          const members = users.filter((user) => group.status.includes(user.status));
          if (members.length === 0) return null;
          return (
            <div key={group.label} className="mb-4">
              <div className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {group.label} — {members.length}
              </div>
              {members.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={(event) => onOpenProfile(user, event.currentTarget.getBoundingClientRect())}
                  className="group flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left transition hover:bg-[var(--bg-hover)]"
                >
                  <Avatar user={user} size={32} showStatus statusBorder="var(--bg-sidebar)" />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`flex min-w-0 items-center gap-1 text-[15px] font-medium leading-5 ${
                        user.status === "offline" ? "opacity-40" : ""
                      }`}
                    >
                      <span className="truncate">
                        <Nameplate kind={user.cosmetics.nameplate} className="text-[15px] font-medium">
                          {user.name}
                        </Nameplate>
                      </span>
                      {user.verified ? <VerifiedBadge size={12} /> : null}
                    </div>
                    {(user.customStatus || user.activity) && user.status !== "offline" && (
                      <div className="flex min-w-0 items-center gap-1 text-xs text-[var(--text-muted)]">
                        {user.customStatus && (
                          <span
                            aria-hidden
                            className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full border border-[var(--text-faint)] text-[8px] leading-none"
                          >
                            +
                          </span>
                        )}
                        <span className="truncate">{user.customStatus || user.activity}</span>
                      </div>
                    )}
                  </div>
                  {user.id === "u-you" && (
                    <span className="rounded bg-[var(--accent-soft)] px-1 py-px text-[10px] font-semibold text-[var(--accent-2)]">
                      YOU
                    </span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
