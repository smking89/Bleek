"use client";

import { useEffect, useState } from "react";
import { DialogPanel } from "./dialog-panel";

/** Eight characters, read out or pasted. The server normalises the rest. */
export function JoinServerDialog({
  open,
  onClose,
  onJoin,
}: {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCode("");
    setError(null);
  }, [open]);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length !== 8) {
      setError("An invite code is eight characters.");
      return;
    }

    setBusy(true);
    try {
      await onJoin(cleaned);
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "That code did not work.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <DialogPanel
        label="Join a server"
        onClose={onClose}
        active={open}
        className="animate-modal relative w-full max-w-md overflow-hidden rounded-xl bg-[var(--bg-chat)] p-5 shadow-2xl ring-1 ring-black/50"
      >
        <h2 className="text-[17px] font-bold text-[var(--text-strong)]">Join a server</h2>
        <p className="mt-1 text-[12.5px] leading-5 text-[var(--text-muted)]">
          Paste the eight-character code a server owner or member shared with you.
        </p>

        <form onSubmit={submit} className="mt-4">
          <label htmlFor="invite-code" className="mb-1.5 block text-[12px] font-medium text-[var(--text-muted)]">
            Invite code
          </label>
          <input
            id="invite-code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="K7QM4XPZ"
            maxLength={12}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-lg border border-white/10 bg-black px-3 py-2 font-mono text-[15px] tracking-[0.24em] text-[var(--text)] outline-none transition-colors placeholder:tracking-[0.24em] placeholder:text-[var(--text-faint)] focus-visible:border-[var(--accent)]"
          />

          {error ? (
            <p role="alert" className="mt-2 text-[12px] text-[var(--red)]">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Joining…" : "Join server"}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  );
}
