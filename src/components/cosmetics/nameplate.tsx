"use client";

import type { ReactNode } from "react";
import type { NameplateKey } from "@/lib/types";

const NAMEPLATE_CLASS: Record<NameplateKey, string> = {
  "neon-pulse": "nameplate nameplate-neon-pulse",
  "gold-shimmer": "nameplate nameplate-gold-shimmer",
  "holo-chrome": "nameplate nameplate-holo-chrome",
  shadowflame: "nameplate nameplate-shadowflame",
};

export function Nameplate({
  kind,
  children,
  className = "",
}: {
  kind: NameplateKey | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  if (!kind) {
    return <span className={`text-[var(--text-strong)] ${className}`}>{children}</span>;
  }
  return <span className={`${NAMEPLATE_CLASS[kind]} ${className}`}>{children}</span>;
}
