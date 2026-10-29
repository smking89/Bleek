import type { ReactNode } from "react";
import {
  CASE_PRIORITY_META,
  CASE_STATUS_META,
  ROLE_META,
  type CasePriority,
  type CaseStatus,
  type StaffRole,
} from "@/lib/admin/roles";

export const PANEL = "rounded-xl border border-white/[0.08] bg-[#0B0C0E]";

export const INPUT =
  "w-full rounded-lg border border-white/10 bg-[#111318] px-3 py-2 text-[13px] text-[#F8FAFC] outline-none transition-colors placeholder:text-[#5B6675] focus-visible:border-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-50";

export const BUTTON_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#4F46E5] px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:bg-[#4F46E5]/35 disabled:text-white/50";

export const BUTTON_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 text-[12px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`${PANEL} ${className}`}>{children}</section>;
}

export function PanelHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
      <div>
        <h2 className="text-[13px] font-semibold text-[#F8FAFC]">{title}</h2>
        {hint ? <p className="mt-0.5 text-[11px] leading-4 text-[#6E7C93]">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E7C93]">{children}</p>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "cyan" | "indigo" | "warn" | "danger";
}) {
  const valueTone =
    tone === "cyan"
      ? "text-[#67E8F9]"
      : tone === "indigo"
        ? "text-[#A5B4FC]"
        : tone === "warn"
          ? "text-[#F5D08A]"
          : tone === "danger"
            ? "text-[#FCA5A5]"
            : "text-[#F8FAFC]";

  return (
    <div className={`${PANEL} px-4 py-3.5`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6E7C93]">{label}</p>
      <p className={`mt-2 text-[24px] font-semibold leading-none tabular-nums ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-2 text-[11px] leading-4 text-[#94A3B8]">{hint}</p> : null}
    </div>
  );
}

export function RoleBadge({ role, short = false }: { role: StaffRole | null; short?: boolean }) {
  if (!role) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6E7C93]">
        Member
      </span>
    );
  }

  const meta = ROLE_META[role];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${meta.tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {short ? meta.badge : meta.label}
    </span>
  );
}

export function CaseStatusTag({ status }: { status: CaseStatus }) {
  const meta = CASE_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${meta.tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}

export function CasePriorityTag({ priority }: { priority: CasePriority }) {
  const meta = CASE_PRIORITY_META[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}

export function AccountStatusTag({ status }: { status: "ACTIVE" | "SUSPENDED" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
        status === "ACTIVE"
          ? "border-[#23A55A]/35 text-[#8BE0AD]"
          : "border-[#EF4444]/45 text-[#FCA5A5]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "ACTIVE" ? "bg-[#23A55A]" : "bg-[#EF4444]"}`}
        aria-hidden
      />
      {status === "ACTIVE" ? "Active" : "Suspended"}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#111318] text-lg text-[#4F46E5]">
        ∅
      </span>
      <p className="mt-3 text-[13px] font-semibold text-[#F8FAFC]">{title}</p>
      <p className="mt-1 max-w-sm text-[12px] leading-5 text-[#94A3B8]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-medium text-[#CBD5E1]">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] leading-4 text-[#6E7C93]">{hint}</p> : null}
    </div>
  );
}

/** Tiny server-safe bar chart for KPI cards and app rows. */
export function Sparkline({ values, tone = "indigo" }: { values: number[]; tone?: "indigo" | "cyan" }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-7 items-end gap-[2px]" aria-hidden>
      {values.map((value, index) => (
        <span
          key={index}
          style={{ height: `${Math.max(6, Math.round((value / max) * 100))}%` }}
          className={`min-w-[2px] flex-1 rounded-[1px] ${
            tone === "cyan" ? "bg-[#06B6D4]/70" : "bg-[#4F46E5]/80"
          }`}
        />
      ))}
    </div>
  );
}
