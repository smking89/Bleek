"use client";

import { useEffect, useMemo, useState } from "react";
import type { Channel, Message, User } from "@/lib/types";
import { MessageContent } from "./markdown";
import { Avatar } from "./cosmetics/avatar";
import { Icon } from "./icons";

const PALETTES: [string, string][] = [
  ["#5865f2", "#a855f7"],
  ["#f97316", "#ec4899"],
  ["#22c55e", "#0ea5e9"],
  ["#eab308", "#f97316"],
  ["#0ea5e9", "#6366f1"],
  ["#dc2626", "#7c3aed"],
  ["#14b8a6", "#84cc16"],
  ["#f472b6", "#8b5cf6"],
];

const GLYPHS = ["✦", "◐", "❖", "△", "☾", "✺", "◇", "❋"];

function hash(value: string) {
  let h = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    h ^= value.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function time(now: number, at: number) {
  const diff = now - at;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

/** Pinterest-style board for art drops, links and screenshots. */
export function GalleryView({
  channel,
  messages,
  users,
  me,
  onOpenProfile,
  onReact,
  onOpenStorefront,
}: {
  channel: Channel;
  messages: Message[];
  users: User[];
  me: User;
  onOpenProfile: (user: User, rect: DOMRect) => void;
  onReact: (id: string, emoji: string) => void;
  onOpenStorefront: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const drops = useMemo(
    () => messages.filter((message) => message.channelId === channel.id).slice().sort((a, b) => b.createdAt - a.createdAt),
    [messages, channel.id],
  );

  return (
    <div className="scroll-thin flex-1 overflow-y-auto">
      <div className="border-b border-[var(--border-subtle)] px-5 py-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <Icon name="inbox" size={13} /> Gallery layout
            </div>
            <h2 className="mt-1 text-xl font-bold text-[var(--text-strong)]">#{channel.name}</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
              {channel.topic ?? "A visual channel."} Everything here stays scrollable, searchable and pinned — not lost in
              chat scrollback.
            </p>
          </div>
          <div className="rounded-lg bg-[var(--bg-sidebar)] px-3 py-2 text-right">
            <div className="text-lg font-bold tabular-nums text-[var(--text-strong)]">{drops.length}</div>
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">drops</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="columns-1 gap-3 sm:columns-2 xl:columns-3 [&>*]:mb-3">
          {drops.map((drop) => {
            const author = userById.get(drop.authorId);
            if (!author) return null;
            const seed = hash(drop.id);
            const palette = PALETTES[seed % PALETTES.length];
            const glyph = GLYPHS[seed % GLYPHS.length];
            const height = 110 + (seed % 130);
            const isArt = /https?:\/\/|\.png|\.jpg|\.gif|art|draw|sketch|design|shot|concept/i.test(drop.content);

            return (
              <article
                key={drop.id}
                className="hover-raise break-inside-avoid overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sidebar)]"
              >
                <div
                  className="relative flex items-center justify-center overflow-hidden"
                  style={{ height, background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
                >
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background:
                        "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.55), transparent 40%), radial-gradient(circle at 80% 75%, rgba(0,0,0,0.4), transparent 45%)",
                    }}
                  />
                  <span className="relative select-none text-5xl text-white/80 drop-shadow-lg">{isArt ? glyph : "❝"}</span>
                  {drop.media ? (
                    <span className="absolute left-2 top-2 text-xl" aria-hidden>
                      {drop.media.emoji}
                    </span>
                  ) : null}
                  <span className="absolute right-2 top-2 rounded bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur">
                    {time(now, drop.createdAt)}
                  </span>
                </div>

                <div className="space-y-2 p-3">
                  <p className="line-clamp-4 text-[13px] leading-5 text-[var(--text)]">
                    <MessageContent content={drop.content} users={users} />
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(event) => onOpenProfile(author, event.currentTarget.getBoundingClientRect())}
                      className="flex min-w-0 items-center gap-1.5 text-left"
                    >
                      <Avatar user={author} size={20} />
                      <span className="truncate text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)]">
                        {author.name}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      {drop.reactions.slice(0, 2).map((reaction) => (
                        <button
                          key={reaction.emoji}
                          type="button"
                          onClick={() => onReact(drop.id, reaction.emoji)}
                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                            reaction.users.includes(me.id)
                              ? "bg-[var(--accent-soft)] text-[var(--text-strong)]"
                              : "bg-[var(--bg-rail)] text-[var(--text-muted)]"
                          }`}
                        >
                          {reaction.emoji} {reaction.users.length}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => onReact(drop.id, "🔥")}
                        className="rounded-full bg-[var(--bg-rail)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)]"
                        aria-label="React with fire"
                      >
                        🔥
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {drops.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-sidebar)] text-[var(--text-muted)]">
              <Icon name="inbox" size={24} />
            </div>
            <p className="text-sm font-semibold text-[var(--text-strong)]">This board is empty</p>
            <p className="max-w-sm text-xs text-[var(--text-muted)]">Drop a link or a screenshot below and it lands here as a card.</p>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenStorefront}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-3 text-left transition hover:border-[var(--accent)]"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-2)]">
              <Icon name="bag" size={16} />
            </span>
            <span>
              <span className="block text-xs font-semibold text-[var(--text-strong)]">Sell your work here</span>
              <span className="block text-[11px] text-[var(--text-muted)]">Mint a cosmetic into this server&apos;s storefront.</span>
            </span>
          </span>
          <Icon name="chevron-down" size={16} className="-rotate-90 text-[var(--text-muted)]" />
        </button>
      </div>
    </div>
  );
}

const BLOCK = /^(#{1,3})\s+(.*)$|^[-*]\s+(.*)$|^(\d+)\.\s+(.*)$|^>\s?(.*)$/;

/** Notion-style knowledge base: a markdown canvas the channel can edit in place. */
export function CanvasView({
  channel,
  users,
  me,
  onSave,
  onOpenStorefront,
}: {
  channel: Channel;
  users: User[];
  me: User;
  onSave: (doc: string) => Promise<void>;
  onOpenStorefront: () => void;
}) {
  const [draft, setDraft] = useState(channel.doc ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(channel.doc ?? "");
    setEditing(false);
  }, [channel.id, channel.doc]);

  async function save() {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  const blocks = draft.split("\n");

  return (
    <div className="scroll-thin flex-1 overflow-y-auto">
      <div className="border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-faint)]">
              <Icon name="pencil" size={13} /> Canvas layout
            </div>
            <h2 className="mt-1 text-xl font-bold text-[var(--text-strong)]">#{channel.name}</h2>
            <p className="text-xs text-[var(--text-muted)]">
              A living document, not a chat log. Edits are versioned to the channel and visible to everyone.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(channel.doc ?? "");
                    setEditing(false);
                  }}
                  className="rounded px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-contrast)] disabled:opacity-50"
                >
                  {saving ? "Publishing…" : "Publish"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded bg-[var(--bg-active)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:brightness-110"
              >
                <Icon name="pencil" size={13} /> Edit document
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-5 py-6">
        {editing ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "H1", insert: "# " },
                { label: "H2", insert: "## " },
                { label: "Bullet", insert: "- " },
                { label: "Quote", insert: "> " },
                { label: "Code", insert: "`" },
              ].map((tool) => (
                <button
                  key={tool.label}
                  type="button"
                  onClick={() => setDraft((current) => `${current}${current.endsWith("\n") || !current ? "" : "\n"}${tool.insert}`)}
                  className="rounded bg-[var(--bg-sidebar)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  {tool.label}
                </button>
              ))}
              <span className="ml-auto self-center text-[11px] text-[var(--text-faint)]">{draft.length} chars</span>
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck={false}
              className="scroll-thin h-[52vh] w-full resize-none rounded-xl border border-[var(--border-strong)] bg-[var(--bg-rail)] px-4 py-3 font-mono text-[13px] leading-6 text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        ) : (
          <article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-6 py-6 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3 text-[11px] text-[var(--text-faint)]">
              <Icon name="users" size={13} /> {channel.doc ? `${channel.doc.trim().split(/\s+/).length} words` : "Empty canvas"}
              <span className="ml-auto">Last edited by {me.name}</span>
            </div>
            <div className="space-y-1.5">
              {blocks.map((line, index) => {
                const heading = line.match(/^(#{1,3})\s+(.*)$/);
                if (heading) {
                  const level = heading[1].length;
                  return (
                    <h3
                      key={index}
                      className={
                        level === 1
                          ? "mt-2 text-2xl font-bold text-[var(--text-strong)]"
                          : level === 2
                            ? "mt-4 text-lg font-bold text-[var(--text-strong)]"
                            : "mt-3 text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]"
                      }
                    >
                      <MessageContent content={heading[2]} users={users} />
                    </h3>
                  );
                }
                if (BLOCK.test(line) && line.startsWith("- ")) {
                  return (
                    <div key={index} className="flex gap-2 text-sm leading-6 text-[var(--text)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-2)]" />
                      <MessageContent content={line.slice(2)} users={users} />
                    </div>
                  );
                }
                const numbered = line.match(/^(\d+)\.\s+(.*)$/);
                if (numbered) {
                  return (
                    <div key={index} className="flex gap-2 text-sm leading-6 text-[var(--text)]">
                      <span className="w-4 shrink-0 text-right font-semibold text-[var(--text-faint)]">{numbered[1]}.</span>
                      <MessageContent content={numbered[2]} users={users} />
                    </div>
                  );
                }
                if (line.startsWith("> ")) {
                  return (
                    <blockquote
                      key={index}
                      className="my-2 border-l-2 border-[var(--accent)] bg-[var(--bg-chat)] px-3 py-1.5 text-sm italic text-[var(--text-muted)]"
                    >
                      <MessageContent content={line.slice(2)} users={users} />
                    </blockquote>
                  );
                }
                if (!line.trim()) return <div key={index} className="h-2" />;
                return (
                  <p key={index} className="text-sm leading-6 text-[var(--text)]">
                    <MessageContent content={line} users={users} />
                  </p>
                );
              })}
            </div>
          </article>
        )}

        <button
          type="button"
          onClick={onOpenStorefront}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-4 py-3 text-left transition hover:border-[var(--accent)]"
        >
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-2)]">
              <Icon name="bag" size={16} />
            </span>
            <span>
              <span className="block text-xs font-semibold text-[var(--text-strong)]">Community storefront</span>
              <span className="block text-[11px] text-[var(--text-muted)]">Buy, mint or gift a cosmetic made in this server.</span>
            </span>
          </span>
          <Icon name="chevron-down" size={16} className="-rotate-90 text-[var(--text-muted)]" />
        </button>
      </div>
    </div>
  );
}
