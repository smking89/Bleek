import type { ScopeKey } from "./keys";

/** Single source of truth for the developer docs and the portal's endpoint list. */
export const API_BASE_URL = "/api/v1";
export const API_VERSION = "2026-10-29";

export type DocumentedEndpoint = {
  method: "GET" | "POST";
  path: string;
  scope: ScopeKey;
  summary: string;
  request?: string;
  response: string;
};

export const DOC_ENDPOINTS: DocumentedEndpoint[] = [
  {
    method: "GET",
    path: "/api/v1/me",
    scope: "profile:read",
    summary: "The account behind the key, plus the app that is calling.",
    response: `{
  "account": {
    "handle": "koba",
    "displayName": "Koba",
    "headline": "building small games",
    "accentColor": "#5865f2",
    "createdAt": "2026-10-29T05:02:11.000Z"
  },
  "app": { "clientId": "astro_app_5f31c2a90b41", "name": "Koba Launcher", "environment": "DEVELOPMENT" }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/connections",
    scope: "connections:read",
    summary: "Every profile chip in display order, with its resolved deep link.",
    response: `{
  "connections": [
    { "platform": "BEEK", "handle": "koba", "url": "https://bleek.app/@koba", "primary": true, "verified": false },
    { "platform": "KOBA_GAMES", "handle": "koba.games", "url": "https://koba.games/@koba.games", "primary": false, "verified": false }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/v1/wallet",
    scope: "wallet:read",
    summary: "The shared ASTRO coin balance and its lifetime counters.",
    response: `{
  "wallet": { "coins": 250, "lifetimeEarned": 250, "lifetimeSpent": 0, "version": 0 }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/wallet/adjust",
    scope: "wallet:write",
    summary: "Moves coins in the key owner's wallet. Negative deltas debit.",
    request: `{ "delta": -25 }`,
    response: `{
  "delta": -25,
  "wallet": { "coins": 225, "lifetimeEarned": 250, "lifetimeSpent": 25, "version": 1 }
}`,
  },
];

export const DOC_ERRORS = [
  { status: "401", code: "MISSING_KEY", meaning: "No Authorization: Bearer header was sent." },
  { status: "401", code: "INVALID_KEY", meaning: "The key is unknown, revoked, or was rotated." },
  { status: "403", code: "MISSING_SCOPE", meaning: "The key does not carry the scope this route needs." },
  { status: "409", code: "INSUFFICIENT_FUNDS", meaning: "A debit would push the wallet below zero." },
  { status: "422", code: "INVALID_DELTA", meaning: "delta must be a non-zero whole number." },
  { status: "429", code: "QUOTA_EXCEEDED", meaning: "The key hit its 10,000 request daily quota." },
] as const;

export const QUICKSTART_CURL = `curl https://astro.app/api/v1/me \\
  -H "Authorization: Bearer astro_sk_live_…"`;
