"use client";

import { useMemo, useState } from "react";
import type { AuditRow } from "@/lib/admin/service";
import { EmptyState, INPUT, Panel } from "./ui";
import { RoleBadge } from "./ui";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
}

function actionTone(action: string): string {
  if (action.startsWith("user.suspend") || action.startsWith("dev_app.revoke")) {
    return "border-[#EF4444]/45 text-[#FCA5A5]";
  }
  if (action.startsWith("wallet.") || action.startsWith("staff.role")) {
    return "border-[#06B6D4]/45 text-[#67E8F9]";
  }
  if (action.startsWith("case.")) return "border-[#4F46E5]/55 text-[#A5B4FC]";
  return "border-white/12 text-[#CBD5E1]";
}

export function AuditLog({ entries }: { entries: AuditRow[] }) {
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");

  const actions = useMemo(() => Array.from(new Set(entries.map((entry) => entry.action))).sort(), [entries]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^@/, "");
    return entries.filter((entry) => {
      if (action !== "all" && entry.action !== action) return false;
      if (!needle) return true;
      return (
        entry.actorHandle.includes(needle) ||
        entry.summary.toLowerCase().includes(needle) ||
        (entry.targetLabel?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [entries, query, action]);

  const actors = new Set(entries.map((entry) => entry.actorHandle)).size;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#F8FAFC]">Audit log</h1>
        <p className="mt-1 text-[12.5px] text-[#94A3B8]">
          Append-only record of every privileged action: who did it, to whom, and from where.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { label: "Events", value: entries.length.toLocaleString() },
          { label: "Actors", value: actors.toString() },
          { label: "Latest", value: entries[0] ? formatWhen(entries[0].createdAt) : "—" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6E7C93]">{card.label}</p>
            <p className="mt-1.5 text-[15px] font-semibold tabular-nums text-[#F8FAFC]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="audit-search" className="sr-only">
          Search the audit log
        </label>
        <input
          id="audit-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Actor, target or summary"
          className={`${INPUT} sm:max-w-[260px]`}
        />
        <label htmlFor="audit-action" className="sr-only">
          Filter by action
        </label>
        <select
          id="audit-action"
          value={action}
          onChange={(event) => setAction(event.target.value)}
          className={`${INPUT} sm:max-w-[220px]`}
        >
          <option value="all">All actions</option>
          {actions.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        <span className="ml-auto text-[11px] tabular-nums text-[#6E7C93]">{visible.length} shown</span>
      </div>

      <Panel>
        {visible.length === 0 ? (
          <EmptyState
            title="No matching events"
            body="Privileged actions land here as they happen: role changes, wallet moves, case work and key revocations."
          />
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {visible.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${actionTone(entry.action)}`}>
                    {entry.action}
                  </span>
                  <span className="text-[12px] font-medium text-[#F8FAFC]">@{entry.actorHandle}</span>
                  <RoleBadge role={entry.actorRole} short />
                  <span className="ml-auto text-[10.5px] tabular-nums text-[#6E7C93]">{formatWhen(entry.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-5 text-[#CBD5E1]">{entry.summary}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-[#6E7C93]">
                  <span>
                    target {entry.targetType}
                    {entry.targetLabel ? ` · ${entry.targetLabel}` : ""}
                  </span>
                  {entry.ip ? <span className="font-mono">{entry.ip}</span> : null}
                </p>
                {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                  <details className="mt-1.5">
                    <summary className="cursor-pointer text-[10.5px] text-[#6E7C93] hover:text-[#CBD5E1]">
                      Metadata
                    </summary>
                    <pre className="mt-1 overflow-x-auto rounded-lg border border-white/[0.07] bg-[#111318] p-2 font-mono text-[10.5px] leading-5 text-[#94A3B8]">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
