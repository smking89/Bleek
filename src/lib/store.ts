import { buildStore, ME_ID, type Store } from "./bootstrap";
import { SHOP } from "./shop";
import { CHARACTER_KEYS } from "./types";
import type {
  ChannelLayout,
  CharacterKey,
  Cosmetics,
  Gift,
  GuardConfig,
  GuardSensitivity,
  Payout,
  PermissionKey,
  Server,
  ServerEvent,
  ShopItem,
  Snapshot,
  Status,
  User,
} from "./types";

type Subscriber = (event: ServerEvent) => void;

const globalRef = globalThis as unknown as {
  __nebulaStore?: Store;
  __nebulaSubs?: Set<Subscriber>;
};

function store(): Store {
  if (!globalRef.__nebulaStore) globalRef.__nebulaStore = buildStore();
  return globalRef.__nebulaStore;
}

function subscribers(): Set<Subscriber> {
  if (!globalRef.__nebulaSubs) globalRef.__nebulaSubs = new Set();
  return globalRef.__nebulaSubs;
}

export function subscribe(fn: Subscriber): () => void {
  subscribers().add(fn);
  return () => {
    subscribers().delete(fn);
  };
}

function broadcast(event: ServerEvent) {
  for (const fn of subscribers()) {
    try {
      fn(event);
    } catch {
      subscribers().delete(fn);
    }
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}

export function me(): User {
  const user = store().users.find((candidate) => candidate.id === ME_ID);
  if (!user) throw new Error("Session user missing");
  return user;
}

let walletBound = false;

/**
 * Binds the local chat identity to the signed-in ASTRO account and names the
 * server provisioned for them. Every field comes from the account row, so no
 * invented member, name or balance reaches a screen.
 */
export function bindAccount(binding: {
  name: string;
  handle: string;
  verified: boolean;
  region: string | null;
  playPlatform: string | null;
  coins: number;
}) {
  const user = me();
  const displayName = binding.name.trim();

  user.name = displayName || binding.handle;
  user.handle = binding.handle;
  user.verified = binding.verified;
  user.region = binding.region;
  user.playPlatform = binding.playPlatform;

  // The wallet is the source of the balance. It is copied once, so shop
  // activity in this session is not undone by the next page load.
  if (!walletBound) {
    user.coins = binding.coins;
    walletBound = true;
  }

  for (const server of store().servers) {
    if (!server.name) server.name = `${user.name}’s server`;
  }

  touchUser(user);
  return structuredClone(user);
}

export function allItems(): ShopItem[] {
  const storefronts = store().servers.flatMap((server) => server.storefront?.items ?? []);
  return [...SHOP, ...storefronts];
}

export function findItem(itemId: string): ShopItem | undefined {
  return allItems().find((item) => item.id === itemId);
}

export function snapshot(): Snapshot {
  const current = store();
  return {
    me: structuredClone(me()),
    users: structuredClone(current.users),
    servers: structuredClone(current.servers),
    messages: structuredClone(current.messages),
    shop: structuredClone(allItems()),
    typing: structuredClone(current.typing),
    gifts: structuredClone(current.gifts),
    payouts: structuredClone(current.payouts),
  };
}

function serverForChannel(channelId: string): Server | undefined {
  return store().servers.find((server) => server.channels.some((channel) => channel.id === channelId));
}

function touchServer(server: Server) {
  broadcast({ type: "server:update", server: structuredClone(server) });
}

function touchUser(user: User) {
  broadcast({ type: "user:update", user: structuredClone(user) });
}

// ── Guard ────────────────────────────────────────────────────────────────

const THRESHOLD: Record<GuardSensitivity, number> = { low: 3, balanced: 2, strict: 1 };

/**
 * Deterministic, fully local content scanner. No message text ever leaves the
 * process, which is the point of an on-prem guard: server owners describe what
 * they want caught, and these rules run in-process.
 */
export function scanContent(content: string, guard: GuardConfig): { score: number; reasons: string[] } {
  const haystack = content.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const rule of guard.rules) {
    const hits = rule.terms.filter((term) => term.trim() && haystack.includes(term.trim().toLowerCase()));
    if (hits.length > 0) {
      score += Math.min(3, hits.length);
      reasons.push(`${rule.label}: ${hits.slice(0, 3).join(", ")}`);
    }
  }

  const letters = content.replace(/[^a-z]/gi, "");
  if (letters.length >= 12) {
    const caps = letters.replace(/[^A-Z]/g, "").length;
    if (caps / letters.length > 0.7) {
      score += 1;
      reasons.push("Excessive capitalisation");
    }
  }

  const links = content.match(/https?:\/\//gi)?.length ?? 0;
  if (links >= 3) {
    score += 1;
    reasons.push("Link flooding");
  }

  return { score, reasons };
}

function guardVerdict(content: string, guard: GuardConfig) {
  if (!guard.enabled) return { flagged: false, blocked: false, score: 0, reasons: [] as string[] };
  const result = scanContent(content, guard);
  const threshold = THRESHOLD[guard.sensitivity];
  if (result.score < threshold) return { flagged: false, blocked: false, ...result };
  return { ...result, flagged: true, blocked: guard.sensitivity === "strict" };
}

/** Dry-run a sample against a server's live guard config, without persisting it. */
export function previewGuard(serverId: string, content: string) {
  const server = findServer(serverId);
  const result = scanContent(content, server.guard);
  const threshold = THRESHOLD[server.guard.sensitivity];
  const flagged = server.guard.enabled && result.score >= threshold;
  return {
    score: result.score,
    reasons: result.reasons,
    threshold,
    flagged,
    blocked: flagged && server.guard.sensitivity === "strict",
    enabled: server.guard.enabled,
  };
}

// ── Messages ─────────────────────────────────────────────────────────────

const MAX_LENGTH = 4000;

export function addMessage(input: { channelId: string; content: string; replyTo?: string | null }) {
  const content = input.content.trim();
  if (!content) throw new ApiError(400, "Message cannot be empty");
  if (content.length > MAX_LENGTH) throw new ApiError(400, "Message is too long");

  const server = serverForChannel(input.channelId);
  const channel = server?.channels.find((candidate) => candidate.id === input.channelId && candidate.type === "text");
  if (!server || !channel) throw new ApiError(404, "Unknown channel");

  const verdict = guardVerdict(content, server.guard);
  if (verdict.blocked) {
    throw new ApiError(400, `Guard blocked this message (${verdict.reasons.join("; ")})`);
  }

  const message = {
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    channelId: input.channelId,
    authorId: ME_ID,
    content,
    createdAt: Date.now(),
    reactions: [],
    replyTo: input.replyTo ?? null,
  };
  store().messages.push(message);
  delete store().typing[input.channelId]?.[ME_ID];

  if (verdict.flagged) {
    server.flagged.unshift({
      id: `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      messageId: message.id,
      channelId: message.channelId,
      authorId: ME_ID,
      reasons: verdict.reasons,
      score: verdict.score,
      at: Date.now(),
      status: "pending",
    });
    broadcast({ type: "server:update", server: structuredClone(server) });
  }

  broadcast({ type: "message:new", message: structuredClone(message) });
  return message;
}

function findOwnMessage(id: string) {
  const message = store().messages.find((candidate) => candidate.id === id);
  if (!message) throw new ApiError(404, "Message not found");
  if (message.authorId !== ME_ID) throw new ApiError(403, "You can only change your own messages");
  return message;
}

export function editMessage(id: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new ApiError(400, "Message cannot be empty");
  if (trimmed.length > MAX_LENGTH) throw new ApiError(400, "Message is too long");
  const message = findOwnMessage(id);
  message.content = trimmed;
  message.editedAt = Date.now();
  broadcast({ type: "message:update", message: structuredClone(message) });
  return message;
}

export function deleteMessage(id: string) {
  const message = findOwnMessage(id);
  store().messages.splice(store().messages.indexOf(message), 1);
  broadcast({ type: "message:delete", id, channelId: message.channelId });
}

export function toggleReaction(id: string, emoji: string) {
  const message = store().messages.find((candidate) => candidate.id === id);
  if (!message) throw new ApiError(404, "Message not found");
  if (!emoji || emoji.length > 16) throw new ApiError(400, "Invalid reaction");

  let reaction = message.reactions.find((entry) => entry.emoji === emoji);
  if (!reaction) {
    reaction = { emoji, users: [] };
    message.reactions.push(reaction);
  }
  const index = reaction.users.indexOf(ME_ID);
  if (index >= 0) reaction.users.splice(index, 1);
  else reaction.users.push(ME_ID);
  message.reactions = message.reactions.filter((entry) => entry.users.length > 0);

  broadcast({ type: "message:update", message: structuredClone(message) });
  return message;
}

export function setTyping(channelId: string) {
  const map = (store().typing[channelId] ??= {});
  map[ME_ID] = Date.now();
  broadcast({ type: "message:typing", channelId, userId: ME_ID, at: map[ME_ID] });
}

// ── Channel layouts ──────────────────────────────────────────────────────

export function setChannelLayout(channelId: string, layout: ChannelLayout) {
  if (!["chat", "gallery", "canvas"].includes(layout)) throw new ApiError(400, "Unknown layout");
  const server = serverForChannel(channelId);
  const channel = server?.channels.find((candidate) => candidate.id === channelId);
  if (!server || !channel) throw new ApiError(404, "Unknown channel");
  if (channel.type !== "text") throw new ApiError(400, "Only text channels have layouts");
  channel.layout = layout;
  touchServer(server);
  return { server: structuredClone(server) };
}

export function setChannelDoc(channelId: string, doc: string) {
  const server = serverForChannel(channelId);
  const channel = server?.channels.find((candidate) => candidate.id === channelId);
  if (!server || !channel) throw new ApiError(404, "Unknown channel");
  if (doc.length > 20_000) throw new ApiError(400, "Document is too long");
  channel.doc = doc;
  touchServer(server);
  return { server: structuredClone(server) };
}

// ── Guard administration ─────────────────────────────────────────────────

export function updateGuard(
  serverId: string,
  patch: { enabled?: boolean; sensitivity?: GuardSensitivity; rules?: GuardConfig["rules"] },
) {
  const server = store().servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new ApiError(404, "Unknown server");
  if (typeof patch.enabled === "boolean") server.guard.enabled = patch.enabled;
  if (patch.sensitivity && ["low", "balanced", "strict"].includes(patch.sensitivity)) {
    server.guard.sensitivity = patch.sensitivity;
  }
  if (Array.isArray(patch.rules)) {
    server.guard.rules = patch.rules
      .filter((rule) => rule && typeof rule.label === "string")
      .slice(0, 12)
      .map((rule, index) => ({
        id: rule.id || `rule-${index}`,
        label: rule.label.slice(0, 60),
        terms: (Array.isArray(rule.terms) ? rule.terms : [])
          .map((term) => String(term).trim().slice(0, 40))
          .filter(Boolean)
          .slice(0, 24),
      }));
  }
  touchServer(server);
  return { server: structuredClone(server) };
}

export function resolveFlag(serverId: string, flagId: string, action: "approve" | "delete") {
  const server = store().servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new ApiError(404, "Unknown server");
  const flag = server.flagged.find((entry) => entry.id === flagId);
  if (!flag) throw new ApiError(404, "Flag not found");

  flag.status = action === "delete" ? "deleted" : "approved";
  if (action === "delete") {
    const index = store().messages.findIndex((message) => message.id === flag.messageId);
    if (index >= 0) {
      const [removed] = store().messages.splice(index, 1);
      broadcast({ type: "message:delete", id: removed.id, channelId: removed.channelId });
    }
  }
  touchServer(server);
  return { server: structuredClone(server) };
}

// ── Role constructor ─────────────────────────────────────────────────────

export const PERMISSION_KEYS = [
  "view",
  "send",
  "react",
  "attach",
  "voice",
  "moderate",
  "manageChannels",
  "manageRoles",
  "manageServer",
  "mint",
] as const;

function cleanPermissions(input: unknown): PermissionKey[] {
  if (!Array.isArray(input)) return [];
  return PERMISSION_KEYS.filter((key) => input.includes(key));
}

function findServer(serverId: string) {
  const server = store().servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new ApiError(404, "Unknown server");
  return server;
}

function normaliseOrder(server: Server) {
  server.roles = [...server.roles]
    .sort((a, b) => a.order - b.order)
    .map((role, index) => ({ ...role, order: index }));
}

export function createRole(serverId: string, input: { name?: string; color?: string; permissions?: unknown }) {
  const server = findServer(serverId);
  const name = (input.name ?? "New role").trim().slice(0, 32) || "New role";
  const role = {
    id: `r-${serverId}-${Date.now().toString(36)}`,
    name,
    color: /^#[0-9a-f]{6}$/i.test(input.color ?? "") ? (input.color as string) : "#b5bac1",
    permissions: cleanPermissions(input.permissions),
    order: server.roles.length,
  };
  server.roles.push(role);
  normaliseOrder(server);
  touchServer(server);
  return { server: structuredClone(server), role };
}

export function updateRole(
  serverId: string,
  roleId: string,
  patch: { name?: string; color?: string; permissions?: unknown; order?: number },
) {
  const server = findServer(serverId);
  const role = server.roles.find((candidate) => candidate.id === roleId);
  if (!role) throw new ApiError(404, "Unknown role");
  if (typeof patch.name === "string") {
    const name = patch.name.trim().slice(0, 32);
    if (!name) throw new ApiError(400, "Role name cannot be empty");
    role.name = name;
  }
  if (typeof patch.color === "string" && /^#[0-9a-f]{6}$/i.test(patch.color)) role.color = patch.color;
  if (patch.permissions !== undefined) role.permissions = cleanPermissions(patch.permissions);
  if (typeof patch.order === "number" && Number.isFinite(patch.order)) role.order = patch.order;
  normaliseOrder(server);
  touchServer(server);
  return { server: structuredClone(server), role };
}

export function deleteRole(serverId: string, roleId: string) {
  const server = findServer(serverId);
  const index = server.roles.findIndex((candidate) => candidate.id === roleId);
  if (index < 0) throw new ApiError(404, "Unknown role");
  if (server.roles.length <= 1) throw new ApiError(400, "A server needs at least one role");
  server.roles.splice(index, 1);
  normaliseOrder(server);
  touchServer(server);
  return { server: structuredClone(server) };
}

export function reorderRoles(serverId: string, order: string[]) {
  const server = findServer(serverId);
  if (!Array.isArray(order) || order.length !== server.roles.length) {
    throw new ApiError(400, "Order must list every role exactly once");
  }
  const known = new Set(server.roles.map((role) => role.id));
  if (order.some((id) => !known.has(id)) || new Set(order).size !== order.length) {
    throw new ApiError(400, "Order must list every role exactly once");
  }
  server.roles = order.map((id, index) => ({ ...server.roles.find((role) => role.id === id)!, order: index }));
  touchServer(server);
  return { server: structuredClone(server) };
}

// ── Creator economy ──────────────────────────────────────────────────────

const CREATOR_SHARE = 0.9;

const MINT_KEYS: Record<ShopItem["slot"], string[]> = {
  decoration: [
    "aurora-halo",
    "ember-crown",
    "stardust-orbit",
    "sakura-bloom",
    "static-surge",
    "glacier-ring",
    "thorn-wreath",
    "neon-haze",
    "lunar-eclipse",
    "pixel-pals",
    "ink-bloom",
    "pixel-forge",
    "lofi-tape",
  ],
  effect: ["soft-glow", "aurora-drift", "starfall", "ember-sparks", "confetti-burst", "rgb-wave"],
  nameplate: ["neon-pulse", "gold-shimmer", "holo-chrome", "shadowflame"],
  theme: ["blurple", "sunset", "forest", "crimson", "ice", "mono"],
};

export function mintCosmetic(
  serverId: string,
  input: { name: string; description?: string; slot: ShopItem["slot"]; key: string; price: number },
) {
  const server = store().servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new ApiError(404, "Unknown server");
  const name = input.name.trim();
  if (!name) throw new ApiError(400, "Give the cosmetic a name");
  if (!MINT_KEYS[input.slot]?.includes(input.key)) throw new ApiError(400, "Unknown visual template");
  const price = Math.round(Number(input.price));
  if (!Number.isFinite(price) || price < 0 || price > 100_000) throw new ApiError(400, "Price out of range");

  const item: ShopItem = {
    id: `mint-${serverId}-${Date.now().toString(36)}`,
    slot: input.slot,
    key: input.key as ShopItem["key"],
    name: name.slice(0, 40),
    description: (input.description ?? "A community-made cosmetic.").slice(0, 140),
    price,
    rarity: price >= 2000 ? "legendary" : price >= 1000 ? "epic" : price >= 400 ? "rare" : "uncommon",
    accent: "#f472b6",
    serverId,
    creatorId: ME_ID,
    creatorShare: CREATOR_SHARE,
  };

  server.storefront ??= {
    tagline: "Community cosmetics, minted by members.",
    creatorId: ME_ID,
    items: [],
  };
  server.storefront.items.push(item);
  touchServer(server);
  return { server: structuredClone(server), item: structuredClone(item) };
}

export function purchase(itemId: string) {
  const item = findItem(itemId);
  if (!item) throw new ApiError(404, "Unknown item");
  const user = me();
  if (user.owned.includes(item.id)) throw new ApiError(400, "You already own this item");
  if (user.coins < item.price) throw new ApiError(400, "Not enough coins for this item");

  user.coins -= item.price;
  user.owned.push(item.id);

  let payout: Payout | undefined;
  if (item.serverId && item.creatorId) {
    const creatorShare = Math.round(item.price * (item.creatorShare ?? CREATOR_SHARE));
    payout = {
      id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      itemId: item.id,
      serverId: item.serverId,
      creatorId: item.creatorId,
      amount: item.price,
      creatorShare,
      platformShare: item.price - creatorShare,
      at: Date.now(),
    };
    store().payouts.unshift(payout);
  }

  touchUser(user);
  if (payout) broadcast({ type: "payout", payout: structuredClone(payout) });
  return { user: structuredClone(user), payout: payout ? structuredClone(payout) : null };
}

export function giftItem(itemId: string, toUserId: string) {
  const item = findItem(itemId);
  if (!item) throw new ApiError(404, "Unknown item");
  if (toUserId === ME_ID) throw new ApiError(400, "Pick someone else to gift");
  const recipient = store().users.find((candidate) => candidate.id === toUserId);
  if (!recipient) throw new ApiError(404, "Unknown recipient");
  const sender = me();
  if (recipient.owned.includes(item.id)) throw new ApiError(400, `${recipient.name} already owns this`);
  if (sender.coins < item.price) throw new ApiError(400, "Not enough coins for this gift");

  sender.coins -= item.price;
  recipient.owned.push(item.id);

  const gift: Gift = {
    id: `gift-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    fromId: ME_ID,
    toId: recipient.id,
    itemId: item.id,
    at: Date.now(),
  };
  store().gifts.unshift(gift);

  if (item.serverId && item.creatorId) {
    const creatorShare = Math.round(item.price * (item.creatorShare ?? CREATOR_SHARE));
    const payout: Payout = {
      id: `pay-${Date.now().toString(36)}-g`,
      itemId: item.id,
      serverId: item.serverId,
      creatorId: item.creatorId,
      amount: item.price,
      creatorShare,
      platformShare: item.price - creatorShare,
      at: Date.now(),
    };
    store().payouts.unshift(payout);
    broadcast({ type: "payout", payout: structuredClone(payout) });
  }

  touchUser(sender);
  touchUser(recipient);
  broadcast({
    type: "gift",
    gift: structuredClone(gift),
    itemName: item.name,
    fromName: sender.name,
  });

  return { user: structuredClone(sender), recipient: structuredClone(recipient), gift: structuredClone(gift) };
}

export function updateProfile(patch: {
  name?: string;
  bio?: string;
  pronouns?: string;
  status?: Status;
  customStatus?: string;
  character?: CharacterKey;
  banner?: [string, string];
  cosmetics?: Partial<Cosmetics>;
}) {
  const user = me();
  if (typeof patch.name === "string") {
    const name = patch.name.trim().slice(0, 32);
    if (!name) throw new ApiError(400, "Display name cannot be empty");
    user.name = name;
  }
  if (typeof patch.bio === "string") user.bio = patch.bio.slice(0, 190);
  if (typeof patch.pronouns === "string") user.pronouns = patch.pronouns.slice(0, 40);
  if (patch.status && ["online", "idle", "dnd", "offline"].includes(patch.status)) user.status = patch.status;
  if (typeof patch.customStatus === "string") {
    const customStatus = patch.customStatus.replace(/\s+/g, " ").trim().slice(0, 64);
    user.customStatus = customStatus || undefined;
  }
  if (patch.character && CHARACTER_KEYS.includes(patch.character)) user.character = patch.character;
  if (Array.isArray(patch.banner) && patch.banner.length === 2) {
    user.banner = [String(patch.banner[0]).slice(0, 32), String(patch.banner[1]).slice(0, 32)];
  }

  if (patch.cosmetics) {
    for (const slot of ["decoration", "effect", "nameplate", "theme"] as const) {
      if (!(slot in patch.cosmetics)) continue;
      const value = patch.cosmetics[slot];
      if (value === null) {
        if (slot === "theme") throw new ApiError(400, "A theme is always equipped");
        user.cosmetics[slot] = null;
        continue;
      }
      const item = findItem(String(value));
      if (!item) throw new ApiError(404, "Unknown cosmetic");
      if (item.slot !== slot) throw new ApiError(400, "That cosmetic belongs in another slot");
      if (!user.owned.includes(item.id)) throw new ApiError(403, "You do not own that cosmetic");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (user.cosmetics as any)[slot] = item.key;
    }
  }

  touchUser(user);
  return { user: structuredClone(user) };
}
