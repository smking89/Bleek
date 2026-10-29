"use client";

import { useState } from "react";
import type { Channel, Server, User } from "@/lib/types";
import { Icon } from "./icons";
import { UserPanel } from "./user-panel";

export function ChannelSidebar({
  server,
  activeChannelId,
  me,
  micMuted,
  deafened,
  voiceChannelId,
  onSelectChannel,
  onCreateChannel,
  onToggleMic,
  onToggleDeafen,
  onOpenSettings,
  onOpenShop,
  onOpenStorefront,
  onOpenServerConsole,
  onOpenProfile,
  onClose,
}: {
  server: Server;
  activeChannelId: string;
  me: User;
  micMuted: boolean;
  deafened: boolean;
  voiceChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: () => void;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
  onOpenSettings: () => void;
  onOpenShop: () => void;
  onOpenStorefront: () => void;
  onOpenServerConsole: () => void;
  onOpenProfile: (rect: DOMRect) => void;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [openSections, setOpenSections] = useState({ text: true, voice: true });

  const needle = query.trim().toLowerCase();
  const matches = (channel: Channel) => channel.name.toLowerCase().includes(needle);
  const textChannels = server.channels.filter((channel) => channel.type === "text").filter(matches);
  const voiceChannels = server.channels.filter((channel) => channel.type === "voice").filter(matches);
  const nothingFound = needle.length > 0 && textChannels.length + voiceChannels.length === 0;

  const renderChannel = (channel: Channel) => {
    const active = channel.id === activeChannelId;
    const joined = channel.type === "voice" && channel.id === voiceChannelId;
    return (
      <button
        key={channel.id}
        type="button"
        onClick={() => onSelectChannel(channel)}
        aria-current={active ? "page" : undefined}
        className={`group flex w-full items-center gap-2 rounded-md px-2 py-[7px] text-left text-[15px] transition ${
          active
            ? "bg-[var(--bg-active)] text-white"
            : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        }`}
      >
        <Icon
          name={channel.type === "text" ? "hash" : "volume"}
          size={18}
          className={active ? "text-white" : "text-[var(--text-faint)] group-hover:text-[var(--text-muted)]"}
        />
        <span className="min-w-0 flex-1 truncate">{channel.name}</span>
        {joined && (
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-[var(--green)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
            Live
          </span>
        )}
      </button>
    );
  };

  const section = (key: "text" | "voice", label: string) => (
    <div className="flex items-center gap-1 pb-1 pt-3">
      <button
        type="button"
        onClick={() => setOpenSections((current) => ({ ...current, [key]: !current[key] }))}
        aria-expanded={openSections[key]}
        className="flex min-w-0 flex-1 items-center gap-1 rounded px-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] transition hover:text-[var(--text)]"
      >
        <Icon
          name="chevron-down"
          size={12}
          className={`transition-transform duration-150 ${openSections[key] ? "" : "-rotate-90"}`}
        />
        <span className="truncate">{label}</span>
      </button>
      <button
        type="button"
        onClick={onCreateChannel}
        title={`Create a ${key} channel`}
        aria-label={`Create a ${key} channel`}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[15px] leading-none text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
      >
        +
      </button>
    </div>
  );

  return (
    <div className="flex h-full w-[280px] max-w-[86vw] shrink-0 flex-col overflow-hidden rounded-r-2xl bg-[var(--bg-sidebar)] md:w-60 md:rounded-none">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-3">
        <button
          type="button"
          onClick={onOpenStorefront}
          className="flex min-w-0 items-center gap-1 rounded-lg px-1 py-1 text-left transition hover:bg-[var(--bg-hover)]"
          aria-label={`${server.name} storefront`}
        >
          <span className="truncate text-[16px] font-bold text-[var(--text-strong)]">{server.name}</span>
          <Icon name="chevron-down" size={16} className="shrink-0 text-[var(--text-faint)]" />
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpenServerConsole}
            title="Server console — guard & roles"
            aria-label="Server console — guard and roles"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            <Icon name="crown" size={17} />
          </button>
          <button
            type="button"
            onClick={onOpenStorefront}
            title="Server storefront"
            aria-label="Server storefront"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            <Icon name="bag" size={17} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] md:hidden"
              aria-label="Close channels"
            >
              <Icon name="close" size={17} />
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 px-2 pb-1">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-rail)] px-2.5 py-1.5 ring-1 ring-[var(--border-subtle)]">
          <Icon name="search" size={14} className="shrink-0 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search channels"
            aria-label="Search channels"
            className="w-full bg-transparent text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear channel search"
              className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <Icon name="close" size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-2 pb-3">
        {nothingFound && (
          <p className="px-2 py-6 text-center text-xs text-[var(--text-muted)]">No channels match “{query.trim()}”.</p>
        )}

        {textChannels.length + voiceChannels.length > 0 && section("text", "Text channels")}
        {openSections.text && <div className="space-y-0.5">{textChannels.map(renderChannel)}</div>}

        {textChannels.length + voiceChannels.length > 0 && section("voice", "Voice channels")}
        {openSections.voice && <div className="space-y-0.5">{voiceChannels.map(renderChannel)}</div>}

        <button
          type="button"
          onClick={onOpenStorefront}
          className="mt-5 flex w-full items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-gradient-to-r from-[var(--accent-soft)] to-transparent p-2.5 text-left transition hover:border-[var(--accent)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
            <Icon name="bag" size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-[var(--text-strong)]">Community storefront</span>
            <span className="block truncate text-[11px] text-[var(--text-muted)]">
              {server.storefront?.items.length ?? 0} items · creators keep 90%
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenShop}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
        >
          <Icon name="sparkles" size={15} />
          <span className="text-[11px] font-medium">Platform cosmetic shop</span>
        </button>
      </div>

      <UserPanel
        me={me}
        micMuted={micMuted}
        deafened={deafened}
        inVoice={Boolean(voiceChannelId)}
        onToggleMic={onToggleMic}
        onToggleDeafen={onToggleDeafen}
        onOpenSettings={onOpenSettings}
        onOpenProfile={onOpenProfile}
      />
    </div>
  );
}
