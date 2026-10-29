"use client";

import { useEffect, useRef, useState } from "react";
import type { Message, User } from "@/lib/types";
import { fullTimeLabel, timeLabel } from "@/lib/format";
import { Avatar } from "./cosmetics/avatar";
import { Nameplate } from "./cosmetics/nameplate";
import { MessageContent } from "./markdown";
import { EmojiPicker } from "./emoji-picker";
import { Icon } from "./icons";
import { VerifiedBadge } from "./verified-badge";

type Props = {
  message: Message;
  author: User;
  me: User;
  users: User[];
  compact: boolean;
  reply: { message: Message; author: User } | null;
  onReact: (id: string, emoji: string) => void;
  onReply: (message: Message) => void;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => void;
  onOpenProfile: (user: User, rect: DOMRect) => void;
};

export function MessageItem({
  message,
  author,
  me,
  users,
  compact,
  reply,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onOpenProfile,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMine = author.id === me.id;
  // A mention marks the message edge; the message body itself stays flat black.
  const mentionsMe = message.content.toLowerCase().includes(`@${me.name.toLowerCase()}`);

  useEffect(() => {
    if (editing) {
      setDraft(message.content);
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
      }
    }
  }, [editing, message.content]);

  async function save() {
    const next = draft.trim();
    if (!next || next === message.content) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onEdit(message.id, next);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative border-l-2 px-4 transition-colors hover:bg-white/[0.02] ${
        mentionsMe ? "border-[#7C3AED]" : "border-transparent"
      } ${compact ? "py-0.5" : "mt-4 py-0.5"}`}
    >
      {reply && (
        <div className="pointer-events-none flex items-center gap-1.5 pb-1 pl-[52px] text-[13px] text-[var(--text-muted)]">
          <span className="ml-[-30px] h-4 w-[30px] shrink-0 rounded-tl-[6px] border-t-2 border-l-2 border-[var(--border-strong)]" />
          <Avatar user={reply.author} size={16} />
          <span className="font-medium text-[var(--text)]">{reply.author.name}</span>
          <span className="truncate opacity-90">{reply.message.content.slice(0, 180)}</span>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex w-10 shrink-0 justify-center">
          {compact ? (
            <span className="mt-1 select-none text-[10px] leading-4 text-[var(--text-faint)] opacity-0 group-hover:opacity-100">
              {timeLabel(message.createdAt)}
            </span>
          ) : (
            <button
              type="button"
              onClick={(event) => onOpenProfile(author, event.currentTarget.getBoundingClientRect())}
              className="mt-0.5 h-10 w-10 transition hover:opacity-90"
              aria-label={`View ${author.name}'s profile`}
            >
              <Avatar user={author} size={40} />
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {!compact && (
            <div className="flex flex-wrap items-baseline gap-2">
              <button
                type="button"
                onClick={(event) => onOpenProfile(author, event.currentTarget.getBoundingClientRect())}
                className="hover:underline"
              >
                <Nameplate kind={author.cosmetics.nameplate} className="text-[15px] leading-5 font-semibold">
                  {author.name}
                </Nameplate>
              </button>
              {author.verified ? <VerifiedBadge size={13} /> : null}
              {author.id === "u-orbit" && (
                <span className="rounded bg-[var(--accent)] px-1 py-px text-[10px] font-bold text-white">APP</span>
              )}
              <span className="text-xs text-[var(--text-muted)]" title={fullTimeLabel(message.createdAt)}>
                {fullTimeLabel(message.createdAt)}
              </span>
            </div>
          )}

          {editing ? (
            <div className="mt-1">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  event.target.style.height = "auto";
                  event.target.style.height = `${Math.min(event.target.scrollHeight, 220)}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void save();
                  }
                  if (event.key === "Escape") setEditing(false);
                }}
                className="w-full resize-none rounded-lg bg-[var(--bg-input)] p-2.5 text-[15px] leading-6 text-[var(--text)] outline-none ring-0"
              />
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)]">
                  escape to <button type="button" className="text-[var(--link)] hover:underline" onClick={() => setEditing(false)}>cancel</button> • enter to{" "}
                  <button type="button" className="text-[var(--link)] hover:underline" onClick={() => void save()}>save</button>
                </span>
                {saving && <span className="text-[var(--text-faint)]">saving…</span>}
              </div>
            </div>
          ) : (
            <>
              <MessageContent content={message.content} users={users} />
              {message.editedAt && (
                <span className="ml-1 align-baseline text-[10px] text-[var(--text-faint)]">(edited)</span>
              )}
            </>
          )}

          {message.reactions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {message.reactions.map((reaction) => {
                const mine = reaction.users.includes(me.id);
                const names = reaction.users
                  .map((id) => users.find((u) => u.id === id)?.name ?? "someone")
                  .join(", ");
                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    title={`${names} reacted with ${reaction.emoji}`}
                    aria-pressed={mine}
                    aria-label={`${reaction.emoji} reaction, ${reaction.users.length} total`}
                    onClick={() => onReact(message.id, reaction.emoji)}
                    className={`flex h-[26px] items-center gap-1.5 rounded-lg border px-2 text-xs transition ${
                      mine
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-white"
                        : "border-transparent bg-[rgba(255,255,255,0.06)] text-[var(--text)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span className="text-sm leading-none">{reaction.emoji}</span>
                    <span className="font-medium tabular-nums">{reaction.users.length}</span>
                  </button>
                );
              })}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((open) => !open)}
                  className="flex h-[26px] items-center rounded-lg bg-[rgba(255,255,255,0.06)] px-2 text-[var(--text-muted)] transition hover:text-[var(--text)]"
                  aria-label="Add reaction"
                >
                  <Icon name="smile" size={15} />
                </button>
                {pickerOpen && (
                  <div className="absolute bottom-8 left-0 z-40">
                    <EmojiPicker
                      align="left"
                      onPick={(emoji) => {
                        onReact(message.id, emoji);
                        setPickerOpen(false);
                      }}
                      onClose={() => setPickerOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hover toolbar */}
      <div className="msg-actions absolute -top-4 right-4 z-20 hidden items-center rounded-lg border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-lg shadow-black/30 group-hover:flex focus-within:flex">
        <div className="relative">
          <button
            type="button"
            title="Add reaction"
            aria-label="Add reaction"
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            <Icon name="smile" size={17} />
          </button>
          {pickerOpen && (
            <div className="absolute top-9 right-0 z-40">
              <EmojiPicker
                onPick={(emoji) => {
                  onReact(message.id, emoji);
                  setPickerOpen(false);
                }}
                onClose={() => setPickerOpen(false)}
              />
            </div>
          )}
        </div>
        <button
          type="button"
          title="Reply"
          aria-label="Reply"
          onClick={() => onReply(message)}
          className="flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          <Icon name="reply" size={17} />
        </button>
        {isMine && (
          <>
            <button
              type="button"
              title="Edit"
              aria-label="Edit message"
              onClick={() => setEditing(true)}
              className="flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
            >
              <Icon name="pencil" size={16} />
            </button>
            <button
              type="button"
              title="Delete"
              aria-label="Delete message"
              onClick={() => setConfirming(true)}
              className="flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--red)] hover:text-white"
            >
              <Icon name="trash" size={16} />
            </button>
          </>
        )}
      </div>

      {confirming && (
        <div className="absolute right-4 top-6 z-30 w-56 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-float)] p-3 shadow-2xl shadow-black/60">
          <div className="text-sm font-semibold text-[var(--text-strong)]">Delete message?</div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">This can&apos;t be undone.</p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded px-2.5 py-1 text-xs text-[var(--text)] hover:underline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                onDelete(message.id);
              }}
              className="rounded bg-[var(--red)] px-2.5 py-1 text-xs font-medium text-white hover:brightness-110"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
