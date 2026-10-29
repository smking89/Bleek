import "server-only";

import { astroDb } from "@/lib/astro/db";
import type { StaffRole } from "./roles";

export type TrendPoint = {
  day: string;
  signups: number;
  cases: number;
  requests: number;
  errors: number;
};

export type OverviewMetrics = {
  accounts: { total: number; suspended: number; staff: number; active24h: number; new7d: number; new30d: number };
  wallet: { coins: number; earned: number; spent: number; holders: number };
  cases: { open: number; investigating: number; urgent: number; resolved7d: number; avgResolutionHours: number | null };
  developers: { apps: number; active: number; requests24h: number; errors24h: number; errorRate: number };
  roles: Record<StaffRole, number>;
  trend: TrendPoint[];
};

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * One aggregate read for the console overview. Daily buckets come from Postgres
 * (`date_trunc`) because Prisma's groupBy cannot truncate a timestamp.
 */
export async function loadOverview(days = 30): Promise<OverviewMetrics> {
  const db = astroDb();
  const now = Date.now();
  const dayAgo = new Date(now - 86_400_000);
  const weekAgo = new Date(now - 7 * 86_400_000);
  const monthAgo = new Date(now - 30 * 86_400_000);
  const trendStart = startOfUtcDay(new Date(now - (days - 1) * 86_400_000));

  const [
    total,
    suspended,
    staff,
    active24h,
    new7d,
    new30d,
    walletTotals,
    holders,
    roleRows,
    openCases,
    investigating,
    urgent,
    resolved7d,
    resolvedRecent,
    apps,
    activeApps,
    requests24h,
    errors24h,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: "SUSPENDED" } }),
    db.user.count({ where: { staffRole: { not: null } } }),
    db.user.count({ where: { lastSeenAt: { gte: dayAgo } } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.count({ where: { createdAt: { gte: monthAgo } } }),
    db.accountWallet.aggregate({ _sum: { coins: true, lifetimeEarned: true, lifetimeSpent: true } }),
    db.accountWallet.count(),
    db.user.groupBy({ by: ["staffRole"], where: { staffRole: { not: null } }, _count: { _all: true } }),
    db.moderationCase.count({ where: { status: "OPEN" } }),
    db.moderationCase.count({ where: { status: "INVESTIGATING" } }),
    db.moderationCase.count({
      where: { status: { in: ["OPEN", "INVESTIGATING"] }, priority: "URGENT" },
    }),
    db.moderationCase.count({ where: { status: "RESOLVED", resolvedAt: { gte: weekAgo } } }),
    db.moderationCase.findMany({
      where: { status: "RESOLVED", resolvedAt: { gte: monthAgo } },
      select: { createdAt: true, resolvedAt: true },
      take: 500,
    }),
    db.developerApp.count(),
    db.developerApp.count({ where: { status: "ACTIVE" } }),
    db.apiRequest.count({ where: { createdAt: { gte: dayAgo } } }),
    db.apiRequest.count({ where: { createdAt: { gte: dayAgo }, status: { gte: 400 } } }),
  ]);

  const signupRows = await db.$queryRaw<{ day: Date; count: number }[]>`
    SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::int AS count
    FROM "users"
    WHERE "createdAt" >= ${trendStart}
    GROUP BY 1
    ORDER BY 1`;
  const caseRows = await db.$queryRaw<{ day: Date; count: number }[]>`
    SELECT date_trunc('day', "createdAt")::date AS day, COUNT(*)::int AS count
    FROM "moderation_cases"
    WHERE "createdAt" >= ${trendStart}
    GROUP BY 1
    ORDER BY 1`;
  const apiRows = await db.$queryRaw<{ day: Date; requests: number; errors: number }[]>`
    SELECT "day", SUM("requests")::int AS requests, SUM("errors")::int AS errors
    FROM "api_usage_daily"
    WHERE "day" >= ${trendStart}
    GROUP BY 1
    ORDER BY 1`;

  const signups = new Map(signupRows.map((row) => [dayKey(row.day), Number(row.count)]));
  const cases = new Map(caseRows.map((row) => [dayKey(row.day), Number(row.count)]));
  const api = new Map(
    apiRows.map((row) => [dayKey(row.day), { requests: Number(row.requests), errors: Number(row.errors) }]),
  );

  const trend: TrendPoint[] = Array.from({ length: days }, (_, index) => {
    const day = dayKey(new Date(trendStart.getTime() + index * 86_400_000));
    return {
      day,
      signups: signups.get(day) ?? 0,
      cases: cases.get(day) ?? 0,
      requests: api.get(day)?.requests ?? 0,
      errors: api.get(day)?.errors ?? 0,
    };
  });

  const roles: Record<StaffRole, number> = { MODERATOR: 0, ADMIN: 0, SUPER_ADMIN: 0 };
  for (const row of roleRows) {
    if (row.staffRole) roles[row.staffRole] = row._count._all;
  }

  const resolutionSamples = resolvedRecent
    .filter((row) => row.resolvedAt)
    .map((row) => (row.resolvedAt!.getTime() - row.createdAt.getTime()) / 3_600_000);
  const avgResolutionHours =
    resolutionSamples.length > 0
      ? Math.round((resolutionSamples.reduce((sum, value) => sum + value, 0) / resolutionSamples.length) * 10) / 10
      : null;

  return {
    accounts: { total, suspended, staff, active24h, new7d, new30d },
    wallet: {
      coins: walletTotals._sum.coins ?? 0,
      earned: walletTotals._sum.lifetimeEarned ?? 0,
      spent: walletTotals._sum.lifetimeSpent ?? 0,
      holders,
    },
    cases: {
      open: openCases,
      investigating,
      urgent,
      resolved7d,
      avgResolutionHours,
    },
    developers: {
      apps,
      active: activeApps,
      requests24h,
      errors24h,
      errorRate: requests24h > 0 ? (errors24h / requests24h) * 100 : 0,
    },
    roles,
    trend,
  };
}
