"use client";

import { useState } from "react";
import { ROLE_META } from "@/lib/admin/roles";
import type { CosmeticSlot, User } from "@/lib/types";
import { Avatar } from "./cosmetics/avatar";
import { Nameplate } from "./cosmetics/nameplate";
import { ProfileEffect } from "./cosmetics/profile-effect";
import { DialogPanel } from "./dialog-panel";
import { Icon, type IconName } from "./icons";
import { UnverifiedTag, VerifiedBadge } from "./verified-badge";

type Tab = "main" | "activity" | "cosmetics";

const TABS: { key: Tab; label: string }[] = [
  { key: "main", label: "Main" },
  { key: "activity", label: "Activity" },
  { key: "cosmetics", label: "Cosmetics" },
];

const prettify = (key: string | null) =>
  key ? key.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") : "None";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-[var(--bg-elevated)] px-4 py-3.5 ${className}`}>{children}</div>;
}

function DockButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-14 flex-col items-center gap-1 rounded-lg py-1 text-[var(--text-muted)] transition hover:text-[var(--text)]"
    >
      <Icon name={icon} size={22} />
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

/** Full-screen profile, the way Discord's mobile client shows it. */
export function ProfilePage({
  user,
  isMe,
  onClose,
  onEditProfile,
  onOpenShop,
  onOpenStorefront,
  onOpenSettings,
  onClearStatus,
}: {
  user: User;
  isMe: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onOpenShop: () => void;
  onOpenStorefront: () => void;
  onOpenSettings: () => void;
  onClearStatus: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("main");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const handle = user.handle ? `@${user.handle}` : `@${user.name.toLowerCase().replace(/\s+/g, "")}`;
  const customStatus = user.customStatus?.trim();
  const statusLine = customStatus || user.activity;

  return (
    <div className="fixed inset-0 z-50 flex bg-[var(--bg-chat)]">
      <DialogPanel
        label={`${user.name} profile`}
        onClose={onClose}
        className="relative flex h-full w-full flex-col overflow-hidden"
      >
        <div className="scroll-thin flex-1 overflow-y-auto pb-28">
          <div className="relative">
            <div
              className="relative h-24 overflow-hidden"
              style={{ background: `linear-gradient(120deg, ${user.banner[0]}, ${user.banner[1]})` }}
            >
              <ProfileEffect kind={user.cosmetics.effect} />
              <span aria-hidden className="absolute inset-0 bg-black/20" />
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile"
              className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
            >
              <Icon name="close" size={20} />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Open settings"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
            >
              <Icon name="settings" size={18} />
            </button>

            <div className="px-4">
              <div className="-mt-11 flex items-end gap-3">
                <Avatar user={user} size={88} showStatus statusBorder="var(--bg-chat)" />
                <div
                  className={`mb-1 flex min-w-0 flex-1 items-center gap-2 rounded-2xl border bg-[var(--bg-sidebar)] px-3 py-2 text-[13px] ${
                    customStatus
                      ? "border-[var(--border-strong)] text-[var(--text)]"
                      : "border-[var(--border-strong)] italic text-[var(--text-muted)]"
                  }`}
                >
                  {isMe && customStatus && confirmingClear ? (
                    <>
                      <span className="min-w-0 flex-1 truncate text-[12px] not-italic text-[var(--text)]">
                        Clear your status?
                      </span>
                      <button
                        type="button"
                        onClick={() => setConfirmingClear(false)}
                        className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
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
                        className="shrink-0 rounded-md bg-[var(--red)] px-2.5 py-1 text-[11px] font-semibold text-white transition disabled:opacity-60"
                      >
                        {clearing ? "Clearing…" : "Clear"}
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        aria-hidden
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--text-muted)] text-[11px] not-italic leading-none"
                      >
                        +
                      </span>
                      <span className="truncate">{statusLine ?? "What have you been playing?"}</span>
                      {isMe && customStatus && (
                        <button
                          type="button"
                          onClick={() => setConfirmingClear(true)}
                          aria-label="Clear custom status"
                          className="-mr-1 ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                        >
                          <Icon name="close" size={13} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-[26px] font-bold leading-8 text-[var(--text-strong)]">
                    <Nameplate kind={user.cosmetics.nameplate}>{user.name}</Nameplate>
                  </h1>
                  {user.verified ? <VerifiedBadge size={18} /> : null}
                  <Icon name="chevron-down" size={18} className="shrink-0 text-[var(--text-faint)]" />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[15px] text-[var(--text)]">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{handle}</span>
                    {isMe && !user.verified ? <UnverifiedTag /> : null}
                    {user.staffRole ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${ROLE_META[user.staffRole].tone}`}
                      >
                        <Icon name="shield" size={10} /> {ROLE_META[user.staffRole].label}
                      </span>
                    ) : null}
                  </span>
                  {user.roles.slice(0, 2).map((role) => (
                    <span
                      key={role.name}
                      className="flex items-center gap-1 rounded-md border border-[var(--border-strong)] bg-[var(--bg-sidebar)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--text)]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: role.color }} />
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>

              {isMe ? (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] text-[15px] font-semibold text-[var(--accent-contrast)] transition hover:brightness-110"
                >
                  <Icon name="pencil" size={16} /> Edit Profile
                </button>
              ) : (
                <div className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-[var(--border-strong)] text-[14px] font-semibold text-[var(--text-muted)]">
                  {user.status === "offline" ? "Offline" : "Member of this server"}
                </div>
              )}

              <div role="tablist" aria-label="Profile sections" className="mt-4 flex border-b border-[var(--border-subtle)]">
                {TABS.map((entry) => (
                  <button
                    key={entry.key}
                    role="tab"
                    type="button"
                    aria-selected={tab === entry.key}
                    onClick={() => setTab(entry.key)}
                    className={`flex-1 border-b-2 pb-2.5 text-[14px] font-semibold transition ${
                      tab === entry.key
                        ? "border-[var(--accent)] text-[var(--text-strong)]"
                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>

              <div role="tabpanel" className="space-y-3 pt-3">
                {tab === "main" && (
                  <>
                    <Card className="flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-semibold text-[var(--text-strong)]">Coin balance</div>
                        <div className="text-[12px] text-[var(--text-muted)]">Virtual currency</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold tabular-nums text-[var(--yellow)]">
                          {user.coins.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={onOpenShop}
                          aria-label="Open cosmetic shop"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-rail)] text-[var(--text-muted)] transition hover:text-[var(--text)]"
                        >
                          <Icon name="bag" size={16} />
                        </button>
                      </div>
                    </Card>

                    <Card>
                      <div className="text-[15px] font-semibold text-[var(--text-strong)]">Member since</div>
                      <div className="mt-1 flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                        <Icon name="users" size={15} /> {user.joined}
                      </div>
                    </Card>

                    {user.bio && (
                      <Card>
                        <div className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                          About me
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-5 text-[var(--text)]">{user.bio}</p>
                        {user.pronouns && <p className="mt-2 text-[12px] text-[var(--text-muted)]">{user.pronouns}</p>}
                      </Card>
                    )}

                    {user.roles.length > 0 && (
                      <Card>
                        <div className="text-[15px] font-semibold text-[var(--text-strong)]">Roles</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {user.roles.map((role) => (
                            <span
                              key={role.name}
                              className="flex items-center gap-1.5 rounded-full bg-[var(--bg-rail)] px-2 py-1 text-[12px] font-medium text-[var(--text)]"
                            >
                              <span className="h-2 w-2 rounded-full" style={{ background: role.color }} />
                              {role.name}
                            </span>
                          ))}
                        </div>
                      </Card>
                    )}
                  </>
                )}

                {tab === "activity" && (
                  <Card>
                    {customStatus && (
                      <>
                        <div className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                          Custom status
                        </div>
                        <p className="mt-1.5 text-[15px] text-[var(--text)]">{customStatus}</p>
                        <div className="my-3 h-px bg-[var(--border-subtle)]" />
                      </>
                    )}
                    <div className="text-[12px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Now</div>
                    <p className="mt-1.5 text-[15px] text-[var(--text)]">
                      {user.activity ?? "Nothing right now — just hanging out."}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: user.status === "online" ? "var(--green)" : "var(--text-faint)" }}
                      />
                      {user.status === "online"
                        ? "Online"
                        : user.status === "idle"
                          ? "Idle"
                          : user.status === "dnd"
                            ? "Do Not Disturb"
                            : "Offline"}
                    </p>
                  </Card>
                )}

                {tab === "cosmetics" && (
                  <Card>
                    <div className="space-y-2.5">
                      {(
                        [
                          ["decoration", "Avatar decoration"],
                          ["effect", "Profile effect"],
                          ["nameplate", "Nameplate"],
                          ["theme", "App theme"],
                        ] as [CosmeticSlot, string][]
                      ).map(([slot, label]) => (
                        <div key={slot} className="flex items-center justify-between gap-3">
                          <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
                          <span className="truncate text-[13px] font-medium text-[var(--text)]">
                            {prettify(user.cosmetics[slot])}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={onOpenShop}
                      className="mt-3 w-full rounded-lg bg-[var(--bg-rail)] py-2 text-[13px] font-semibold text-[var(--text)] transition hover:brightness-110"
                    >
                      Browse the shop
                    </button>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {isMe && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4">
            <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-[var(--bg-float)] px-3 py-2 shadow-2xl shadow-black/60 ring-1 ring-white/10">
              <DockButton icon="bag" label="Shop" onClick={onOpenShop} />
              <DockButton icon="sparkles" label="Store" onClick={onOpenStorefront} />
              <DockButton icon="settings" label="Settings" onClick={onOpenSettings} />
            </div>
          </div>
        )}
      </DialogPanel>
    </div>
  );
}
