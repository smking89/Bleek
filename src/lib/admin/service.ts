import "server-only";

import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { adjustWallet } from "@astro/core/accounts";
import { astroDb } from "@astro/core/db";
import { setAnyAppStatus } from "@/lib/dev/apps";
import { AstroDataError } from "@astro/core/errors";
import { AstroLinkError, normalizeAccountHandle } from "@astro/core/links";
import { recordAudit, type StaffContext } from "./access";
import { AdminError } from "./errors";
import {
  ROLE_META,
  assignableRoles,
  can,
  isCasePriority,
  isCaseStatus,
  isStaffRole,
  roleRank,
  type CasePriority,
  type CaseStatus,
  type StaffRole,
} from "./roles";

/* ── Directory ──────────────────────────────────────────────────────── */

export type DirectoryUser = {
  id: string;
  handle: string;
  displayName: string;
  staffRole: StaffRole | null;
  staffTitle: string | null;
  status: "ACTIVE" | "SUSPENDED";
  suspendedReason: string | null;
  handleVerifiedAt: string | null;
  coins: number;
  lifetimeEarned: number;
  connections: number;
  createdAt: string;
  lastSeenAt: string | null;
};

export async function listDirectory(limit = 200): Promise<DirectoryUser[]> {
  const rows = await astroDb().user.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      handle: true,
      displayName: true,
      staffRole: true,
      staffTitle: true,
      status: true,
      suspendedReason: true,
      handleVerifiedAt: true,
      createdAt: true,
      lastSeenAt: true,
      wallet: { select: { coins: true, lifetimeEarned: true } },
      _count: { select: { connections: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    staffRole: row.staffRole,
    staffTitle: row.staffTitle,
    status: row.status,
    suspendedReason: row.suspendedReason,
    handleVerifiedAt: row.handleVerifiedAt?.toISOString() ?? null,
    coins: row.wallet?.coins ?? 0,
    lifetimeEarned: row.wallet?.lifetimeEarned ?? 0,
    connections: row._count.connections,
    createdAt: row.createdAt.toISOString(),
    lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
  }));
}

export type StaffRow = {
  id: string;
  handle: string;
  displayName: string;
  role: StaffRole;
  title: string | null;
  since: string | null;
  lastSeenAt: string | null;
};

export async function listStaff(): Promise<StaffRow[]> {
  const rows = await astroDb().user.findMany({
    where: { staffRole: { not: null } },
    select: {
      id: true,
      handle: true,
      displayName: true,
      staffRole: true,
      staffTitle: true,
      staffSince: true,
      lastSeenAt: true,
    },
  });

  return rows
    .filter((row): row is typeof row & { staffRole: StaffRole } => row.staffRole !== null)
    .map((row) => ({
      id: row.id,
      handle: row.handle,
      displayName: row.displayName,
      role: row.staffRole,
      title: row.staffTitle,
      since: row.staffSince?.toISOString() ?? null,
      lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
    }))
    .sort((a, b) => roleRank(b.role) - roleRank(a.role) || a.handle.localeCompare(b.handle));
}

/* ── Cases ──────────────────────────────────────────────────────────── */

export type CaseNoteRow = { id: string; authorHandle: string; body: string; createdAt: string };

export type CaseRow = {
  id: string;
  reference: string;
  subjectHandle: string;
  reporterHandle: string | null;
  reason: string;
  detail: string | null;
  channel: string | null;
  status: CaseStatus;
  priority: CasePriority;
  resolution: string | null;
  assignee: { handle: string; displayName: string } | null;
  notes: CaseNoteRow[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

const CASE_INCLUDE = {
  assignee: { select: { handle: true, displayName: true } },
  notes: {
    orderBy: { createdAt: "asc" },
    select: { id: true, authorHandle: true, body: true, createdAt: true },
  },
} satisfies Prisma.ModerationCaseInclude;

type CaseRecord = Prisma.ModerationCaseGetPayload<{ include: typeof CASE_INCLUDE }>;

function toCaseRow(row: CaseRecord): CaseRow {
  return {
    id: row.id,
    reference: row.reference,
    subjectHandle: row.subjectHandle,
    reporterHandle: row.reporterHandle,
    reason: row.reason,
    detail: row.detail,
    channel: row.channel,
    status: row.status,
    priority: row.priority,
    resolution: row.resolution,
    assignee: row.assignee ? { handle: row.assignee.handle, displayName: row.assignee.displayName } : null,
    notes: row.notes.map((note) => ({
      id: note.id,
      authorHandle: note.authorHandle,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}

export async function listCases(limit = 150): Promise<CaseRow[]> {
  const rows = await astroDb().moderationCase.findMany({
    take: limit,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    include: CASE_INCLUDE,
  });
  return rows.map(toCaseRow);
}

/* ── Audit ──────────────────────────────────────────────────────────── */

export type AuditRow = {
  id: string;
  actorHandle: string;
  actorRole: StaffRole | null;
  action: string;
  targetType: string;
  targetLabel: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export async function listAudit(limit = 200): Promise<AuditRow[]> {
  const rows = await astroDb().staffAudit.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      actorHandle: true,
      actorRole: true,
      action: true,
      targetType: true,
      targetLabel: true,
      summary: true,
      metadata: true,
      ip: true,
      createdAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    actorHandle: row.actorHandle,
    actorRole: row.actorRole,
    action: row.action,
    targetType: row.targetType,
    targetLabel: row.targetLabel,
    summary: row.summary,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    ip: row.ip,
    createdAt: row.createdAt.toISOString(),
  }));
}

/* ── Mutations ──────────────────────────────────────────────────────── */

async function findUser(handle: string) {
  let normalized: string;
  try {
    normalized = normalizeAccountHandle(handle);
  } catch (error) {
    if (error instanceof AstroLinkError) throw new AdminError(error.message, 422, "INVALID_HANDLE");
    throw error;
  }

  const user = await astroDb().user.findUnique({
    where: { handle: normalized },
    select: {
      id: true,
      handle: true,
      displayName: true,
      staffRole: true,
      staffSince: true,
      staffTitle: true,
      status: true,
    },
  });

  if (!user) throw new AdminError(`@${normalized} is not an ASTRO account.`, 404, "USER_NOT_FOUND");
  return user;
}

/**
 * Grants, changes or removes a staff role. A staff member can never edit their own
 * role, outranked targets are untouchable, and the final super admin is permanent.
 */
export async function setStaffRole(
  actor: StaffContext,
  handle: string,
  role: StaffRole | null,
  ip?: string | null,
): Promise<{ handle: string; role: StaffRole | null }> {
  if (!can(actor.role, "users.role")) {
    throw new AdminError("Your role cannot change staff assignments.", 403, "FORBIDDEN");
  }

  const target = await findUser(handle);

  if (target.id === actor.id) {
    throw new AdminError("You cannot change your own staff role.", 409, "SELF_ROLE");
  }
  if (role && target.staffRole === role) {
    throw new AdminError(`@${target.handle} already holds the ${ROLE_META[role].label} role.`, 409, "ROLE_UNCHANGED");
  }
  if (role && !assignableRoles(actor.role).includes(role)) {
    throw new AdminError(`A ${ROLE_META[actor.role].label} cannot grant the ${ROLE_META[role].label} role.`, 403, "ROLE_NOT_ASSIGNABLE");
  }
  if (target.staffRole && roleRank(actor.role) <= roleRank(target.staffRole)) {
    throw new AdminError(
      `@${target.handle} is a ${ROLE_META[target.staffRole].label}. Only a higher role can change that.`,
      403,
      "OUTRANKED",
    );
  }

  if (role === null && target.staffRole === "SUPER_ADMIN") {
    const supers = await astroDb().user.count({ where: { staffRole: "SUPER_ADMIN" } });
    if (supers <= 1) {
      throw new AdminError("The last super admin cannot be demoted. Promote a replacement first.", 409, "LAST_SUPER_ADMIN");
    }
  }

  const updated = await astroDb().user.update({
    where: { id: target.id },
    data: {
      staffRole: role,
      staffSince: role ? (target.staffSince ?? new Date()) : null,
      staffTitle: role ? (target.staffTitle ?? ROLE_META[role].label) : null,
    },
    select: { handle: true, staffRole: true },
  });

  await recordAudit(actor, {
    action: role ? "staff.role_granted" : "staff.role_removed",
    targetType: "user",
    targetId: target.id,
    targetLabel: `@${target.handle}`,
    summary: role
      ? `Granted ${ROLE_META[role].label} to @${target.handle}`
      : `Removed ${target.staffRole ? ROLE_META[target.staffRole].label : "staff"} role from @${target.handle}`,
    metadata: { from: target.staffRole, to: role },
    ip,
  });

  return { handle: updated.handle, role: updated.staffRole };
}

export async function setSuspension(
  actor: StaffContext,
  handle: string,
  input: { suspend: boolean; reason?: unknown },
  ip?: string | null,
): Promise<{ handle: string; status: "ACTIVE" | "SUSPENDED" }> {
  const target = await findUser(handle);

  if (target.id === actor.id) {
    throw new AdminError("You cannot suspend your own account.", 409, "SELF_SUSPEND");
  }
  if (target.staffRole && roleRank(actor.role) <= roleRank(target.staffRole)) {
    throw new AdminError(`Only a role above ${ROLE_META[target.staffRole].label} can suspend that account.`, 403, "OUTRANKED");
  }

  if (!input.suspend) {
    const restored = await astroDb().user.update({
      where: { id: target.id },
      data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
      select: { handle: true, status: true },
    });
    await recordAudit(actor, {
      action: "user.restored",
      targetType: "user",
      targetId: target.id,
      targetLabel: `@${target.handle}`,
      summary: `Restored @${target.handle}`,
      ip,
    });
    return restored;
  }

  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (reason.length < 3 || reason.length > 280) {
    throw new AdminError("Add a suspension reason of 3 to 280 characters.", 422, "REASON_REQUIRED");
  }

  const suspended = await astroDb().user.update({
    where: { id: target.id },
    data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: reason },
    select: { handle: true, status: true },
  });
  await recordAudit(actor, {
    action: "user.suspended",
    targetType: "user",
    targetId: target.id,
    targetLabel: `@${target.handle}`,
    summary: `Suspended @${target.handle}`,
    metadata: { reason },
    ip,
  });
  return suspended;
}

export async function moveCoins(
  actor: StaffContext,
  handle: string,
  input: { delta?: unknown; note?: unknown },
  ip?: string | null,
) {
  if (!can(actor.role, "users.wallet")) {
    throw new AdminError("Your role cannot move coins.", 403, "FORBIDDEN");
  }

  const delta = Number(input.delta);
  if (!Number.isInteger(delta) || delta === 0) {
    throw new AdminError("delta must be a non-zero whole number.", 422, "INVALID_DELTA");
  }
  if (Math.abs(delta) > 1_000_000) {
    throw new AdminError("Adjustments are limited to 1,000,000 coins.", 422, "DELTA_TOO_LARGE");
  }

  const target = await findUser(handle);
  const wallet = await adjustWallet(target.handle, delta);
  const note = typeof input.note === "string" ? input.note.trim().slice(0, 200) : "";

  await recordAudit(actor, {
    action: "wallet.adjusted",
    targetType: "wallet",
    targetId: target.id,
    targetLabel: `@${target.handle}`,
    summary: `${delta > 0 ? "Credited" : "Debited"} ${Math.abs(delta).toLocaleString()} coins ${delta > 0 ? "to" : "from"} @${target.handle}`,
    metadata: { delta, balance: wallet.coins, note: note || null },
    ip,
  });

  return { handle: target.handle, wallet };
}

export async function openCase(
  actor: StaffContext,
  input: { subjectHandle?: unknown; reason?: unknown; detail?: unknown; channel?: unknown; priority?: unknown },
  ip?: string | null,
): Promise<CaseRow> {
  const rawHandle = typeof input.subjectHandle === "string" ? input.subjectHandle : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  const detail = typeof input.detail === "string" ? input.detail.trim() : "";
  const channel = typeof input.channel === "string" ? input.channel.trim() : "";
  const priority: CasePriority = isCasePriority(input.priority) ? input.priority : "NORMAL";

  if (reason.length < 3 || reason.length > 160) {
    throw new AdminError("A case needs a reason of 3 to 160 characters.", 422, "REASON_REQUIRED");
  }
  if (detail.length > 2000) throw new AdminError("Detail is limited to 2,000 characters.", 422, "DETAIL_TOO_LONG");
  if (channel.length > 80) throw new AdminError("Channel is limited to 80 characters.", 422, "CHANNEL_TOO_LONG");

  const subject = await findUser(rawHandle);
  const db = astroDb();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const created = await db.moderationCase.create({
        data: {
          reference: `MC-${randomBytes(3).toString("hex").toUpperCase()}`,
          subjectId: subject.id,
          subjectHandle: subject.handle,
          reporterHandle: actor.handle,
          reason,
          detail: detail || null,
          channel: channel || null,
          priority,
        },
        include: CASE_INCLUDE,
      });

      await recordAudit(actor, {
        action: "case.opened",
        targetType: "case",
        targetId: created.id,
        targetLabel: created.reference,
        summary: `Opened ${created.reference} against @${subject.handle}: ${reason}`,
        metadata: { priority },
        ip,
      });

      return toCaseRow(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }

  throw new AdminError("Could not allocate a case reference. Try again.", 503, "REFERENCE_COLLISION");
}

export type CaseUpdate =
  | { action: "claim" }
  | { action: "assign"; handle?: unknown }
  | { action: "priority"; priority?: unknown }
  | { action: "status"; status?: unknown; resolution?: unknown }
  | { action: "note"; body?: unknown };

export async function updateCase(
  actor: StaffContext,
  caseId: string,
  input: CaseUpdate,
  ip?: string | null,
): Promise<CaseRow> {
  const db = astroDb();
  const existing = await db.moderationCase.findUnique({
    where: { id: caseId },
    select: { id: true, reference: true, subjectHandle: true, status: true, priority: true },
  });
  if (!existing) throw new AdminError("That case no longer exists.", 404, "CASE_NOT_FOUND");

  const data: Prisma.ModerationCaseUpdateInput = {};
  let action = "case.updated";
  let summary = `Updated ${existing.reference}`;
  let metadata: Record<string, unknown> = {};

  if (input.action === "claim") {
    if (!can(actor.role, "cases.write")) throw new AdminError("Your role cannot work cases.", 403, "FORBIDDEN");
    data.assignee = { connect: { id: actor.id } };
    if (existing.status === "OPEN") data.status = "INVESTIGATING";
    action = "case.claimed";
    summary = `Claimed ${existing.reference} (@${existing.subjectHandle})`;
  } else if (input.action === "assign") {
    if (!can(actor.role, "cases.assign")) {
      throw new AdminError("Your role cannot assign cases to other staff.", 403, "FORBIDDEN");
    }
    const handle = typeof input.handle === "string" ? input.handle.trim() : "";
    if (!handle) {
      data.assignee = { disconnect: true };
      action = "case.unassigned";
      summary = `Unassigned ${existing.reference}`;
    } else {
      const assignee = await findUser(handle);
      if (!assignee.staffRole) throw new AdminError(`@${assignee.handle} is not staff.`, 422, "NOT_STAFF");
      data.assignee = { connect: { id: assignee.id } };
      action = "case.assigned";
      summary = `Assigned ${existing.reference} to @${assignee.handle}`;
      metadata = { assignee: assignee.handle };
    }
  } else if (input.action === "priority") {
    if (!can(actor.role, "cases.write")) throw new AdminError("Your role cannot work cases.", 403, "FORBIDDEN");
    if (!isCasePriority(input.priority)) throw new AdminError("Unknown case priority.", 422, "INVALID_PRIORITY");
    data.priority = input.priority;
    action = "case.priority_changed";
    summary = `Set ${existing.reference} to ${input.priority.toLowerCase()} priority`;
    metadata = { from: existing.priority, to: input.priority };
  } else if (input.action === "status") {
    if (!can(actor.role, "cases.write")) throw new AdminError("Your role cannot work cases.", 403, "FORBIDDEN");
    if (!isCaseStatus(input.status)) throw new AdminError("Unknown case status.", 422, "INVALID_STATUS");

    const status = input.status;
    const closing = status === "RESOLVED" || status === "DISMISSED";
    const resolution = typeof input.resolution === "string" ? input.resolution.trim() : "";

    if (closing && (resolution.length < 3 || resolution.length > 500)) {
      throw new AdminError("Closing a case needs a resolution of 3 to 500 characters.", 422, "RESOLUTION_REQUIRED");
    }

    data.status = status;
    data.resolution = closing ? resolution : null;
    data.resolvedAt = closing ? new Date() : null;
    action = closing ? `case.${status.toLowerCase()}` : "case.reopened";
    summary = closing ? `${status === "RESOLVED" ? "Resolved" : "Dismissed"} ${existing.reference}` : `Reopened ${existing.reference}`;
    metadata = closing ? { resolution } : {};
  } else if (input.action === "note") {
    if (!can(actor.role, "cases.write")) throw new AdminError("Your role cannot work cases.", 403, "FORBIDDEN");
    const body = typeof input.body === "string" ? input.body.trim() : "";
    if (body.length < 1 || body.length > 2000) {
      throw new AdminError("Notes need 1 to 2,000 characters.", 422, "INVALID_NOTE");
    }

    await db.$transaction([
      db.caseNote.create({
        data: { caseId, authorId: actor.id, authorHandle: actor.handle, body },
      }),
      db.moderationCase.update({ where: { id: caseId }, data: { updatedAt: new Date() } }),
    ]);

    await recordAudit(actor, {
      action: "case.note_added",
      targetType: "case",
      targetId: caseId,
      targetLabel: existing.reference,
      summary: `Noted on ${existing.reference}`,
      metadata: { body },
      ip,
    });

    const fresh = await db.moderationCase.findUniqueOrThrow({ where: { id: caseId }, include: CASE_INCLUDE });
    return toCaseRow(fresh);
  } else {
    throw new AdminError("Unknown case action.", 422, "INVALID_ACTION");
  }

  const updated = await db.moderationCase.update({ where: { id: caseId }, data, include: CASE_INCLUDE });

  await recordAudit(actor, {
    action,
    targetType: "case",
    targetId: caseId,
    targetLabel: existing.reference,
    summary,
    metadata,
    ip,
  });

  return toCaseRow(updated);
}

/** Grants or removes the cyan verification check on an account handle. */
export async function setHandleVerification(
  actor: StaffContext,
  handle: string,
  verified: boolean,
  ip?: string | null,
): Promise<{ handle: string; verified: boolean; verifiedAt: string | null }> {
  if (!can(actor.role, "users.verify")) {
    throw new AdminError("Your role cannot verify handles.", 403, "FORBIDDEN");
  }

  const target = await findUser(handle);

  const updated = await astroDb().user.update({
    where: { id: target.id },
    data: { handleVerifiedAt: verified ? new Date() : null },
    select: { handle: true, handleVerifiedAt: true },
  });

  await recordAudit(actor, {
    action: verified ? "user.handle_verified" : "user.handle_unverified",
    targetType: "user",
    targetId: target.id,
    targetLabel: `@${target.handle}`,
    summary: `${verified ? "Verified" : "Removed verification from"} @${target.handle}`,
    ip,
  });

  return {
    handle: updated.handle,
    verified: Boolean(updated.handleVerifiedAt),
    verifiedAt: updated.handleVerifiedAt?.toISOString() ?? null,
  };
}

/** Revokes or restores any developer app from the staff console. */
export async function setDeveloperAppStatus(
  actor: StaffContext,
  appId: string,
  status: "ACTIVE" | "REVOKED",
  ip?: string | null,
) {
  if (!can(actor.role, "dev.revoke")) {
    throw new AdminError("Your role cannot revoke developer apps.", 403, "FORBIDDEN");
  }

  const app = await setAnyAppStatus(appId, status);

  await recordAudit(actor, {
    action: status === "REVOKED" ? "dev_app.revoked" : "dev_app.restored",
    targetType: "developer_app",
    targetId: app.id,
    targetLabel: app.name,
    summary: `${status === "REVOKED" ? "Revoked" : "Restored"} ${app.name} (${app.clientId})`,
    metadata: { clientId: app.clientId, scopes: app.scopes },
    ip,
  });

  return app;
}
