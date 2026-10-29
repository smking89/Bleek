"use client";

import { useMemo, useState } from "react";
import type { Channel, HomeFilter, Message, Server, User } from "@/lib/types";
import { Avatar } from "./cosmetics/avatar";
import { Nameplate } from "./cosmetics/nameplate";
import { Icon } from "./icons";

const MINUTE = 60_000;

function ago(at: number, now: number) {
  const diff = Math.max(0, now - at);
  if (diff < MINUTE) return "just now";
  if (diff < 60 * MINUTE) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < 24 * 60 * MINUTE) return `${Math.floor(diff / (60 * MINUTE))}h ago`;
  return `${Math.floor(diff / (24 * 60 * MINUTE))}d ago`;
}

type Thread = {
  server: Server;
  channel: Channel;
  recent: Message[];
  last: Message;
  participants: User[];
  fresh: number;
  score: number;
};

const STOPWORDS = new Set([
  "about", "after", "again", "also", "and", "anything", "are", "because", "been", "but", "can", "could", "does",
  "doing", "down", "even", "every", "from", "gonna", "have", "here", "into", "just", "like", "make", "more", "much",
  "need", "never", "only", "other", "over", "really", "right", "should", "some", "still", "such", "than", "that",
  "their", "them", "then", "there", "these", "they", "thing", "things", "this", "those", "through", "under", "very",
  "want", "well", "were", "what", "when", "where", "which", "while", "who", "will", "with", "would", "your", "youre",
]);

export function HomeFeed({
  servers,
  users,
  messages,
  me,
  clock,
  payouts,
  onOpen,
  onOpenStorefront,
}: {
  servers: Server[];
  users: User[];
  messages: Message[];
  me: User;
  clock: number;
  payouts: { creatorId: string; creatorShare: number; serverId: string; amount: number }[];
  onOpen: (serverId: string, channelId: string) => void;
  onOpenStorefront: (serverId: string) => void;
}) {
  const [filter, setFilter] = useState<HomeFilter>("all");

  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const dayAgo = clock - 24 * 60 * MINUTE;

  const threads = useMemo<Thread[]>(() => {
    const built = servers.flatMap((server) =>
      server.channels
        .filter((channel) => channel.type === "text")
        .map((channel) => {
          const list = messages
            .filter((message) => message.channelId === channel.id)
            .sort((a, b) => a.createdAt - b.createdAt);
          const last = list[list.length - 1];
          if (!last) return null;
          const recent = list.slice(-4).reverse();
          const participants = [...new Set(list.slice(-14).map((message) => message.authorId))]
            .map((id) => userById.get(id))
            .filter((user): user is User => Boolean(user));
          const fresh = list.filter((message) => message.createdAt >= dayAgo).length;
          return {
            server,
            channel,
            recent,
            last,
            participants: [...new Map(participants.map((user) => [user.id, user])).values()],
            fresh,
            score: fresh * 4 + participants.length * 2 + (last.createdAt >= dayAgo ? 3 : 0),
          };
        })
        .filter((entry): entry is Thread => Boolean(entry)),
    );
    return built.sort((a, b) => b.score - a.score || b.last.createdAt - a.last.createdAt);
  }, [servers, messages, userById, dayAgo]);

  const trending = useMemo(() => {
    const counts = new Map<string, number>();
    for (const message of messages) {
      if (message.createdAt < clock - 48 * 60 * MINUTE) continue;
      for (const raw of message.content.toLowerCase().split(/[^a-z0-9]+/)) {
        if (raw.length < 5 || STOPWORDS.has(raw)) continue;
        counts.set(raw, (counts.get(raw) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [messages, clock]);

  const audioRooms = useMemo(
    () =>
      servers.flatMap((server) =>
        server.channels.filter((channel) => channel.type === "voice").map((channel) => ({ server, channel })),
      ),
    [servers],
  );

  const recentThreads = filter === "text" ? threads : threads;
  const myEarnings = payouts.filter((entry) => entry.creatorId === me.id).reduce((total, entry) => total + entry.creatorShare, 0);
  const totalCreator = payouts.reduce((total, entry) => total + entry.creatorShare, 0);
  const online = users.filter((user) => user.status === "online" || user.status === "idle");

  return (
    <section className="flex min-w-0 flex-1 bg-[var(--bg-chat)]">
      <div className="scroll-thin flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="border-b border-[var(--border-subtle)] px-5 pb-4 pt-5 sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bleek-icon.png" alt="" width={14} height={14} className="h-3.5 w-3.5 object-contain" />
                Bleek — unified home
              </div>
              <h1 className="mt-1 text-2xl font-bold text-[var(--text-strong)]">Welcome back, {me.name}</h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
                Every conversation from the {servers.length} communities you&apos;re in, in one place. Servers are
                infrastructure — this is the feed.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[var(--bg-sidebar)] px-3 py-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">ASTRO wallet</span>
              <span className="flex items-center gap-1 font-semibold tabular-nums text-[var(--yellow)]">
                <Icon name="coins" size={14} /> {me.coins.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {(
              [
                { key: "all" as const, label: "Everything", icon: "sparkles" as const },
                { key: "text" as const, label: "Text threads", icon: "hash" as const },
                { key: "audio" as const, label: "Audio rooms", icon: "volume" as const },
                { key: "trending" as const, label: "Trending", icon: "compass" as const },
              ] satisfies { key: HomeFilter; label: string; icon: "sparkles" | "hash" | "volume" | "compass" }[]
            ).map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setFilter(entry.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === entry.key
                    ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                    : "bg-[var(--bg-sidebar)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <Icon name={entry.icon} size={14} /> {entry.label}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-7 px-5 py-5 sm:px-7">
          {filter === "trending" ? (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Across your servers</h2>
              <p className="mt-1 text-xs text-[var(--text-faint)]">Words surfacing in the last 48 hours. No per-server silos.</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {trending.map(([word, count], index) => (
                  <div
                    key={word}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-rail)] text-xs font-bold text-[var(--text-muted)]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--text-strong)]">#{word}</div>
                        <div className="text-[11px] text-[var(--text-faint)]">{count} mentions</div>
                      </div>
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--bg-rail)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(12, (count / (trending[0]?.[1] || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {filter === "audio" ? (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Persistent audio spaces</h2>
              <p className="mt-1 text-xs text-[var(--text-faint)]">Drop-in rooms, no invite links — join from any server.</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {audioRooms.map(({ server, channel }) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onOpen(server.id, channel.id)}
                    className="hover-raise flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-3 text-left"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-rail)] text-[var(--green)]">
                      <Icon name="volume" size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--text-strong)]">{channel.name}</span>
                      <span className="block truncate text-[11px] text-[var(--text-muted)]">
                        {server.icon} {server.name} · open room
                      </span>
                    </span>
                    <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-bold text-[var(--accent-contrast)]">
                      Join
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {filter !== "audio" && filter !== "trending" ? (
            <div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Active threads</h2>
                <span className="text-[11px] text-[var(--text-faint)]">{recentThreads.length} channels with history</span>
              </div>
              <div className="mt-3 space-y-2.5">
                {recentThreads.map((thread) => {
                  const author = userById.get(thread.last.authorId);
                  return (
                    <article
                      key={thread.channel.id}
                      className="hover-raise group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--text-muted)]">
                          <span className="text-sm">{thread.server.icon}</span>
                          <span className="truncate font-semibold text-[var(--text)]">{thread.server.name}</span>
                          <span className="text-[var(--text-faint)]">/</span>
                          <span className="flex min-w-0 items-center gap-1 truncate">
                            <Icon name="hash" size={12} /> {thread.channel.name}
                          </span>
                          {thread.channel.layout === "gallery" ? (
                            <span className="rounded bg-[var(--bg-rail)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--text-faint)]">
                              gallery
                            </span>
                          ) : thread.channel.layout === "canvas" ? (
                            <span className="rounded bg-[var(--bg-rail)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--text-faint)]">
                              canvas
                            </span>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-[11px] text-[var(--text-faint)]">{ago(thread.last.createdAt, clock)}</span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm text-[var(--text)]">
                        <span className="font-semibold" style={{ color: author?.roles[0]?.color ?? "var(--text-strong)" }}>
                          {author?.name ?? "Unknown"}:
                        </span>{" "}
                        {thread.last.content}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex -space-x-1.5">
                          {thread.participants.slice(0, 4).map((user) => (
                            <Avatar key={user.id} user={user} size={22} />
                          ))}
                          {thread.participants.length > 4 && (
                            <span className="flex h-[22px] items-center rounded-full bg-[var(--bg-rail)] px-1.5 text-[10px] font-semibold text-[var(--text-muted)]">
                              +{thread.participants.length - 4}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-[var(--text-faint)]">
                          <span>{thread.fresh} today</span>
                          <button
                            type="button"
                            onClick={() => onOpen(thread.server.id, thread.channel.id)}
                            className="rounded bg-[var(--bg-rail)] px-2.5 py-1 font-semibold text-[var(--text)] transition group-hover:bg-[var(--accent)] group-hover:text-white"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--text-muted)]">Community storefronts</h2>
              <span className="text-[11px] text-[var(--text-faint)]">90% to the creator</span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {servers
                .filter((server) => server.storefront)
                .map((server) => (
                  <button
                    key={server.id}
                    type="button"
                    onClick={() => onOpenStorefront(server.id)}
                    className="hover-raise flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-gradient-to-r from-[var(--accent-soft)] to-transparent p-3 text-left"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-rail)] text-lg">
                      {server.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--text-strong)]">{server.name}</span>
                      <span className="block truncate text-[11px] text-[var(--text-muted)]">
                        {server.storefront?.items.length ?? 0} community cosmetics
                      </span>
                    </span>
                    <Icon name="bag" size={18} className="text-[var(--text-muted)]" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="scroll-thin hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-4 xl:flex">
        <div className="rounded-xl bg-[var(--bg-chat)] p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">Today, at a glance</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { label: "Active threads", value: threads.filter((thread) => thread.fresh > 0).length },
              { label: "Messages", value: messages.filter((message) => message.createdAt >= dayAgo).length },
              { label: "People online", value: online.length },
              { label: "Audio rooms", value: audioRooms.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-[var(--bg-sidebar)] px-2.5 py-2">
                <div className="text-lg font-bold tabular-nums text-[var(--text-strong)]">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">Around right now</div>
          <div className="mt-2 space-y-0.5">
            {online.slice(0, 7).map((user) => (
              <div key={user.id} className="flex items-center gap-2 rounded px-1 py-1.5 hover:bg-[var(--bg-hover)]">
                <Avatar user={user} size={28} showStatus />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-[var(--text)]">
                    {user.cosmetics.nameplate ? (
                      <Nameplate kind={user.cosmetics.nameplate} className="text-xs font-semibold">
                        {user.name}
                      </Nameplate>
                    ) : (
                      user.name
                    )}
                  </div>
                  <div className="truncate text-[10px] text-[var(--text-faint)]">{user.activity ?? "Online"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
            <Icon name="coins" size={13} /> Creator payouts
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold tabular-nums text-[var(--text-strong)]">{totalCreator.toLocaleString()}</span>
            <span className="text-[11px] text-[var(--text-faint)]">coins to creators</span>
          </div>
          <div className="mt-1 text-[11px] text-[var(--text-muted)]">
            You&apos;ve earned <strong className="text-[var(--text)]">{myEarnings.toLocaleString()}</strong> from your mints.
          </div>
        </div>
      </aside>
    </section>
  );
}
