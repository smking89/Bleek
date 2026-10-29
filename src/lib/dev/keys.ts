/**
 * Developer platform vocabulary, shared by the portal UI and the `/api/v1` guards.
 * Client-safe: no Prisma, no Node crypto.
 */

export const API_SCOPES = [
  {
    key: "profile:read",
    label: "Read profile",
    description: "Display name, handle, headline, accent colour and creation date.",
  },
  {
    key: "connections:read",
    label: "Read connections",
    description: "The Bleek, Koba.games and SnagChat chips linked to the account.",
  },
  {
    key: "wallet:read",
    label: "Read wallet",
    description: "Shared coin balance plus lifetime earned and spent totals.",
  },
  {
    key: "wallet:write",
    label: "Move coins",
    description: "Debit or credit the wallet that owns the key. Cannot touch other accounts.",
  },
] as const;

export type ScopeKey = (typeof API_SCOPES)[number]["key"];

export const ALL_SCOPES: ScopeKey[] = API_SCOPES.map((scope) => scope.key);

export const DEFAULT_SCOPES: ScopeKey[] = ["profile:read", "connections:read", "wallet:read"];

/** Hard daily ceiling per key. Counted from `api_usage_daily`, so it survives restarts. */
export const DAILY_QUOTA = 10_000;

export function isScopeKey(value: unknown): value is ScopeKey {
  return typeof value === "string" && (ALL_SCOPES as string[]).includes(value);
}

/** Keeps only known scopes, de-duplicated and in catalogue order. */
export function normalizeScopes(input: unknown): ScopeKey[] {
  const given = Array.isArray(input) ? input.filter(isScopeKey) : [];
  return ALL_SCOPES.filter((scope) => given.includes(scope));
}

export function scopeLabel(scope: ScopeKey): string {
  return API_SCOPES.find((entry) => entry.key === scope)?.label ?? scope;
}

/** Display form for a stored key: prefix stays visible, the middle is redacted. */
export function maskSecret(prefix: string, lastFour: string): string {
  return `${prefix}••••••••${lastFour}`;
}

export function keyPrefix(secret: string): string {
  return secret.slice(0, 13);
}

export function lastFour(secret: string): string {
  return secret.slice(-4);
}
