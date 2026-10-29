/**
 * Staff role model and capability matrix, shared by the server guards and the
 * console UI. Client-safe: this module never imports Prisma or Node built-ins.
 *
 * Roles are strictly ranked — SUPER_ADMIN implies every ADMIN capability, and
 * ADMIN implies every MODERATOR capability. Individual capabilities are still
 * checked explicitly so a future role can hold an unusual subset.
 */

export const STAFF_ROLES = ["MODERATOR", "ADMIN", "SUPER_ADMIN"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type RoleMeta = {
  label: string;
  badge: string;
  blurb: string;
  rank: number;
  /** Border + text classes for the border-only role tag. */
  tone: string;
  dot: string;
};

export const ROLE_META: Record<StaffRole, RoleMeta> = {
  MODERATOR: {
    label: "Moderator",
    badge: "MOD",
    blurb: "Triage reports, suspend accounts and read the audit trail.",
    rank: 1,
    tone: "border-[#64748B]/45 text-[#CBD5E1]",
    dot: "bg-[#94A3B8]",
  },
  ADMIN: {
    label: "Admin",
    badge: "ADM",
    blurb: "Moderator powers plus wallets, role changes and developer apps.",
    rank: 2,
    tone: "border-[#4F46E5]/60 text-[#A5B4FC]",
    dot: "bg-[#818CF8]",
  },
  SUPER_ADMIN: {
    label: "Super admin",
    badge: "SUP",
    blurb: "Unrestricted access, including who wears a staff badge.",
    rank: 3,
    tone: "border-[#06B6D4]/55 text-[#67E8F9]",
    dot: "bg-[#22D3EE]",
  },
};

export const CAPABILITIES = [
  "admin.view",
  "users.read",
  "users.suspend",
  "users.wallet",
  "users.role",
  "users.verify",
  "cases.read",
  "cases.write",
  "cases.assign",
  "dev.read",
  "dev.revoke",
  "staff.manage",
  "audit.read",
  "system.manage",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  "admin.view": "Open the console",
  "users.read": "Read the account directory",
  "users.suspend": "Suspend and restore accounts",
  "users.wallet": "Move coins in a wallet",
  "users.role": "Change a member's staff role",
  "users.verify": "Verify member handles",
  "cases.read": "Read the moderation queue",
  "cases.write": "Work cases, add notes, resolve",
  "cases.assign": "Assign cases to another staff member",
  "dev.read": "Read every developer app",
  "dev.revoke": "Revoke developer apps",
  "staff.manage": "Grant and revoke staff roles",
  "audit.read": "Read the staff audit log",
  "system.manage": "Manage platform-wide settings",
};

const MODERATOR_GRANTS: readonly Capability[] = [
  "admin.view",
  "users.read",
  "users.suspend",
  "cases.read",
  "cases.write",
  "audit.read",
];

const ADMIN_GRANTS: readonly Capability[] = [
  ...MODERATOR_GRANTS,
  "users.wallet",
  "users.role",
  "users.verify",
  "cases.assign",
  "dev.read",
  "dev.revoke",
];

const SUPER_ADMIN_GRANTS: readonly Capability[] = [...ADMIN_GRANTS, "staff.manage", "system.manage"];

const GRANTS: Record<StaffRole, readonly Capability[]> = {
  MODERATOR: MODERATOR_GRANTS,
  ADMIN: ADMIN_GRANTS,
  SUPER_ADMIN: SUPER_ADMIN_GRANTS,
};

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value);
}

export function can(role: StaffRole | null | undefined, capability: Capability): boolean {
  return role ? GRANTS[role].includes(capability) : false;
}

export function capabilitiesFor(role: StaffRole | null | undefined): Capability[] {
  return role ? [...GRANTS[role]] : [];
}

export function roleRank(role: StaffRole | null | undefined): number {
  return role ? ROLE_META[role].rank : 0;
}

/**
 * Roles `actor` may hand out. Super admins can mint anything; admins can only
 * recruit moderators; moderators cannot touch the roster at all.
 */
export function assignableRoles(actor: StaffRole | null | undefined): StaffRole[] {
  if (actor === "SUPER_ADMIN") return [...STAFF_ROLES];
  if (actor === "ADMIN") return ["MODERATOR"];
  return [];
}

/** Roles at or above `actor`, which the actor may not suspend. */
export function outranks(actor: StaffRole, target: StaffRole | null | undefined): boolean {
  return roleRank(actor) > roleRank(target);
}

/* ── Console vocabulary ─────────────────────────────────────────────── */

export const CASE_STATUSES = ["OPEN", "INVESTIGATING", "RESOLVED", "DISMISSED"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];

export const CASE_STATUS_META: Record<CaseStatus, { label: string; tone: string; dot: string }> = {
  OPEN: { label: "Open", tone: "border-[#F0B232]/45 text-[#F5D08A]", dot: "bg-[#F0B232]" },
  INVESTIGATING: { label: "Investigating", tone: "border-[#4F46E5]/55 text-[#A5B4FC]", dot: "bg-[#818CF8]" },
  RESOLVED: { label: "Resolved", tone: "border-[#23A55A]/45 text-[#8BE0AD]", dot: "bg-[#23A55A]" },
  DISMISSED: { label: "Dismissed", tone: "border-[#64748B]/45 text-[#94A3B8]", dot: "bg-[#64748B]" },
};

export const CASE_PRIORITY_META: Record<CasePriority, { label: string; tone: string; weight: number }> = {
  LOW: { label: "Low", tone: "border-[#64748B]/45 text-[#94A3B8]", weight: 1 },
  NORMAL: { label: "Normal", tone: "border-[#64748B]/45 text-[#CBD5E1]", weight: 2 },
  HIGH: { label: "High", tone: "border-[#F0B232]/45 text-[#F5D08A]", weight: 3 },
  URGENT: { label: "Urgent", tone: "border-[#EF4444]/50 text-[#FCA5A5]", weight: 4 },
};

export function isCaseStatus(value: unknown): value is CaseStatus {
  return typeof value === "string" && (CASE_STATUSES as readonly string[]).includes(value);
}

export function isCasePriority(value: unknown): value is CasePriority {
  return typeof value === "string" && (CASE_PRIORITIES as readonly string[]).includes(value);
}
