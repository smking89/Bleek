"use client";

import { useState } from "react";
import type { CosmeticSlot, ShopItem, User } from "@/lib/types";
import { RARITY, SLOT_META, THEMES } from "@/lib/shop";
import { Avatar } from "./cosmetics/avatar";
import { DialogPanel } from "./dialog-panel";
import { Nameplate } from "./cosmetics/nameplate";
import { ProfileEffect } from "./cosmetics/profile-effect";
import { Icon } from "./icons";

const TABS: { key: CosmeticSlot | "inventory"; label: string; icon: "sparkles" | "gift" | "crown" | "bag" | "inbox" }[] = [
  { key: "decoration", label: "Decorations", icon: "sparkles" },
  { key: "effect", label: "Profile effects", icon: "gift" },
  { key: "nameplate", label: "Nameplates", icon: "crown" },
  { key: "theme", label: "App themes", icon: "bag" },
  { key: "inventory", label: "Inventory", icon: "inbox" },
];

function Coins({ amount }: { amount: number }) {
  return (
    <span className="flex items-center gap-1.5 font-semibold tabular-nums text-[var(--yellow)]">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--yellow)] text-[9px] font-black text-black">
        C
      </span>
      {amount.toLocaleString()}
    </span>
  );
}

function RarityTag({ rarity }: { rarity: ShopItem["rarity"] }) {
  const meta = RARITY[rarity];
  return (
    <span
      className="shrink-0 rounded-full border px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide"
      style={{ color: meta.color, borderColor: `${meta.color}80`, background: `${meta.color}14` }}
    >
      {meta.label}
    </span>
  );
}

function ItemPreview({ item, me }: { item: ShopItem; me: User }) {
  if (item.slot === "decoration") {
    return (
      <div className="relative flex h-[132px] items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 45%, ${item.accent}26, transparent 65%)` }}
        />
        <div className="relative">
          <Avatar user={me} size={64} decoration={item.key as never} />
        </div>
      </div>
    );
  }

  if (item.slot === "effect") {
    return (
      <div
        className="relative h-[132px] w-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${me.banner[0]}, ${me.banner[1]})` }}
      >
        <ProfileEffect kind={item.key as never} />
        <div className="relative flex h-full items-end gap-2 p-3">
          <Avatar user={me} size={40} />
          <div className="pb-0.5 text-sm font-bold text-white drop-shadow">Your profile</div>
        </div>
      </div>
    );
  }

  if (item.slot === "nameplate") {
    return (
      <div className="flex h-[132px] flex-col items-center justify-center gap-1 bg-[var(--bg-float)] px-4">
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-faint)]">Display name</span>
        <Nameplate kind={item.key as never} className="text-2xl font-bold">
          {me.name}
        </Nameplate>
        <span className="text-[11px] text-[var(--text-muted)]">Preview on your profile</span>
      </div>
    );
  }

  const theme = THEMES[item.key as keyof typeof THEMES];
  return (
    <div className="flex h-[132px] flex-col justify-center gap-2.5 bg-[var(--bg-float)] px-4">
      <div className="flex items-center gap-2">
        {theme.swatch.map((color) => (
          <span key={color} className="h-6 w-6 rounded-full ring-1 ring-white/20" style={{ background: color }} />
        ))}
        <span className="ml-1 text-xs text-[var(--text-muted)]">{theme.label}</span>
      </div>
      <div className="overflow-hidden rounded-md ring-1 ring-white/10">
        <div className="flex h-16">
          <div className="flex w-9 items-center justify-center bg-[#1e1f22]">
            <span className="h-4 w-4 rounded-full" style={{ background: theme.accent }} />
          </div>
          <div className="flex w-20 flex-col gap-1 bg-[#2b2d31] p-1.5">
            <span className="h-1.5 w-12 rounded-full bg-white/25" />
            <span className="h-1.5 w-9 rounded-full bg-white/15" />
            <span className="h-1.5 w-14 rounded-full" style={{ background: theme.accent }} />
          </div>
          <div className="flex flex-1 flex-col justify-end gap-1 bg-[#313338] p-1.5">
            <span className="h-1.5 w-16 rounded-full bg-white/20" />
            <span className="h-1.5 w-10 rounded-full bg-white/10" />
            <span className="mt-1 h-3 w-full rounded" style={{ background: theme.accent, opacity: 0.35 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemDetail({
  item,
  me,
  onClose,
  onPurchase,
  onEquip,
  onGift,
}: {
  item: ShopItem;
  me: User;
  onClose: () => void;
  onPurchase: (itemId: string) => Promise<void>;
  onEquip: (slot: CosmeticSlot, itemId: string | null) => Promise<void>;
  onGift: (itemId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const owned = me.owned.includes(item.id);
  const equipped = me.cosmetics[item.slot] === item.key;
  const affordable = me.coins >= item.price;

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      onClose();
    } catch {
      // The parent surfaces the error as a toast.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close item details"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <DialogPanel
        label={`${item.name} details`}
        onClose={onClose}
        className="animate-modal relative w-full max-w-sm overflow-hidden rounded-xl bg-[var(--bg-sidebar)] shadow-2xl ring-1 ring-black/50"
      >
        <div className="relative overflow-hidden border-b border-[var(--border-subtle)]">
          <ItemPreview item={item} me={me} />
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold leading-6 text-[var(--text-strong)]">{item.name}</h3>
            <RarityTag rarity={item.rarity} />
          </div>
          <p className="mt-1 text-xs leading-5 text-[var(--text-body)]">{item.description}</p>

          <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--bg-float)] px-3 py-2">
            <span className="text-[11px] text-[var(--text-muted)]">{owned ? "Already owned" : "Price"}</span>
            {owned ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--green)]">
                <Icon name="check" size={13} /> Purchased
              </span>
            ) : (
              <Coins amount={item.price} />
            )}
          </div>

          <div className="mt-3 grid gap-2">
            <button
              type="button"
              disabled={busy || equipped || (!owned && !affordable)}
              onClick={() => void run(() => (owned ? onEquip(item.slot, item.id) : onPurchase(item.id)))}
              className={`h-9 rounded-lg text-sm font-semibold transition ${
                equipped
                  ? "cursor-default bg-[var(--bg-active)] text-[var(--text-muted)]"
                  : owned
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:brightness-110"
                    : affordable
                      ? "bg-[var(--green)] text-white hover:brightness-110"
                      : "cursor-not-allowed bg-[var(--bg-active)] text-[var(--text-faint)]"
              } disabled:opacity-70`}
            >
              {busy ? "Working…" : equipped ? "Equipped" : owned ? "Equip now" : affordable ? "Buy now" : "Not enough coins"}
            </button>
            <button
              type="button"
              onClick={() => onGift(item.id)}
              disabled={busy || !affordable}
              title={affordable ? "Buy this for another member" : "Not enough coins to gift this"}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="gift" size={15} /> Gift to a member
            </button>
          </div>
        </div>
      </DialogPanel>
    </div>
  );
}

export function ShopModal({
  open,
  me,
  shop,
  onClose,
  onPurchase,
  onEquip,
  onGift,
}: {
  open: boolean;
  me: User;
  shop: ShopItem[];
  onClose: () => void;
  onPurchase: (itemId: string) => Promise<void>;
  onEquip: (slot: CosmeticSlot, itemId: string | null) => Promise<void>;
  onGift: (itemId: string) => void;
}) {
  const [tab, setTab] = useState<CosmeticSlot | "inventory">("decoration");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  if (!open) return null;

  const items =
    tab === "inventory" ? shop.filter((item) => me.owned.includes(item.id)) : shop.filter((item) => item.slot === tab);
  const detail = detailId ? shop.find((entry) => entry.id === detailId) ?? null : null;

  async function act(item: ShopItem) {
    const owned = me.owned.includes(item.id);
    const equipped = me.cosmetics[item.slot] === item.key;
    setPendingId(item.id);
    try {
      if (!owned) await onPurchase(item.id);
      else if (!equipped) await onEquip(item.slot, item.id);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      <button
        type="button"
        aria-label="Close shop"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <DialogPanel
        label="Cosmetic shop"
        onClose={onClose}
        active={open}
        className="animate-modal relative flex h-full w-full max-w-5xl overflow-hidden bg-[var(--bg-sidebar)] shadow-2xl ring-1 ring-black/50 sm:h-[86vh] sm:rounded-xl"
      >
        <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-rail)] sm:flex">
          <div className="px-4 pb-3 pt-5">
            <div className="flex items-center gap-2 text-[var(--text-strong)]">
              <Icon name="bag" size={18} />
              <span className="text-sm font-bold uppercase tracking-wide">Shop</span>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 px-2">
            {TABS.map((entry) => {
              const count =
                entry.key === "inventory" ? me.owned.length : shop.filter((item) => item.slot === entry.key).length;
              return (
                <button
                  key={entry.key}
                  type="button"
                  aria-current={tab === entry.key ? "true" : undefined}
                  onClick={() => setTab(entry.key)}
                  className={`flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm transition ${
                    tab === entry.key
                      ? "bg-[var(--bg-active)] font-semibold text-white"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                  }`}
                >
                  <Icon name={entry.icon} size={17} />
                  <span className="flex-1 truncate">{entry.label}</span>
                  <span className="rounded bg-[var(--bg-float)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--text-muted)]">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="m-2 rounded-lg bg-[var(--bg-sidebar)] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Balance</div>
            <div className="mt-1 flex items-center justify-between">
              <Coins amount={me.coins} />
              <span className="text-[10px] text-[var(--text-faint)]">virtual</span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[var(--text-strong)]">Cosmetic shop</h2>
              <p className="mt-0.5 text-xs text-[var(--text-body)]">
                {tab === "inventory" ? "Everything you own, ready to equip." : SLOT_META[tab as CosmeticSlot].blurb}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="rounded-full bg-[var(--bg-float)] px-3 py-1.5">
                <Coins amount={me.coins} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-float)] text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
                aria-label="Close shop"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          </header>

          <div className="relative sm:hidden">
            <div className="scroll-fade-x scroll-thin flex gap-1 overflow-x-auto border-b border-[var(--border-subtle)] px-3 py-2">
              {TABS.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  aria-current={tab === entry.key ? "true" : undefined}
                  onClick={() => setTab(entry.key)}
                  className={`shrink-0 whitespace-nowrap rounded px-2.5 py-1 text-xs transition ${
                    tab === entry.key
                      ? "bg-[var(--accent)] font-semibold text-[var(--accent-contrast)]"
                      : "bg-[var(--bg-rail)] text-[var(--text-muted)]"
                  }`}
                >
                  {entry.label}
                </button>
              ))}
              <span aria-hidden className="w-6 shrink-0" />
            </div>
          </div>

          <div className="scroll-thin flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-rail)] text-[var(--text-muted)]">
                  <Icon name="inbox" size={28} />
                </div>
                <div className="text-sm font-semibold text-[var(--text-strong)]">
                  {tab === "inventory" ? "Your inventory is empty" : "Nothing here yet"}
                </div>
                <p className="max-w-xs text-xs text-[var(--text-body)]">
                  {tab === "inventory"
                    ? "Buy a decoration, effect, nameplate or theme and it will show up here."
                    : "Check back after the next shop rotation."}
                </p>
                <button
                  type="button"
                  onClick={() => setTab("decoration")}
                  className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)]"
                >
                  Browse decorations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                  const owned = me.owned.includes(item.id);
                  const equipped = me.cosmetics[item.slot] === item.key;
                  const affordable = me.coins >= item.price;
                  const pending = pendingId === item.id;

                  return (
                    <article
                      key={item.id}
                      className="hover-raise flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-chat)] shadow-lg shadow-black/20 transition hover:border-[var(--border-strong)]"
                      style={equipped ? { borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" } : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => setDetailId(item.id)}
                        aria-label={`View ${item.name}`}
                        className="block w-full text-left"
                      >
                        <div className="relative h-[132px] overflow-hidden border-b border-[var(--border-subtle)]">
                          <ItemPreview item={item} me={me} />
                          <span className="absolute left-2 top-2">
                            <RarityTag rarity={item.rarity} />
                          </span>
                          {equipped && (
                            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              <Icon name="check" size={11} /> Equipped
                            </span>
                          )}
                        </div>
                        <div className="px-3 pt-2.5">
                          <h3 className="truncate text-sm font-semibold leading-5 text-[var(--text-strong)]">
                            {item.name}
                          </h3>
                          <p className="mt-0.5 h-8 overflow-hidden text-[11px] leading-4 text-[var(--text-body)]">
                            {item.description}
                          </p>
                        </div>
                      </button>

                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-3 py-2">
                        <span className="min-w-0 truncate text-[11px]">
                          {owned ? (
                            <span className="font-medium text-[var(--text-muted)]">{equipped ? "In use" : "Owned"}</span>
                          ) : (
                            <Coins amount={item.price} />
                          )}
                        </span>
                        <button
                          type="button"
                          disabled={pending || equipped || (!owned && !affordable)}
                          onClick={() => void act(item)}
                          className={`h-7 min-w-[84px] shrink-0 rounded-md px-2.5 text-[11px] font-semibold transition ${
                              equipped
                                ? "cursor-default bg-[var(--bg-active)] text-[var(--text-muted)]"
                                : owned
                                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:brightness-110"
                                  : affordable
                                    ? "bg-[var(--green)] text-white hover:brightness-110"
                                    : "cursor-not-allowed bg-[var(--bg-active)] text-[var(--text-faint)]"
                            }`}
                          >
                            {pending ? "…" : equipped ? "Equipped" : owned ? "Equip" : affordable ? "Buy" : "Not enough"}
                          </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogPanel>

      {detail && (
        <ItemDetail
          item={detail}
          me={me}
          onClose={() => setDetailId(null)}
          onPurchase={onPurchase}
          onEquip={onEquip}
          onGift={onGift}
        />
      )}
    </div>
  );
}
