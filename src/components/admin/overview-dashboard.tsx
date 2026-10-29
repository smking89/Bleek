"use client";

import Link from "next/link";
import { useState } from "react";
import type { OverviewMetrics, TrendPoint } from "@/lib/admin/metrics";
import type { AuditRow, CaseRow, StaffRow } from "@/lib/admin/service";
import { ROLE_META, type CasePriority } from "@/lib/admin/roles";
import { CasePriorityTag, CaseStatusTag, EmptyState, Metric, Panel, PanelHeader, RoleBadge } from "./ui";

const RANGES = [7, 14, 30] as const;
type Range = (typeof RANGES)[number];

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

type SeriesKey = "signups" | "cases" | "requests" | "errors";

function TrendChart({
  points,
  series,
}: {
  points: TrendPoint[];
  series: { key: SeriesKey; label: string; color: string }[];
}) {
  const max = Math.max(1, ...points.flatMap((point) => series.map((entry) => point[entry.key])));

  return (
    <div>
      <div className="flex h-[128px] items-end gap-[3px]">
        {points.map((point) => (
          <div
            key={point.day}
            className="flex h-full flex-1 items-end justify-center gap-[1px]"
            title={`${formatDay(point.day)} · ${series.map((entry) => `${entry.label} ${point[entry.key]}`).join(" · ")}`}
          >
            {series.map((entry) => (
              <span
                key={entry.key}
                style={{ height: `${Math.max(2, Math.round((point[entry.key] / max) * 100))}%` }}
                className={`w-full max-w-[7px] rounded-t-[2px] ${entry.color}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-[#8A8A94]">
        <span>{points[0] ? formatDay(points[0].day) : ""}</span>
        <span>{points[points.length - 1] ? formatDay(points[points.length - 1].day) : ""}</span>
      </div>
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[10.5px] text-[#A1A1AA]">
          <span className={`h-2 w-2 rounded-[2px] ${item.color}`} aria-hidden />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function OverviewDashboard({
  metrics,
  queue,
  staff,
  audit,
}: {
  metrics: OverviewMetrics;
  queue: CaseRow[];
  staff: StaffRow[];
  audit: AuditRow[];
}) {
  const [range, setRange] = useState<Range>(14);
  const points = metrics.trend.slice(-range);
  const totalSignups = points.reduce((sum, point) => sum + point.signups, 0);
  const totalCases = points.reduce((sum, point) => sum + point.cases, 0);
  const totalRequests = points.reduce((sum, point) => sum + point.requests, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[#FAFAFA]">Platform overview</h1>
          <p className="mt-1 text-[12.5px] text-[#A1A1AA]">
            Live totals across ASTRO, the moderation queue and every developer key.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-[#06B6D4]/40 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#67E8F9]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#06B6D4]" aria-hidden /> Live
          </span>
          <div
            role="group"
            aria-label="Trend range"
            className="flex rounded-full border border-white/10 bg-[#121214] p-0.5"
          >
            {RANGES.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={range === option}
                onClick={() => setRange(option)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors ${
                  range === option ? "bg-[#7C3AED] text-white" : "text-[#A1A1AA] hover:text-[#FAFAFA]"
                }`}
              >
                {option}d
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Metric label="Accounts" value={metrics.accounts.total.toLocaleString()} hint={`+${metrics.accounts.new7d} this week`} />
        <Metric
          label="Coins in circulation"
          value={metrics.wallet.coins.toLocaleString()}
          hint={`${metrics.wallet.holders.toLocaleString()} wallets`}
          tone="indigo"
        />
        <Metric
          label="Open cases"
          value={metrics.cases.open + metrics.cases.investigating}
          hint={`${metrics.cases.urgent} urgent · ${metrics.cases.resolved7d} resolved`}
          tone={metrics.cases.urgent > 0 ? "danger" : "default"}
        />
        <Metric
          label="API requests · 24h"
          value={metrics.developers.requests24h.toLocaleString()}
          hint={`${metrics.developers.errorRate.toFixed(1)}% error rate`}
          tone="cyan"
        />
        <Metric
          label="Active · 24h"
          value={metrics.accounts.active24h.toLocaleString()}
          hint={`${metrics.accounts.suspended} suspended`}
        />
        <Metric
          label="Staff"
          value={metrics.accounts.staff}
          hint={`${metrics.roles.MODERATOR} mod · ${metrics.roles.ADMIN} admin · ${metrics.roles.SUPER_ADMIN} super`}
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Accounts and cases"
            hint={`${totalSignups} signups · ${totalCases} cases opened in ${range} days`}
            action={
              <Legend
                items={[
                  { label: "Signups", color: "bg-[#7C3AED]" },
                  { label: "Cases", color: "bg-[#06B6D4]" },
                ]}
              />
            }
          />
          <div className="px-4 py-4">
            <TrendChart
              points={points}
              series={[
                { key: "signups", label: "signups", color: "bg-[#7C3AED]" },
                { key: "cases", label: "cases", color: "bg-[#06B6D4]" },
              ]}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Developer API traffic"
            hint={`${totalRequests.toLocaleString()} requests in ${range} days · ${metrics.developers.active}/${metrics.developers.apps} keys active`}
            action={
              <Legend
                items={[
                  { label: "Requests", color: "bg-[#7C3AED]/80" },
                  { label: "Errors", color: "bg-[#EF4444]/80" },
                ]}
              />
            }
          />
          <div className="px-4 py-4">
            <TrendChart
              points={points}
              series={[
                { key: "requests", label: "requests", color: "bg-[#7C3AED]/80" },
                { key: "errors", label: "errors", color: "bg-[#EF4444]/80" },
              ]}
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Panel>
          <PanelHeader
            title="Priority queue"
            hint="Open and investigating cases, highest priority first"
            action={
              <Link href="/admin/moderation" className="text-[11.5px] font-medium text-[#C4B5FD] hover:text-[#DDD6FE]">
                Open queue →
              </Link>
            }
          />
          {queue.length === 0 ? (
            <EmptyState title="Queue is clear" body="No open reports. New cases appear here the moment they are filed." />
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {queue.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/moderation?case=${item.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="w-[86px] shrink-0 font-mono text-[10.5px] text-[#8A8A94]">{item.reference}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] text-[#FAFAFA]">
                        @{item.subjectHandle} · {item.reason}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-[#8A8A94]">
                        {item.assignee ? `Assigned to @${item.assignee.handle}` : "Unassigned"} ·{" "}
                        {formatWhen(item.createdAt)}
                      </span>
                    </span>
                    <CasePriorityTag priority={item.priority as CasePriority} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel>
            <PanelHeader title="Staff on duty" hint="Everyone who can act in this console" />
            <ul className="divide-y divide-white/[0.05]">
              {staff.slice(0, 6).map((member) => (
                <li key={member.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-[#D4D4D8]">
                    {member.displayName.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-[#FAFAFA]">@{member.handle}</span>
                    <span className="block text-[10.5px] text-[#8A8A94]">
                      {member.lastSeenAt ? `Seen ${formatWhen(member.lastSeenAt)}` : "Never signed in"}
                    </span>
                  </span>
                  <RoleBadge role={member.role} short />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <PanelHeader
              title="Recent staff activity"
              action={
                <Link href="/admin/audit" className="text-[11.5px] font-medium text-[#C4B5FD] hover:text-[#DDD6FE]">
                  Full log →
                </Link>
              }
            />
            {audit.length === 0 ? (
              <p className="px-4 py-6 text-[12px] text-[#8A8A94]">No privileged actions recorded yet.</p>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {audit.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="px-4 py-2.5">
                    <p className="truncate text-[12px] text-[#E4E4E7]">{entry.summary}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-[#8A8A94]">
                      <span className="font-mono">{entry.action}</span> · @{entry.actorHandle}
                      {entry.actorRole ? ` · ${ROLE_META[entry.actorRole].label}` : ""} · {formatWhen(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
