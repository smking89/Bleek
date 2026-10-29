"use client";

import { useEffect, useState } from "react";
import type { Channel, Server, User } from "@/lib/types";
import { DialogPanel } from "./dialog-panel";
import { Icon } from "./icons";

/**
 * One place to run a server: name, invite code, the channel list, and the exit.
 * Owners get rename/delete controls; members get the code, channel topics and leave.
 */
export function ServerSettings({
  open,
  server,
  me,
  onClose,
  onRename,
  onRotateInvite,
  onRenameChannel,
  onDeleteChannel,
  onDeleteServer,
  onLeaveServer,
}: {
  open: boolean;
  server: Server;
  me: User;
  onClose: () => void;
  onRename: (name: string) => Promise<void>;
  onRotateInvite: () => Promise<void>;
  onRenameChannel: (channelId: string, name: string) => Promise<void>;
  onDeleteChannel: (channelId: string) => Promise<void>;
  onDeleteServer: () => Promise<void>;
  onLeaveServer: () => Promise<void>;
}) {
  const isOwner = server.ownerId === me.id;
  const [name, setName] = useState(server.name);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(server.name);
    setEditing(null);
    setConfirmDelete(false);
    setCopied(false);
    setError(null);
  }, [open, server.name]);

  if (!open) return null;

  async function run(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await action();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "That did not work.");
      throw thrown;
    } finally {
      setBusy(null);
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(server.inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Copying is blocked in this browser. Select the code and copy it manually.");
    }
  }

  const field =
    "w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-[13.5px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus-visible:border-[var(--accent)]";
  const label = "mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]";
  const danger =
    "rounded-lg border border-[var(--red)]/45 px-3 py-1.5 text-[12px] font-semibold text-[var(--red)] transition hover:bg-[var(--red)]/10 disabled:cursor-not-allowed disabled:opacity-50";

  const channels: Channel[] = server.channels;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close server settings"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <DialogPanel
        label={`${server.name} settings`}
        onClose={onClose}
        active={open}
        className="animate-modal relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-[var(--bg-chat)] shadow-2xl ring-1 ring-black/50"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-bold text-[var(--text-strong)]">{server.name}</h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--text-muted)]">
              {isOwner ? "You own this server." : "You joined this server."} ·{" "}
              {channels.length} {channels.length === 1 ? "channel" : "channels"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close server settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
          >
            <Icon name="close" size={16} />
          </button>
        </header>

        <div className="scroll-thin flex-1 space-y-6 overflow-y-auto px-5 py-4">
          {isOwner ? (
            <section>
              <label htmlFor="server-name" className={label}>
                Server name
              </label>
              <div className="flex gap-2">
                <input
                  id="server-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={48}
                  className={field}
                />
                <button
                  type="button"
                  disabled={busy === "name" || !name.trim() || name.trim() === server.name}
                  onClick={() => void run("name", () => onRename(name.trim())).catch(() => {})}
                  className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === "name" ? "Saving…" : "Save"}
                </button>
              </div>
            </section>
          ) : null}

          <section>
            <span className={label}>Invite code</span>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] px-3 py-2.5">
              <code className="flex-1 font-mono text-[15px] tracking-[0.2em] text-[var(--text-strong)]">
                {server.inviteCode}
              </code>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
              >
                <Icon name="copy" size={13} />
                {copied ? "Copied" : "Copy"}
              </button>
              {isOwner ? (
                <button
                  type="button"
                  disabled={busy === "invite"}
                  onClick={() => void run("invite", onRotateInvite).catch(() => {})}
                  className="rounded-md px-2 py-1 text-[11.5px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)] disabled:opacity-50"
                >
                  {busy === "invite" ? "Rotating…" : "New code"}
                </button>
              ) : null}
            </div>
            <p className="mt-1.5 text-[11.5px] leading-5 text-[var(--text-muted)]">
              Anyone with this code can join. Issuing a new one stops the old code working immediately.
            </p>
          </section>

          <section>
            <span className={label}>Channels</span>
            <ul className="divide-y divide-[var(--border-subtle)] overflow-hidden rounded-lg border border-[var(--border-subtle)]">
              {channels.map((channel) => (
                <li key={channel.id} className="flex items-center gap-2 bg-[var(--bg-sidebar)] px-3 py-2">
                  <Icon
                    name={channel.type === "text" ? "hash" : "volume"}
                    size={15}
                    className="shrink-0 text-[var(--text-faint)]"
                  />
                  {editing?.id === channel.id ? (
                    <form
                      className="flex min-w-0 flex-1 items-center gap-1.5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void run(`rename-${channel.id}`, async () => {
                          await onRenameChannel(channel.id, editing.value);
                          setEditing(null);
                        }).catch(() => {});
                      }}
                    >
                      <input
                        value={editing.value}
                        onChange={(event) => setEditing({ id: channel.id, value: event.target.value })}
                        maxLength={24}
                        autoFocus
                        aria-label={`Rename ${channel.name}`}
                        className="min-w-0 flex-1 rounded border border-[var(--border-strong)] bg-black px-2 py-1 font-mono text-[12.5px] text-[var(--text)] outline-none focus-visible:border-[var(--accent)]"
                      />
                      <button
                        type="submit"
                        disabled={busy === `rename-${channel.id}`}
                        className="rounded px-2 py-1 text-[11.5px] font-semibold text-[var(--accent-2)] disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="rounded px-2 py-1 text-[11.5px] font-semibold text-[var(--text-muted)]"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text)]">{channel.name}</span>
                      {isOwner ? (
                        <span className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setEditing({ id: channel.id, value: channel.name })}
                            title={`Rename ${channel.name}`}
                            aria-label={`Rename ${channel.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
                          >
                            <Icon name="pencil" size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={busy === `delete-${channel.id}` || channels.length <= 1}
                            onClick={() => void run(`delete-${channel.id}`, () => onDeleteChannel(channel.id)).catch(() => {})}
                            title={`Delete ${channel.name}`}
                            aria-label={`Delete ${channel.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--red)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Icon name="trash" size={13} />
                          </button>
                        </span>
                      ) : null}
                    </>
                  )}
                </li>
              ))}
            </ul>
            {isOwner && channels.length <= 1 ? (
              <p className="mt-1.5 text-[11.5px] text-[var(--text-muted)]">A server keeps at least one channel.</p>
            ) : null}
          </section>

          <section className="rounded-lg border border-[var(--border-subtle)] p-3">
            <span className={label}>{isOwner ? "Delete this server" : "Leave this server"}</span>
            <p className="mb-2.5 text-[12px] leading-5 text-[var(--text-muted)]">
              {isOwner
                ? "Deleting removes every channel, message, role and storefront item. This cannot be undone."
                : "Leaving removes the server from your rail. You can rejoin later with a current invite code."}
            </p>
            {isOwner ? (
              confirmDelete ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy === "delete"}
                    onClick={() => void run("delete", onDeleteServer).catch(() => {})}
                    className={danger}
                  >
                    {busy === "delete" ? "Deleting…" : "Yes, delete permanently"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)]"
                  >
                    Keep server
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className={danger}>
                  Delete server
                </button>
              )
            ) : (
              <button
                type="button"
                disabled={busy === "leave"}
                onClick={() => void run("leave", onLeaveServer).catch(() => {})}
                className={danger}
              >
                {busy === "leave" ? "Leaving…" : "Leave server"}
              </button>
            )}
          </section>

          {error ? (
            <p role="alert" className="rounded-lg bg-[var(--red)]/10 px-3 py-2 text-[12px] text-[var(--red)]">
              {error}
            </p>
          ) : null}
        </div>
      </DialogPanel>
    </div>
  );
}
