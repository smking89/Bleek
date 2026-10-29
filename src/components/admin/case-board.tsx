"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CASE_PRIORITIES,
  CASE_STATUS_META,
  can,
  type CasePriority,
  type StaffRole,
} from "@/lib/admin/roles";
import type { CaseRow } from "@/lib/admin/service";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  CasePriorityTag,
  CaseStatusTag,
  EmptyState,
  Eyebrow,
  INPUT,
  Panel,
  PanelHeader,
} from "./ui";

const STATUS_TABS = [
  { key: "active", label: "Active" },
  { key: "all", label: "All" },
  { key: "closed", label: "Closed" },
] as const;

type StatusTab = (typeof STATUS_TABS)[number]["key"];
type PriorityFilter = "all" | CasePriority;

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export function CaseBoard({
  cases,
  role,
  meHandle,
  initialCaseId,
  initialSubject = "",
}: {
  cases: CaseRow[];
  role: StaffRole;
  meHandle: string;
  initialCaseId?: string;
  initialSubject?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<StatusTab>("active");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialCaseId ?? null);
  const [creating, setCreating] = useState(false);
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("");
  const [assignHandle, setAssignHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState({
    subjectHandle: initialSubject,
    reason: "",
    channel: "",
    detail: "",
    priority: "NORMAL" as CasePriority,
  });

  const canWork = can(role, "cases.write");
  const canAssign = can(role, "cases.assign");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^@/, "");
    return cases.filter((item) => {
      const closed = item.status === "RESOLVED" || item.status === "DISMISSED";
      if (tab === "active" && closed) return false;
      if (tab === "closed" && !closed) return false;
      if (priority !== "all" && item.priority !== priority) return false;
      if (!needle) return true;
      return (
        item.subjectHandle.includes(needle) ||
        item.reference.toLowerCase().includes(needle) ||
        item.reason.toLowerCase().includes(needle)
      );
    });
  }, [cases, tab, priority, query]);

  const selected = cases.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  async function act(caseId: string, body: Record<string, unknown>, success: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "That case action was rejected.");
        return;
      }

      setNotice(success);
      setNote("");
      setResolution("");
      setAssignHandle("");
      router.refresh();
    } catch {
      setError("The console could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function createCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; case?: CaseRow };

      if (!response.ok || !data.case) {
        setError(data.error ?? "That case could not be opened.");
        return;
      }

      setNotice(`Opened ${data.case.reference}.`);
      setSelectedId(data.case.id);
      setCreating(false);
      setForm({ subjectHandle: "", reason: "", channel: "", detail: "", priority: "NORMAL" });
      router.refresh();
    } catch {
      setError("The console could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[#F8FAFC]">Moderation</h1>
          <p className="mt-1 text-[12.5px] text-[#94A3B8]">
            Triage reports, claim work, leave an internal trail and close with a resolution.
          </p>
        </div>
        {canWork ? (
          <button type="button" onClick={() => setCreating((value) => !value)} className={BUTTON_PRIMARY}>
            {creating ? "Close form" : "New case"}
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-[12px] text-[#FCA5A5]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-lg border border-[#23A55A]/35 bg-[#23A55A]/10 px-3 py-2 text-[12px] text-[#8BE0AD]">
          {notice}
        </p>
      ) : null}

      {creating ? (
        <Panel>
          <PanelHeader title="Open a case" hint="The subject must already be an ASTRO account." />
          <form onSubmit={createCase} className="grid gap-3 px-4 py-4 sm:grid-cols-2">
            <label className="text-[11px] font-medium text-[#CBD5E1]">
              Subject handle
              <input
                required
                value={form.subjectHandle}
                onChange={(event) => setForm({ ...form, subjectHandle: event.target.value })}
                placeholder="@handle"
                className={`${INPUT} mt-1`}
              />
            </label>
            <label className="text-[11px] font-medium text-[#CBD5E1]">
              Priority
              <select
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value as CasePriority })}
                className={`${INPUT} mt-1`}
              >
                {CASE_PRIORITIES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-medium text-[#CBD5E1] sm:col-span-2">
              Reason
              <input
                required
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
                placeholder="Harassment in #general"
                className={`${INPUT} mt-1`}
              />
            </label>
            <label className="text-[11px] font-medium text-[#CBD5E1]">
              Channel
              <input
                value={form.channel}
                onChange={(event) => setForm({ ...form, channel: event.target.value })}
                placeholder="#general"
                className={`${INPUT} mt-1`}
              />
            </label>
            <label className="text-[11px] font-medium text-[#CBD5E1]">
              Detail
              <input
                value={form.detail}
                onChange={(event) => setForm({ ...form, detail: event.target.value })}
                placeholder="What happened, links, message ids"
                className={`${INPUT} mt-1`}
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy || form.reason.trim().length < 3} className={BUTTON_PRIMARY}>
                {busy ? "Opening…" : "Open case"}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Filter by status" className="flex rounded-full border border-white/10 bg-[#0B0C0E] p-0.5">
          {STATUS_TABS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              aria-pressed={tab === entry.key}
              onClick={() => setTab(entry.key)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                tab === entry.key ? "bg-[#4F46E5] text-white" : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <label className="sr-only" htmlFor="case-search">
          Search cases
        </label>
        <input
          id="case-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Reference, member or reason"
          className={`${INPUT} sm:max-w-[260px]`}
        />

        <label className="sr-only" htmlFor="case-priority">
          Filter by priority
        </label>
        <select
          id="case-priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as PriorityFilter)}
          className={`${INPUT} sm:max-w-[150px]`}
        >
          <option value="all">All priorities</option>
          {CASE_PRIORITIES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>

        <span className="ml-auto text-[11px] tabular-nums text-[#6E7C93]">
          {filtered.length} of {cases.length}
        </span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Panel className="self-start">
          <PanelHeader title="Queue" hint="Active cases first, urgent on top" />
          {filtered.length === 0 ? (
            <EmptyState title="Nothing in this view" body="Change the filter, or open a case to start the trail." />
          ) : (
            <ul className="max-h-[560px] divide-y divide-white/[0.05] overflow-y-auto scroll-thin">
              {filtered.map((item) => {
                const active = selected?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      aria-current={active ? "true" : undefined}
                      className={`flex w-full flex-col gap-1 border-l-2 px-3.5 py-2.5 text-left transition-colors ${
                        active
                          ? "border-[#4F46E5] bg-[#4F46E5]/10"
                          : "border-transparent hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-[10.5px] text-[#6E7C93]">{item.reference}</span>
                        <CasePriorityTag priority={item.priority} />
                        <span className="ml-auto">
                          <CaseStatusTag status={item.status} />
                        </span>
                      </span>
                      <span className="truncate text-[12.5px] font-medium text-[#F8FAFC]">
                        @{item.subjectHandle} · {item.reason}
                      </span>
                      <span className="text-[10.5px] text-[#6E7C93]">
                        {item.assignee ? `@${item.assignee.handle}` : "Unassigned"} · {formatWhen(item.createdAt)} ·{" "}
                        {item.notes.length} note{item.notes.length === 1 ? "" : "s"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel className="self-start">
          {!selected ? (
            <EmptyState title="Pick a case" body="Select a case from the queue to see its trail." />
          ) : (
            <>
              <div className="border-b border-white/[0.06] px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-[#6E7C93]">{selected.reference}</span>
                  <CaseStatusTag status={selected.status} />
                  <CasePriorityTag priority={selected.priority} />
                  <span className="ml-auto text-[10.5px] text-[#6E7C93]">{formatWhen(selected.createdAt)}</span>
                </div>
                <h2 className="mt-1.5 text-[16px] font-semibold text-[#F8FAFC]">{selected.reason}</h2>
                <p className="mt-1 text-[12px] text-[#94A3B8]">
                  <Link href={`/admin/users?q=${selected.subjectHandle}`} className="text-[#A5B4FC] hover:underline">
                    @{selected.subjectHandle}
                  </Link>
                  {selected.channel ? ` · ${selected.channel}` : ""} · reported by @{selected.reporterHandle ?? "staff"}
                  {selected.assignee ? ` · with @${selected.assignee.handle}` : " · unassigned"}
                </p>
                {selected.detail ? (
                  <p className="mt-2 rounded-lg border border-white/[0.07] bg-[#111318] px-3 py-2 text-[12px] leading-5 text-[#CBD5E1]">
                    {selected.detail}
                  </p>
                ) : null}
                {selected.resolution ? (
                  <p className="mt-2 rounded-lg border border-[#23A55A]/30 bg-[#23A55A]/10 px-3 py-2 text-[12px] leading-5 text-[#8BE0AD]">
                    Resolution: {selected.resolution}
                  </p>
                ) : null}
              </div>

              {canWork ? (
                <div className="space-y-4 border-b border-white/[0.06] px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy || selected.assignee?.handle === meHandle}
                      onClick={() => void act(selected.id, { action: "claim" }, "Case claimed.")}
                      className={BUTTON_PRIMARY}
                    >
                      {selected.assignee?.handle === meHandle ? "Assigned to you" : "Claim case"}
                    </button>

                    {CASE_PRIORITIES.map((entry) => (
                      <button
                        key={entry}
                        type="button"
                        disabled={busy || selected.priority === entry}
                        aria-pressed={selected.priority === entry}
                        onClick={() => void act(selected.id, { action: "priority", priority: entry }, `Priority set to ${entry}.`)}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                          selected.priority === entry
                            ? "border-[#4F46E5]/60 bg-[#4F46E5]/15 text-[#C7D2FE]"
                            : "border-white/12 text-[#94A3B8] hover:border-white/25 hover:text-white"
                        }`}
                      >
                        {entry}
                      </button>
                    ))}
                  </div>

                  {canAssign ? (
                    <div className="flex flex-wrap gap-2">
                      <input
                        aria-label="Assign to staff handle"
                        value={assignHandle}
                        onChange={(event) => setAssignHandle(event.target.value)}
                        placeholder="Assign to @handle"
                        className={`${INPUT} max-w-[220px]`}
                      />
                      <button
                        type="button"
                        disabled={busy || assignHandle.trim().length < 2}
                        onClick={() =>
                          void act(selected.id, { action: "assign", handle: assignHandle }, "Case reassigned.")
                        }
                        className={BUTTON_GHOST}
                      >
                        Assign
                      </button>
                    </div>
                  ) : null}

                  <div>
                    <Eyebrow>Close with a resolution</Eyebrow>
                    <textarea
                      aria-label="Resolution"
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      rows={2}
                      placeholder="What did you decide, and why?"
                      className={`${INPUT} mt-1.5 resize-y`}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy || resolution.trim().length < 3}
                        onClick={() =>
                          void act(selected.id, { action: "status", status: "RESOLVED", resolution }, "Case resolved.")
                        }
                        className="rounded-lg border border-[#23A55A]/40 bg-[#23A55A]/10 px-3 py-1.5 text-[12px] font-semibold text-[#8BE0AD] transition-colors hover:bg-[#23A55A]/20 disabled:opacity-40"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        disabled={busy || resolution.trim().length < 3}
                        onClick={() =>
                          void act(selected.id, { action: "status", status: "DISMISSED", resolution }, "Case dismissed.")
                        }
                        className={BUTTON_GHOST}
                      >
                        Dismiss
                      </button>
                      {selected.status === "RESOLVED" || selected.status === "DISMISSED" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void act(selected.id, { action: "status", status: "INVESTIGATING" }, "Case reopened.")
                          }
                          className={BUTTON_GHOST}
                        >
                          Reopen
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <Eyebrow>Case trail</Eyebrow>
                    {selected.notes.length === 0 ? (
                      <p className="mt-1.5 text-[12px] text-[#6E7C93]">No notes yet.</p>
                    ) : (
                      <ol className="mt-1.5 space-y-2">
                        {selected.notes.map((entry) => (
                          <li key={entry.id} className="border-l-2 border-white/10 pl-2.5">
                            <p className="text-[12px] leading-5 text-[#E2E8F0]">{entry.body}</p>
                            <p className="text-[10.5px] text-[#6E7C93]">
                              @{entry.authorHandle} · {formatWhen(entry.createdAt)}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                    <div className="mt-2 flex gap-2">
                      <input
                        aria-label="New case note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Internal note"
                        className={INPUT}
                      />
                      <button
                        type="button"
                        disabled={busy || note.trim().length === 0}
                        onClick={() => void act(selected.id, { action: "note", body: note }, "Note added.")}
                        className={BUTTON_GHOST}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="px-4 py-4 text-[12px] text-[#6E7C93]">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${CASE_STATUS_META[selected.status].tone}`}>
                    Read only
                  </span>{" "}
                  Your role can read cases but not work them.
                </p>
              )}

              <div className="flex flex-wrap gap-2 px-4 py-3">
                <Link href={`/admin/users?q=${selected.subjectHandle}`} className={BUTTON_GHOST}>
                  Open @{selected.subjectHandle}
                </Link>
                <span className="text-[10.5px] leading-5 text-[#6E7C93]">
                  Every action here is written to the staff audit log.
                </span>
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
