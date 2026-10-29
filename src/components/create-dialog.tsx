"use client";

import { useEffect, useState } from "react";
import { DialogPanel } from "./dialog-panel";

/**
 * One dialog for both creation flows: a name, and for channels a type. The
 * server re-validates the name, so this only blocks obvious mistakes.
 */
export function CreateDialog({
  open,
  title,
  description,
  label,
  placeholder,
  submitLabel,
  withType = false,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  withType?: boolean;
  onClose: () => void;
  onSubmit: (name: string, type: "text" | "voice") => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"text" | "voice">("text");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setType("text");
    setError(null);
  }, [open]);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Enter a name first.");
      return;
    }

    setBusy(true);
    try {
      await onSubmit(name.trim(), type);
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-[14px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-faint)] focus-visible:border-[var(--accent)]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <DialogPanel
        label={title}
        onClose={onClose}
        active={open}
        className="animate-modal relative w-full max-w-md overflow-hidden rounded-xl bg-[var(--bg-chat)] p-5 shadow-2xl ring-1 ring-black/50"
      >
        <h2 className="text-[17px] font-bold text-[var(--text-strong)]">{title}</h2>
        {description ? (
          <p className="mt-1 text-[12.5px] leading-5 text-[var(--text-muted)]">{description}</p>
        ) : null}

        <form onSubmit={submit} className="mt-4">
          <label htmlFor="create-name" className="mb-1.5 block text-[12px] font-medium text-[var(--text-muted)]">
            {label}
          </label>
          <input
            id="create-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={placeholder}
            maxLength={48}
            autoFocus
            className={field}
          />

          {withType ? (
            <fieldset className="mt-3">
              <legend className="mb-1.5 block text-[12px] font-medium text-[var(--text-muted)]">Type</legend>
              <div className="flex rounded-lg border border-white/10 bg-black p-1" role="radiogroup" aria-label="Channel type">
                {(
                  [
                    { value: "text" as const, label: "Text" },
                    { value: "voice" as const, label: "Voice" },
                  ]
                ).map((option) => (
                  <label
                    key={option.value}
                    className={`flex-1 cursor-pointer rounded-md px-2 py-1.5 text-center text-[12.5px] font-semibold transition-colors ${
                      type === option.value
                        ? "bg-[var(--accent)] text-[var(--accent-contrast)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel-type"
                      value={option.value}
                      checked={type === option.value}
                      onChange={() => setType(option.value)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 rounded-lg border border-[var(--red)]/40 bg-[var(--red)]/10 px-3 py-2 text-[12px] text-[var(--text)]">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/15 px-3.5 py-2 text-[13px] font-medium text-[var(--text-muted)] transition hover:text-[var(--text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[var(--accent)] px-3.5 py-2 text-[13px] font-semibold text-[var(--accent-contrast)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Working…" : submitLabel}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  );
}
