"use client";

import { DialogPanel } from "./dialog-panel";

import { useEffect, useState } from "react";
import type { GuardSensitivity, Message, Server, User } from "@/lib/types";
import { Avatar } from "./cosmetics/avatar";
import { Icon } from "./icons";
import { RoleConstructor } from "./role-constructor";

const SENSITIVITY: { key: GuardSensitivity; label: string; blurb: string }[] = [
  { key: "low", label: "Low", blurb: "Only obvious hits — 3 points" },
  { key: "balanced", label: "Balanced", blurb: "Flags at 2 points" },
  { key: "strict", label: "Strict", blurb: "Flags and blocks at 1 point" },
];

function timeAgo(at: number) {
  const diff = Math.max(0, Date.now() - at);
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function ServerConsole({
  open,
  server,
  users,
  me,
  messages,
  onClose,
  onUpdateGuard,
  onResolveFlag,
  onRoles,
  onScan,
}: {
  open: boolean;
  server: Server;
  users: User[];
  me: User;
  messages: Message[];
  onClose: () => void;
  onUpdateGuard: (patch: { enabled?: boolean; sensitivity?: GuardSensitivity; rules?: Server["guard"]["rules"] }) => Promise<void>;
  onResolveFlag: (flagId: string, action: "approve" | "delete") => Promise<void>;
  onRoles: Parameters<typeof RoleConstructor>[0]["onRoles"];
  onScan: (content: string) => Promise<{ score: number; reasons: string[]; threshold: number; flagged: boolean; blocked: boolean }>;
}) {
  const [tab, setTab] = useState<"guard" | "roles">("guard");
  const [termDrafts, setTermDrafts] = useState<Record<string, string>>({});
  const [newRule, setNewRule] = useState("");
  const [newTerms, setNewTerms] = useState("");
  const [test, setTest] = useState("free-nitro dot com, claim airdrop now");
  const [testResult, setTestResult] = useState<{ score: number; reasons: string[]; threshold: number; flagged: boolean; blocked: boolean } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pending = server.flagged.filter((flag) => flag.status === "pending");

  async function act(key: string, action: () => Promise<void>) {
    setBusy(key);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  }

  async function scan() {
    setScanning(true);
    try {
      setTestResult(await onScan(test));
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
      <button type="button" aria-label="Close server console" onClick={onClose} className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm" />
      <DialogPanel
        label="Server console"
        onClose={onClose}
        active={open}
        className="animate-modal relative flex h-full w-full max-w-4xl overflow-hidden bg-[var(--bg-sidebar)] shadow-2xl ring-1 ring-black/50 sm:h-[86vh] sm:rounded-xl"
      >
        <aside className="hidden w-52 shrink-0 flex-col bg-[var(--bg-rail)] sm:flex">
          <div className="flex items-center gap-2 px-4 pb-3 pt-5">
            <span className="text-lg">{server.icon}</span>
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Server console</span>
              <span className="block truncate text-xs font-semibold text-[var(--text)]">{server.name}</span>
            </span>
          </div>
          <nav className="space-y-0.5 px-2">
            {(
              [
                { key: "guard" as const, label: "Guard", icon: "bell" as const, badge: pending.length },
                { key: "roles" as const, label: "Roles", icon: "crown" as const, badge: 0 },
              ]
            ).map((entry) => (
              <button
                key={entry.key}
                type="button"
                onClick={() => setTab(entry.key)}
                className={`flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm transition ${
                  tab === entry.key
                    ? "bg-[var(--bg-active)] font-semibold text-white"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                }`}
              >
                <Icon name={entry.icon} size={16} />
                <span className="flex-1">{entry.label}</span>
                {entry.badge > 0 ? (
                  <span className="rounded-full bg-[var(--red)] px-1.5 text-[10px] font-bold text-white">{entry.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-2 p-3 text-[10px] leading-4 text-[var(--text-faint)]">
            <p className="rounded bg-[var(--bg-sidebar)] p-2">
              The guard runs in-process. Message text never leaves this server, and rules are plain language terms you
              control.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-strong)]">{tab === "guard" ? "Context-aware guard" : "Role constructor"}</h2>
              <p className="text-xs text-[var(--text-muted)]">
                {tab === "guard" ? "Local moderation with plain-language rules — no third-party bot to invite." : "Drag to reorder authority and toggle explicit permissions."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => setTab("guard")}
                  className={`rounded px-2 py-1 text-[11px] ${tab === "guard" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-rail)] text-[var(--text-muted)]"}`}
                >
                  Guard
                </button>
                <button
                  type="button"
                  onClick={() => setTab("roles")}
                  className={`rounded px-2 py-1 text-[11px] ${tab === "roles" ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-rail)] text-[var(--text-muted)]"}`}
                >
                  Roles
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-float)] text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                aria-label="Close server console"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          </header>

          <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">
            {tab === "roles" ? (
              <RoleConstructor server={server} users={users} onRoles={onRoles} />
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-strong)]">Guard enabled</div>
                      <p className="text-[11px] text-[var(--text-muted)]">Scan every new message before it reaches the channel.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void act("toggle", () => onUpdateGuard({ enabled: !server.guard.enabled }))}
                      aria-pressed={server.guard.enabled}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                        server.guard.enabled ? "bg-[var(--green)]" : "bg-[var(--bg-active)]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                          server.guard.enabled ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    {SENSITIVITY.map((entry) => (
                      <button
                        key={entry.key}
                        type="button"
                        onClick={() => void act(`sens-${entry.key}`, () => onUpdateGuard({ sensitivity: entry.key }))}
                        className={`rounded border px-2.5 py-2 text-left transition ${
                          server.guard.sensitivity === entry.key
                            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                            : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <span className="block text-xs font-semibold text-[var(--text)]">{entry.label}</span>
                        <span className="block text-[10px] text-[var(--text-faint)]">{entry.blurb}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Rules</div>
                    <span className="text-[10px] text-[var(--text-faint)]">{server.guard.rules.length} active</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {server.guard.rules.map((rule) => (
                      <div key={rule.id} className="rounded border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-2">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--text)]">{rule.label}</span>
                          <button
                            type="button"
                            onClick={() =>
                              void act(`${rule.id}-del`, () =>
                                onUpdateGuard({ rules: server.guard.rules.filter((entry) => entry.id !== rule.id) }),
                              )
                            }
                            className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-faint)] hover:text-[var(--red)]"
                            aria-label={`Delete ${rule.label}`}
                          >
                            <Icon name="close" size={13} />
                          </button>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {rule.terms.map((term) => (
                            <span
                              key={term}
                              className="flex items-center gap-1 rounded-full bg-[var(--bg-rail)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
                            >
                              {term}
                              <button
                                type="button"
                                aria-label={`Remove ${term}`}
                                onClick={() =>
                                  void act(`${rule.id}-${term}`, () =>
                                    onUpdateGuard({
                                      rules: server.guard.rules.map((entry) =>
                                        entry.id === rule.id
                                          ? { ...entry, terms: entry.terms.filter((candidate) => candidate !== term) }
                                          : entry,
                                      ),
                                    }),
                                  )
                                }
                                className="text-[var(--text-faint)] hover:text-[var(--red)]"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          <input
                            value={termDrafts[rule.id] ?? ""}
                            onChange={(event) => setTermDrafts((current) => ({ ...current, [rule.id]: event.target.value }))}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return;
                              const term = (termDrafts[rule.id] ?? "").trim();
                              if (!term) return;
                              setTermDrafts((current) => ({ ...current, [rule.id]: "" }));
                              void act(`${rule.id}-add`, () =>
                                onUpdateGuard({
                                  rules: server.guard.rules.map((entry) =>
                                    entry.id === rule.id ? { ...entry, terms: [...entry.terms, term].slice(0, 24) } : entry,
                                  ),
                                }),
                              );
                            }}
                            placeholder="+ term"
                            className="w-20 rounded-full bg-[var(--bg-rail)] px-2 py-0.5 text-[10px] text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
                    <input
                      value={newRule}
                      onChange={(event) => setNewRule(event.target.value)}
                      placeholder="Rule name, e.g. Scam links"
                      className="min-w-0 flex-1 rounded bg-[var(--bg-rail)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <input
                      value={newTerms}
                      onChange={(event) => setNewTerms(event.target.value)}
                      placeholder="terms, comma separated"
                      className="min-w-0 flex-1 rounded bg-[var(--bg-rail)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <button
                      type="button"
                      disabled={!newRule.trim() || !newTerms.trim()}
                      onClick={() => {
                        const label = newRule.trim();
                        const terms = newTerms
                          .split(",")
                          .map((term) => term.trim())
                          .filter(Boolean);
                        setNewRule("");
                        setNewTerms("");
                        void act("add-rule", () =>
                          onUpdateGuard({
                            rules: [
                              ...server.guard.rules,
                              { id: `g-${Date.now().toString(36)}`, label, terms },
                            ],
                          }),
                        );
                      }}
                      className="rounded bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-[var(--accent-contrast)] disabled:opacity-40"
                    >
                      Add rule
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Try it locally</div>
                  <p className="mt-0.5 text-[11px] text-[var(--text-faint)]">Runs the real scanner against a sample, without posting anything.</p>
                  <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
                    <input
                      value={test}
                      onChange={(event) => setTest(event.target.value)}
                      className="min-w-0 flex-1 rounded bg-[var(--bg-rail)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => void scan()}
                      disabled={scanning || !test.trim()}
                      className="rounded bg-[var(--bg-active)] px-3 py-1.5 text-[11px] font-semibold text-[var(--text)] disabled:opacity-40"
                    >
                      {scanning ? "Scanning…" : "Scan"}
                    </button>
                  </div>
                  {testResult ? (
                    <div className="mt-2 rounded bg-[var(--bg-rail)] p-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                          style={{
                            background: testResult.blocked
                              ? "var(--red)"
                              : testResult.flagged
                                ? "var(--yellow)"
                                : "var(--green)",
                            color: "#0b0b0d",
                          }}
                        >
                          {testResult.blocked ? "Blocked" : testResult.flagged ? "Flagged" : "Clean"}
                        </span>
                        <span className="text-[var(--text-muted)]">
                          score {testResult.score} · threshold {testResult.threshold}
                        </span>
                      </div>
                      {testResult.reasons.length > 0 ? (
                        <ul className="mt-1 list-inside list-disc text-[var(--text-muted)]">
                          {testResult.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-[var(--text-faint)]">No rule matched.</p>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-chat)] p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Flag queue</div>
                    <span className="rounded-full bg-[var(--bg-rail)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                      {pending.length} pending
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {server.flagged.map((flag) => {
                      const author = users.find((user) => user.id === flag.authorId);
                      const message = messages.find((entry) => entry.id === flag.messageId);
                      const channel = server.channels.find((entry) => entry.id === flag.channelId);
                      return (
                        <div key={flag.id} className="rounded border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-2.5">
                          <div className="flex items-center gap-2">
                            {author ? <Avatar user={author} size={22} /> : null}
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[var(--text)]">
                              {author?.name ?? "Unknown"}
                              <span className="ml-1 font-normal text-[var(--text-faint)]">in #{channel?.name ?? "unknown"}</span>
                            </span>
                            <span className="text-[10px] text-[var(--text-faint)]">{timeAgo(flag.at)}</span>
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase"
                              style={{
                                background: flag.status === "pending" ? "var(--yellow)" : flag.status === "deleted" ? "var(--red)" : "var(--green)",
                                color: "#0b0b0d",
                              }}
                            >
                              {flag.status}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-2 rounded bg-[var(--bg-rail)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
                            {message?.content ?? "Message removed"}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-[var(--text-faint)]">score {flag.score}</span>
                            {flag.reasons.map((reason) => (
                              <span key={reason} className="rounded bg-[var(--bg-rail)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                                {reason}
                              </span>
                            ))}
                            {flag.status === "pending" ? (
                              <span className="ml-auto flex gap-1.5">
                                <button
                                  type="button"
                                  disabled={busy === `${flag.id}-approve`}
                                  onClick={() => void act(`${flag.id}-approve`, () => onResolveFlag(flag.id, "approve"))}
                                  className="rounded bg-[var(--bg-active)] px-2 py-1 text-[10px] font-semibold text-[var(--text)] hover:brightness-110"
                                >
                                  Keep
                                </button>
                                <button
                                  type="button"
                                  disabled={busy === `${flag.id}-delete`}
                                  onClick={() => void act(`${flag.id}-delete`, () => onResolveFlag(flag.id, "delete"))}
                                  className="rounded bg-[var(--red)] px-2 py-1 text-[10px] font-semibold text-white hover:brightness-110"
                                >
                                  Delete
                                </button>
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {server.flagged.length === 0 ? (
                      <p className="py-4 text-center text-[11px] text-[var(--text-muted)]">Nothing in the queue. Quiet servers are good servers.</p>
                    ) : null}
                  </div>
                </div>

                <p className="text-[10px] text-[var(--text-faint)]">
                  Signed in as {me.name}. Guard actions are scoped to {server.name}.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogPanel>
    </div>
  );
}
