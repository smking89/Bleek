"use client";

import type { Server } from "@/lib/types";
import { Icon } from "./icons";

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative flex w-full justify-center">
      <span
        className={`absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r-full bg-white transition-all ${
          active ? "h-10" : "h-2 scale-0 group-hover:h-5 group-hover:scale-100"
        }`}
      />
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`flex h-10 w-10 items-center justify-center overflow-hidden text-xl transition-all duration-200 sm:h-12 sm:w-12 ${
          active
            ? "rounded-full bg-[var(--accent)] text-white sm:rounded-2xl"
            : "rounded-full bg-[var(--bg-sidebar)] hover:bg-[var(--accent)] hover:text-white sm:rounded-3xl sm:hover:rounded-2xl"
        }`}
      >
        {children}
      </button>
      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--bg-float)] px-2.5 py-1.5 text-sm font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
        {label}
      </span>
    </div>
  );
}

export function ServerRail({
  servers,
  activeServerId,
  homeActive,
  liveCount,
  onHome,
  onSelect,
  onOpenShop,
  onOpenSettings,
  onOpenProfile,
  meInitials,
}: {
  servers: Server[];
  activeServerId: string;
  homeActive: boolean;
  liveCount: number;
  onHome: () => void;
  onSelect: (id: string) => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  meInitials: string;
}) {
  return (
    <nav className="flex h-full w-[56px] shrink-0 flex-col items-center gap-1.5 bg-[var(--bg-rail)] py-2 sm:w-[72px] sm:gap-2 sm:py-3">
      <RailButton label={`Bleek home — ${liveCount} active threads`} active={homeActive} onClick={onHome}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bleek-icon.png"
          alt=""
          width={26}
          height={26}
          className="h-[26px] w-[26px] object-contain"
        />
      </RailButton>
      <div className="h-0.5 w-8 rounded-full bg-[var(--border-strong)]" />

      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto no-scrollbar">
        {servers.map((server) => (
          <RailButton
            key={server.id}
            label={server.name}
            active={!homeActive && server.id === activeServerId}
            onClick={() => onSelect(server.id)}
          >
            <span className="text-[22px] leading-none">{server.icon || server.name.slice(0, 1).toUpperCase()}</span>
          </RailButton>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="mb-1 h-0.5 w-8 rounded-full bg-[var(--border-strong)]" />
        <RailButton label="Cosmetic shop" onClick={onOpenShop}>
          <Icon name="bag" size={22} />
        </RailButton>
        <RailButton label="User settings" onClick={onOpenSettings}>
          <Icon name="settings" size={22} />
        </RailButton>
        <RailButton label="Your profile" onClick={onOpenProfile}>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ background: "linear-gradient(145deg,#5865f2,#a855f7)" }}
          >
            {meInitials}
          </span>
        </RailButton>
      </div>
    </nav>
  );
}
