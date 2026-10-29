"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DialogPanel } from "@/components/dialog-panel";
import { ROLE_META, assignableRoles, can, roleRank, type StaffRole } from "@/lib/admin/roles";
import type { DirectoryUser } from "@/lib/admin/service";
import { UnverifiedTag, VerifiedBadge } from "@/components/verified-badge";
import {
  AccountStatusTag,
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  EmptyState,
  Eyebrow,
  INPUT,
  Panel,
  RoleBadge,
} from "./ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "staff", label: "Staff" },
  { key: "suspended", label: "Suspended" },
  { key: "chips", label: "Linked" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function UserTable({
  users,
  role,
  meHandle,
  initialQuery = "",
}: {
  users: DirectoryUser[];
  role: StaffRole;
  meHandle: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedHandle, setSelectedHandle] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState("");
  const [delta, setDelta] = useState("50");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^@/, "");
    return users.filter((user) => {
      if (filter === "staff" && !user.staffRole) return false;
      if (filter === "suspended" && user.status !== "SUSPENDED") return false;
      if (filter === "chips" && user.connections === 0) return false;
      if (!needle) return true;
      return (
        user.handle.toLowerCase().includes(needle) ||
        user.displayName.toLowerCase().includes(needle)
      );
    });
  }, [users, query, filter]);

  const selected = users.find((user) => user.handle === selectedHandle) ?? null;
  const grantable = assignableRoles(role);
  const canEditRole = can(role, "users.role");
  const canMoveCoins = can(role, "users.wallet");
  const canSuspend = can(role, "users.suspend");
  const canVerify = can(role, "users.verify");

  function open(user: DirectoryUser) {
    setSelectedHandle(user.handle);
    setRoleDraft(user.staffRole ?? "");
    setDelta("50");
    setNote("");
    setReason("");
    setError(null);
    setNotice(null);
  }

  function close() {
    setSelectedHandle(null);
    setError(null);
    setNotice(null);
  }

  async function act(handle: string, body: Record<string, unknown>, success: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(handle)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "That action was rejected.");
        return;
      }

      setNotice(success);
      setNote("");
      setReason("");
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
        <h1 className="text-[22px] font-semibold tracking-tight text-[#F8FAFC]">Members</h1>
        <p className="mt-1 text-[12.5px] text-[#94A3B8]">
          Every ASTRO account, its wallet, its chips and its staff role.
        </p>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-3 py-2.5 sm:px-4">
          <label htmlFor="member-search" className="sr-only">
            Search members
          </label>
          <input
            id="member-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search handle or name"
            className={`${INPUT} sm:max-w-[240px]`}
          />

          <div
            role="group"
            aria-label="Filter members"
            className="flex rounded-full border border-white/10 bg-[#111318] p-0.5"
          >
            {FILTERS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={filter === option.key}
                onClick={() => setFilter(option.key)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  filter === option.key ? "bg-[#4F46E5] text-white" : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <span className="ml-auto text-[11px] tabular-nums text-[#6E7C93]">
            {visible.length} of {users.length}
          </span>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No accounts match"
            body="Try a shorter search, or clear the filter to see every member."
            action={
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className={BUTTON_GHOST}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-[#6E7C93]">
                  <th scope="col" className="px-4 py-2 font-semibold">Account</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Role</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Coins</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Chips</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Joined</th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => open(user)}
                    className={`cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.03] ${
                      selectedHandle === user.handle ? "bg-[#4F46E5]/10" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      <button type="button" onClick={() => open(user)} className="flex items-center gap-2.5 text-left">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-[#CBD5E1]">
                          {user.displayName.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12.5px] font-medium text-[#F8FAFC]">
                            {user.displayName}
                          </span>
                          <span className="flex items-center gap-1 text-[10.5px] text-[#6E7C93]">
                            @{user.handle}
                            {user.handleVerifiedAt ? <VerifiedBadge size={11} /> : null}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <RoleBadge role={user.staffRole} />
                    </td>
                    <td className="px-3 py-2.5">
                      <AccountStatusTag status={user.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-[#CBD5E1]">
                      {user.coins.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[12px] tabular-nums text-[#94A3B8]">
                      {user.connections}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] text-[#94A3B8]">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-[11px] font-medium text-[#A5B4FC]">Manage →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <DialogPanel
            label={`Manage @${selected.handle}`}
            onClose={close}
            className="h-full w-full max-w-[430px] overflow-y-auto border-l border-white/10 bg-[#0B0C0E]"
          >
            <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#0B0C0E] px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Eyebrow>Account</Eyebrow>
                  <h2 className="mt-1 truncate text-[16px] font-semibold text-[#F8FAFC]">
                    {selected.displayName}
                  </h2>
                  <p className="text-[12px] text-[#94A3B8]">@{selected.handle}</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-md p-1.5 text-[#94A3B8] transition-colors hover:bg-white/[0.06] hover:text-white"
                  aria-label="Close account panel"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={selected.staffRole} />
                <AccountStatusTag status={selected.status} />
                {selected.staffTitle ? (
                  <span className="text-[10.5px] text-[#6E7C93]">{selected.staffTitle}</span>
                ) : null}
              </div>
            </div>

            <div className="space-y-4 px-4 py-4">
              {error ? (
                <p role="alert" className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-[12px] leading-5 text-[#FCA5A5]">
                  {error}
                </p>
              ) : null}
              {notice ? (
                <p role="status" className="rounded-lg border border-[#23A55A]/35 bg-[#23A55A]/10 px-3 py-2 text-[12px] leading-5 text-[#8BE0AD]">
                  {notice}
                </p>
              ) : null}

              <dl className="grid grid-cols-3 gap-2">
                {[
                  { label: "Balance", value: selected.coins.toLocaleString() },
                  { label: "Earned", value: selected.lifetimeEarned.toLocaleString() },
                  { label: "Chips", value: selected.connections.toString() },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-white/[0.07] bg-[#111318] px-2.5 py-2">
                    <dt className="text-[9.5px] uppercase tracking-[0.12em] text-[#6E7C93]">{stat.label}</dt>
                    <dd className="mt-1 text-[14px] font-semibold tabular-nums text-[#F8FAFC]">{stat.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="text-[11px] leading-5 text-[#6E7C93]">
                Joined {formatDate(selected.createdAt)} · Last seen {formatDate(selected.lastSeenAt)}
                {selected.suspendedReason ? ` · Suspended: ${selected.suspendedReason}` : ""}
              </p>

              <section className="rounded-lg border border-white/[0.07] bg-[#111318] p-3">
                <h3 className="text-[12px] font-semibold text-[#F8FAFC]">Handle verification</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {selected.handleVerifiedAt ? <VerifiedBadge size={13} /> : <UnverifiedTag />}
                  <span className="text-[11px] text-[#94A3B8]">
                    {selected.handleVerifiedAt
                      ? `Verified ${formatDate(selected.handleVerifiedAt)}`
                      : "Not verified. The cyan check is hidden in Bleek and on profile cards."}
                  </span>
                </div>
                {canVerify ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        selected.handle,
                        { action: selected.handleVerifiedAt ? "unverify" : "verify" },
                        selected.handleVerifiedAt ? "Handle verification removed." : "Handle verified.",
                      )
                    }
                    className={`${BUTTON_GHOST} mt-2`}
                  >
                    {selected.handleVerifiedAt ? "Remove verification" : `Verify @${selected.handle}`}
                  </button>
                ) : (
                  <p className="mt-2 text-[10.5px] text-[#6E7C93]">Only admins can change verification.</p>
                )}
              </section>

              {canEditRole ? (
                <section className="rounded-lg border border-white/[0.07] bg-[#111318] p-3">
                  <h3 className="text-[12px] font-semibold text-[#F8FAFC]">Staff role</h3>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#6E7C93]">
                    A {ROLE_META[role].label} can assign{" "}
                    {grantable.length > 0 ? grantable.map((entry) => ROLE_META[entry].label).join(", ") : "no roles"}.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <select
                      aria-label="Staff role"
                      value={roleDraft}
                      onChange={(event) => setRoleDraft(event.target.value)}
                      disabled={selected.handle === meHandle || !grantable.length}
                      className={INPUT}
                    >
                      <option value="">No staff role</option>
                      {grantable.map((entry) => (
                        <option key={entry} value={entry}>
                          {ROLE_META[entry].label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={busy || selected.handle === meHandle}
                      onClick={() =>
                        void act(
                          selected.handle,
                          { action: "role", role: roleDraft === "" ? null : roleDraft },
                          "Staff role updated.",
                        )
                      }
                      className={BUTTON_PRIMARY}
                    >
                      Apply
                    </button>
                  </div>
                  {selected.handle === meHandle ? (
                    <p className="mt-2 text-[10.5px] text-[#6E7C93]">You cannot change your own role.</p>
                  ) : null}
                </section>
              ) : null}

              {canMoveCoins ? (
                <section className="rounded-lg border border-white/[0.07] bg-[#111318] p-3">
                  <h3 className="text-[12px] font-semibold text-[#F8FAFC]">Adjust wallet</h3>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#6E7C93]">
                    Writes through the version-guarded ledger. Negative values debit.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <input
                      aria-label="Coin delta"
                      type="number"
                      value={delta}
                      onChange={(event) => setDelta(event.target.value)}
                      className={`${INPUT} max-w-[110px] tabular-nums`}
                    />
                    <input
                      aria-label="Adjustment note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Reason (optional)"
                      className={INPUT}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void act(
                        selected.handle,
                        { action: "wallet", delta: Number(delta), note },
                        `Wallet adjusted by ${Number(delta) > 0 ? "+" : ""}${Number(delta).toLocaleString()} coins.`,
                      )
                    }
                    className={`${BUTTON_GHOST} mt-2`}
                  >
                    Move coins
                  </button>
                </section>
              ) : null}

              {canSuspend ? (
                <section className="rounded-lg border border-white/[0.07] bg-[#111318] p-3">
                  <h3 className="text-[12px] font-semibold text-[#F8FAFC]">
                    {selected.status === "SUSPENDED" ? "Restore access" : "Suspend account"}
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-4 text-[#6E7C93]">
                    Suspended accounts cannot sign in. Sessions already issued are blocked from the console.
                  </p>
                  {selected.status === "SUSPENDED" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act(selected.handle, { action: "restore" }, "Account restored.")}
                      className={`${BUTTON_GHOST} mt-2`}
                    >
                      Restore @{selected.handle}
                    </button>
                  ) : (
                    <>
                      <input
                        aria-label="Suspension reason"
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Reason shown to the member on sign-in"
                        className={`${INPUT} mt-2`}
                      />
                      <button
                        type="button"
                        disabled={busy || reason.trim().length < 3}
                        onClick={() => void act(selected.handle, { action: "suspend", reason }, "Account suspended.")}
                        className="mt-2 rounded-lg border border-[#EF4444]/40 px-3 py-1.5 text-[12px] font-medium text-[#FCA5A5] transition-colors hover:bg-[#EF4444]/10 disabled:opacity-40"
                      >
                        Suspend @{selected.handle}
                      </button>
                    </>
                  )}
                </section>
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                <Link href={`/astro`} className={BUTTON_GHOST}>
                  ASTRO profile
                </Link>
                <Link href={`/admin/moderation?subject=${selected.handle}`} className={BUTTON_GHOST}>
                  File a case
                </Link>
                {roleRank(role) >= roleRank("ADMIN") ? null : (
                  <span className="text-[10.5px] leading-4 text-[#6E7C93]">
                    Moderators can suspend and file cases; wallet and role changes need an admin.
                  </span>
                )}
              </div>
            </div>
          </DialogPanel>
        </div>
      ) : null}
    </div>
  );
}
