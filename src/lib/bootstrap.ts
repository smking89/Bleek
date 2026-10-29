import type { Server, Snapshot } from "./types";

/**
 * The chat store starts empty.
 *
 * Nothing here is invented: the store holds the signed-in account, one server
 * provisioned for them, and the structural defaults a server needs (a text
 * channel, a voice channel, an owner role and a member role). Members, messages,
 * storefronts, gifts, payouts and guard rules are all created by real use.
 */

/** The local chat identity. Its fields are filled from the ASTRO account on load. */
export const ME_ID = "u-me";

export const STARTER_SERVER_ID = "s-personal";
export const STARTER_CHANNEL_ID = "c-general";

export type Store = {
  users: Snapshot["users"];
  servers: Snapshot["servers"];
  messages: Snapshot["messages"];
  typing: Snapshot["typing"];
  gifts: Snapshot["gifts"];
  payouts: Snapshot["payouts"];
};

function starterServer(): Server {
  return {
    id: STARTER_SERVER_ID,
    // Named after the account that owns it the first time it loads.
    name: "",
    icon: "",
    color: "#4f46e5",
    channels: [
      { id: STARTER_CHANNEL_ID, name: "general", type: "text" },
      { id: "c-voice", name: "Voice", type: "voice" },
    ],
    roles: [
      {
        id: "r-owner",
        name: "Owner",
        color: "#f0b232",
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
      },
      {
        id: "r-member",
        name: "Member",
        color: "#b5bac1",
        permissions: ["view", "send", "react", "attach", "voice"],
        order: 1,
      },
    ],
    // Guard starts off with no rules; a server owner writes their own.
    guard: { enabled: false, sensitivity: "balanced", rules: [] },
    flagged: [],
  };
}

function joinedToday(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function buildStore(): Store {
  return {
    users: [
      {
        id: ME_ID,
        name: "",
        tag: "",
        status: "online",
        avatarFrom: "#4f46e5",
        avatarTo: "#06b6d4",
        banner: ["#4f46e5", "#0f172a"],
        bio: "",
        pronouns: "",
        roles: [],
        joined: joinedToday(),
        character: "comet",
        cosmetics: { decoration: null, effect: null, nameplate: null, theme: "blurple" },
        coins: 0,
        owned: [],
      },
    ],
    servers: [starterServer()],
    messages: [],
    typing: {},
    gifts: [],
    payouts: [],
  };
}
