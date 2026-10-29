"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { can, type StaffRole } from "@/lib/admin/roles";
import type { AdminAppRow } from "@/lib/dev/apps";
import { maskSecret } from "@/lib/dev/keys";
import { BUTTON_GHOST, EmptyState, INPUT, Panel, PanelHeader } from "./ui";

function formatDate(value: Date | string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function DeveloperTable({ apps, role }: { apps: AdminAppRow[]; role: StaffRole }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "REVOKED">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canRevoke = can(role, "dev.revoke");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (filter !== "all" && app.status !== filter) return false;
      if (!needle) return true;
      return (
        app.name.toLowerCase().includes(needle) ||
        app.owner.handle.includes(needle) ||
        app.clientId.toLowerCase().includes(needle)
      );
    });
  }, [apps, query, filter]);

  const totalRequests = apps.reduce((sum, app) => sum + app.requestCount, 0);
  const totalErrors = apps.reduce((sum, app) => sum + app.errorCount, 0);
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  async function toggle(app: AdminAppRow) {
    setBusyId(app.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: app.status === "ACTIVE" ? "revoke" : "restore" }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "That change was rejected.");
        return;
      }
      router.refresh();
    } catch {
      setError("The console could not reach the server.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#F8FAFC]">Developer apps</h1>
        <p className="mt-1 text-[12.5px] text-[#94A3B8]">
          Every key issued against the ASTRO API. Revoking is instant and keeps the account and its data.
        </p>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { label: "Apps", value: apps.length.toLocaleString(), hint: `${apps.filter((app) => app.status === "ACTIVE").length} active` },
          { label: "Requests", value: totalRequests.toLocaleString(), hint: "all time" },
          { label: "Error rate", value: `${errorRate.toFixed(1)}%`, hint: `${totalErrors.toLocaleString()} failed calls` },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6E7C93]">{card.label}</p>
            <p className="mt-1.5 text-[20px] font-semibold tabular-nums text-[#F8FAFC]">{card.value}</p>
            <p className="mt-1 text-[11px] text-[#94A3B8]">{card.hint}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-[12px] text-[#FCA5A5]">
          {error}
        </p>
      ) : null}

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 sm:px-4">
          <label htmlFor="app-search" className="sr-only">
            Search apps
          </label>
          <input
            id="app-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="App, owner or client id"
            className={`${INPUT} sm:max-w-[240px]`}
          />
          <div role="group" aria-label="Filter apps" className="flex rounded-full border border-white/10 bg-[#111318] p-0.5">
            {(["all", "ACTIVE", "REVOKED"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors ${
                  filter === option ? "bg-[#4F46E5] text-white" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                {option.toLowerCase()}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[11px] tabular-nums text-[#6E7C93]">{visible.length} shown</span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No apps in this view"
            body="Developer keys appear here the moment someone creates one in the portal."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-[#6E7C93]">
                  <th scope="col" className="px-4 py-2 font-semibold">App</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Owner</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Key</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Scopes</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Requests</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Errors</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Last used</th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((app) => (
                  <tr key={app.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5">
                      <span className="block text-[12.5px] font-medium text-[#F8FAFC]">{app.name}</span>
                      <span className="font-mono text-[10px] text-[#6E7C93]">{app.clientId}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="block text-[12px] text-[#CBD5E1]">@{app.owner.handle}</span>
                      <span className="text-[10.5px] text-[#6E7C93]">{app.environment.toLowerCase()}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[10.5px] text-[#94A3B8]">
                        {maskSecret(app.keyPrefix, app.lastFour)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#94A3B8]">{app.scopes.length}</td>
                    <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-[#CBD5E1]">
                      {app.requestCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-[#FCA5A5]">
                      {app.errorCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#94A3B8]">{formatDate(app.lastUsedAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {canRevoke ? (
                        <button
                          type="button"
                          onClick={() => void toggle(app)}
                          disabled={busyId === app.id}
                          className={BUTTON_GHOST}
                        >
                          {busyId === app.id ? "Working…" : app.status === "ACTIVE" ? "Revoke" : "Restore"}
                        </button>
                      ) : (
                        <span className="text-[10.5px] text-[#6E7C93]">
                          {app.status === "ACTIVE" ? "Active" : "Revoked"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="text-[11px] leading-5 text-[#6E7C93]">
        Revoking rejects the key on the next call. The owner rotates or restores it from the ASTRO developer portal.
      </p>
    </div>
  );
}
