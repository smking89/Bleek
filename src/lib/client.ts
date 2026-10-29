import type {
  ChannelLayout,
  CharacterKey,
  Cosmetics,
  Gift,
  GuardConfig,
  GuardSensitivity,
  Message,
  Payout,
  ShopItem,
  Snapshot,
  Status,
  User,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : "Request failed";
    throw new Error(message);
  }
  return data as T;
}

export type ServerPayload = { server: Snapshot["servers"][number] };

export const api = {
  state: () => request<Snapshot>("/api/state"),
  send: (channelId: string, content: string, replyTo?: string | null) =>
    request<{ message: Message }>("/api/messages", {
      method: "POST",
      body: JSON.stringify({ channelId, content, replyTo: replyTo ?? null }),
    }),
  edit: (id: string, content: string) =>
    request<{ message: Message }>(`/api/messages/${id}`, { method: "PATCH", body: JSON.stringify({ content }) }),
  remove: (id: string) => request<{ ok: boolean }>(`/api/messages/${id}`, { method: "DELETE" }),
  react: (id: string, emoji: string) =>
    request<{ message: Message }>(`/api/messages/${id}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),
  typing: (channelId: string) =>
    request<{ ok: boolean }>("/api/typing", { method: "POST", body: JSON.stringify({ channelId }) }),
  purchase: (itemId: string) =>
    request<{ user: User; payout: Payout | null }>("/api/shop/purchase", {
      method: "POST",
      body: JSON.stringify({ itemId }),
    }),
  gift: (itemId: string, toUserId: string) =>
    request<{ user: User; recipient: User; gift: Gift }>("/api/shop/gift", {
      method: "POST",
      body: JSON.stringify({ itemId, toUserId }),
    }),
  updateProfile: (patch: {
    name?: string;
    bio?: string;
    pronouns?: string;
    status?: Status;
    customStatus?: string;
    character?: CharacterKey;
    banner?: [string, string];
    cosmetics?: Partial<Cosmetics>;
  }) => request<{ user: User }>("/api/profile", { method: "PATCH", body: JSON.stringify(patch) }),
  createServer: (name: string) =>
    request<{ server: Snapshot["servers"][number] }>("/api/servers", { method: "POST", body: JSON.stringify({ name }) }),
  createChannel: (serverId: string, input: { name: string; type: "text" | "voice" }) =>
    request<ServerPayload>(`/api/servers/${serverId}/channels`, { method: "POST", body: JSON.stringify(input) }),
  joinServer: (code: string) =>
    request<ServerPayload>("/api/servers/join", { method: "POST", body: JSON.stringify({ code }) }),
  updateServer: (serverId: string, patch: { name?: string; rotateInvite?: boolean }) =>
    request<ServerPayload>(`/api/servers/${serverId}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteServer: (serverId: string) =>
    request<{ ok: boolean; serverId: string }>(`/api/servers/${serverId}`, { method: "DELETE" }),
  leaveServer: (serverId: string) =>
    request<{ ok: boolean; serverId: string }>(`/api/servers/${serverId}/membership`, { method: "DELETE" }),
  updateChannel: (channelId: string, patch: { name?: string; topic?: string }) =>
    request<ServerPayload>(`/api/channels/${channelId}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteChannel: (channelId: string) =>
    request<ServerPayload>(`/api/channels/${channelId}`, { method: "DELETE" }),
  setLayout: (channelId: string, layout: ChannelLayout) =>
    request<ServerPayload>(`/api/channels/${channelId}`, { method: "PATCH", body: JSON.stringify({ layout }) }),
  setDoc: (channelId: string, doc: string) =>
    request<ServerPayload>(`/api/channels/${channelId}`, { method: "PATCH", body: JSON.stringify({ doc }) }),
  mint: (serverId: string, input: { name: string; description?: string; slot: ShopItem["slot"]; price: number }) =>
    request<ServerPayload & { item: ShopItem }>(`/api/servers/${serverId}/storefront`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateGuard: (
    serverId: string,
    patch: { enabled?: boolean; sensitivity?: GuardSensitivity; rules?: GuardConfig["rules"] },
  ) => request<ServerPayload>(`/api/servers/${serverId}/guard`, { method: "PATCH", body: JSON.stringify(patch) }),
  resolveFlag: (serverId: string, flagId: string, action: "approve" | "delete") =>
    request<ServerPayload>(`/api/servers/${serverId}/flagged/${flagId}`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
  scanGuard: (serverId: string, content: string) =>
    request<{ score: number; reasons: string[]; threshold: number; flagged: boolean; blocked: boolean }>(
      `/api/servers/${serverId}/guard`,
      { method: "POST", body: JSON.stringify({ content }) },
    ),
  roles: (
    serverId: string,
    payload:
      | { create: { name?: string; color?: string; permissions?: string[] } }
      | { update: { id: string; name?: string; color?: string; permissions?: string[] } }
      | { delete: string }
      | { order: string[] },
  ) => request<ServerPayload>(`/api/servers/${serverId}/roles`, { method: "POST", body: JSON.stringify(payload) }),
};
