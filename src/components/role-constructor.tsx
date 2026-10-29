"use client";

import { useEffect, useState } from "react";
import type { PermissionKey, Server, ServerRole, User } from "@/lib/types";
import { Avatar } from "./cosmetics/avatar";
import { Icon } from "./icons";

const PERMISSIONS: { key: PermissionKey; label: string; hint: string }[] = [
  { key: "view", label: "View", hint: "See the channel" },
  { key: "send", label: "Send", hint: "Post messages" },
  { key: "react", label: "React", hint: "Add reactions" },
  { key: "attach", label: "Attach", hint: "Upload media" },
  { key: "voice", label: "Voice", hint: "Join audio rooms" },
  { key: "moderate", label: "Moderate", hint: "Resolve guard flags" },
  { key: "manageChannels", label: "Channels", hint: "Edit layouts and docs" },
  { key: "manageRoles", label: "Roles", hint: "Edit this hierarchy" },
  { key: "manageServer", label: "Server", hint: "Full control" },
  { key: "mint", label: "Mint", hint: "Publish storefront cosmetics" },
];

const ROLE_COLORS = ["#f0b232", "#3ba55d", "#4d8bf0", "#b862f0", "#eb459e", "#f23f43", "#22d3ee", "#b5bac1"];

export function RoleConstructor({
  server,
  users,
  onRoles,
}: {
  server: Server;
  users: User[];
  onRoles: (
    payload:
      | { create: { name?: string; color?: string; permissions?: string[] } }
      | { update: { id: string; name?: string; color?: string; permissions?: string[] } }
      | { delete: string }
      | { order: string[] },
  ) => Promise<void>;
}) {
  const [roles, setRoles] = useState<ServerRole[]>(server.roles);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(server.roles[0]?.id ?? null);

  useEffect(() => {
    setRoles(server.roles);
  }, [server.roles]);

  const memberCount = (role: ServerRole) =>
    users.filter((user) => user.roles.some((entry) => entry.name === role.name)).length;

  async function run(key: string, action: () => Promise<void>) {
    setPending(key);
    try {
      await action();
    } finally {
      setPending(null);
    }
  }

  function drop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = roles.findIndex((role) => role.id === dragId);
    const to = roles.findIndex((role) => role.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...roles];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRoles(next);
    void run("order", () => onRoles({ order: next.map((role) => role.id) }));
    setDragId(null);
    setOverId(null);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-[var(--accent-2)]">
            <Icon name="crown" size={15} />
          </span>
          <div>
            <div className="text-xs font-semibold text-[var(--text-strong)]">Visual hierarchy</div>
            <p className="text-[11px] leading-5 text-[var(--text-muted)]">
              Drag a node to reorder it. The top of the graph is the highest authority; permissions are explicit, never
              inherited by accident.
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute bottom-4 left-[15px] top-4 w-px bg-[var(--border-strong)]" aria-hidden />
        <div className="space-y-1.5">
          {roles.map((role, index) => {
            const count = memberCount(role);
            const open = expanded === role.id;
            return (
              <div
                key={role.id}
                draggable
                onDragStart={() => setDragId(role.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(role.id);
                }}
                onDrop={() => drop(role.id)}
                className={`relative pl-8 transition ${dragId === role.id ? "opacity-50" : ""} ${
                  overId === role.id && dragId && dragId !== role.id ? "translate-y-0.5" : ""
                }`}
              >
                <span
                  className="absolute left-[9px] top-4 z-10 h-3.5 w-3.5 rounded-full ring-4 ring-[var(--bg-sidebar)]"
                  style={{ background: role.color }}
                  aria-hidden
                />
                <div
                  className={`rounded-lg border bg-[var(--bg-chat)] ${
                    open ? "border-[var(--border-strong)]" : "border-[var(--border-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2 px-2.5 py-2">
                    <span className="cursor-grab select-none text-[13px] leading-none text-[var(--text-faint)]" title="Drag to reorder">
                      ⠿
                    </span>
                    <span className="w-4 text-[10px] tabular-nums text-[var(--text-faint)]">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: role.color }}>
                      {role.name}
                    </span>
                    <span className="rounded bg-[var(--bg-rail)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--text-muted)]">
                      {count} member{count === 1 ? "" : "s"}
                    </span>
                    <span className="hidden text-[10px] text-[var(--text-faint)] sm:inline">
                      {role.permissions.length}/{PERMISSIONS.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : role.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                      aria-label={open ? "Collapse role" : "Expand role"}
                    >
                      <Icon name="chevron-down" size={14} className={open ? "rotate-180" : ""} />
                    </button>
                  </div>

                  {open ? (
                    <div className="space-y-3 border-t border-[var(--border-subtle)] px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={role.name}
                          maxLength={32}
                          onChange={(event) => {
                            const name = event.target.value;
                            setRoles((current) => current.map((entry) => (entry.id === role.id ? { ...entry, name } : entry)));
                          }}
                          onBlur={(event) => {
                            const name = event.target.value.trim();
                            if (name && name !== server.roles.find((entry) => entry.id === role.id)?.name) {
                              void run(role.id, () => onRoles({ update: { id: role.id, name } }));
                            }
                          }}
                          className="min-w-0 flex-1 rounded bg-[var(--bg-rail)] px-2 py-1.5 text-xs font-semibold text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                        <div className="flex items-center gap-1">
                          {ROLE_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              aria-label={`Set colour ${color}`}
                              onClick={() => {
                                setRoles((current) =>
                                  current.map((entry) => (entry.id === role.id ? { ...entry, color } : entry)),
                                );
                                void run(`${role.id}-${color}`, () => onRoles({ update: { id: role.id, color } }));
                              }}
                              className={`h-4 w-4 rounded-full ring-1 transition ${
                                role.color === color ? "ring-white" : "ring-transparent hover:ring-white/40"
                              }`}
                              style={{ background: color }}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={pending?.startsWith(role.id) ?? false}
                          onClick={() => {
                            if (!window.confirm(`Delete the ${role.name} role?`)) return;
                            void run(`${role.id}-delete`, () => onRoles({ delete: role.id }));
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-faint)] hover:bg-[var(--bg-hover)] hover:text-[var(--red)]"
                          aria-label={`Delete ${role.name}`}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {PERMISSIONS.map((permission) => {
                          const on = role.permissions.includes(permission.key);
                          return (
                            <button
                              key={permission.key}
                              type="button"
                              onClick={() => {
                                const permissions = on
                                  ? role.permissions.filter((key) => key !== permission.key)
                                  : [...role.permissions, permission.key];
                                setRoles((current) =>
                                  current.map((entry) => (entry.id === role.id ? { ...entry, permissions } : entry)),
                                );
                                void run(`${role.id}-${permission.key}`, () =>
                                  onRoles({ update: { id: role.id, permissions } }),
                                );
                              }}
                              className={`flex items-center gap-2 rounded border px-2 py-1.5 text-left transition ${
                                on
                                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                                  : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                              }`}
                            >
                              <span
                                className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                                  on ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--border-strong)]"
                                }`}
                              >
                                {on ? <Icon name="check" size={10} /> : null}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[11px] font-semibold text-[var(--text)]">{permission.label}</span>
                                <span className="block truncate text-[10px] text-[var(--text-faint)]">{permission.hint}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 border-t border-[var(--border-subtle)] pt-2">
                        <div className="flex -space-x-1.5">
                          {users
                            .filter((user) => user.roles.some((entry) => entry.name === role.name))
                            .slice(0, 5)
                            .map((user) => (
                              <Avatar key={user.id} user={user} size={22} />
                            ))}
                        </div>
                        <span className="text-[10px] text-[var(--text-faint)]">
                          {count === 0 ? "Nobody has this role yet" : `${count} assigned · drag members in from the member list`}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] p-2">
        <input
          value={newName}
          maxLength={32}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="New role name"
          className="min-w-0 flex-1 bg-transparent px-1.5 text-xs text-[var(--text)] outline-none"
        />
        <button
          type="button"
          disabled={!newName.trim() || pending === "create"}
          onClick={() => {
            const name = newName.trim();
            setNewName("");
            void run("create", () =>
              onRoles({ create: { name, color: ROLE_COLORS[Math.floor(Math.random() * ROLE_COLORS.length)], permissions: ["view", "send", "react"] } }),
            );
          }}
          className="flex items-center gap-1 rounded bg-[var(--accent)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--accent-contrast)] disabled:opacity-40"
        >
          <Icon name="plus" size={12} /> Add role
        </button>
      </div>
    </div>
  );
}
