'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SCOPES, EDITOR_SCOPES, type Scope } from '@/lib/agents/scope-list';

type Job = {
  id: string;
  prompt: string;
  status: string;
  expected_posts: number | null;
  run_at: string;
  attempts: number;
  progress: { stage?: string; message?: string };
  report: {
    summary?: string;
    items?: {
      title: string;
      status: string;
      url?: string;
      note?: string;
      sources?: string[];
    }[];
    warnings?: string[];
  } | null;
  updated_at: string;
};
type Credential = {
  id: string;
  name: string;
  scopes: string[];
  expires_at: string;
  revoked_at: string | null;
};
type Overview = {
  endpoint: string;
  credentials: Credential[];
  jobs: Job[];
  audit: {
    id: number;
    actor: string;
    operation: string;
    entity_id: string;
    created_at: string;
  }[];
};
const field =
  'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100';
const button =
  'rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50';
export function AgentConsole() {
  const [overview, setOverview] = useState<Overview | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState('');
  const [name, setName] = useState('Hermes'),
    [scopes, setScopes] = useState<Scope[]>(EDITOR_SCOPES),
    [days, setDays] = useState(30);
  const [prompt, setPrompt] = useState(''),
    [expected, setExpected] = useState(''),
    [runAt, setRunAt] = useState('');
  const jobKey = useRef('');
  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/agents', { cache: 'no-store' }),
        data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dashboard unavailable');
    }
  }, []);
  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 30000);
    return () => clearInterval(id);
  }, [refresh]);
  async function action(body: unknown) {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
        data = await r.json();
      if (!r.ok) throw new Error(data.error);
      await refresh();
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10 text-zinc-100">
      <div>
        <h1 className="text-2xl font-semibold">Agent control</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Connect ChatGPT or your own agent. Tasks, progress and completion
          reports stay here.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300"
        >
          {error}
        </p>
      )}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <h2 className="font-semibold">Connection</h2>
        <p className="mt-2 text-sm text-zinc-400">
          ChatGPT: install Makezaa Control and connect using your admin login.
          Hermes and other agents: use this MCP URL with OAuth or a dedicated
          key.
        </p>
        <code className="mt-3 block break-all text-sm text-emerald-300">
          {overview?.endpoint ?? 'Loading connection…'}
        </code>
        <p className="mt-3 text-sm text-zinc-400">
          Your agent handles web research and image generation. To run tasks
          later, configure its scheduler to read and claim queued tasks. A
          queued task waits until an agent picks it up.
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border border-zinc-800 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await action({
              action: 'create_key',
              name,
              scopes,
              days,
            });
            if (result?.token) setToken(result.token);
          }}
        >
          <h2 className="font-semibold">Create an agent key</h2>
          <label className="block text-sm">
            Agent name
            <input
              className={`${field} mt-1`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </label>
          <label className="block text-sm">
            Expires in days
            <input
              type="number"
              className={`${field} mt-1`}
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              required
            />
          </label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setScopes(EDITOR_SCOPES)}
              className="rounded-lg border border-zinc-700 px-3 py-2"
            >
              Content editor
            </button>
            <button
              type="button"
              onClick={() => setScopes([...SCOPES])}
              className="rounded-lg border border-zinc-700 px-3 py-2"
            >
              All CMS permissions
            </button>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm text-zinc-400">Permissions</legend>
            <div className="grid grid-cols-2 gap-2">
              {SCOPES.map((s) => (
                <label key={s} className="flex gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={scopes.includes(s)}
                    onChange={(e) =>
                      setScopes(
                        e.target.checked
                          ? [...scopes, s]
                          : scopes.filter((v) => v !== s),
                      )
                    }
                  />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
          <button className={button} disabled={busy || !scopes.length}>
            Create key
          </button>
          {token && (
            <div className="space-y-2 rounded-xl border border-emerald-700 p-3">
              <p className="text-sm">
                Save this key in your agent’s secret store. It is shown only
                now.
              </p>
              <code className="block break-all text-xs">{token}</code>
              <button
                type="button"
                className="text-sm underline"
                onClick={() => navigator.clipboard.writeText(token)}
              >
                Copy key
              </button>
              <button
                type="button"
                className="ml-4 text-sm underline"
                onClick={() => setToken('')}
              >
                Hide
              </button>
            </div>
          )}
        </form>
        <form
          className="space-y-4 rounded-2xl border border-zinc-800 p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!jobKey.current) jobKey.current = crypto.randomUUID();
            const result = await action({
              action: 'create_job',
              prompt,
              idempotency_key: jobKey.current,
              ...(expected ? { expected_posts: Number(expected) } : {}),
              ...(runAt ? { run_at: new Date(runAt).toISOString() } : {}),
            });
            if (result?.id) {
              setPrompt('');
              setExpected('');
              setRunAt('');
              jobKey.current = '';
            }
          }}
        >
          <h2 className="font-semibold">Queue a task</h2>
          <label className="block text-sm">
            Task
            <textarea
              className={`${field} mt-1 min-h-36`}
              placeholder="Research today’s technology news and publish five original posts with images and source links."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                jobKey.current = '';
              }}
              required
              maxLength={10000}
            />
          </label>
          <label className="block text-sm">
            Required published posts (optional)
            <input
              type="number"
              className={`${field} mt-1`}
              min={1}
              max={50}
              value={expected}
              onChange={(e) => {
                setExpected(e.target.value);
                jobKey.current = '';
              }}
            />
          </label>
          <label className="block text-sm">
            Available from (optional, your local time)
            <input
              type="datetime-local"
              className={`${field} mt-1`}
              value={runAt}
              onChange={(e) => {
                setRunAt(e.target.value);
                jobKey.current = '';
              }}
            />
          </label>
          <p className="text-xs text-zinc-400">
            Ask the connected agent to process the queue, or enable its
            scheduler. This dashboard stores tasks and reports; it does not run
            an AI model by itself.
          </p>
          <button className={button} disabled={busy}>
            Queue task
          </button>
        </form>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Connected agents and keys</h2>
        {overview?.credentials.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 p-4"
          >
            <div>
              <p>
                {c.name}{' '}
                <span className="text-xs text-zinc-500">
                  {c.revoked_at
                    ? 'Revoked'
                    : Date.parse(c.expires_at) <= Date.now()
                      ? 'Expired'
                      : 'Active'}
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Expires {new Date(c.expires_at).toLocaleString()}
              </p>
              <p className="mt-1 max-w-2xl break-words text-xs text-zinc-500">
                {c.scopes.join(', ')}
              </p>
            </div>
            {!c.revoked_at && (
              <button
                disabled={busy}
                className="text-sm text-red-300"
                onClick={() => void action({ action: 'revoke_key', id: c.id })}
              >
                Revoke
              </button>
            )}
          </div>
        ))}
        {overview?.credentials.length === 0 && (
          <p className="text-sm text-zinc-500">No connected agents yet.</p>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tasks and reports</h2>
        {overview?.jobs.map((j) => (
          <article
            key={j.id}
            className="space-y-3 rounded-2xl border border-zinc-800 p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="whitespace-pre-wrap text-sm">{j.prompt}</p>
              <span className="rounded-lg bg-zinc-800 px-2 py-1 text-xs">
                {j.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {j.id} · {j.attempts} attempts · available{' '}
              {new Date(j.run_at).toLocaleString()}
            </p>
            {j.progress?.stage && (
              <p className="text-sm text-zinc-400">
                {j.progress.stage}: {j.progress.message}
              </p>
            )}
            {j.report && (
              <div className="space-y-3 border-t border-zinc-800 pt-3">
                <p className="whitespace-pre-wrap text-sm">
                  {j.report.summary}
                </p>
                {j.report.items?.map((item, i) => (
                  <div key={i} className="text-sm">
                    <p>
                      {item.status} ·{' '}
                      {item.url && /^https:\/\//.test(item.url) ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-300 underline"
                        >
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </p>
                    {item.note && (
                      <p className="text-xs text-zinc-400">{item.note}</p>
                    )}
                    {item.sources?.map((url, k) =>
                      /^https:\/\//.test(url) ? (
                        <a
                          key={k}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-3 inline-block text-xs text-zinc-500 underline"
                        >
                          Source {k + 1}
                        </a>
                      ) : null,
                    )}
                  </div>
                ))}
                {j.report.warnings?.map((w, i) => (
                  <p key={i} className="text-xs text-amber-300">
                    {w}
                  </p>
                ))}
              </div>
            )}
            {['queued', 'running'].includes(j.status) && (
              <button
                disabled={busy}
                className="text-sm text-red-300"
                onClick={() => void action({ action: 'cancel_job', id: j.id })}
              >
                Cancel task
              </button>
            )}
          </article>
        ))}
        {overview?.jobs.length === 0 && (
          <p className="text-sm text-zinc-500">
            Your first task and completion report will appear here.
          </p>
        )}
      </section>
      <section>
        <h2 className="text-lg font-semibold">Recent agent actions</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-zinc-400">
              <tr>
                <th className="p-2">Time</th>
                <th className="p-2">Action</th>
                <th className="p-2">Item</th>
              </tr>
            </thead>
            <tbody>
              {overview?.audit.map((a) => (
                <tr key={a.id} className="border-t border-zinc-800">
                  <td className="p-2">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="p-2">{a.operation}</td>
                  <td className="p-2 break-all">{a.entity_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
