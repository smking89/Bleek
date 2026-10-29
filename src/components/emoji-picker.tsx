"use client";

import { useEffect, useRef, useState } from "react";

const QUICK = ["🔥", "😂", "💜", "✨", "🪙", "🌙", "💀", "🎉", "👀", "🙌", "😭", "🤝"];

const GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "People",
    emojis: ["😀", "😅", "😂", "🥲", "😊", "😍", "😘", "😎", "🤩", "🥳", "🤔", "😴", "😭", "😤", "😱", "🤯", "🥺", "😇", "🙃", "😏"],
  },
  {
    label: "Gestures",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤝", "🙏", "👏", "🙌", "💪", "🫡", "🖖", "👀", "🫶", "🧠", "💅"],
  },
  {
    label: "Objects",
    emojis: ["🔥", "✨", "💜", "💙", "💚", "🧡", "🪙", "🎮", "🎨", "🎧", "🌙", "⭐", "🌌", "☕", "🍕", "🎉", "🎁", "🏆", "👑", "💎"],
  },
  {
    label: "Symbols",
    emojis: ["✅", "❌", "⚠️", "💀", "💯", "🕳️", "⚡", "🌸", "🍂", "❄️", "🌊", "🎯", "🚀", "📌", "🧵", "🔮", "🛒", "💬", "❤️", "🖤"],
  },
];

export function EmojiPicker({
  onPick,
  onClose,
  align = "right",
}: {
  onPick: (emoji: string) => void;
  onClose?: () => void;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!onClose) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const filtered = query
    ? GROUPS.map((group) => ({
        ...group,
        emojis: group.emojis.filter(() => group.label.toLowerCase().includes(query.toLowerCase())),
      })).filter((group) => group.emojis.length > 0)
    : GROUPS;

  return (
    <div
      ref={ref}
      className={`absolute bottom-full z-40 mb-3 w-[336px] overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--bg-modal)] shadow-2xl shadow-black/50 ${
        align === "right" ? "right-0" : "left-0"
      } animate-pop`}
    >
      <div className="border-b border-[var(--border-subtle)] p-2">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search emoji"
          className="w-full rounded bg-[var(--bg-float)] px-3 py-1.5 text-sm text-[var(--text)] outline-none"
        />
      </div>
      <div className="scroll-thin max-h-[300px] overflow-y-auto p-2">
        {filtered.map((group) => (
          <div key={group.label} className="mb-2">
            <div className="px-1 pb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              {group.label}
            </div>
            <div className="grid grid-cols-10 gap-0.5">
              {group.emojis.map((emoji) => (
                <button
                  key={`${group.label}-${emoji}`}
                  type="button"
                  onClick={() => onPick(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded text-lg transition hover:bg-[var(--bg-hover)] active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1.5">
        <span className="pr-1 text-[11px] font-semibold uppercase text-[var(--text-muted)]">Quick</span>
        {QUICK.slice(0, 6).map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(emoji)}
            className="flex h-7 w-7 items-center justify-center rounded text-base transition hover:bg-[var(--bg-hover)]"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
