"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DialogPanel } from "@/components/dialog-panel";
import {
  API_SCOPES,
  DEFAULT_SCOPES,
  maskSecret,
  type ScopeKey,
} from "@/lib/dev/keys";
import type { DevApp, UsagePoint } from "@/lib/dev/apps";
import {
  BUTTON_GHOST,
  BUTTON_PRIMARY,
  EmptyState,
  Eyebrow,
  Field,
  INPUT,
  Panel,
  PanelHeader,
  Sparkline,
} from "@/components/admin/ui";
import { Icon } from "@/components/icons";

export type RequestView = {
  id: string;
  appId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  createdAt: string;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function toggleScope(current: ScopeKey[], scope: ScopeKey): ScopeKey[] {
  return current.includes(scope) ? current.filter((entry) => entry !== scope) : [...current, scope];
}

export function AppConsole({
  apps,
  usage,
  requests,
  handle,
}: {
  apps: DevApp[];
  usage: Record<string, UsagePoint[]>;
  requests: RequestView[];
  handle: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(apps.length === 0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState<"DEVELOPMENT" | "PRODUCTION">("DEVELOPMENT");
  const [scopes, setScopes] = useState<ScopeKey[]>([...DEFAULT_SCOPES]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secret, setSecret] = useState<{ name: string; clientId: string; secret: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const totalRequests = apps.reduce((sum, app) => sum + app.requestCount, 0);
  const appName = (id: string) => apps.find((app) => app.id === id)?.name ?? "app";

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("Clipboard access was blocked. Select the value and copy it manually.");
    }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/dev/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, environment, scopes }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        app?: DevApp;
        secret?: string;
      };

      if (!response.ok || !data.app || !data.secret) {
        setError(data.error ?? "That app could not be created.");
        return;
      }

      setSecret({ name: data.app.name, clientId: data.app.clientId, secret: data.secret });
      setNotice(`${data.app.name} created. The key is shown once.`);
      setName("");
      setDescription("");
      setScopes([...DEFAULT_SCOPES]);
      setCreating(false);
      router.refresh();
    } catch {
      setError("The developer portal could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function appAction(id: string, body: Record<string, unknown>, success: string) {
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/dev/apps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        app?: DevApp;
        secret?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "That action was rejected.");
        return;
      }

      if (data.secret && data.app) {
        setSecret({ name: data.app.name, clientId: data.app.clientId, secret: data.secret });
      }
      setNotice(success);
      router.refresh();
    } catch {
      setError("The developer portal could not reach the server.");
    }
  }

  async function deleteApp(id: string) {
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/dev/apps/${id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "That app could not be deleted.");
        return;
      }
      setNotice("App deleted. Its keys and request history are gone.");
      router.refresh();
    } catch {
      setError("The developer portal could not reach the server.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Developer portal</Eyebrow>
          <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-[#F8FAFC]">Apps and API keys</h1>
          <p className="mt-1 text-[12.5px] text-[#94A3B8]">
            Signed in as <span className="text-[#CBD5E1]">@{handle}</span>. Keys act on your ASTRO account only.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/developers/docs" className={BUTTON_GHOST}>
            API reference
          </Link>
          <button type="button" onClick={() => setCreating((value) => !value)} className={BUTTON_PRIMARY}>
            {creating ? "Close form" : "New app"}
          </button>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {[
          { label: "Apps", value: apps.length.toString(), hint: `${apps.filter((app) => app.status === "ACTIVE").length} active` },
          { label: "Requests", value: totalRequests.toLocaleString(), hint: "all time" },
          {
            label: "24h errors",
            value: apps.reduce((sum, app) => sum + app.errorCount, 0).toLocaleString(),
            hint: "lifetime failures",
          },
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
      {notice ? (
        <p role="status" className="rounded-lg border border-[#23A55A]/35 bg-[#23A55A]/10 px-3 py-2 text-[12px] text-[#8BE0AD]">
          {notice}
        </p>
      ) : null}

      {creating ? (
        <Panel>
          <PanelHeader title="Create an app" hint="A key is generated once. Store it before closing the dialog." />
          <form onSubmit={create} className="grid gap-3 px-4 py-4 sm:grid-cols-2">
            <Field label="App name" htmlFor="app-name">
              <input
                id="app-name"
                required
                minLength={2}
                maxLength={48}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Koba Launcher"
                className={INPUT}
              />
            </Field>
            <Field label="Environment" htmlFor="app-env">
              <select
                id="app-env"
                value={environment}
                onChange={(event) => setEnvironment(event.target.value as "DEVELOPMENT" | "PRODUCTION")}
                className={INPUT}
              >
                <option value="DEVELOPMENT">Development</option>
                <option value="PRODUCTION">Production</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" htmlFor="app-description" hint="Optional. Shown only to you.">
                <input
                  id="app-description"
                  maxLength={240}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Syncs Koba match results into the shared wallet"
                  className={INPUT}
                />
              </Field>
            </div>

            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 text-[11px] font-medium text-[#CBD5E1]">Scopes</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {API_SCOPES.map((scope) => (
                  <label
                    key={scope.key}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/[0.07] bg-[#111318] px-2.5 py-2 text-[11px] text-[#CBD5E1]"
                  >
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope.key)}
                      onChange={() => setScopes((current) => toggleScope(current, scope.key))}
                      className="mt-0.5 accent-[#4F46E5]"
                    />
                    <span>
                      <span className="block font-mono text-[10.5px] text-[#A5B4FC]">{scope.key}</span>
                      <span className="mt-0.5 block text-[10.5px] leading-4 text-[#6E7C93]">{scope.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="sm:col-span-2">
              <button type="submit" disabled={busy || scopes.length === 0} className={BUTTON_PRIMARY}>
                {busy ? "Creating…" : "Create app and key"}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      {apps.length === 0 ? (
        <Panel>
          <EmptyState
            title="No apps yet"
            body="Create an app to get a client id and a secret key, then call /api/v1/me with it."
          />
        </Panel>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {apps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              points={usage[app.id] ?? []}
              copied={copied}
              onCopy={copy}
              onAction={appAction}
              onDelete={deleteApp}
            />
          ))}
        </div>
      )}

      <Panel>
        <PanelHeader
          title="Recent API calls"
          hint="The last 12 calls across every key on this account"
          action={
            requests.length > 0 ? (
              <span className="text-[10.5px] tabular-nums text-[#6E7C93]">{requests.length} shown</span>
            ) : null
          }
        />
        {requests.length === 0 ? (
          <p className="px-4 py-5 text-[12px] leading-5 text-[#94A3B8]">
            No calls yet. Try{" "}
            <code className="rounded bg-[#111318] px-1.5 py-0.5 font-mono text-[11px] text-[#67E8F9]">
              GET /api/v1/me
            </code>{" "}
            with a key from above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-[#6E7C93]">
                  <th scope="col" className="px-4 py-2 font-semibold">Method</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Path</th>
                  <th scope="col" className="px-3 py-2 font-semibold">App</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Status</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Time</th>
                  <th scope="col" className="px-4 py-2 font-semibold">When</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-4 py-2 font-mono text-[11px] text-[#94A3B8]">{entry.method}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-[#CBD5E1]">{entry.path}</td>
                    <td className="px-3 py-2 text-[11px] text-[#94A3B8]">{appName(entry.appId)}</td>
                    <td
                      className={`px-3 py-2 text-right font-mono text-[11px] ${
                        entry.status >= 400 ? "text-[#FCA5A5]" : "text-[#8BE0AD]"
                      }`}
                    >
                      {entry.status}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px] tabular-nums text-[#94A3B8]">
                      {entry.durationMs}ms
                    </td>
                    <td className="px-4 py-2 text-[11px] text-[#6E7C93]">{formatWhen(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {secret ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSecret(null);
          }}
        >
          <DialogPanel
            label={`Key for ${secret.name}`}
            onClose={() => setSecret(null)}
            className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0B0C0E] p-5"
          >
            <Eyebrow>Secret key</Eyebrow>
            <h2 className="mt-1 text-[17px] font-semibold text-[#F8FAFC]">{secret.name}</h2>
            <p className="mt-1 text-[12px] leading-5 text-[#FCA5A5]">
              Copy this now. It is stored as a hash and cannot be shown again — rotating replaces it.
            </p>
            <code className="mt-3 block break-all rounded-lg border border-white/[0.08] bg-[#111318] p-3 font-mono text-[11.5px] leading-5 text-[#67E8F9]">
              {secret.secret}
            </code>
            <p className="mt-2 text-[10.5px] text-[#6E7C93]">
              Client id <span className="font-mono text-[#94A3B8]">{secret.clientId}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copy(secret.secret, "modal")} className={BUTTON_PRIMARY}>
                <Icon name="copy" size={14} />
                {copied === "modal" ? "Copied" : "Copy key"}
              </button>
              <button type="button" onClick={() => setSecret(null)} className={BUTTON_GHOST}>
                I stored it
              </button>
            </div>
          </DialogPanel>
        </div>
      ) : null}
    </div>
  );
}

function AppCard({
  app,
  points,
  copied,
  onCopy,
  onAction,
  onDelete,
}: {
  app: DevApp;
  points: UsagePoint[];
  copied: string | null;
  onCopy: (value: string, key: string) => Promise<void>;
  onAction: (id: string, body: Record<string, unknown>, success: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draftScopes, setDraftScopes] = useState<ScopeKey[]>(app.scopes as ScopeKey[]);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const total = points.reduce((sum, point) => sum + point.requests, 0);
  const errors = points.reduce((sum, point) => sum + point.errors, 0);
  const successRate = total > 0 ? 100 - (errors / total) * 100 : 100;

  async function run(body: Record<string, unknown>, success: string) {
    setBusy(true);
    try {
      await onAction(app.id, body, success);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-xl border border-white/[0.08] bg-[#0B0C0E] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="truncate text-[14px] font-semibold text-[#F8FAFC]">{app.name}</h2>
            <span className="rounded-full border border-white/12 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">
              {app.environment.toLowerCase()}
            </span>
            <span
              className={`rounded-full border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] ${
                app.status === "ACTIVE"
                  ? "border-[#23A55A]/35 text-[#8BE0AD]"
                  : "border-[#EF4444]/45 text-[#FCA5A5]"
              }`}
            >
              {app.status.toLowerCase()}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-5 text-[#94A3B8]">
            {app.description ?? "No description"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onCopy(app.clientId, `client-${app.id}`)}
          className="text-[10.5px] font-medium text-[#A5B4FC] hover:text-[#C7D2FE]"
        >
          {copied === `client-${app.id}` ? "Copied" : "Copy client id"}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#111318] px-2.5 py-2">
        <Icon name="key" size={14} className="shrink-0 text-[#6E7C93]" />
        <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[#CBD5E1]">
          {maskSecret(app.keyPrefix, app.lastFour)}
        </code>
        <button
          type="button"
          onClick={() => void run({ action: "rotate" }, "Key rotated. The previous key no longer works.")}
          disabled={busy}
          className="shrink-0 rounded-md border border-white/12 px-2 py-1 text-[10.5px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white disabled:opacity-40"
        >
          Rotate
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
        <dl className="grid grid-cols-3 gap-2">
          {[
            { label: "Requests", value: app.requestCount.toLocaleString() },
            { label: "Errors", value: app.errorCount.toLocaleString() },
            { label: "14d ok", value: `${successRate.toFixed(0)}%` },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="text-[9.5px] uppercase tracking-[0.12em] text-[#6E7C93]">{stat.label}</dt>
              <dd className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#F8FAFC]">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <div>
          <Sparkline values={points.map((point) => point.requests)} tone="cyan" />
          <p className="mt-1 text-right text-[9.5px] text-[#6E7C93]">
            {total.toLocaleString()} in 14d · {errors} failed
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1">
        {(app.scopes as ScopeKey[]).map((scope) => (
          <span
            key={scope}
            className="rounded-full border border-[#4F46E5]/40 px-1.5 py-0.5 font-mono text-[9.5px] text-[#A5B4FC]"
          >
            {scope}
          </span>
        ))}
      </div>

      <details className="mt-3 rounded-lg border border-white/[0.07] bg-[#111318] px-2.5 py-2">
        <summary className="cursor-pointer text-[11px] font-medium text-[#CBD5E1]">Edit scopes</summary>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {API_SCOPES.map((scope) => (
            <label key={scope.key} className="flex items-start gap-1.5 text-[10.5px] text-[#94A3B8]">
              <input
                type="checkbox"
                checked={draftScopes.includes(scope.key)}
                onChange={() => setDraftScopes((current) => toggleScope(current, scope.key))}
                className="mt-0.5 accent-[#4F46E5]"
              />
              <span className="font-mono text-[10px] text-[#A5B4FC]">{scope.key}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={busy || draftScopes.length === 0}
          onClick={() => void run({ action: "update", scopes: draftScopes }, "Scopes updated.")}
          className="mt-2 rounded-md border border-white/12 px-2.5 py-1 text-[10.5px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white disabled:opacity-40"
        >
          Save scopes
        </button>
      </details>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void run(
              { action: app.status === "ACTIVE" ? "revoke" : "restore" },
              app.status === "ACTIVE" ? "Key revoked." : "Key restored.",
            )
          }
          className="rounded-md border border-white/12 px-2.5 py-1 text-[10.5px] font-medium text-[#CBD5E1] transition-colors hover:border-white/25 hover:text-white disabled:opacity-40"
        >
          {busy ? "Working…" : app.status === "ACTIVE" ? "Revoke key" : "Restore key"}
        </button>

        {confirmDelete ? (
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void onDelete(app.id)}
              className="rounded-md border border-[#EF4444]/45 px-2.5 py-1 text-[10.5px] font-semibold text-[#FCA5A5] transition-colors hover:bg-[#EF4444]/10"
            >
              Delete permanently
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-[10.5px] text-[#6E7C93] hover:text-[#CBD5E1]"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-[10.5px] text-[#6E7C93] transition-colors hover:text-[#FCA5A5]"
          >
            Delete app
          </button>
        )}

        <span className="ml-auto text-[9.5px] text-[#6E7C93]">
          {app.lastUsedAt
            ? `Last used ${new Date(app.lastUsedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`
            : "Never used"}
        </span>
      </div>
    </article>
  );
}
