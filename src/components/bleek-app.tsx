"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Channel,
  ChannelLayout,
  CharacterKey,
  Cosmetics,
  CosmeticSlot,
  Server,
  ServerEvent,
  ShopItem,
  Snapshot,
  Status,
  User,
} from "@/lib/types";
import { api } from "@/lib/client";
import { withHandle, withIdentity, type AppIdentity } from "@/lib/identity";
import { ChannelSidebar } from "./channel-sidebar";
import { CreateDialog } from "./create-dialog";
import { ChatView } from "./chat-view";
import { GiftDialog } from "./gift-dialog";
import { HomeFeed } from "./home-feed";
import { Icon } from "./icons";
import { JoinServerDialog } from "./join-server-dialog";
import { MemberList } from "./member-list";
import { ProfilePage } from "./profile-page";
import { ProfilePopout } from "./profile-popout";
import { ServerConsole } from "./server-console";
import { ServerRail } from "./server-rail";
import { ServerSettings } from "./server-settings";
import { SettingsModal } from "./settings-modal";
import { ShopModal } from "./shop-modal";
import { StorefrontModal } from "./storefront-modal";
import { VoiceView } from "./voice-view";

type Toast = { id: number; message: string; tone: "ok" | "error" };

const messageOf = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

function applyEvent(previous: Snapshot | null, event: ServerEvent): Snapshot | null {
  if (!previous) return previous;
  switch (event.type) {
    case "message:new":
      if (previous.messages.some((message) => message.id === event.message.id)) return previous;
      return { ...previous, messages: [...previous.messages, event.message] };
    case "message:update":
      return {
        ...previous,
        messages: previous.messages.map((message) => (message.id === event.message.id ? event.message : message)),
      };
    case "message:delete":
      return { ...previous, messages: previous.messages.filter((message) => message.id !== event.id) };
    case "user:update":
      return {
        ...previous,
        me: previous.me.id === event.user.id ? event.user : previous.me,
        users: previous.users.map((user) => (user.id === event.user.id ? event.user : user)),
      };
    case "server:update":
      return {
        ...previous,
        servers: previous.servers.map((server) => (server.id === event.server.id ? event.server : server)),
        shop: [
          ...previous.shop.filter((item) => item.serverId !== event.server.id),
          ...(event.server.storefront?.items ?? []),
        ],
      };
    case "server:new":
      // A join event belongs to the account that joined, not to everyone else.
      if (event.accountId && event.accountId !== previous.me.id) return previous;
      return previous.servers.some((server) => server.id === event.server.id)
        ? previous
        : {
            ...previous,
            servers: [...previous.servers, event.server],
            shop: [...previous.shop, ...(event.server.storefront?.items ?? [])],
          };
    case "server:delete": {
      const gone = new Set(
        previous.servers.find((server) => server.id === event.serverId)?.channels.map((channel) => channel.id) ?? [],
      );
      return {
        ...previous,
        servers: previous.servers.filter((server) => server.id !== event.serverId),
        messages: previous.messages.filter((message) => !gone.has(message.channelId)),
        shop: previous.shop.filter((item) => item.serverId !== event.serverId),
      };
    }
    case "payout":
      return {
        ...previous,
        payouts: [event.payout, ...previous.payouts.filter((payout) => payout.id !== event.payout.id)],
      };
    case "gift":
      return {
        ...previous,
        gifts: [event.gift, ...previous.gifts.filter((gift) => gift.id !== event.gift.id)],
      };
    case "message:typing":
      return {
        ...previous,
        typing: {
          ...previous.typing,
          [event.channelId]: { ...(previous.typing[event.channelId] ?? {}), [event.userId]: event.at },
        },
      };
    default:
      return previous;
  }
}

/** First paint: keep the three-column shell stable so the layout does not flash in. */
function AppSkeleton() {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--bg-chat)]" aria-busy="true" aria-label="Loading workspace">
      <div className="hidden w-[72px] shrink-0 flex-col items-center gap-3 bg-[var(--bg-rail)] py-3 sm:flex">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-12 w-12 animate-pulse rounded-2xl bg-[var(--bg-sidebar)]" />
        ))}
      </div>
      <div className="hidden w-60 shrink-0 flex-col gap-2 bg-[var(--bg-sidebar)] p-3 md:flex">
        <div className="h-8 w-40 animate-pulse rounded bg-[var(--bg-rail)]" />
        {[0, 1, 2, 3, 4, 5, 6].map((index) => (
          <div key={index} className="h-6 w-full animate-pulse rounded bg-[var(--bg-rail)] opacity-70" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-12 shrink-0 border-b border-[var(--border-subtle)] px-4 py-3">
          <div className="h-5 w-40 animate-pulse rounded bg-[var(--bg-sidebar)]" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[var(--bg-sidebar)]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-[var(--bg-sidebar)]" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-[var(--bg-sidebar)] opacity-70" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4">
          <div className="h-11 animate-pulse rounded-lg bg-[var(--bg-input)]" />
        </div>
      </div>
    </div>
  );
}

export function BleekApp({ identity }: { identity: AppIdentity }) {
  const [rawSnap, setRawSnap] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<"home" | "server">("server");
  const [activeServerId, setActiveServerId] = useState<string>("");
  const [channelByServer, setChannelByServer] = useState<Record<string, string>>({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialPage, setSettingsInitialPage] = useState<"profile" | "cosmetics" | undefined>(undefined);
  const [isCompact, setIsCompact] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [storefrontServerId, setStorefrontServerId] = useState<string | null>(null);
  const [giftItemId, setGiftItemId] = useState<string | null>(null);
  const [createServerOpen, setCreateServerOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [joinServerOpen, setJoinServerOpen] = useState(false);
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false);
  const [popout, setPopout] = useState<{ userId: string; rect: DOMRect } | null>(null);
  const [voiceChannelId, setVoiceChannelId] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [clock, setClock] = useState(() => Date.now());
  const lastTypingRef = useRef(0);
  const connectedRef = useRef(false);

  // Every read is stamped with the session's handle: the ASTRO account is canonical.
  const snap = useMemo(
    () => (rawSnap ? withHandle(rawSnap, identity) : null),
    [rawSnap, identity],
  );

  const toast = useCallback((message: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((entry) => entry.id !== id));
    }, 4200);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api.state();
      setRawSnap(withIdentity(data, identity));
      setActiveServerId((current) => current || data.servers[0]?.id || "");
      setLoadError(null);
    } catch (error) {
      setLoadError(messageOf(error));
    }
  }, [identity]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = (event) => {
      let payload: ServerEvent;
      try {
        payload = JSON.parse(event.data) as ServerEvent;
      } catch {
        return;
      }
      if (payload.type === "hello") {
        if (connectedRef.current) {
          void api
            .state()
            .then((data) => setRawSnap(withIdentity(data, identity)))
            .catch(() => {});
        }
        connectedRef.current = true;
        return;
      }
      setRawSnap((previous) => applyEvent(previous, payload));
    };
    return () => source.close();
  }, [identity]);

  // Members sit in a third column on wide screens, but only appear on demand below that.
  useEffect(() => {
    if (window.matchMedia("(min-width: 1280px)").matches) setMembersOpen(true);
  }, []);

  // Phones get the full-screen profile sheet; wider screens keep the popout card.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const me = snap?.me;
  const activeServer: Server | undefined = useMemo(() => {
    if (!snap) return undefined;
    return snap.servers.find((server) => server.id === activeServerId) ?? snap.servers[0];
  }, [snap, activeServerId]);

  const activeChannel: Channel | undefined = useMemo(() => {
    if (!activeServer) return undefined;
    const stored = channelByServer[activeServer.id];
    const storedChannel = activeServer.channels.find((channel) => channel.id === stored);
    return storedChannel ?? activeServer.channels.find((channel) => channel.type === "text") ?? activeServer.channels[0];
  }, [activeServer, channelByServer]);

  const typingActive = Boolean(
    snap && activeChannel && Object.keys(snap.typing[activeChannel.id] ?? {}).length > 0,
  );

  // The clock only drives typing expiry, so it should not tick (and re-render) when nobody is typing.
  useEffect(() => {
    if (!typingActive) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [typingActive]);

  const storefrontServer = useMemo(
    () => (snap && storefrontServerId ? snap.servers.find((server) => server.id === storefrontServerId) : undefined),
    [snap, storefrontServerId],
  );

  const giftItem: ShopItem | undefined = useMemo(
    () => (snap && giftItemId ? snap.shop.find((item) => item.id === giftItemId) : undefined),
    [snap, giftItemId],
  );

  const typingUsers = useMemo(() => {
    if (!snap || !activeChannel) return [];
    const map = snap.typing[activeChannel.id] ?? {};
    return Object.entries(map)
      .filter(([id, at]) => id !== snap.me.id && clock - at < 6500)
      .map(([id]) => snap.users.find((user) => user.id === id))
      .filter((user): user is User => Boolean(user));
  }, [snap, activeChannel, clock]);

  const popoutUser = useMemo(() => {
    if (!snap || !popout) return null;
    const user = snap.users.find((candidate) => candidate.id === popout.userId);
    return user ? { user, rect: popout.rect } : null;
  }, [snap, popout]);

  const liveThreads = useMemo(() => {
    if (!snap) return 0;
    const since = clock - 24 * 60 * 60_000;
    const channels = new Set(snap.messages.filter((message) => message.createdAt >= since).map((message) => message.channelId));
    return channels.size;
  }, [snap, clock]);

  const mergeUser = useCallback((user: User) => {
    setRawSnap((previous) =>
      previous
        ? {
            ...previous,
            me: previous.me.id === user.id ? user : previous.me,
            users: previous.users.map((candidate) => (candidate.id === user.id ? user : candidate)),
          }
        : previous,
    );
  }, []);

  const mergeServer = useCallback((server: Server) => {
    setRawSnap((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        servers: previous.servers.map((candidate) => (candidate.id === server.id ? server : candidate)),
        shop: [
          ...previous.shop.filter((item) => item.serverId !== server.id),
          ...(server.storefront?.items ?? []),
        ],
      };
    });
  }, []);

  const upsertMessage = useCallback((message: Snapshot["messages"][number]) => {
    setRawSnap((previous) => {
      if (!previous) return previous;
      const exists = previous.messages.some((candidate) => candidate.id === message.id);
      return {
        ...previous,
        messages: exists
          ? previous.messages.map((candidate) => (candidate.id === message.id ? message : candidate))
          : [...previous.messages, message],
      };
    });
  }, []);

  const selectServer = useCallback((id: string) => {
    setActiveServerId(id);
    setView("server");
    setMobileNavOpen(false);
  }, []);

  const selectChannel = useCallback(
    (channel: Channel) => {
      if (!activeServer) return;
      setChannelByServer((previous) => ({ ...previous, [activeServer.id]: channel.id }));
      if (channel.type === "voice") setVoiceChannelId(channel.id);
      setMobileNavOpen(false);
    },
    [activeServer],
  );

  const openFromHome = useCallback((serverId: string, channelId: string) => {
    setActiveServerId(serverId);
    setView("server");
    setChannelByServer((previous) => ({ ...previous, [serverId]: channelId }));
    setMobileNavOpen(false);
  }, []);

  const openProfile = useCallback((user: User, rect: DOMRect) => {
    setPopout({ userId: user.id, rect });
  }, []);

  const onSend = useCallback(
    async (content: string, replyTo: string | null) => {
      if (!activeChannel || activeChannel.type !== "text") return;
      try {
        const { message } = await api.send(activeChannel.id, content, replyTo);
        upsertMessage(message);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [activeChannel, toast, upsertMessage],
  );

  const onReact = useCallback(
    async (id: string, emoji: string) => {
      try {
        const { message } = await api.react(id, emoji);
        upsertMessage(message);
      } catch (error) {
        toast(messageOf(error), "error");
      }
    },
    [toast, upsertMessage],
  );

  const onEdit = useCallback(
    async (id: string, content: string) => {
      try {
        const { message } = await api.edit(id, content);
        upsertMessage(message);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [toast, upsertMessage],
  );

  const onDelete = useCallback(
    async (id: string) => {
      try {
        await api.remove(id);
        setRawSnap((previous) =>
          previous ? { ...previous, messages: previous.messages.filter((message) => message.id !== id) } : previous,
        );
      } catch (error) {
        toast(messageOf(error), "error");
      }
    },
    [toast],
  );

  const onTyping = useCallback(() => {
    if (!activeChannel) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 2500) return;
    lastTypingRef.current = now;
    void api.typing(activeChannel.id).catch(() => {});
    setRawSnap((previous) =>
      previous
        ? {
            ...previous,
            typing: {
              ...previous.typing,
              [activeChannel.id]: { ...(previous.typing[activeChannel.id] ?? {}), [previous.me.id]: now },
            },
          }
        : previous,
    );
  }, [activeChannel]);

  const onPurchase = useCallback(
    async (itemId: string) => {
      try {
        const { user } = await api.purchase(itemId);
        mergeUser(user);
        const item = snap?.shop.find((entry) => entry.id === itemId);
        toast(`Purchased ${item?.name ?? "cosmetic"} — equip it from your inventory.`);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [mergeUser, snap, toast],
  );

  const onEquip = useCallback(
    async (slot: CosmeticSlot, itemId: string | null) => {
      try {
        const cosmetics = { [slot]: itemId } as unknown as Partial<Cosmetics>;
        const { user } = await api.updateProfile({ cosmetics });
        mergeUser(user);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [mergeUser, toast],
  );

  const onStoreItem = useCallback(
    async (itemId: string) => {
      const item = snap?.shop.find((entry) => entry.id === itemId);
      if (!item || !me) return;
      if (me.owned.includes(itemId)) {
        await onEquip(item.slot, itemId);
        toast(`${item.name} equipped.`);
        return;
      }
      await onPurchase(itemId);
    },
    [snap, me, onPurchase, onEquip, toast],
  );

  const onGift = useCallback(
    async (itemId: string, toUserId: string) => {
      try {
        const result = await api.gift(itemId, toUserId);
        mergeUser(result.user);
        mergeUser(result.recipient);
        setRawSnap((previous) =>
          previous
            ? { ...previous, gifts: [result.gift, ...previous.gifts.filter((gift) => gift.id !== result.gift.id)] }
            : previous,
        );
        const item = snap?.shop.find((entry) => entry.id === itemId);
        toast(`Sent ${item?.name ?? "cosmetic"} to ${result.recipient.name}.`);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [mergeUser, snap, toast],
  );

  const onCreateServer = useCallback(
    async (name: string) => {
      const { server } = await api.createServer(name);
      setRawSnap((previous) =>
        previous
          ? {
              ...previous,
              servers: [...previous.servers, server],
              shop: [...previous.shop, ...(server.storefront?.items ?? [])],
            }
          : previous,
      );
      setActiveServerId(server.id);
      setView("server");
      setMobileNavOpen(false);
      toast(`“${server.name}” is ready.`);
    },
    [toast],
  );

  const onCreateChannel = useCallback(
    async (input: { name: string; type: "text" | "voice" }) => {
      if (!activeServer) throw new Error("No server selected");
      const { server } = await api.createChannel(activeServer.id, input);
      mergeServer(server);

      const slug = input.name.trim().toLowerCase().replace(/\s+/g, "-");
      const created = server.channels.find((channel) => channel.name.toLowerCase() === slug);
      if (created) {
        setChannelByServer((previous) => ({ ...previous, [server.id]: created.id }));
        if (created.type === "voice") setVoiceChannelId(created.id);
      }
      toast(`${input.type === "voice" ? "Voice channel" : "#"}${created?.name ?? slug} added.`);
    },
    [activeServer, mergeServer, toast],
  );

  const removeServerLocally = useCallback((serverId: string) => {
    setRawSnap((previous) => {
      if (!previous) return previous;
      const gone = new Set(
        previous.servers.find((server) => server.id === serverId)?.channels.map((channel) => channel.id) ?? [],
      );
      return {
        ...previous,
        servers: previous.servers.filter((server) => server.id !== serverId),
        messages: previous.messages.filter((message) => !gone.has(message.channelId)),
        shop: previous.shop.filter((item) => item.serverId !== serverId),
      };
    });
    setActiveServerId((current) => (current === serverId ? "" : current));
  }, []);

  const onJoinServer = useCallback(
    async (code: string) => {
      const { server } = await api.joinServer(code);
      setRawSnap((previous) =>
        previous && !previous.servers.some((entry) => entry.id === server.id)
          ? {
              ...previous,
              servers: [...previous.servers, server],
              shop: [...previous.shop, ...(server.storefront?.items ?? [])],
            }
          : previous,
      );
      setActiveServerId(server.id);
      setView("server");
      setMobileNavOpen(false);
      toast(`Joined “${server.name}”.`);
    },
    [toast],
  );

  const onRenameServer = useCallback(
    async (name: string) => {
      if (!activeServer) return;
      const { server } = await api.updateServer(activeServer.id, { name });
      mergeServer(server);
      toast(`Renamed to “${server.name}”.`);
    },
    [activeServer, mergeServer, toast],
  );

  const onRotateInvite = useCallback(async () => {
    if (!activeServer) return;
    const { server } = await api.updateServer(activeServer.id, { rotateInvite: true });
    mergeServer(server);
    toast("New invite code issued. The old one no longer works.");
  }, [activeServer, mergeServer, toast]);

  const onRenameChannel = useCallback(
    async (channelId: string, name: string) => {
      const { server } = await api.updateChannel(channelId, { name });
      mergeServer(server);
      toast(`Channel renamed to #${server.channels.find((channel) => channel.id === channelId)?.name ?? name}.`);
    },
    [mergeServer, toast],
  );

  const onDeleteChannel = useCallback(
    async (channelId: string) => {
      const { server } = await api.deleteChannel(channelId);
      mergeServer(server);
      setChannelByServer((previous) => {
        if (previous[server.id] !== channelId) return previous;
        const next = { ...previous };
        delete next[server.id];
        return next;
      });
      toast("Channel deleted.");
    },
    [mergeServer, toast],
  );

  const onDeleteServer = useCallback(async () => {
    if (!activeServer) return;
    const name = activeServer.name;
    await api.deleteServer(activeServer.id);
    removeServerLocally(activeServer.id);
    setServerSettingsOpen(false);
    toast(`“${name}” deleted.`);
  }, [activeServer, removeServerLocally, toast]);

  const onLeaveServer = useCallback(async () => {
    if (!activeServer) return;
    const name = activeServer.name;
    await api.leaveServer(activeServer.id);
    removeServerLocally(activeServer.id);
    setServerSettingsOpen(false);
    toast(`Left “${name}”.`);
  }, [activeServer, removeServerLocally, toast]);

  const onSetLayout = useCallback(
    async (layout: ChannelLayout) => {
      if (!activeChannel) return;
      try {
        const { server } = await api.setLayout(activeChannel.id, layout);
        mergeServer(server);
        toast(`#${activeChannel.name} switched to ${layout} layout.`);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [activeChannel, mergeServer, toast],
  );

  const onSaveDoc = useCallback(
    async (doc: string) => {
      if (!activeChannel) return;
      try {
        const { server } = await api.setDoc(activeChannel.id, doc);
        mergeServer(server);
        toast("Document published to the channel.");
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [activeChannel, mergeServer, toast],
  );

  const onMint = useCallback(
    async (input: { name: string; description?: string; slot: ShopItem["slot"]; price: number }) => {
      if (!storefrontServerId) return;
      try {
        const result = await api.mint(storefrontServerId, input);
        mergeServer(result.server);
        toast(`“${result.item.name}” is live in the storefront.`);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [storefrontServerId, mergeServer, toast],
  );

  const onUpdateGuard = useCallback(
    async (patch: { enabled?: boolean; sensitivity?: "low" | "balanced" | "strict"; rules?: Server["guard"]["rules"] }) => {
      if (!activeServer) return;
      try {
        const { server } = await api.updateGuard(activeServer.id, patch);
        mergeServer(server);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [activeServer, mergeServer, toast],
  );

  const onResolveFlag = useCallback(
    async (flagId: string, action: "approve" | "delete") => {
      if (!activeServer) return;
      try {
        const { server } = await api.resolveFlag(activeServer.id, flagId, action);
        mergeServer(server);
        toast(action === "delete" ? "Message deleted by guard." : "Message approved and kept.");
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [activeServer, mergeServer, toast],
  );

  const onRoles = useCallback(
    async (
      payload:
        | { create: { name?: string; color?: string; permissions?: string[] } }
        | { update: { id: string; name?: string; color?: string; permissions?: string[] } }
        | { delete: string }
        | { order: string[] },
    ) => {
      if (!activeServer) return;
      try {
        const { server } = await api.roles(activeServer.id, payload);
        mergeServer(server);
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [activeServer, mergeServer, toast],
  );

  const onScan = useCallback(
    async (content: string) => {
      if (!activeServer) throw new Error("No server selected");
      return api.scanGuard(activeServer.id, content);
    },
    [activeServer],
  );

  const onSaveProfile = useCallback(
    async (patch: {
      name: string;
      bio: string;
      pronouns: string;
      status: Status;
      customStatus: string;
      character: CharacterKey;
      banner: [string, string];
    }) => {
      try {
        const { user } = await api.updateProfile(patch);
        mergeUser(user);
        toast("Profile saved.");
      } catch (error) {
        toast(messageOf(error), "error");
        throw error;
      }
    },
    [mergeUser, toast],
  );

  const onClearStatus = useCallback(async () => {
    try {
      const { user } = await api.updateProfile({ customStatus: "" });
      mergeUser(user);
      toast("Custom status cleared.");
    } catch (error) {
      toast(messageOf(error), "error");
      throw error;
    }
  }, [mergeUser, toast]);

  if (loadError) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-[var(--bg-chat)] text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-sidebar)] text-[var(--red)]">
          <Icon name="close" size={26} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[var(--text-strong)]">Could not reach the server</h1>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!snap || !me || !activeServer || !activeChannel) {
    return <AppSkeleton />;
  }

  const theme = me.cosmetics.theme;

  return (
    <div
      data-theme={theme}
      className="flex h-dvh w-full overflow-hidden bg-[var(--bg-chat)] text-[var(--text)]"
    >
      <ServerRail
        servers={snap.servers}
        activeServerId={activeServer.id}
        homeActive={view === "home"}
        liveCount={liveThreads}
        onHome={() => {
          setView("home");
          setMobileNavOpen(false);
        }}
        onSelect={selectServer}
        onCreateServer={() => setCreateServerOpen(true)}
        onJoinServer={() => setJoinServerOpen(true)}
        onOpenShop={() => setShopOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => {
          setPopout({ userId: me.id, rect: new DOMRect(window.innerWidth - 320, 120, 0, 0) });
        }}
        meInitials={me.name.slice(0, 1).toUpperCase()}
      />

      {view === "home" ? (
        <HomeFeed
          servers={snap.servers}
          users={snap.users}
          messages={snap.messages}
          me={me}
          clock={clock}
          payouts={snap.payouts}
          onOpen={openFromHome}
          onOpenStorefront={(serverId) => setStorefrontServerId(serverId)}
        />
      ) : (
        <div className="relative flex min-w-0 flex-1">
          <div
            className={`${
              mobileNavOpen ? "absolute inset-y-0 left-0 z-40 flex shadow-2xl shadow-black/50" : "hidden"
            } md:static md:z-auto md:flex md:shadow-none`}
          >
            <ChannelSidebar
              server={activeServer}
              activeChannelId={activeChannel.id}
              me={me}
              micMuted={micMuted}
              deafened={deafened}
              voiceChannelId={voiceChannelId}
              onSelectChannel={selectChannel}
              onCreateChannel={() => setCreateChannelOpen(true)}
              onToggleMic={() => setMicMuted((value) => !value)}
              onToggleDeafen={() => setDeafened((value) => !value)}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenShop={() => setShopOpen(true)}
              onOpenStorefront={() => setStorefrontServerId(activeServer.id)}
              onOpenServerConsole={() => setConsoleOpen(true)}
              onOpenServerSettings={() => setServerSettingsOpen(true)}
              onOpenProfile={(rect) => setPopout({ userId: me.id, rect })}
              onClose={() => setMobileNavOpen(false)}
            />
          </div>

          {mobileNavOpen && (
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 z-30 cursor-default bg-black/50 md:hidden"
            />
          )}

          {activeChannel.type === "voice" ? (
            <VoiceView
              server={activeServer}
              channel={activeChannel}
              me={me}
              joined={voiceChannelId === activeChannel.id}
              muted={micMuted}
              deafened={deafened}
              onJoin={() => {
                setVoiceChannelId(activeChannel.id);
                toast(`Joined voice channel “${activeChannel.name}”.`);
              }}
              onLeave={() => setVoiceChannelId(null)}
              onToggleMute={() => setMicMuted((value) => !value)}
              onToggleDeafen={() => setDeafened((value) => !value)}
            />
          ) : (
            <ChatView
              server={activeServer}
              channel={activeChannel}
              messages={snap.messages}
              users={snap.users}
              me={me}
              typing={typingUsers}
              membersOpen={membersOpen}
              onToggleMembers={() => setMembersOpen((value) => !value)}
              onOpenMobileNav={() => setMobileNavOpen(true)}
              onSend={onSend}
              onReact={onReact}
              onEdit={onEdit}
              onDelete={onDelete}
              onTyping={onTyping}
              onOpenProfile={openProfile}
              onSetLayout={onSetLayout}
              onSaveDoc={onSaveDoc}
              onOpenStorefront={() => setStorefrontServerId(activeServer.id)}
              onFocusComposer={() => setMobileNavOpen(false)}
            />
          )}

          <div
            className={`${
              membersOpen ? "absolute inset-y-0 right-0 z-30 flex shadow-2xl shadow-black/50" : "hidden"
            } xl:static xl:z-auto xl:flex xl:shadow-none`}
          >
            <MemberList
              users={snap.users}
              onOpenProfile={openProfile}
              onClose={() => setMembersOpen(false)}
            />
          </div>
        </div>
      )}

      {shopOpen && (
        <ShopModal
          open={shopOpen}
          me={me}
          shop={snap.shop}
          onClose={() => setShopOpen(false)}
          onPurchase={onPurchase}
          onEquip={onEquip}
          onGift={(itemId) => setGiftItemId(itemId)}
        />
      )}

      {storefrontServer && (
        <StorefrontModal
          open
          server={storefrontServer}
          me={me}
          payouts={snap.payouts}
          onClose={() => setStorefrontServerId(null)}
          onMint={onMint}
          onPurchase={onStoreItem}
          onGift={(itemId) => setGiftItemId(itemId)}
        />
      )}

      <ServerConsole
        open={consoleOpen}
        server={activeServer}
        users={snap.users}
        me={me}
        messages={snap.messages}
        onClose={() => setConsoleOpen(false)}
        onUpdateGuard={onUpdateGuard}
        onResolveFlag={onResolveFlag}
        onRoles={onRoles}
        onScan={onScan}
      />

      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          me={me}
          shop={snap.shop}
          initialPage={settingsInitialPage}
          onClose={() => {
            setSettingsOpen(false);
            setSettingsInitialPage(undefined);
          }}
          onSave={onSaveProfile}
          onEquip={onEquip}
          onOpenShop={() => {
            setSettingsOpen(false);
            setShopOpen(true);
          }}
        />
      )}

      <CreateDialog
        open={createServerOpen}
        title="Create a server"
        description="Every server starts with a text channel and a voice channel you can rename."
        label="Server name"
        placeholder="Late Night Cafe"
        submitLabel="Create server"
        onClose={() => setCreateServerOpen(false)}
        onSubmit={(name) => onCreateServer(name)}
      />

      <CreateDialog
        open={createChannelOpen}
        title="Create a channel"
        description={`Added to ${activeServer.name}.`}
        label="Channel name"
        placeholder="design-lab"
        submitLabel="Create channel"
        withType
        onClose={() => setCreateChannelOpen(false)}
        onSubmit={(name, type) => onCreateChannel({ name, type })}
      />

      <JoinServerDialog
        open={joinServerOpen}
        onClose={() => setJoinServerOpen(false)}
        onJoin={onJoinServer}
      />

      {serverSettingsOpen && (
        <ServerSettings
          open
          server={activeServer}
          me={me}
          onClose={() => setServerSettingsOpen(false)}
          onRename={onRenameServer}
          onRotateInvite={onRotateInvite}
          onRenameChannel={onRenameChannel}
          onDeleteChannel={onDeleteChannel}
          onDeleteServer={onDeleteServer}
          onLeaveServer={onLeaveServer}
        />
      )}

      {giftItem && (
        <GiftDialog
          item={giftItem}
          users={snap.users}
          me={me}
          onClose={() => setGiftItemId(null)}
          onGift={onGift}
        />
      )}

      {popoutUser && isCompact ? (
        <ProfilePage
          user={popoutUser.user}
          isMe={popoutUser.user.id === me.id}
          onClose={() => setPopout(null)}
          onEditProfile={() => {
            setPopout(null);
            setSettingsInitialPage("profile");
            setSettingsOpen(true);
          }}
          onOpenShop={() => {
            setPopout(null);
            setShopOpen(true);
          }}
          onOpenStorefront={() => {
            setPopout(null);
            setStorefrontServerId(activeServer.id);
          }}
          onOpenSettings={() => {
            setPopout(null);
            setSettingsInitialPage(undefined);
            setSettingsOpen(true);
          }}
          onClearStatus={onClearStatus}
        />
      ) : popoutUser ? (
        <ProfilePopout
          user={popoutUser.user}
          rect={popoutUser.rect}
          isMe={popoutUser.user.id === me.id}
          onClose={() => setPopout(null)}
          onOpenShop={() => {
            setPopout(null);
            setShopOpen(true);
          }}
          onClearStatus={onClearStatus}
        />
      ) : null}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[320px] flex-col gap-2"
      >
        {toasts.map((entry) => (
          <div
            key={entry.id}
            className={`animate-pop pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-[var(--bg-float)] px-3 py-2.5 text-sm shadow-2xl shadow-black/50 ${
              entry.tone === "error" ? "border-[var(--red)]" : "border-[var(--accent)]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                entry.tone === "error" ? "bg-[var(--red)] text-white" : "bg-[var(--green)] text-white"
              }`}
            >
              <Icon name={entry.tone === "error" ? "close" : "check"} size={12} />
            </span>
            <span className="flex-1 text-[var(--text)]">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
