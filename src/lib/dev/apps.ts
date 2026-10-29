import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { astroDb } from "@astro/core/db";
import { AstroDataError } from "@astro/core/errors";
import { DEFAULT_SCOPES, keyPrefix, lastFour, normalizeScopes, type ScopeKey } from "./keys";

export const APP_SELECT = {
  id: true,
  name: true,
  description: true,
  clientId: true,
  keyPrefix: true,
  lastFour: true,
  scopes: true,
  environment: true,
  status: true,
  requestCount: true,
  errorCount: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
} satisfies Prisma.DeveloperAppSelect;

export type DevApp = Prisma.DeveloperAppGetPayload<{ select: typeof APP_SELECT }>;

const ENVIRONMENTS = ["DEVELOPMENT", "PRODUCTION"] as const;
type Environment = (typeof ENVIRONMENTS)[number];

const NAME_MAX = 48;
const DESCRIPTION_MAX = 240;

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function cleanText(value: unknown, field: string, max: number, required: boolean): string | null {
  if (value === null || value === undefined || value === "") {
    if (required) throw new AstroDataError(`${field} is required.`, 422, "INVALID_APP");
    return null;
  }
  if (typeof value !== "string") throw new AstroDataError(`${field} must be text.`, 422, "INVALID_APP");

  const trimmed = value.trim();
  if (required && trimmed.length < 2) {
    throw new AstroDataError(`${field} needs at least 2 characters.`, 422, "INVALID_APP");
  }
  if (trimmed.length > max) {
    throw new AstroDataError(`${field} is limited to ${max} characters.`, 422, "INVALID_APP");
  }
  return trimmed;
}

function generateClientId(): string {
  return `astro_app_${randomBytes(6).toString("hex")}`;
}

function generateSecret(): string {
  return `astro_sk_${randomBytes(24).toString("base64url")}`;
}

/** Only the hash is stored; the plaintext secret exists in the response exactly once. */
function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function scopesOrDefault(value: unknown): ScopeKey[] {
  const scopes = normalizeScopes(value);
  return scopes.length > 0 ? scopes : [...DEFAULT_SCOPES];
}

export async function listAppsForOwner(ownerId: string): Promise<DevApp[]> {
  return astroDb().developerApp.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: APP_SELECT,
  });
}

export type AdminAppRow = DevApp & {
  owner: { handle: string; displayName: string; status: "ACTIVE" | "SUSPENDED" };
};

export async function listAllApps(limit = 200): Promise<AdminAppRow[]> {
  return astroDb().developerApp.findMany({
    take: limit,
    orderBy: [{ createdAt: "desc" }],
    select: {
      ...APP_SELECT,
      owner: { select: { handle: true, displayName: true, status: true } },
    },
  });
}

/** Staff-side status change; ownership is enforced by the caller's capability. */
export async function setAnyAppStatus(appId: string, status: "ACTIVE" | "REVOKED"): Promise<DevApp> {
  const existing = await astroDb().developerApp.findUnique({ where: { id: appId }, select: { id: true } });
  if (!existing) throw new AstroDataError("That developer app does not exist.", 404, "APP_NOT_FOUND");

  return astroDb().developerApp.update({
    where: { id: appId },
    data: { status, revokedAt: status === "REVOKED" ? new Date() : null },
    select: APP_SELECT,
  });
}

export async function createApp(
  ownerId: string,
  input: { name?: unknown; description?: unknown; environment?: unknown; scopes?: unknown; redirectUri?: unknown },
): Promise<{ app: DevApp; secret: string }> {
  const name = cleanText(input.name, "App name", NAME_MAX, true) as string;
  const description = cleanText(input.description, "Description", DESCRIPTION_MAX, false);
  const environment: Environment = input.environment === "PRODUCTION" ? "PRODUCTION" : "DEVELOPMENT";
  const redirectUri = cleanText(input.redirectUri, "Redirect URI", 300, false);
  const scopes = scopesOrDefault(input.scopes);

  const secret = generateSecret();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const app = await astroDb().developerApp.create({
        data: {
          ownerId,
          name,
          description,
          environment,
          redirectUri,
          scopes,
          clientId: generateClientId(),
          keyHash: hashSecret(secret),
          keyPrefix: keyPrefix(secret),
          lastFour: lastFour(secret),
        },
        select: APP_SELECT,
      });
      return { app, secret };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }

  throw new AstroDataError("Could not allocate a unique client id. Try again.", 503, "CLIENT_ID_COLLISION");
}

async function findOwnedApp(ownerId: string, appId: string) {
  const app = await astroDb().developerApp.findFirst({
    where: { id: appId, ownerId },
    select: { id: true, name: true, status: true, scopes: true },
  });
  if (!app) throw new AstroDataError("That developer app does not exist.", 404, "APP_NOT_FOUND");
  return app;
}

export async function rotateAppSecret(ownerId: string, appId: string): Promise<{ app: DevApp; secret: string }> {
  await findOwnedApp(ownerId, appId);

  const secret = generateSecret();
  const app = await astroDb().developerApp.update({
    where: { id: appId },
    data: { keyHash: hashSecret(secret), keyPrefix: keyPrefix(secret), lastFour: lastFour(secret) },
    select: APP_SELECT,
  });

  return { app, secret };
}

export async function updateApp(
  ownerId: string,
  appId: string,
  input: { name?: unknown; description?: unknown; scopes?: unknown; environment?: unknown; redirectUri?: unknown },
): Promise<DevApp> {
  await findOwnedApp(ownerId, appId);

  const data: Prisma.DeveloperAppUpdateInput = {};

  if (input.name !== undefined) data.name = cleanText(input.name, "App name", NAME_MAX, true) as string;
  if (input.description !== undefined) data.description = cleanText(input.description, "Description", DESCRIPTION_MAX, false);
  if (input.redirectUri !== undefined) data.redirectUri = cleanText(input.redirectUri, "Redirect URI", 300, false);
  if (input.scopes !== undefined) data.scopes = scopesOrDefault(input.scopes);
  if (input.environment !== undefined) {
    if (!(ENVIRONMENTS as readonly unknown[]).includes(input.environment)) {
      throw new AstroDataError("environment must be DEVELOPMENT or PRODUCTION.", 422, "INVALID_APP");
    }
    data.environment = input.environment as Environment;
  }

  return astroDb().developerApp.update({ where: { id: appId }, data, select: APP_SELECT });
}

export async function setAppStatus(
  ownerId: string,
  appId: string,
  status: "ACTIVE" | "REVOKED",
): Promise<DevApp> {
  await findOwnedApp(ownerId, appId);

  return astroDb().developerApp.update({
    where: { id: appId },
    data: { status, revokedAt: status === "REVOKED" ? new Date() : null },
    select: APP_SELECT,
  });
}

export async function deleteApp(ownerId: string, appId: string): Promise<{ id: string }> {
  const result = await astroDb().developerApp.deleteMany({ where: { id: appId, ownerId } });
  if (result.count === 0) throw new AstroDataError("That developer app does not exist.", 404, "APP_NOT_FOUND");
  return { id: appId };
}

/* ── Usage ──────────────────────────────────────────────────────────── */

export type UsagePoint = { day: string; requests: number; errors: number };

/** Fills every day in the window, so the portal chart has no gaps. */
export async function usageForApps(appIds: string[], days = 14): Promise<Record<string, UsagePoint[]>> {
  if (appIds.length === 0) return {};

  const since = startOfUtcDay(new Date(Date.now() - (days - 1) * 86_400_000));
  const rows = await astroDb().apiUsageDaily.findMany({
    where: { appId: { in: appIds }, day: { gte: since } },
    select: { appId: true, day: true, requests: true, errors: true },
  });

  const byKey = new Map(rows.map((row) => [`${row.appId}|${dayKey(row.day)}`, row]));

  return Object.fromEntries(
    appIds.map((appId) => [
      appId,
      Array.from({ length: days }, (_, index) => {
        const date = new Date(since.getTime() + index * 86_400_000);
        const key = dayKey(date);
        const row = byKey.get(`${appId}|${key}`);
        return { day: key, requests: row?.requests ?? 0, errors: row?.errors ?? 0 };
      }),
    ]),
  );
}

export type RequestRow = {
  id: string;
  appId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  createdAt: Date;
};

export async function recentRequests(appIds: string[], take = 12): Promise<RequestRow[]> {
  if (appIds.length === 0) return [];

  return astroDb().apiRequest.findMany({
    where: { appId: { in: appIds } },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, appId: true, method: true, path: true, status: true, durationMs: true, createdAt: true },
  });
}

export async function loadConsole(ownerId: string) {
  const apps = await listAppsForOwner(ownerId);
  const ids = apps.map((app) => app.id);
  const [usage, requests] = await Promise.all([usageForApps(ids, 14), recentRequests(ids, 12)]);
  return { apps, usage, requests };
}

/* ── Authentication ─────────────────────────────────────────────────── */

export type ApiKeyContext = {
  app: DevApp;
  owner: { id: string; handle: string; displayName: string; status: "ACTIVE" | "SUSPENDED" };
};

/**
 * Resolves `Authorization: Bearer astro_sk_…` to an active app and its owner.
 * Missing, malformed, unknown and revoked keys all fail as INVALID_KEY except the
 * missing-header case, so the response never confirms which keys exist.
 */
export async function authenticateApiKey(request: Request): Promise<ApiKeyContext> {
  const header = request.headers.get("authorization");
  if (!header) throw new AstroDataError("Send the key as Authorization: Bearer <key>.", 401, "MISSING_KEY");

  const [scheme, raw] = header.split(" ");
  const secret = raw?.trim() ?? "";
  if (scheme?.toLowerCase() !== "bearer" || !secret.startsWith("astro_sk_")) {
    throw new AstroDataError("That API key is not valid.", 401, "INVALID_KEY");
  }

  const app = await astroDb().developerApp.findUnique({
    where: { keyHash: hashSecret(secret) },
    select: { ...APP_SELECT, owner: { select: { id: true, handle: true, displayName: true, status: true } } },
  });

  if (!app || app.status !== "ACTIVE") {
    throw new AstroDataError("That API key is not valid.", 401, "INVALID_KEY");
  }

  const { owner, ...rest } = app;
  if (owner.status === "SUSPENDED") {
    throw new AstroDataError("The account that owns this key is suspended.", 403, "ACCOUNT_SUSPENDED");
  }

  return { app: rest, owner };
}

/** Today's counted requests, the basis for the per-key quota. */
export async function todayUsage(appId: string): Promise<number> {
  const row = await astroDb().apiUsageDaily.findUnique({
    where: { appId_day: { appId, day: startOfUtcDay() } },
    select: { requests: true },
  });
  return row?.requests ?? 0;
}

/**
 * One row in the rolling request log, one increment on today's aggregate, and the
 * app's lifetime counters. The 30-day prune runs on a small random sample.
 */
export async function recordApiRequest(input: {
  appId: string;
  request: Request;
  status: number;
  durationMs: number;
}): Promise<void> {
  const db = astroDb();
  const day = startOfUtcDay();
  const failed = input.status >= 400;
  const path = new URL(input.request.url).pathname;
  const ip = input.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  await db.$transaction([
    db.apiRequest.create({
      data: {
        appId: input.appId,
        method: input.request.method,
        path,
        status: input.status,
        durationMs: input.durationMs,
        ip,
      },
    }),
    db.apiUsageDaily.upsert({
      where: { appId_day: { appId: input.appId, day } },
      create: { appId: input.appId, day, requests: 1, errors: failed ? 1 : 0 },
      update: { requests: { increment: 1 }, ...(failed ? { errors: { increment: 1 } } : {}) },
    }),
    db.developerApp.update({
      where: { id: input.appId },
      data: {
        requestCount: { increment: 1 },
        ...(failed ? { errorCount: { increment: 1 } } : {}),
        lastUsedAt: new Date(),
      },
    }),
  ]);

  if (Math.random() < 0.02) {
    try {
      await db.apiRequest.deleteMany({
        where: { appId: input.appId, createdAt: { lt: new Date(Date.now() - 30 * 86_400_000) } },
      });
    } catch (error) {
      console.error("[dev] request prune failed", error);
    }
  }
}
