"use client";

import { DialogPanel } from "./dialog-panel";

import { useEffect, useMemo, useState } from "react";
import type { Payout, Server, ShopItem, User } from "@/lib/types";
import { RARITY, THEMES } from "@/lib/shop";
import { Avatar } from "./cosmetics/avatar";
import { Nameplate } from "./cosmetics/nameplate";
import { ProfileEffect } from "./cosmetics/profile-effect";
import { AstroGlyph } from "./brand/astro-brand";
import { Icon } from "./icons";

const PREVIEW_KEY: Record<ShopItem["slot"], ShopItem["key"]> = {
  decoration: "aurora-halo",
  effect: "soft-glow",
  nameplate: "neon-pulse",
  theme: "blurple",
};

const SLOTS: { key: ShopItem["slot"]; label: string }[] = [
  { key: "decoration", label: "Avatar decoration" },
  { key: "effect", label: "Profile effect" },
  { key: "nameplate", label: "Nameplate" },
  { key: "theme", label: "App theme" },
];

function StorePreview({ item, me }: { item: ShopItem; me: User }) {
  if (item.slot === "decoration") {
    return (
      <div
        className="flex h-28 items-center justify-center"
        style={{ background: `radial-gradient(circle at 50% 45%, ${item.accent}30, var(--bg-rail) 72%)` }}
      >
        <Avatar user={me} size={56} decoration={item.key as never} />
      </div>
    );
  }
  if (item.slot === "effect") {
    return (
      <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(135deg, ${me.banner[0]}, ${me.banner[1]})` }}>
        <ProfileEffect kind={item.key as never} />
        <div className="relative flex h-full items-end p-2.5">
          <Avatar user={me} size={34} />
        </div>
      </div>
    );
  }
  if (item.slot === "nameplate") {
    return (
      <div className="flex h-28 flex-col items-center justify-center gap-1 bg-[var(--bg-rail)]">
        <span className="text-[9px] uppercase tracking-widest text-[var(--text-faint)]">Display name</span>
        <Nameplate kind={item.key as never} className="text-xl font-bold">
          {me.name}
        </Nameplate>
      </div>
    );
  }
  const theme = THEMES[item.key as keyof typeof THEMES];
  return (
    <div className="flex h-28 items-center justify-center gap-2 bg-[var(--bg-rail)]">
      {theme.swatch.map((color) => (
        <span key={color} className="h-8 w-8 rounded-full ring-1 ring-white/20" style={{ background: color }} />
      ))}
      <span className="ml-1 text-[11px] text-[var(--text-muted)]">{theme.label}</span>
    </div>
  );
}

export function StorefrontModal({
  open,
  server,
  me,
  payouts,
  onClose,
  onMint,
  onPurchase,
  onGift,
}: {
  open: boolean;
  server: Server;
  me: User;
  payouts: Payout[];
  onClose: () => void;
  onMint: (input: { name: string; description?: string; slot: ShopItem["slot"]; price: number }) => Promise<void>;
  onPurchase: (itemId: string) => Promise<void>;
  onGift: (itemId: string) => void;
}) {
  const [tab, setTab] = useState<"shop" | "mint" | "ledger">("shop");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slot, setSlot] = useState<ShopItem["slot"]>("decoration");
  const [price, setPrice] = useState("800");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = server.storefront?.items ?? [];
  const ledger = useMemo(() => payouts.filter((entry) => entry.serverId === server.id), [payouts, server.id]);
  const creatorTotal = ledger.reduce((total, entry) => total + entry.creatorShare, 0);
  const platformTotal = ledger.reduce((total, entry) => total + entry.platformShare, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function mint() {
    setError(null);
    setBusy(true);
    try {
      await onMint({
        name: name.trim(),
        description: description.trim() || undefined,
        slot,
        price: Math.max(0, Math.round(Number(price) || 0)),
      });
      setName("");
      setDescription("");
      setTab("shop");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not mint that cosmetic");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      <button type="button" aria-label="Close storefront" onClick={onClose} className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm" />
      <DialogPanel
        label={`${server.name} storefront`}
        onClose={onClose}
        active={open}
        className="animate-modal relative flex h-full w-full max-w-5xl overflow-hidden bg-[var(--bg-sidebar)] shadow-2xl ring-1 ring-black/50 sm:h-[86vh] sm:rounded-xl"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-[var(--border-subtle)] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-rail)] text-xl">{server.icon}</span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-[var(--text-strong)]">{server.name} storefront</h2>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {server.storefront?.tagline ?? "Community cosmetics, minted by members."}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  title="ASTRO wallet"
                  className="flex items-center gap-1.5 rounded-full bg-[var(--bg-float)] px-3 py-1.5 text-xs font-semibold tabular-nums text-[var(--yellow)]"
                >
                  <AstroGlyph size={13} /> {me.coins.toLocaleString()}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    ASTRO Coins
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-float)] text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                  aria-label="Close storefront"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex gap-1">
                {(
                  [
                    { key: "shop" as const, label: `Shop (${items.length})` },
                    { key: "mint" as const, label: "Mint a cosmetic" },
                    { key: "ledger" as const, label: "Payouts" },
                  ] satisfies { key: "shop" | "mint" | "ledger"; label: string }[]
                ).map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => setTab(entry.key)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                      tab === entry.key ? "bg-[var(--accent)] text-[var(--accent-contrast)]" : "bg-[var(--bg-rail)] text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2 rounded-full bg-[var(--bg-rail)] px-3 py-1 text-[11px]">
                <span className="font-semibold text-[var(--green)]">90% creator</span>
                <span className="h-3 w-px bg-[var(--border-strong)]" />
                <span className="text-[var(--text-muted)]">10% infrastructure</span>
              </div>
            </div>
          </header>

          <div className="scroll-thin flex-1 overflow-y-auto p-4">
            {tab === "shop" ? (
              items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-rail)] text-[var(--text-muted)]">
                    <Icon name="bag" size={24} />
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-strong)]">No community cosmetics yet</p>
                  <p className="max-w-sm text-xs text-[var(--text-muted)]">
                    Be the first: mint a decoration, effect, nameplate or theme and keep 90% of every sale.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("mint")}
                    className="mt-1 rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)]"
                  >
                    Mint the first item
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => {
                    const owned = me.owned.includes(item.id);
                    const equipped = me.cosmetics[item.slot] === item.key;
                    const affordable = me.coins >= item.price;
                    const rarity = RARITY[item.rarity];
                    const creator = item.creatorId ? server.id && item.creatorId : null;
                    return (
                      <article
                        key={item.id}
                        className="hover-raise overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-chat)] shadow-lg shadow-black/20"
                        style={equipped ? { borderColor: "var(--accent)" } : undefined}
                      >
                        <div className="relative overflow-hidden border-b border-[var(--border-subtle)]">
                          <StorePreview item={item} me={me} />
                          <span
                            className="absolute left-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black/85"
                            style={{ background: rarity.color }}
                          >
                            {rarity.label}
                          </span>
                          {equipped ? (
                            <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                              <Icon name="check" size={10} /> Equipped
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-2 p-3">
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--text-strong)]">{item.name}</h3>
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-[var(--text-muted)]">{item.description}</p>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[var(--text-faint)]">
                            <span className="truncate">by {creator ?? "a member"}</span>
                            <span className="tabular-nums text-[var(--yellow)]">{item.price.toLocaleString()} c</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={equipped || (!owned && !affordable)}
                              onClick={() => void onPurchase(item.id)}
                              className={`flex-1 rounded px-2 py-1.5 text-xs font-semibold transition ${
                                equipped
                                  ? "cursor-default bg-[var(--bg-active)] text-[var(--text-muted)]"
                                  : owned
                                    ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:brightness-110"
                                    : affordable
                                      ? "bg-[var(--green)] text-white hover:brightness-110"
                                      : "cursor-not-allowed bg-[var(--bg-active)] text-[var(--text-faint)]"
                              }`}
                            >
                              {equipped ? "Equipped" : owned ? "Equip" : affordable ? "Buy" : "Not enough"}
                            </button>
                            <button
                              type="button"
                              onClick={() => onGift(item.id)}
                              disabled={owned || !affordable}
                              className="flex items-center gap-1 rounded bg-[var(--bg-active)] px-2 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Icon name="gift" size={13} /> Gift
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            ) : tab === "mint" ? (
              <div className="mx-auto max-w-xl space-y-3">
                <div>
                  <label htmlFor="mint-name" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Name
                  </label>
                  <input
                    id="mint-name"
                    value={name}
                    maxLength={40}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Name your cosmetic"
                    className="mt-1 w-full rounded bg-[var(--bg-rail)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div>
                  <label htmlFor="mint-desc" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Description
                  </label>
                  <textarea
                    id="mint-desc"
                    value={description}
                    maxLength={140}
                    rows={2}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What makes it worth 800 ASTRO Coins?"
                    className="mt-1 w-full resize-none rounded bg-[var(--bg-rail)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label htmlFor="mint-slot" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Slot
                    </label>
                    <select
                      id="mint-slot"
                      value={slot}
                      onChange={(event) => setSlot(event.target.value as ShopItem["slot"])}
                      className="mt-1 w-full rounded bg-[var(--bg-rail)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    >
                      {SLOTS.map((entry) => (
                        <option key={entry.key} value={entry.key}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="mint-price" className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Price (ASTRO Coins)
                  </label>
                  <input
                    id="mint-price"
                    type="number"
                    min={0}
                    max={100000}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="mt-1 w-full rounded bg-[var(--bg-rail)] px-3 py-2 text-sm tabular-nums text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <p className="mt-1 text-[11px] text-[var(--text-faint)]">
                    You receive <strong className="text-[var(--green)]">{Math.round((Number(price) || 0) * 0.9).toLocaleString()}</strong>{" "}
                    of each sale ({Math.round((Number(price) || 0) * 0.1).toLocaleString()} to infrastructure).
                  </p>
                </div>

                {name.trim() ? (
                  <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">Live preview</div>
                    <div className="mt-2 overflow-hidden rounded-lg">
                      <StorePreview
                        item={{
                          id: "preview",
                          slot,
                          key: PREVIEW_KEY[slot],
                          name: name || "Untitled",
                          description: description,
                          price: Number(price) || 0,
                          rarity: "rare",
                          accent: "#f472b6",
                        }}
                        me={me}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text-strong)]">{name}</span>
                      <span className="text-xs tabular-nums text-[var(--yellow)]">{Number(price) || 0} ASTRO Coins</span>
                    </div>
                  </div>
                ) : null}

                {error ? <p className="text-xs text-[var(--red)]">{error}</p> : null}

                <button
                  type="button"
                  onClick={() => void mint()}
                  disabled={busy || !name.trim()}
                  className="w-full rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "Minting…" : "Mint into the storefront"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Creator earnings", value: creatorTotal, color: "var(--green)" },
                    { label: "Infrastructure", value: platformTotal, color: "var(--text)" },
                    { label: "Sales", value: ledger.length, color: "var(--text)" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">{stat.label}</div>
                      <div className="mt-1 text-xl font-bold tabular-nums" style={{ color: stat.color }}>
                        {stat.value.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-rail)] text-[10px] uppercase tracking-wider text-[var(--text-faint)]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Item</th>
                        <th className="px-3 py-2 font-semibold">Creator</th>
                        <th className="px-3 py-2 text-right font-semibold">Sale</th>
                        <th className="px-3 py-2 text-right font-semibold">Creator 90%</th>
                        <th className="px-3 py-2 text-right font-semibold">Platform 10%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((entry) => {
                        const item = items.find((candidate) => candidate.id === entry.itemId);
                        const creator = server.roles.find((role) => role.id === entry.creatorId);
                        return (
                          <tr key={entry.id} className="border-t border-[var(--border-subtle)]">
                            <td className="px-3 py-2 text-[var(--text)]">{item?.name ?? entry.itemId}</td>
                            <td className="px-3 py-2 text-[var(--text-muted)]">{creator?.name ?? entry.creatorId}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-[var(--text-muted)]">{entry.amount.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-[var(--green)]">{entry.creatorShare.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-[var(--text-faint)]">{entry.platformShare.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                      {ledger.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 py-6 text-center text-[var(--text-muted)]">
                            No sales yet — the first mint is all upside.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogPanel>
    </div>
  );
}
