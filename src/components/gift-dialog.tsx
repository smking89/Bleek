"use client";

import { useMemo, useState } from "react";
import type { ShopItem, User } from "@/lib/types";
import { Avatar } from "./cosmetics/avatar";
import { DialogPanel } from "./dialog-panel";
import { Icon } from "./icons";

export function GiftDialog({
  item,
  users,
  me,
  onClose,
  onGift,
}: {
  item: ShopItem;
  users: User[];
  me: User;
  onClose: () => void;
  onGift: (itemId: string, userId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const candidates = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users
      .filter((user) => user.id !== me.id)
      .filter((user) => (needle ? user.name.toLowerCase().includes(needle) : true))
      .sort((a, b) => Number(a.status === "offline") - Number(b.status === "offline"));
  }, [users, me.id, query]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cancel gift"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <DialogPanel
        label={`Gift ${item.name}`}
        onClose={onClose}
        className="animate-modal relative w-full max-w-sm overflow-hidden rounded-xl bg-[var(--bg-sidebar)] shadow-2xl ring-1 ring-black/50"
      >
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-strong)]">Gift “{item.name}”</h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-body)]">
              {item.price > 0 ? `${item.price.toLocaleString()} ASTRO Coins from your ASTRO wallet` : "Free to send"} · they own it
              instantly
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-float)] text-[var(--text-muted)] hover:text-[var(--text-strong)]"
            aria-label="Close"
          >
            <Icon name="close" size={15} />
          </button>
        </header>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2 rounded bg-[var(--bg-rail)] px-2.5 py-1.5">
            <Icon name="search" size={14} className="text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a member"
              aria-label="Find a member"
              className="w-full bg-transparent text-xs text-[var(--text)] outline-none"
            />
          </div>

          <div className="scroll-thin mt-2 max-h-64 space-y-0.5 overflow-y-auto">
            {candidates.map((user) => (
              <button
                key={user.id}
                type="button"
                disabled={pending !== null || user.owned.includes(item.id)}
                onClick={async () => {
                  setPending(user.id);
                  try {
                    await onGift(item.id, user.id);
                    onClose();
                  } finally {
                    setPending(null);
                  }
                }}
                className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-left transition hover:bg-[var(--bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Avatar user={user} size={30} showStatus />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-[var(--text)]">{user.name}</span>
                  <span className="block truncate text-[10px] text-[var(--text-faint)]">
                    {user.owned.includes(item.id) ? "Already owns this" : user.activity ?? `@${user.name.toLowerCase()}`}
                  </span>
                </span>
                <span className="rounded bg-[var(--bg-rail)] px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)]">
                  {pending === user.id ? "…" : "Send"}
                </span>
              </button>
            ))}
            {candidates.length === 0 && (
              <p className="py-6 text-center text-xs text-[var(--text-muted)]">No members match that name.</p>
            )}
          </div>
        </div>
      </DialogPanel>
    </div>
  );
}
