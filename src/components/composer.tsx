"use client";

import { useEffect, useRef, useState } from "react";
import type { Message, User } from "@/lib/types";
import { EmojiPicker } from "./emoji-picker";
import { Icon } from "./icons";

export function Composer({
  channelName,
  reply,
  replyAuthor,
  typing,
  onCancelReply,
  onSend,
  onTyping,
  onOpenShop,
  onFocusComposer,
}: {
  channelName: string;
  reply: Message | null;
  replyAuthor?: User;
  typing: User[];
  onCancelReply: () => void;
  onSend: (content: string, replyTo: string | null) => Promise<void>;
  onTyping: () => void;
  onOpenShop: () => void;
  onFocusComposer?: () => void;
}) {
  const [value, setValue] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [channelName]);

  async function submit() {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await onSend(content, reply?.id ?? null);
      setValue("");
    } finally {
      setSending(false);
    }
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + emoji + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  const canSend = value.trim().length > 0;

  return (
    <div className="px-3 pb-3 pt-1 md:px-4 md:pb-5">
      {typing.length > 0 && (
        <div className="flex h-5 items-center gap-1.5 pl-1 text-xs text-[var(--text)]">
          <span className="flex items-end gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 rounded-full bg-[var(--text-muted)]"
                style={{ animation: `nebula-typing 1.2s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </span>
          <strong className="font-semibold">{typing.map((u) => u.name).join(", ")}</strong>
          <span className="text-[var(--text-muted)]">{typing.length === 1 ? "is typing…" : "are typing…"}</span>
        </div>
      )}

      {reply && (
        <div className="mb-1.5 flex items-center justify-between rounded-t-lg bg-[var(--bg-elevated)] px-4 py-1.5 text-[13px]">
          <div className="truncate text-[var(--text-muted)]">
            Replying to <span className="font-semibold text-[var(--text)]">{replyAuthor?.name ?? "unknown"}</span>
            <span className="text-[var(--text-faint)]"> · </span>
            <span>{reply.content.slice(0, 120)}</span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="ml-3 shrink-0 text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Cancel reply"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <div className="relative">
        {pickerOpen && (
          <div className="absolute bottom-full right-12 z-40 pb-2">
            <EmojiPicker
              onPick={(emoji) => {
                insertEmoji(emoji);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          </div>
        )}

        <div className="flex items-end gap-2.5 rounded-2xl bg-[var(--bg-input)] px-3 py-2.5 md:rounded-lg md:py-3">
          <button
            type="button"
            onClick={onOpenShop}
            title="Cosmetic shop"
            aria-label="Open cosmetic shop"
            className="mb-[5px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--text-muted)] text-[var(--bg-input)] transition hover:bg-[var(--text)]"
          >
            <Icon name="plus" size={17} />
          </button>

          <textarea
            ref={textareaRef}
            data-flat-focus
            rows={1}
            value={value}
            placeholder={`Message #${channelName}`}
            onFocus={onFocusComposer}
            onChange={(event) => {
              setValue(event.target.value);
              if (event.target.value) onTyping();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
              if (event.key === "Escape" && reply) onCancelReply();
            }}
            className="scroll-thin max-h-[220px] min-h-6 flex-1 resize-none bg-transparent py-1 text-[15px] leading-6 text-[var(--text)] outline-none"
            aria-label={`Message ${channelName}`}
          />

          <div className="mb-[1px] flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onOpenShop}
              title="Gift a cosmetic"
              aria-label="Gift a cosmetic"
              className="flex h-8 w-8 items-center justify-center rounded text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--text)]"
            >
              <Icon name="gift" size={19} />
            </button>
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              title="Emoji"
              aria-label="Insert emoji"
              aria-expanded={pickerOpen}
              className="flex h-8 w-8 items-center justify-center rounded text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--text)]"
            >
              <Icon name="smile" size={19} />
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSend || sending}
              title="Send"
              aria-label="Send message"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                canSend ? "animate-blip text-[var(--accent)] hover:brightness-110" : "text-[var(--text-faint)]"
              } disabled:cursor-not-allowed`}
            >
              <Icon name="send" size={19} />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-1.5 hidden items-center justify-end gap-1 pr-1 text-[11px] text-[var(--text-faint)] md:flex">
        <kbd>Enter</kbd>
        <span>to send</span>
        <span aria-hidden>·</span>
        <kbd>Shift</kbd>
        <span>+</span>
        <kbd>Enter</kbd>
        <span>for a new line</span>
      </div>
    </div>
  );
}
