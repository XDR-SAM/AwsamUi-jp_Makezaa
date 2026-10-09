'use client';

import { useState, type FormEvent } from 'react';

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const decision = button?.value === 'deny' ? 'deny' : 'allow';
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
        body: new URLSearchParams({ request: requestId, scope: scopes.join(','), decision }),
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
      <input type="hidden" name="scope" value={scopes.join(',')} />
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
