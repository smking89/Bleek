import "server-only";

import { Prisma } from "@prisma/client";
import { currentAccount } from "@/lib/astro/auth";
import { astroDb } from "@/lib/astro/db";
import { AstroDataError } from "@/lib/astro/errors";
import { AdminError } from "./errors";
import { can, type Capability, type StaffRole } from "./roles";

export type StaffContext = {
  id: string;
  handle: string;
  displayName: string;
  role: StaffRole;
  title: string | null;
  since: Date | null;
};

/** The signed-in account as staff, or null when it is not suspended staff. */
export async function staffContext(): Promise<StaffContext | null> {
  let account: Awaited<ReturnType<typeof currentAccount>>;
  try {
    account = await currentAccount();
  } catch (error) {
    if (error instanceof AstroDataError) return null;
    throw error;
  }

  if (!account?.staffRole || account.status === "SUSPENDED") return null;

  return {
    id: account.id,
    handle: account.handle,
    displayName: account.displayName,
    role: account.staffRole,
    title: account.staffTitle,
    since: account.staffSince,
  };
}

/** Throws instead of returning null so route handlers cannot forget the check. */
export async function requireStaff(capability?: Capability): Promise<StaffContext> {
  const staff = await staffContext();
  if (!staff) {
    throw new AdminError("Sign in with an ASTRO staff account to use the console.", 403, "STAFF_REQUIRED");
  }
  if (capability && !can(staff.role, capability)) {
    const label = capability.replace(/[.:]/g, " ");
    throw new AdminError(`Your ${staff.role} role does not grant ${label}.`, 403, "FORBIDDEN");
  }
  return staff;
}

export function staffErrorResponse(error: unknown): Response {
  if (error instanceof AdminError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof AstroDataError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return Response.json({ error: "That record no longer exists.", code: "NOT_FOUND" }, { status: 404 });
  }

  console.error("[admin] unexpected failure", error);
  return Response.json({ error: "The console could not complete that action.", code: "INTERNAL" }, { status: 500 });
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

type AuditEntry = {
  action: string;
  targetType: string;
  targetId?: string | null;
  targetLabel?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

/**
 * Writes one row to the append-only staff log. A failed audit write is logged but
 * never rolls back the action it describes — the action already happened.
 */
export async function recordAudit(actor: StaffContext, entry: AuditEntry): Promise<void> {
  try {
    await astroDb().staffAudit.create({
      data: {
        actorId: actor.id,
        actorHandle: actor.handle,
        actorRole: actor.role,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        targetLabel: entry.targetLabel ?? null,
        summary: entry.summary,
        metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
        ip: entry.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[admin] audit write failed", error);
  }
}
