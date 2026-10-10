'use client';

import { useState, type FormEvent } from 'react';
import { defaultConsentScopes } from '@/lib/agents/scope-list';

export function AgentConsentForm({
  requestId,
  scopes,
  callbackUri,
}: {
  requestId: string;
  scopes: string[];
  callbackUri: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const defaults = defaultConsentScopes(scopes);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const decision = button?.value === 'deny' ? 'deny' : 'allow';
    const selected = new FormData(event.currentTarget).getAll('scope').map(String);
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/oauth/authorize', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ request: requestId, scope: selected.join(','), decision }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || 'Connection failed. Reconnect from your agent.');
      if (typeof result.redirect_to !== 'string')
        throw new Error('Missing callback. Reconnect from your agent.');
      const destination = new URL(result.redirect_to);
      const expected = new URL(callbackUri);
      if (destination.origin !== expected.origin || destination.pathname !== expected.pathname)
        throw new Error('Unexpected callback. Reconnect from your agent.');
      window.location.assign(destination.toString());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Connection failed. Reconnect from your agent.');
      setBusy(false);
    }
  }

  return (
    <form action="/api/oauth/authorize" method="POST" onSubmit={submit} className="space-y-3">
      <input type="hidden" name="request" value={requestId} />
      <fieldset disabled={busy} className="space-y-3">
        <legend className="font-medium">Choose permissions</legend>
        <p className="text-sm text-zinc-400">Only checked permissions will be granted. Content publishing permissions are selected by default. Deletion and private customer inbox access require a separate choice.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {scopes.map((scope) => (
            <label key={scope} className="flex items-start gap-2 rounded-lg border border-zinc-800 p-3 text-sm">
              <input type="checkbox" name="scope" value={scope} defaultChecked={defaults.includes(scope)} className="mt-1 accent-white" />
              <span>{scope}{scope.endsWith(':delete') ? <span className="block text-xs text-amber-300">Permanently delete content</span> : scope === 'inbox:read' ? <span className="block text-xs text-amber-300">Read private customer details</span> : null}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-3">
        <button name="decision" value="allow" disabled={busy} className="rounded-xl bg-white px-5 py-3 font-medium text-zinc-900 disabled:opacity-50">
          {busy ? 'Connecting…' : 'Connect agent'}
        </button>
        <button name="decision" value="deny" disabled={busy} className="rounded-xl border border-zinc-700 px-5 py-3 disabled:opacity-50">Deny</button>
      </div>
      {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
    </form>
  );
}
