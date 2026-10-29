import { Prisma } from "@prisma/client";
import { astroDb } from "@astro/core/db";
import { SHOP } from "./shop";
import { CHARACTER_KEYS } from "./types";
import type {
  ChannelLayout,
  CharacterKey,
  Cosmetics,
  Gift,
  GuardConfig,
  GuardSensitivity,
  Message,
  Payout,
  PermissionKey,
  Server,
  ServerEvent,
  ServerRole,
  ShopItem,
  Snapshot,
  Status,
  Storefront,
  TypingState,
  User,
} from "./types";

/**
 * The chat store, backed by PostgreSQL.
 *
 * Every function takes the signed-in ASTRO account id, so a member only ever
 * reads or writes their own workspace. Channels, messages, gifts and payouts are
 * rows; roles, guard rules, flagged posts and the storefront are JSON documents
 * on the server row because they are read and written as a unit.
 */

type Subscriber = (event: ServerEvent) => void;

const globalRef = globalThis as unknown as {
  __bleekSubs?: Set<Subscriber>;
  __bleekTyping?: Map<string, TypingState>;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return Response.json({ error: "That name is already taken here." }, { status: 409 });
  }
  console.error(error);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}

function db() {
  return astroDb();
}

function subscribers(): Set<Subscriber> {
  if (!globalRef.__bleekSubs) globalRef.__bleekSubs = new Set();
  return globalRef.__bleekSubs;
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

// ── Row shapes ───────────────────────────────────────────────────────────

type MemberRow = {
  id: string;
  handle: string;
  name: string;
  verified: boolean;
  region: string | null;
  playPlatform: string | null;
  status: string;
  avatarFrom: string;
  avatarTo: string;
  banner: string[];
  bio: string;
  pronouns: string;
  customStatus: string | null;
  character: string;
  cosmetics: unknown;
  coins: number;
  owned: string[];
  joinedAt: Date;
};

type ChannelRow = {
  id: string;
  name: string;
  type: string;
  topic: string | null;
  layout: string | null;
  doc: string | null;
};

type ServerRow = {
  id: string;
  ownerId: string;
  name: string;
  icon: string;
  color: string;
  roles: unknown;
  guard: unknown;
  flagged: unknown;
  storefront: unknown;
  channels: ChannelRow[];
};

type MessageRow = {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
  reactions: unknown;
  replyTo: string | null;
  pinned: boolean;
};

const DEFAULT_COSMETICS: Cosmetics = { decoration: null, effect: null, nameplate: null, theme: "blurple" };

function joinedLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toUser(row: MemberRow): User {
  return {
    id: row.id,
    name: row.name,
    tag: "",
    handle: row.handle,
    verified: row.verified,
    status: row.status as Status,
    avatarFrom: row.avatarFrom,
    avatarTo: row.avatarTo,
    banner: [row.banner[0] ?? "#4f46e5", row.banner[1] ?? "#0f172a"],
    bio: row.bio,
    pronouns: row.pronouns,
    roles: [],
    joined: joinedLabel(row.joinedAt),
    ...(row.customStatus ? { customStatus: row.customStatus } : {}),
    character: row.character as CharacterKey,
    cosmetics: { ...DEFAULT_COSMETICS, ...(row.cosmetics as Partial<Cosmetics> | null) },
    coins: row.coins,
    owned: row.owned,
    region: row.region,
    playPlatform: row.playPlatform,
  };
}

function toServer(row: ServerRow): Server {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    channels: row.channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      type: channel.type === "voice" ? "voice" : "text",
      ...(channel.topic ? { topic: channel.topic } : {}),
      ...(channel.layout ? { layout: channel.layout as ChannelLayout } : {}),
      ...(channel.doc ? { doc: channel.doc } : {}),
    })),
    roles: (row.roles ?? []) as ServerRole[],
    guard: (row.guard ?? { enabled: false, sensitivity: "balanced", rules: [] }) as GuardConfig,
    flagged: (row.flagged ?? []) as Server["flagged"],
    ...(row.storefront ? { storefront: row.storefront as Storefront } : {}),
  };
}

function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    channelId: row.channelId,
    authorId: row.authorId,
    content: row.content,
    createdAt: row.createdAt.getTime(),
    ...(row.editedAt ? { editedAt: row.editedAt.getTime() } : {}),
    reactions: (row.reactions ?? []) as Message["reactions"],
    replyTo: row.replyTo,
    ...(row.pinned ? { pinned: true } : {}),
  };
}

function toGift(row: { id: string; fromId: string; toId: string; itemId: string; createdAt: Date }): Gift {
  return { id: row.id, fromId: row.fromId, toId: row.toId, itemId: row.itemId, at: row.createdAt.getTime() };
}

function toPayout(row: {
  id: string;
  itemId: string;
  serverId: string;
  creatorId: string;
  amount: number;
  creatorShare: number;
  platformShare: number;
  createdAt: Date;
}): Payout {
  return { ...row, at: row.createdAt.getTime() };
}

async function memberRow(accountId: string): Promise<MemberRow> {
  const row = await db().chatMember.findUnique({ where: { id: accountId } });
  if (!row) throw new ApiError(401, "Sign in to use Bleek.");
  return row as unknown as MemberRow;
}

async function ownedServer(accountId: string, serverId: string): Promise<ServerRow> {
  const row = await db().chatServer.findFirst({
    where: { id: serverId, ownerId: accountId },
    include: { channels: { orderBy: { position: "asc" } } },
  });
  if (!row) throw new ApiError(404, "Unknown server");
  return row as unknown as ServerRow;
}

async function channelWithServer(accountId: string, channelId: string) {
  const channel = await db().chatChannel.findFirst({
    where: { id: channelId, server: { ownerId: accountId } },
    include: { server: { include: { channels: { orderBy: { position: "asc" } } } } },
  });
  if (!channel) throw new ApiError(404, "Unknown channel");
  return channel as unknown as ChannelRow & { server: ServerRow };
}

async function persistServer(serverId: string): Promise<Server> {
  const row = await db().chatServer.findUniqueOrThrow({
    where: { id: serverId },
    include: { channels: { orderBy: { position: "asc" } } },
  });
  const server = toServer(row as unknown as ServerRow);
  broadcast({ type: "server:update", server });
  return server;
}

// ── Identity ─────────────────────────────────────────────────────────────

const OWNER_ROLE: Omit<ServerRole, "id" | "name" | "color"> = {
  permissions: [
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
  ],
  order: 0,
};

function starterRoles(): ServerRole[] {
  return [
    { id: "owner", name: "Owner", color: "#f0b232", ...OWNER_ROLE },
    {
      id: "member",
      name: "Member",
      color: "#b5bac1",
      permissions: ["view", "send", "react", "attach", "voice"],
      order: 1,
    },
  ];
}

const DEFAULT_GUARD: GuardConfig = { enabled: false, sensitivity: "balanced", rules: [] };

async function createServerRow(ownerId: string, name: string, position: number) {
  return db().chatServer.create({
    data: {
      ownerId,
      name,
      color: "#4f46e5",
      position,
      roles: starterRoles() as unknown as Prisma.InputJsonValue,
      guard: DEFAULT_GUARD as unknown as Prisma.InputJsonValue,
      flagged: [] as unknown as Prisma.InputJsonValue,
      channels: {
        create: [
          { name: "general", type: "text", position: 0 },
          { name: "Voice", type: "voice", position: 1 },
        ],
      },
    },
    include: { channels: { orderBy: { position: "asc" } } },
  });
}

/**
 * Creates the member on first use and keeps the display fields in step with the
 * ASTRO account. The shared wallet is copied once, on creation.
 */
export async function ensureMember(input: {
  id: string;
  handle: string;
  displayName: string;
  verified: boolean;
  region: string | null;
  playPlatform: string | null;
  coins: number;
}): Promise<User> {
  const name = input.displayName.trim() || input.handle;
  const existing = await db().chatMember.findUnique({ where: { id: input.id } });

  if (existing) {
    const updated = await db().chatMember.update({
      where: { id: input.id },
      data: {
        name,
        handle: input.handle,
        verified: input.verified,
        region: input.region,
        playPlatform: input.playPlatform,
      },
    });
    return toUser(updated as unknown as MemberRow);
  }

  const created = await db().chatMember.create({
    data: {
      id: input.id,
      handle: input.handle,
      name,
      verified: input.verified,
      region: input.region,
      playPlatform: input.playPlatform,
      banner: ["#4f46e5", "#0f172a"],
      cosmetics: DEFAULT_COSMETICS as unknown as Prisma.InputJsonValue,
      coins: input.coins,
    },
  });

  await createServerRow(created.id, `${name}’s server`, 0);
  return toUser(created as unknown as MemberRow);
}

// ── Reads ────────────────────────────────────────────────────────────────

export async function allItems(accountId: string): Promise<ShopItem[]> {
  const servers = await db().chatServer.findMany({ where: { ownerId: accountId }, select: { storefront: true } });
  const minted = servers.flatMap((row) => (row.storefront as unknown as Storefront | null)?.items ?? []);
  return [...SHOP, ...minted];
}

export async function findItem(accountId: string, itemId: string): Promise<ShopItem | undefined> {
  return (await allItems(accountId)).find((item) => item.id === itemId);
}

export async function snapshot(accountId: string): Promise<Snapshot> {
  const member = await memberRow(accountId);
  const servers = await db().chatServer.findMany({
    where: { ownerId: accountId },
    orderBy: { position: "asc" },
    include: { channels: { orderBy: { position: "asc" } } },
  });
  const messages = await db().chatMessage.findMany({
    where: { channel: { server: { ownerId: accountId } } },
    orderBy: { createdAt: "asc" },
    take: 2000,
  });
  const gifts = await db().chatGift.findMany({
    where: { OR: [{ fromId: accountId }, { toId: accountId }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const payouts = await db().chatPayout.findMany({
    where: { serverId: { in: servers.map((server) => server.id) } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    me: toUser(member),
    users: [toUser(member)],
    servers: servers.map((server) => toServer(server as unknown as ServerRow)),
    messages: messages.map((message) => toMessage(message as unknown as MessageRow)),
    shop: await allItems(accountId),
    typing: typingRooms().get(accountId) ?? {},
    gifts: gifts.map(toGift),
    payouts: payouts.map(toPayout),
  };
}

// ── Guard ────────────────────────────────────────────────────────────────

const THRESHOLD: Record<GuardSensitivity, number> = { low: 3, balanced: 2, strict: 1 };

/** Deterministic, in-process content scanner. Message text never leaves the host. */
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
export async function previewGuard(accountId: string, serverId: string, content: string) {
  const server = await ownedServer(accountId, serverId);
  const guard = server.guard as GuardConfig;
  const result = scanContent(content, guard);
  const threshold = THRESHOLD[guard.sensitivity];
  const flagged = guard.enabled && result.score >= threshold;
  return {
    score: result.score,
    reasons: result.reasons,
    threshold,
    flagged,
    blocked: flagged && guard.sensitivity === "strict",
    enabled: guard.enabled,
  };
}

export async function updateGuard(
  accountId: string,
  serverId: string,
  patch: { enabled?: boolean; sensitivity?: GuardSensitivity; rules?: GuardConfig["rules"] },
) {
  const server = await ownedServer(accountId, serverId);
  const guard = { ...(server.guard as GuardConfig) };

  if (typeof patch.enabled === "boolean") guard.enabled = patch.enabled;
  if (patch.sensitivity && ["low", "balanced", "strict"].includes(patch.sensitivity)) {
    guard.sensitivity = patch.sensitivity;
  }
  if (Array.isArray(patch.rules)) {
    guard.rules = patch.rules
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

  await db().chatServer.update({
    where: { id: serverId },
    data: { guard: guard as unknown as Prisma.InputJsonValue },
  });
  return { server: await persistServer(serverId) };
}

// ── Messages ─────────────────────────────────────────────────────────────

const MAX_LENGTH = 4000;

function typingRooms(): Map<string, TypingState> {
  if (!globalRef.__bleekTyping) globalRef.__bleekTyping = new Map();
  return globalRef.__bleekTyping;
}

export async function addMessage(
  accountId: string,
  input: { channelId: string; content: string; replyTo?: string | null },
) {
  const content = input.content.trim();
  if (!content) throw new ApiError(400, "Message cannot be empty");
  if (content.length > MAX_LENGTH) throw new ApiError(400, "Message is too long");

  const channel = await channelWithServer(accountId, input.channelId);
  if (channel.type !== "text") throw new ApiError(400, "Only text channels take messages");

  const guard = channel.server.guard as GuardConfig;
  const verdict = guardVerdict(content, guard);
  if (verdict.blocked) {
    throw new ApiError(400, `Guard blocked this message (${verdict.reasons.join("; ")})`);
  }

  const row = await db().chatMessage.create({
    data: {
      channelId: channel.id,
      authorId: accountId,
      content,
      replyTo: input.replyTo ?? null,
      reactions: [] as unknown as Prisma.InputJsonValue,
    },
  });

  if (verdict.flagged) {
    const flagged = [
      {
        id: `f-${Date.now().toString(36)}`,
        messageId: row.id,
        channelId: channel.id,
        authorId: accountId,
        reasons: verdict.reasons,
        score: verdict.score,
        at: Date.now(),
        status: "pending",
      },
      ...((channel.server.flagged ?? []) as Server["flagged"]),
    ].slice(0, 100);

    await db().chatServer.update({
      where: { id: channel.server.id },
      data: { flagged: flagged as unknown as Prisma.InputJsonValue },
    });
    await persistServer(channel.server.id);
  }

  const typing = typingRooms().get(accountId);
  if (typing?.[channel.id]) delete typing[channel.id][accountId];

  const message = toMessage(row as unknown as MessageRow);
  broadcast({ type: "message:new", message });
  return message;
}

async function ownMessage(accountId: string, id: string) {
  const row = await db().chatMessage.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Message not found");
  if (row.authorId !== accountId) throw new ApiError(403, "You can only change your own messages");
  return row as unknown as MessageRow;
}

export async function editMessage(accountId: string, id: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new ApiError(400, "Message cannot be empty");
  if (trimmed.length > MAX_LENGTH) throw new ApiError(400, "Message is too long");

  await ownMessage(accountId, id);
  const row = await db().chatMessage.update({
    where: { id },
    data: { content: trimmed, editedAt: new Date() },
  });

  const message = toMessage(row as unknown as MessageRow);
  broadcast({ type: "message:update", message });
  return message;
}

export async function deleteMessage(accountId: string, id: string) {
  const message = await ownMessage(accountId, id);
  await db().chatMessage.delete({ where: { id } });
  broadcast({ type: "message:delete", id, channelId: message.channelId });
}

export async function toggleReaction(accountId: string, id: string, emoji: string) {
  if (!emoji || emoji.length > 16) throw new ApiError(400, "Invalid reaction");
  const row = await db().chatMessage.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Message not found");

  const reactions = ((row.reactions ?? []) as unknown as Message["reactions"]).map((entry) => ({
    emoji: entry.emoji,
    users: [...entry.users],
  }));
  const existing = reactions.find((entry) => entry.emoji === emoji);

  if (!existing) {
    reactions.push({ emoji, users: [accountId] });
  } else if (existing.users.includes(accountId)) {
    existing.users = existing.users.filter((user) => user !== accountId);
  } else {
    existing.users.push(accountId);
  }

  const kept = reactions.filter((entry) => entry.users.length > 0);
  const updated = await db().chatMessage.update({
    where: { id },
    data: { reactions: kept as unknown as Prisma.InputJsonValue },
  });

  const message = toMessage(updated as unknown as MessageRow);
  broadcast({ type: "message:update", message });
  return message;
}

export function setTyping(accountId: string, channelId: string) {
  const rooms = typingRooms();
  const state = rooms.get(accountId) ?? {};
  const channel = (state[channelId] ??= {});
  channel[accountId] = Date.now();
  rooms.set(accountId, state);
  broadcast({ type: "message:typing", channelId, userId: accountId, at: channel[accountId] });
}

// ── Channels ─────────────────────────────────────────────────────────────

export async function setChannelLayout(accountId: string, channelId: string, layout: ChannelLayout) {
  if (!["chat", "gallery", "canvas"].includes(layout)) throw new ApiError(400, "Unknown layout");
  const channel = await channelWithServer(accountId, channelId);
  if (channel.type !== "text") throw new ApiError(400, "Only text channels have layouts");

  await db().chatChannel.update({ where: { id: channelId }, data: { layout } });
  return { server: await persistServer(channel.server.id) };
}

export async function setChannelDoc(accountId: string, channelId: string, doc: string) {
  const channel = await channelWithServer(accountId, channelId);
  if (doc.length > 20_000) throw new ApiError(400, "Document is too long");

  await db().chatChannel.update({ where: { id: channelId }, data: { doc } });
  return { server: await persistServer(channel.server.id) };
}

export async function resolveFlag(
  accountId: string,
  serverId: string,
  flagId: string,
  action: "approve" | "delete",
) {
  const server = await ownedServer(accountId, serverId);
  const flagged = [...((server.flagged ?? []) as Server["flagged"])];
  const flag = flagged.find((entry) => entry.id === flagId);
  if (!flag) throw new ApiError(404, "Flag not found");

  flag.status = action === "delete" ? "deleted" : "approved";
  await db().chatServer.update({
    where: { id: serverId },
    data: { flagged: flagged as unknown as Prisma.InputJsonValue },
  });

  if (action === "delete") {
    const message = await db().chatMessage.findUnique({ where: { id: flag.messageId } });
    if (message) {
      await db().chatMessage.delete({ where: { id: message.id } });
      broadcast({ type: "message:delete", id: message.id, channelId: message.channelId });
    }
  }

  return { server: await persistServer(serverId) };
}

// ── Servers and channels ─────────────────────────────────────────────────

const MAX_SERVERS = 20;
const MAX_CHANNELS = 40;

function channelSlug(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 24);
  if (!slug) throw new ApiError(400, "Give the channel a name");
  return slug;
}

export async function createServer(accountId: string, input: { name: string }) {
  const name = input.name.trim().slice(0, 48);
  if (!name) throw new ApiError(400, "Give the server a name");

  const count = await db().chatServer.count({ where: { ownerId: accountId } });
  if (count >= MAX_SERVERS) throw new ApiError(400, `A workspace holds ${MAX_SERVERS} servers`);

  const row = await createServerRow(accountId, name, count);
  const server = toServer(row as unknown as ServerRow);
  broadcast({ type: "server:new", server });
  return server;
}

export async function createChannel(
  accountId: string,
  serverId: string,
  input: { name: string; type: "text" | "voice" },
) {
  const server = await ownedServer(accountId, serverId);
  if (server.channels.length >= MAX_CHANNELS) {
    throw new ApiError(400, `A server holds ${MAX_CHANNELS} channels`);
  }
  const name = channelSlug(input.name);
  if (server.channels.some((channel) => channel.name.toLowerCase() === name.toLowerCase())) {
    throw new ApiError(409, "That channel already exists");
  }

  await db().chatChannel.create({
    data: { serverId, name, type: input.type === "voice" ? "voice" : "text", position: server.channels.length },
  });
  return { server: await persistServer(serverId) };
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

function normaliseOrder(roles: ServerRole[]): ServerRole[] {
  return [...roles].sort((a, b) => a.order - b.order).map((role, index) => ({ ...role, order: index }));
}

async function writeRoles(accountId: string, serverId: string, roles: ServerRole[]) {
  await ownedServer(accountId, serverId);
  await db().chatServer.update({
    where: { id: serverId },
    data: { roles: normaliseOrder(roles) as unknown as Prisma.InputJsonValue },
  });
  return { server: await persistServer(serverId) };
}

export async function createRole(
  accountId: string,
  serverId: string,
  input: { name?: string; color?: string; permissions?: unknown },
) {
  const server = await ownedServer(accountId, serverId);
  const roles = [...(server.roles as ServerRole[])];
  const name = (input.name ?? "New role").trim().slice(0, 32);
  if (!name) throw new ApiError(400, "Role name cannot be empty");

  const role: ServerRole = {
    id: `r-${Date.now().toString(36)}`,
    name,
    color: /^#[0-9a-f]{6}$/i.test(input.color ?? "") ? (input.color as string) : "#b5bac1",
    permissions: cleanPermissions(input.permissions),
    order: roles.length,
  };
  roles.push(role);
  const result = await writeRoles(accountId, serverId, roles);
  return { ...result, role };
}

export async function updateRole(
  accountId: string,
  serverId: string,
  roleId: string,
  patch: { name?: string; color?: string; permissions?: unknown; order?: number },
) {
  const server = await ownedServer(accountId, serverId);
  const roles = (server.roles as ServerRole[]).map((role) => ({ ...role }));
  const role = roles.find((candidate) => candidate.id === roleId);
  if (!role) throw new ApiError(404, "Unknown role");

  if (typeof patch.name === "string") {
    const name = patch.name.trim().slice(0, 32);
    if (!name) throw new ApiError(400, "Role name cannot be empty");
    role.name = name;
  }
  if (typeof patch.color === "string" && /^#[0-9a-f]{6}$/i.test(patch.color)) role.color = patch.color;
  if (patch.permissions !== undefined) role.permissions = cleanPermissions(patch.permissions);
  if (typeof patch.order === "number" && Number.isFinite(patch.order)) role.order = patch.order;

  const result = await writeRoles(accountId, serverId, roles);
  return { ...result, role };
}

export async function deleteRole(accountId: string, serverId: string, roleId: string) {
  const server = await ownedServer(accountId, serverId);
  const roles = (server.roles as ServerRole[]).filter((role) => role.id !== roleId);
  if (roles.length === (server.roles as ServerRole[]).length) throw new ApiError(404, "Unknown role");
  if (roles.length === 0) throw new ApiError(400, "A server needs at least one role");
  return writeRoles(accountId, serverId, roles);
}

export async function reorderRoles(accountId: string, serverId: string, order: string[]) {
  const server = await ownedServer(accountId, serverId);
  const roles = server.roles as ServerRole[];
  const known = new Set(roles.map((role) => role.id));
  if (order.length !== roles.length || order.some((id) => !known.has(id)) || new Set(order).size !== order.length) {
    throw new ApiError(400, "Order must list every role exactly once");
  }
  return writeRoles(
    accountId,
    serverId,
    order.map((id, index) => ({ ...roles.find((role) => role.id === id)!, order: index })),
  );
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

export async function mintCosmetic(
  accountId: string,
  serverId: string,
  input: { name: string; description?: string; slot: ShopItem["slot"]; key: string; price: number },
) {
  const server = await ownedServer(accountId, serverId);
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
    creatorId: accountId,
    creatorShare: CREATOR_SHARE,
  };

  const storefront: Storefront = (server.storefront as Storefront | null) ?? {
    tagline: "Community cosmetics, minted by members.",
    creatorId: accountId,
    items: [],
  };
  storefront.items = [...storefront.items, item];

  await db().chatServer.update({
    where: { id: serverId },
    data: { storefront: storefront as unknown as Prisma.InputJsonValue },
  });

  return { server: await persistServer(serverId), item };
}

async function payCreator(item: ShopItem, payerId: string): Promise<Payout | null> {
  if (!item.serverId || !item.creatorId) return null;

  const creatorShare = Math.round(item.price * (item.creatorShare ?? CREATOR_SHARE));
  const row = await db().chatPayout.create({
    data: {
      itemId: item.id,
      serverId: item.serverId,
      creatorId: item.creatorId,
      amount: item.price,
      creatorShare,
      platformShare: item.price - creatorShare,
    },
  });
  void payerId;

  const payout = toPayout(row);
  broadcast({ type: "payout", payout });
  return payout;
}

export async function purchase(accountId: string, itemId: string) {
  const item = await findItem(accountId, itemId);
  if (!item) throw new ApiError(404, "Unknown item");

  const member = await memberRow(accountId);
  if (member.owned.includes(item.id)) throw new ApiError(400, "You already own this item");
  if (member.coins < item.price) throw new ApiError(400, "Not enough coins for this item");

  const updated = await db().chatMember.update({
    where: { id: accountId },
    data: { coins: { decrement: item.price }, owned: { push: item.id } },
  });

  const payout = await payCreator(item, accountId);
  const user = toUser(updated as unknown as MemberRow);
  broadcast({ type: "user:update", user });
  return { user, payout };
}

export async function giftItem(accountId: string, itemId: string, toUserId: string) {
  if (toUserId === accountId) throw new ApiError(400, "Pick someone else to gift");
  const item = await findItem(accountId, itemId);
  if (!item) throw new ApiError(404, "Unknown item");

  const recipientRow = await db().chatMember.findUnique({ where: { id: toUserId } });
  if (!recipientRow) throw new ApiError(404, "Unknown recipient");
  const recipient = toUser(recipientRow as unknown as MemberRow);
  if (recipient.owned.includes(item.id)) throw new ApiError(400, `${recipient.name} already owns this`);

  const senderRow = await memberRow(accountId);
  if (senderRow.coins < item.price) throw new ApiError(400, "Not enough coins for this gift");

  const [senderUpdated, recipientUpdated] = await db().$transaction([
    db().chatMember.update({
      where: { id: accountId },
      data: { coins: { decrement: item.price } },
    }),
    db().chatMember.update({
      where: { id: toUserId },
      data: { owned: { push: item.id } },
    }),
    db().chatGift.create({ data: { fromId: accountId, toId: toUserId, itemId: item.id } }),
  ]);

  const giftRow = await db().chatGift.findFirst({
    where: { fromId: accountId, toId: toUserId, itemId: item.id },
    orderBy: { createdAt: "desc" },
  });
  await payCreator(item, accountId);

  const sender = toUser(senderUpdated as unknown as MemberRow);
  const updatedRecipient = toUser(recipientUpdated as unknown as MemberRow);
  broadcast({ type: "user:update", user: sender });
  broadcast({ type: "user:update", user: updatedRecipient });

  if (!giftRow) throw new ApiError(500, "The gift could not be recorded");
  const gift = toGift(giftRow);
  broadcast({ type: "gift", gift, itemName: item.name, fromName: sender.name });

  return { user: sender, recipient: updatedRecipient, gift };
}

export async function updateProfile(
  accountId: string,
  patch: {
    name?: string;
    bio?: string;
    pronouns?: string;
    status?: Status;
    customStatus?: string;
    character?: CharacterKey;
    banner?: [string, string];
    cosmetics?: Partial<Cosmetics>;
  },
) {
  const member = await memberRow(accountId);
  const data: Prisma.ChatMemberUpdateInput = {};

  if (typeof patch.name === "string") {
    const name = patch.name.trim().slice(0, 32);
    if (!name) throw new ApiError(400, "Display name cannot be empty");
    data.name = name;
  }
  if (typeof patch.bio === "string") data.bio = patch.bio.slice(0, 190);
  if (typeof patch.pronouns === "string") data.pronouns = patch.pronouns.slice(0, 40);
  if (patch.status && ["online", "idle", "dnd", "offline"].includes(patch.status)) data.status = patch.status;
  if (typeof patch.customStatus === "string") {
    const customStatus = patch.customStatus.replace(/\s+/g, " ").trim().slice(0, 64);
    data.customStatus = customStatus || null;
  }
  if (patch.character && CHARACTER_KEYS.includes(patch.character)) data.character = patch.character;
  if (Array.isArray(patch.banner) && patch.banner.length === 2) {
    data.banner = patch.banner.map((colour) => String(colour).slice(0, 32));
  }

  if (patch.cosmetics) {
    const cosmetics: Cosmetics = { ...DEFAULT_COSMETICS, ...(member.cosmetics as Partial<Cosmetics> | null) };
    for (const slot of ["decoration", "effect", "nameplate", "theme"] as const) {
      if (!(slot in patch.cosmetics)) continue;
      const value = patch.cosmetics[slot];
      if (value === null) {
        if (slot === "theme") throw new ApiError(400, "A theme is always equipped");
        cosmetics[slot] = null;
        continue;
      }
      const item = await findItem(accountId, String(value));
      if (!item) throw new ApiError(404, "Unknown cosmetic");
      if (item.slot !== slot) throw new ApiError(400, "That cosmetic belongs in another slot");
      if (!member.owned.includes(item.id)) throw new ApiError(403, "You do not own that cosmetic");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cosmetics as any)[slot] = item.key;
    }
    data.cosmetics = cosmetics as unknown as Prisma.InputJsonValue;
  }

  const updated = await db().chatMember.update({ where: { id: accountId }, data });
  const user = toUser(updated as unknown as MemberRow);
  broadcast({ type: "user:update", user });
  return { user };
}
