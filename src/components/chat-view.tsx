"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Channel, ChannelLayout, Message, Server, User } from "@/lib/types";
import { dayKey, dayLabel, isSameDay } from "@/lib/format";
import { CanvasView, GalleryView } from "./channel-views";
import { Composer } from "./composer";
import { CharacterArt } from "./cosmetics/character";
import { Icon } from "./icons";
import { MessageItem } from "./message-item";

const LAYOUTS: { key: ChannelLayout; label: string; icon: "hash" | "inbox" | "pencil" }[] = [
  { key: "chat", label: "Chat", icon: "hash" },
  { key: "gallery", label: "Gallery", icon: "inbox" },
  { key: "canvas", label: "Canvas", icon: "pencil" },
];

export function ChatView({
  server,
  channel,
  messages,
  users,
  me,
  typing,
  membersOpen,
  onToggleMembers,
  onOpenMobileNav,
  onSend,
  onReact,
  onEdit,
  onDelete,
  onTyping,
  onOpenProfile,
  onSetLayout,
  onSaveDoc,
  onOpenStorefront,
  onFocusComposer,
}: {
  server: Server;
  channel: Channel;
  messages: Message[];
  users: User[];
  me: User;
  typing: User[];
  membersOpen: boolean;
  onToggleMembers: () => void;
  onOpenMobileNav: () => void;
  onSend: (content: string, replyTo: string | null) => Promise<void>;
  onReact: (id: string, emoji: string) => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => void;
  onTyping: () => void;
  onOpenProfile: (user: User, rect: DOMRect) => void;
  onSetLayout: (layout: ChannelLayout) => Promise<void>;
  onSaveDoc: (doc: string) => Promise<void>;
  onOpenStorefront: () => void;
  onFocusComposer: () => void;
}) {
  const [reply, setReply] = useState<Message | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const layout: ChannelLayout = channel.layout ?? "chat";
  const onlineCount = users.filter((user) => user.status !== "offline").length;

  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const channelMessages = useMemo(
    () =>
      messages
        .filter((message) => message.channelId === channel.id)
        .sort((a, b) => a.createdAt - b.createdAt),
    [messages, channel.id],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return channelMessages;
    return channelMessages.filter((message) => {
      const author = userById.get(message.authorId);
      return (
        message.content.toLowerCase().includes(needle) || (author?.name.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [channelMessages, query, userById]);

  useEffect(() => {
    setReply(null);
    setQuery("");
    stickToBottom.current = true;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [channel.id]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !stickToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [channelMessages.length, visible.length]);

  async function chooseLayout(next: ChannelLayout) {
    if (next === layout || switching) return;
    setSwitching(true);
    try {
      await onSetLayout(next);
    } finally {
      setSwitching(false);
    }
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[var(--bg-chat)]">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-[var(--border-subtle)] px-2 shadow-sm shadow-black/20 md:h-12 md:gap-2 md:px-4">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text)] transition hover:bg-[var(--bg-hover)] md:hidden"
          aria-label="Open channels"
        >
          <Icon name="arrow-left" size={22} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
          <Icon
            name={layout === "chat" ? "hash" : layout === "gallery" ? "inbox" : "pencil"}
            size={22}
            className="shrink-0 text-[var(--text-muted)]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="truncate text-[17px] font-bold leading-6 text-[var(--text-strong)] md:text-[15px] md:font-semibold">
                {channel.name}
              </h1>
              <Icon name="chevron-down" size={16} className="shrink-0 text-[var(--text-faint)] md:hidden" />
            </div>
            <p className="flex items-center gap-1.5 truncate text-[11px] leading-3 text-[var(--text-muted)] md:hidden">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--green)]" />
              {onlineCount} online
            </p>
          </div>
        </div>

        {channel.topic && (
          <>
            <div className="mx-2 hidden h-6 w-px bg-[var(--border-strong)] lg:block" />
            <p className="hidden min-w-0 flex-1 truncate text-[13px] text-[var(--text-muted)] lg:block">{channel.topic}</p>
          </>
        )}

        <div className="ml-auto flex shrink-0 items-center">
          <div className="flex items-center gap-0.5 text-[var(--text-muted)] md:rounded-lg md:bg-[var(--bg-rail)] md:p-0.5 md:ring-1 md:ring-[var(--border-subtle)]">
            {LAYOUTS.map((entry) => (
              <button
                key={entry.key}
                type="button"
                title={`${entry.label} layout`}
                aria-label={`${entry.label} layout`}
                aria-pressed={layout === entry.key}
                onClick={() => void chooseLayout(entry.key)}
                className={`hidden h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold transition md:flex ${
                  layout === entry.key
                    ? "bg-[var(--bg-active)] text-[var(--text-strong)]"
                    : "text-[var(--text-faint)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                }`}
              >
                <Icon name={entry.icon} size={14} />
                <span className="hidden lg:inline">{entry.label}</span>
              </button>
            ))}

            {layout === "chat" && (
              <div className="ml-0.5 hidden items-center lg:flex">
                <input
                  value={query}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search"
                  aria-label={`Search ${channel.name}`}
                  className="h-7 w-32 rounded-md bg-[var(--bg-chat)] px-2 text-xs text-[var(--text)] outline-none transition-all focus:w-44 focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            )}

            {layout === "chat" && (
              <button
                type="button"
                title="Search messages"
                aria-label="Search messages"
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((open) => !open)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)] md:h-7 md:w-7 md:rounded-md lg:hidden"
              >
                <Icon name="search" size={16} />
              </button>
            )}

            <span aria-hidden className="mx-0.5 hidden h-4 w-px bg-[var(--border-strong)] md:block" />

            <button
              type="button"
              onClick={onOpenStorefront}
              title="Server storefront"
              aria-label="Server storefront"
              className="hidden h-7 w-7 items-center justify-center rounded-md transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)] sm:flex"
            >
              <Icon name="bag" size={16} />
            </button>
            <button
              type="button"
              title="Notification settings"
              aria-label="Notification settings"
              className="hidden h-7 w-7 items-center justify-center rounded-md transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)] sm:flex"
            >
              <Icon name="bell" size={16} />
            </button>
            <button
              type="button"
              title={membersOpen ? "Hide member list" : "Show member list"}
              aria-label={membersOpen ? "Hide member list" : "Show member list"}
              aria-pressed={membersOpen}
              onClick={onToggleMembers}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)] md:h-7 md:w-7 md:rounded-md ${
                membersOpen ? "bg-[var(--bg-active)] text-[var(--text)]" : ""
              }`}
            >
              <Icon name="users" size={16} />
            </button>
          </div>
        </div>
      </header>

      {searchOpen && layout === "chat" && (
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-4 py-2 md:hidden">
          <Icon name="search" size={16} className="text-[var(--text-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search #${channel.name}`}
            className="flex-1 bg-transparent text-sm text-[var(--text)] outline-none"
          />
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
            }}
            className="text-[var(--text-muted)]"
            aria-label="Close search"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {layout === "gallery" ? (
        <GalleryView
          channel={channel}
          messages={messages}
          users={users}
          me={me}
          onOpenProfile={onOpenProfile}
          onReact={onReact}
          onOpenStorefront={onOpenStorefront}
        />
      ) : layout === "canvas" ? (
        <CanvasView channel={channel} users={users} me={me} onSave={onSaveDoc} onOpenStorefront={onOpenStorefront} />
      ) : (
        <div
          ref={scrollerRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          }}
          className="scroll-thin flex-1 overflow-y-auto overflow-x-hidden pt-4"
        >
          <div className="px-4 pb-2">
            <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-active)] text-[var(--text-strong)]">
              <Icon name="hash" size={40} />
            </div>
            <h2 className="text-[32px] font-bold leading-tight text-[var(--text-strong)]">
              Welcome to #{channel.name}!
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              This is the start of the #{channel.name} channel in {server.name}.
            </p>
          </div>

          {query.trim() && (
            <div className="mx-4 mb-2 rounded-lg bg-[var(--bg-sidebar)] px-3 py-2 text-xs text-[var(--text-muted)]">
              {visible.length} result{visible.length === 1 ? "" : "s"} for <strong className="text-[var(--text)]">{query}</strong>
            </div>
          )}

          {visible.length === 0 && query.trim() && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <span className="opacity-80">
                <CharacterArt kind={me.character} size={64} />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-strong)]">No matches in #{channel.name}</p>
                <p className="mt-1 text-xs text-[var(--text-body)]">
                  Nothing here mentions “{query.trim()}”. Try a shorter word.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-md bg-[var(--bg-active)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] transition hover:brightness-110"
              >
                Clear search
              </button>
            </div>
          )}

          {visible.map((message, index) => {
            const author = userById.get(message.authorId);
            if (!author) return null;
            const previous = visible[index - 1];
            const showDivider = !previous || !isSameDay(previous.createdAt, message.createdAt);
            const compact =
              !showDivider &&
              !!previous &&
              previous.authorId === message.authorId &&
              message.createdAt - previous.createdAt < 7 * 60 * 1000 &&
              !message.replyTo &&
              dayKey(previous.createdAt) === dayKey(message.createdAt);
            const replyMessage = message.replyTo
              ? channelMessages.find((candidate) => candidate.id === message.replyTo) ?? null
              : null;
            const replyAuthor = replyMessage ? userById.get(replyMessage.authorId) ?? null : null;

            return (
              <div key={message.id}>
                {showDivider && (
                  <div className="relative my-4 flex items-center px-4">
                    <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                    <span className="px-2 text-[11px] font-semibold text-[var(--text-muted)]">
                      {dayLabel(message.createdAt)}
                    </span>
                    <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                  </div>
                )}
                <MessageItem
                  message={message}
                  author={author}
                  me={me}
                  users={users}
                  compact={compact}
                  reply={replyMessage && replyAuthor ? { message: replyMessage, author: replyAuthor } : null}
                  onReact={onReact}
                  onReply={(target) => {
                    setReply(target);
                    stickToBottom.current = true;
                  }}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpenProfile={onOpenProfile}
                />
              </div>
            );
          })}

          <div className="h-6" />
        </div>
      )}

      {layout !== "canvas" ? (
        <Composer
          channelName={channel.name}
          reply={reply}
          replyAuthor={reply ? userById.get(reply.authorId) : undefined}
          typing={typing}
          onFocusComposer={onFocusComposer}
          onCancelReply={() => setReply(null)}
          onSend={async (content, replyTo) => {
            await onSend(content, replyTo);
            setReply(null);
            stickToBottom.current = true;
          }}
          onTyping={onTyping}
          onOpenShop={onOpenStorefront}
        />
      ) : null}
    </section>
  );
}
