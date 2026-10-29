"use client";

import { useEffect, useMemo, useState } from "react";
import type { CharacterKey, CosmeticSlot, ShopItem, Status, User } from "@/lib/types";
import { THEMES } from "@/lib/shop";
import { playPlatformLabel, regionLabel } from "@/lib/astro/regions";
import { Avatar } from "./cosmetics/avatar";
import { CharacterArt, CHARACTER_OPTIONS } from "./cosmetics/character";
import { Nameplate } from "./cosmetics/nameplate";
import { ProfileCard } from "./profile-card";
import { ProfileEffect } from "./cosmetics/profile-effect";
import { DialogPanel } from "./dialog-panel";
import { Icon, type IconName } from "./icons";

const BANNERS: [string, string][] = [
  ["#7C3AED", "#a855f7"],
  ["#0c4a6e", "#0ea5e9"],
  ["#121214", "#6D28D9"],
  ["#831843", "#a78bfa"],
  ["#7c2d12", "#dc2626"],
  ["#064e3b", "#0d9488"],
  ["#1e293b", "#71717A"],
  ["#9d174d", "#fb923c"],
];

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "online", label: "Online", color: "#23a55a" },
  { value: "idle", label: "Idle", color: "#f0b232" },
  { value: "dnd", label: "Do Not Disturb", color: "#f23f43" },
  { value: "offline", label: "Invisible", color: "#80848e" },
];

type Page = "root" | "profile" | "cosmetics";

const PAGE_META: Record<Exclude<Page, "root">, { title: string; blurb: string }> = {
  profile: { title: "My profile", blurb: "How you appear across every server." },
  cosmetics: { title: "Cosmetics & themes", blurb: "Equip what you own — previews update live." },
};

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="pb-2">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{children}</h3>
      {hint && <p className="mt-0.5 text-xs text-[var(--text-faint)]">{hint}</p>}
    </div>
  );
}

/** One line in the settings list: icon, label, optional value, chevron. */
function SettingRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-rail)] text-[var(--text)]">
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[var(--text-strong)]">{label}</span>
      {value && <span className="max-w-[45%] shrink-0 truncate text-[13px] text-[var(--text-muted)]">{value}</span>}
      {onClick && <Icon name="chevron-down" size={16} className="-rotate-90 shrink-0 text-[var(--text-faint)]" />}
    </>
  );

  const className =
    "flex w-full items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3 text-left last:border-0";

  if (!onClick) return <div className={className}>{content}</div>;

  return (
    <button type="button" onClick={onClick} className={`${className} transition active:bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)]`}>
      {content}
    </button>
  );
}

export function SettingsModal({
  open,
  me,
  shop,
  onClose,
  onSave,
  onEquip,
  onOpenShop,
  initialPage,
}: {
  open: boolean;
  me: User;
  shop: ShopItem[];
  onClose: () => void;
  onSave: (patch: {
    name: string;
    bio: string;
    pronouns: string;
    status: Status;
    customStatus: string;
    character: CharacterKey;
    banner: [string, string];
  }) => Promise<void>;
  onEquip: (slot: CosmeticSlot, itemId: string | null) => Promise<void>;
  onOpenShop: () => void;
  initialPage?: Exclude<Page, "root">;
}) {
  const [page, setPage] = useState<Page>("root");
  const [query, setQuery] = useState("");
  const [name, setName] = useState(me.name);
  const [bio, setBio] = useState(me.bio);
  const [pronouns, setPronouns] = useState(me.pronouns);
  const [status, setStatus] = useState<Status>(me.status);
  const [banner, setBanner] = useState<[string, string]>(me.banner);
  const [character, setCharacter] = useState<CharacterKey>(me.character);
  const [customStatus, setCustomStatus] = useState(me.customStatus ?? "");
  const [saving, setSaving] = useState(false);
  const [equipping, setEquipping] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPage("root");
      setQuery("");
      return;
    }
    setName(me.name);
    setBio(me.bio);
    setPronouns(me.pronouns);
    setStatus(me.status);
    setBanner(me.banner);
    setCharacter(me.character);
    setCustomStatus(me.customStatus ?? "");
    // Phones start on the list; wider screens land directly in the sidebar's first page.
    setPage(initialPage ?? (window.matchMedia("(min-width: 640px)").matches ? "profile" : "root"));
  }, [open, me, initialPage]);

  const previewUser = useMemo<User>(
    () => ({ ...me, name: name.trim() || me.name, bio, pronouns, status, banner, character, customStatus }),
    [me, name, bio, pronouns, status, banner, character, customStatus],
  );

  const dirty =
    name !== me.name ||
    bio !== me.bio ||
    pronouns !== me.pronouns ||
    status !== me.status ||
    banner !== me.banner ||
    character !== me.character ||
    customStatus !== (me.customStatus ?? "");

  if (!open) return null;

  const ownedBySlot = (slot: CosmeticSlot) => shop.filter((item) => item.slot === slot && me.owned.includes(item.id));
  const themeLabel = THEMES[me.cosmetics.theme]?.label ?? me.cosmetics.theme;

  async function save() {
    setSaving(true);
    try {
      await onSave({ name, bio, pronouns, status, banner, character, customStatus });
    } finally {
      setSaving(false);
    }
  }

  function CosmeticSlotSection({ slot, title, hint }: { slot: CosmeticSlot; title: string; hint: string }) {
    const items = ownedBySlot(slot);
    const equippedKey = me.cosmetics[slot];
    return (
      <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
        <SectionTitle hint={hint}>{title}</SectionTitle>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {slot !== "theme" && (
            <button
              type="button"
              onClick={async () => {
                setEquipping(`${slot}-none`);
                try {
                  await onEquip(slot, null);
                } finally {
                  setEquipping(null);
                }
              }}
              className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition ${
                equippedKey === null
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded bg-[var(--bg-rail)] text-[var(--text-faint)]">
                <Icon name="close" size={14} />
              </span>
              <span className="flex-1 text-left font-medium text-[var(--text)]">None</span>
              {equippedKey === null && <Icon name="check" size={14} className="text-[var(--accent-2)]" />}
            </button>
          )}
          {items.map((item) => {
            const equipped = equippedKey === item.key;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition ${
                  equipped ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border-subtle)]"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-[var(--bg-rail)]">
                  {slot === "decoration" ? (
                    <Avatar user={me} size={20} decoration={item.key as never} />
                  ) : slot === "nameplate" ? (
                    <Nameplate kind={item.key as never} className="text-[11px] font-bold">
                      Ab
                    </Nameplate>
                  ) : slot === "theme" ? (
                    <span className="flex gap-0.5">
                      {THEMES[item.key as keyof typeof THEMES].swatch.map((color) => (
                        <span key={color} className="h-4 w-2 rounded-sm" style={{ background: color }} />
                      ))}
                    </span>
                  ) : (
                    <span className="relative h-8 w-8 overflow-hidden">
                      <ProfileEffect kind={item.key as never} />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-[var(--text)]">{item.name}</span>
                {equipped ? (
                  <Icon name="check" size={14} className="text-[var(--accent-2)]" />
                ) : (
                  <button
                    type="button"
                    disabled={equipping === item.id}
                    onClick={async () => {
                      setEquipping(item.id);
                      try {
                        await onEquip(slot, item.id);
                      } finally {
                        setEquipping(null);
                      }
                    }}
                    className="rounded bg-[var(--bg-active)] px-2 py-1 text-[11px] font-semibold text-[var(--text)] hover:brightness-110"
                  >
                    {equipping === item.id ? "…" : "Equip"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {items.length === 0 && (
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            Nothing owned yet.{" "}
            <button type="button" onClick={onOpenShop} className="text-[var(--link)] hover:underline">
              Visit the shop
            </button>
          </p>
        )}
      </div>
    );
  }

  const rows: { group: string; items: { icon: IconName; label: string; value?: string; onClick?: () => void }[] }[] = [
    {
      group: "Account",
      items: [
        {
          icon: "users",
          label: "My profile",
          value: `@${me.name.toLowerCase().replace(/\s+/g, "")}`,
          onClick: () => setPage("profile"),
        },
        {
          icon: "sparkles",
          label: "Cosmetics & themes",
          value: `${me.owned.length} owned`,
          onClick: () => setPage("cosmetics"),
        },
        {
          icon: "pin",
          label: "Sign-up region",
          value: me.region
            ? `${regionLabel(me.region)}${me.playPlatform ? ` · ${playPlatformLabel(me.playPlatform)}` : ""}`
            : "Not set",
        },
        { icon: "bag", label: "Open cosmetic shop", value: `${me.coins.toLocaleString()} ASTRO Coins`, onClick: onOpenShop },
      ],
    },
    {
      group: "App",
      items: [
        { icon: "crown", label: "Active theme", value: themeLabel },
        { icon: "bell", label: "Presence", value: STATUS_OPTIONS.find((option) => option.value === status)?.label },
      ],
    },
    {
      group: "About",
      items: [
        { icon: "compass", label: "App version", value: "1.0.0" },
        { icon: "pin", label: "Moderation", value: "Guard runs locally" },
      ],
    },
  ];

  const needle = query.trim().toLowerCase();
  const visibleRows = rows
    .map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(needle)) }))
    .filter((group) => group.items.length > 0);

  const isRoot = page === "root";
  const title = isRoot ? "Settings" : PAGE_META[page].title;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <DialogPanel
        label="User settings"
        onClose={onClose}
        active={open}
        className="animate-modal relative flex h-full w-full max-w-4xl overflow-hidden bg-[var(--bg-chat)] shadow-2xl ring-1 ring-black/50 sm:h-[86vh] sm:rounded-xl sm:bg-[var(--bg-sidebar)]"
      >
        <aside className="hidden w-52 shrink-0 flex-col bg-[var(--bg-rail)] sm:flex">
          <div className="px-4 pb-3 pt-5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            User settings
          </div>
          <nav className="space-y-0.5 px-2">
            {(
              [
                { key: "profile" as const, label: "My profile", icon: "users" as const },
                { key: "cosmetics" as const, label: "Cosmetics", icon: "sparkles" as const },
              ]
            ).map((entry) => (
              <button
                key={entry.key}
                type="button"
                aria-current={page === entry.key ? "true" : undefined}
                onClick={() => setPage(entry.key)}
                className={`flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm transition ${
                  page === entry.key
                    ? "bg-[var(--bg-active)] font-semibold text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                }`}
              >
                <Icon name={entry.icon} size={17} />
                {entry.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-3">
            <button
              type="button"
              onClick={onOpenShop}
              className="flex w-full items-center justify-center gap-2 rounded bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-contrast)] hover:brightness-110"
            >
              <Icon name="bag" size={15} /> Open shop
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-[var(--bg-chat)] sm:bg-transparent">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--border-subtle)] px-3 sm:h-16 sm:px-5">
            <button
              type="button"
              onClick={() => (isRoot ? onClose() : setPage("root"))}
              aria-label={isRoot ? "Close settings" : "Back to settings"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--text)] transition hover:bg-[var(--bg-hover)] sm:hidden"
            >
              <Icon name={isRoot ? "close" : "arrow-left"} size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[19px] font-bold leading-6 text-[var(--text-strong)] sm:text-lg">{title}</h2>
              {!isRoot && (
                <p className="truncate text-[11px] text-[var(--text-muted)]">{PAGE_META[page].blurb}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-float)] text-[var(--text-muted)] hover:text-[var(--text-strong)] sm:flex"
              aria-label="Close settings"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          {isRoot ? (
            <div className="scroll-thin flex-1 overflow-y-auto px-3 pb-6 pt-3 sm:hidden">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-sidebar)] px-3 py-2.5">
                <Icon name="search" size={17} className="shrink-0 text-[var(--text-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  aria-label="Search settings"
                  className="w-full bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="text-[var(--text-muted)]"
                  >
                    <Icon name="close" size={15} />
                  </button>
                )}
              </div>

              {visibleRows.length === 0 && (
                <p className="py-10 text-center text-sm text-[var(--text-muted)]">No settings match “{query.trim()}”.</p>
              )}

              {visibleRows.map((group) => (
                <section key={group.group} className="mt-5">
                  <h3 className="px-1 pb-2 text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {group.group}
                  </h3>
                  <div className="overflow-hidden rounded-xl bg-[var(--bg-elevated)]">
                    {group.items.map((item) => (
                      <SettingRow key={item.label} {...item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <>
              <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
                  <div className="order-2 lg:order-1">
                    <div className="sticky top-0 space-y-3">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Preview</div>
                      <ProfileCard user={previewUser} isMe />
                    </div>
                  </div>

                  <div className="order-1 space-y-3 lg:order-2">
                    {page === "profile" ? (
                      <>
                        <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
                          <SectionTitle>Display name</SectionTitle>
                          <input
                            value={name}
                            maxLength={32}
                            onChange={(event) => setName(event.target.value)}
                            className="w-full rounded-lg bg-[var(--bg-rail)] px-3 py-2.5 text-[15px] text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          />
                          <div className="mt-3">
                            <SectionTitle>Pronouns</SectionTitle>
                            <input
                              value={pronouns}
                              maxLength={40}
                              placeholder="e.g. they/them"
                              onChange={(event) => setPronouns(event.target.value)}
                              className="w-full rounded-lg bg-[var(--bg-rail)] px-3 py-2.5 text-[15px] text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                            />
                          </div>
                        </div>

                        <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
                          <SectionTitle hint="Captured when you created your ASTRO account.">
                            Region & platform
                          </SectionTitle>
                          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--text)]">
                            <span className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-rail)] px-2.5 py-1.5">
                              <Icon name="pin" size={15} />
                              {me.region ? regionLabel(me.region) : "Not set"}
                            </span>
                            <span className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-rail)] px-2.5 py-1.5">
                              <Icon name="compass" size={15} />
                              {me.playPlatform ? playPlatformLabel(me.playPlatform) : "Not set"}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
                          <SectionTitle hint="Markdown-style formatting is not applied here.">About me</SectionTitle>
                          <textarea
                            value={bio}
                            maxLength={190}
                            rows={4}
                            onChange={(event) => setBio(event.target.value)}
                            className="w-full resize-none rounded-lg bg-[var(--bg-rail)] px-3 py-2.5 text-[15px] leading-5 text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          />
                          <div className="mt-1 text-right text-[11px] tabular-nums text-[var(--text-faint)]">
                            {bio.length}/190
                          </div>
                        </div>

                        <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
                          <SectionTitle hint="The same avatar art follows you into every server.">
                            Avatar character
                          </SectionTitle>
                          <div className="grid grid-cols-5 gap-2">
                            {CHARACTER_OPTIONS.map((option) => {
                              const active = character === option.key;
                              return (
                                <button
                                  key={option.key}
                                  type="button"
                                  onClick={() => setCharacter(option.key)}
                                  aria-pressed={active}
                                  aria-label={option.label}
                                  className={`flex flex-col items-center gap-1 rounded-lg border p-1.5 transition ${
                                    active
                                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                      : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                                  }`}
                                >
                                  <span
                                    aria-hidden
                                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
                                    style={{
                                      background: `linear-gradient(145deg, ${me.avatarFrom}, ${me.avatarTo})`,
                                    }}
                                  >
                                    <CharacterArt kind={option.key} size={40} />
                                  </span>
                                  <span
                                    className={`w-full truncate text-center text-[10px] ${
                                      active ? "font-semibold text-[var(--text-strong)]" : "text-[var(--text-muted)]"
                                    }`}
                                  >
                                    {option.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
                          <SectionTitle hint="Shows in the bubble on your profile.">Custom status</SectionTitle>
                          <input
                            value={customStatus}
                            maxLength={64}
                            placeholder="What have you been playing?"
                            onChange={(event) => setCustomStatus(event.target.value)}
                            className="w-full rounded-lg bg-[var(--bg-rail)] px-3 py-2.5 text-[15px] text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          />
                          <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                            <span>Leave empty to show your activity instead.</span>
                            <span className="tabular-nums">{customStatus.length}/64</span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
                          <SectionTitle>Presence</SectionTitle>
                          <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={status === option.value}
                                onClick={() => setStatus(option.value)}
                                className={`flex items-center gap-2 rounded-lg border px-2.5 py-2.5 text-[13px] font-medium transition ${
                                  status === option.value
                                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-strong)]"
                                    : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                                }`}
                              >
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: option.color }} />
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl bg-[var(--bg-elevated)] p-3.5">
                          <SectionTitle>Profile banner</SectionTitle>
                          <div className="grid grid-cols-4 gap-2">
                            {BANNERS.map((preset) => {
                              const active = preset[0] === banner[0] && preset[1] === banner[1];
                              return (
                                <button
                                  key={preset.join("-")}
                                  type="button"
                                  onClick={() => setBanner(preset)}
                                  aria-label={`Banner ${preset[0]} to ${preset[1]}`}
                                  aria-pressed={active}
                                  className={`h-12 rounded-lg ring-2 transition ${
                                    active ? "ring-[var(--accent)]" : "ring-transparent hover:ring-white/25"
                                  }`}
                                  style={{ background: `linear-gradient(135deg, ${preset[0]}, ${preset[1]})` }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <CosmeticSlotSection
                          slot="decoration"
                          title="Avatar decoration"
                          hint="Animated frames rendered around your avatar."
                        />
                        <CosmeticSlotSection slot="effect" title="Profile effect" hint="Ambient motion on your profile card." />
                        <CosmeticSlotSection slot="nameplate" title="Nameplate" hint="Animated treatment for your name." />
                        <CosmeticSlotSection slot="theme" title="App theme" hint="Recolours your whole client." />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 sm:px-5">
                <span className="truncate text-xs text-[var(--text-faint)]">
                  {page === "profile" ? (dirty ? "Unsaved changes" : "Everything up to date") : `${me.owned.length} owned`}
                </span>
                {page === "profile" && (
                  <button
                    type="button"
                    disabled={!dirty || saving}
                    onClick={() => void save()}
                    className="h-9 shrink-0 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--accent-contrast)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                )}
              </footer>
            </>
          )}
        </div>
      </DialogPanel>
    </div>
  );
}
