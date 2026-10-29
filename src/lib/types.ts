import type { StaffRole } from "./admin/roles";

export type Status = "online" | "idle" | "dnd" | "offline";

export type CosmeticSlot = "decoration" | "effect" | "nameplate" | "theme";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type DecorationKey =
  | "aurora-halo"
  | "ember-crown"
  | "stardust-orbit"
  | "sakura-bloom"
  | "static-surge"
  | "glacier-ring"
  | "thorn-wreath"
  | "neon-haze"
  | "lunar-eclipse"
  | "pixel-pals"
  | "ink-bloom"
  | "pixel-forge"
  | "lofi-tape";

export type EffectKey =
  | "soft-glow"
  | "aurora-drift"
  | "starfall"
  | "ember-sparks"
  | "confetti-burst"
  | "rgb-wave";

export type NameplateKey = "neon-pulse" | "gold-shimmer" | "holo-chrome" | "shadowflame";

export type ThemeKey = "blurple" | "sunset" | "forest" | "crimson" | "ice" | "mono";

export const CHARACTER_KEYS = [
  "comet",
  "orbit",
  "petal",
  "ember",
  "shade",
  "mochi",
  "prism",
  "sprout",
  "static",
  "tide",
] as const;

export type CharacterKey = (typeof CHARACTER_KEYS)[number];

export type ChannelLayout = "chat" | "gallery" | "canvas";

export type GuardSensitivity = "low" | "balanced" | "strict";

export interface Cosmetics {
  decoration: DecorationKey | null;
  effect: EffectKey | null;
  nameplate: NameplateKey | null;
  theme: ThemeKey;
}

export interface Role {
  name: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  tag: string;
  /** Canonical ASTRO handle, present on the signed-in account. */
  handle?: string;
  /** True when staff have verified the ASTRO handle behind this member. */
  verified?: boolean;
  /** Staff role in the ASTRO operations console, when the account has one. */
  staffRole?: StaffRole | null;
  status: Status;
  avatarFrom: string;
  avatarTo: string;
  banner: [string, string];
  bio: string;
  pronouns: string;
  roles: Role[];
  joined: string;
  activity?: string;
  /** Free-text status the user writes themselves, shown above their activity. */
  customStatus?: string;
  character: CharacterKey;
  cosmetics: Cosmetics;
  coins: number;
  owned: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  topic?: string;
  layout?: ChannelLayout;
  doc?: string;
}

export type PermissionKey =
  | "view"
  | "send"
  | "react"
  | "attach"
  | "voice"
  | "moderate"
  | "manageChannels"
  | "manageRoles"
  | "manageServer"
  | "mint";

export interface ServerRole {
  id: string;
  name: string;
  color: string;
  permissions: PermissionKey[];
  order: number;
}

export interface GuardRule {
  id: string;
  label: string;
  terms: string[];
}

export interface GuardConfig {
  enabled: boolean;
  sensitivity: GuardSensitivity;
  rules: GuardRule[];
}

export interface FlaggedMessage {
  id: string;
  messageId: string;
  channelId: string;
  authorId: string;
  reasons: string[];
  score: number;
  at: number;
  status: "pending" | "approved" | "deleted";
}

export interface MediaArt {
  emoji: string;
  from: string;
  to: string;
}

export interface Reaction {
  emoji: string;
  users: string[];
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: number;
  editedAt?: number;
  reactions: Reaction[];
  replyTo?: string | null;
  pinned?: boolean;
  media?: MediaArt;
}

export interface ShopItem {
  id: string;
  slot: CosmeticSlot;
  key: DecorationKey | EffectKey | NameplateKey | ThemeKey;
  name: string;
  description: string;
  price: number;
  rarity: Rarity;
  accent: string;
  /** Set when the item belongs to a community storefront rather than the platform shop. */
  serverId?: string;
  creatorId?: string;
  creatorShare?: number;
}

export interface Storefront {
  tagline: string;
  creatorId: string;
  items: ShopItem[];
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  color: string;
  channels: Channel[];
  roles: ServerRole[];
  guard: GuardConfig;
  flagged: FlaggedMessage[];
  storefront?: Storefront;
}

export interface Gift {
  id: string;
  fromId: string;
  toId: string;
  itemId: string;
  at: number;
}

export interface Payout {
  id: string;
  itemId: string;
  serverId: string;
  creatorId: string;
  amount: number;
  creatorShare: number;
  platformShare: number;
  at: number;
}

export type TypingState = Record<string, Record<string, number>>;

export interface Snapshot {
  me: User;
  users: User[];
  servers: Server[];
  messages: Message[];
  /** Platform catalogue plus every community storefront item. */
  shop: ShopItem[];
  typing: TypingState;
  gifts: Gift[];
  payouts: Payout[];
}

export type ServerEvent =
  | { type: "hello" }
  | { type: "message:new"; message: Message }
  | { type: "message:update"; message: Message }
  | { type: "message:delete"; id: string; channelId: string }
  | { type: "message:typing"; channelId: string; userId: string; at: number }
  | { type: "user:update"; user: User }
  | { type: "server:update"; server: Server }
  | { type: "payout"; payout: Payout }
  | { type: "gift"; gift: Gift; itemName: string; fromName: string };

export type HomeFilter = "all" | "text" | "audio" | "trending";
