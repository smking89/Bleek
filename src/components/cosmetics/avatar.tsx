"use client";

import type { CharacterKey, DecorationKey, Status, User } from "@/lib/types";
import { AvatarDecoration } from "./avatar-decoration";
import { CharacterArt } from "./character";

const STATUS_COLOR: Record<Status, string> = {
  online: "#23a55a",
  idle: "#f0b232",
  dnd: "#f23f43",
  offline: "#80848e",
};

export function PresenceDot({ status, size = 12, border }: { status: Status; size?: number; border?: string }) {
  const color = STATUS_COLOR[status];
  return (
    <span
      aria-label={status}
      className="absolute right-0 bottom-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        border: `${Math.max(2, size * 0.25)}px solid ${border ?? "var(--bg-sidebar)"}`,
        boxShadow: status === "online" ? `0 0 6px ${color}80` : undefined,
      }}
    />
  );
}

export function Avatar({
  user,
  size = 40,
  showStatus = false,
  statusBorder,
  decoration,
  className = "",
}: {
  user: Pick<User, "name" | "avatarFrom" | "avatarTo" | "status" | "cosmetics"> & {
    character?: CharacterKey;
  };
  size?: number;
  showStatus?: boolean;
  statusBorder?: string;
  /** Overrides the equipped decoration — used by shop previews. */
  decoration?: DecorationKey | null;
  className?: string;
}) {
  const equipped = decoration === undefined ? user.cosmetics.decoration : decoration;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <AvatarDecoration kind={equipped} size={size} />
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full"
        style={{
          background: `linear-gradient(145deg, ${user.avatarFrom}, ${user.avatarTo})`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 -6px 12px rgba(0,0,0,0.25)",
        }}
      >
        <CharacterArt kind={user.character ?? "comet"} size={size} />
      </div>
      {showStatus && (
        <PresenceDot status={user.status} size={Math.max(10, size * 0.3)} border={statusBorder} />
      )}
    </div>
  );
}
