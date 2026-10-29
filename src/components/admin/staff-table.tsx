"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ROLE_META,
  STAFF_ROLES,
  assignableRoles,
  capabilitiesFor,
  roleRank,
  type StaffRole,
} from "@/lib/admin/roles";
import type { StaffRow } from "@/lib/admin/service";
import { BUTTON_GHOST, BUTTON_PRIMARY, EmptyState, Eyebrow, INPUT, Panel, PanelHeader, RoleBadge } from "./ui";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function StaffTable({
  staff,
  role,
  meHandle,
}: {
  staff: StaffRow[];
  role: StaffRole;
  meHandle: string;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [nextRole, setNextRole] = useState<StaffRole | "">(assignableRoles(role)[0] ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const grantable = assignableRoles(role);

  async function change(target: string, next: StaffRole | null, success: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(target)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "role", role: next }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "That role change was rejected.");
        return;
      }

      setNotice(success);
      setHandle("");
      router.refresh();
    } catch {
      setError("The console could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-[#F8FAFC]">Staff</h1>
        <p className="mt-1 text-[12.5px] text-[#94A3B8]">
          Who can act in this console, and exactly what each role is allowed to do.
        </p>
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

      <div className="grid gap-3 sm:grid-cols-3">
        {STAFF_ROLES.map((entry) => {
          const meta = ROLE_META[entry];
          return (
            <Panel key={entry} className="px-4 py-3.5">
              <div className="flex items-center justify-between gap-2">
                <RoleBadge role={entry} />
                <span className="text-[10.5px] tabular-nums text-[#6E7C93]">
                  {staff.filter((member) => member.role === entry).length} member
                  {staff.filter((member) => member.role === entry).length === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-2 text-[11.5px] leading-5 text-[#94A3B8]">{meta.blurb}</p>
              <p className="mt-2 font-mono text-[10px] text-[#6E7C93]">
                {capabilitiesFor(entry).length} capabilities · rank {meta.rank}
              </p>
            </Panel>
          );
        })}
      </div>

      <Panel>
        <PanelHeader
          title="Grant a role"
          hint={
            grantable.length > 0
              ? `A ${ROLE_META[role].label} can grant ${grantable.map((entry) => ROLE_META[entry].label).join(", ")}.`
              : "Your role cannot grant staff roles."
          }
        />
        <div className="flex flex-wrap items-end gap-2 px-4 py-4">
          <label className="text-[11px] font-medium text-[#CBD5E1]">
            Member handle
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="@handle"
              disabled={grantable.length === 0}
              className={`${INPUT} mt-1 sm:w-[220px]`}
            />
          </label>
          <label className="text-[11px] font-medium text-[#CBD5E1]">
            Role
            <select
              value={nextRole}
              onChange={(event) => setNextRole(event.target.value as StaffRole)}
              disabled={grantable.length === 0}
              className={`${INPUT} mt-1 sm:w-[180px]`}
            >
              {grantable.map((entry) => (
                <option key={entry} value={entry}>
                  {ROLE_META[entry].label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy || !nextRole || handle.trim().length < 2}
            onClick={() => nextRole && void change(handle, nextRole, `Granted ${ROLE_META[nextRole].label}.`)}
            className={BUTTON_PRIMARY}
          >
            {busy ? "Saving…" : "Grant role"}
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Roster" hint="Everyone with console access" />
        {staff.length === 0 ? (
          <EmptyState
            title="No staff yet"
            body="Grant the first role with the form above, or run npm run staff:grant from a terminal."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-[#6E7C93]">
                  <th scope="col" className="px-4 py-2 font-semibold">Member</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Role</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Title</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Since</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Last seen</th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const removable = roleRank(role) > roleRank(member.role) && member.handle !== meHandle;
                  return (
                    <tr key={member.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">
                        <span className="block text-[12.5px] font-medium text-[#F8FAFC]">{member.displayName}</span>
                        <span className="text-[10.5px] text-[#6E7C93]">@{member.handle}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-3 py-2.5 text-[11.5px] text-[#94A3B8]">{member.title ?? "—"}</td>
                      <td className="px-3 py-2.5 text-[11px] text-[#94A3B8]">{formatDate(member.since)}</td>
                      <td className="px-3 py-2.5 text-[11px] text-[#94A3B8]">{formatDate(member.lastSeenAt)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {removable ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void change(member.handle, null, `Removed @${member.handle} from staff.`)}
                            className={BUTTON_GHOST}
                          >
                            Remove
                          </button>
                        ) : (
                          <span className="text-[10.5px] text-[#6E7C93]">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] px-4 py-3">
        <Eyebrow>Invariant</Eyebrow>
        <p className="mt-1 text-[11.5px] leading-5 text-[#94A3B8]">
          A staff member cannot edit their own role, cannot touch a role at or above their own, and the last super admin
          cannot be demoted. Every grant and removal lands in the audit log with the actor, target and IP.
        </p>
      </div>
    </div>
  );
}
