'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, Loader2 } from 'lucide-react';

const inputClass = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 text-sm';

export function PasswordRecoveryForm({ reset = false, invalidLink = false }: { reset?: boolean; invalidLink?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(invalidLink ? 'This reset link is invalid or expired. Request a new link and open it in the same browser.' : null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (reset && password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/${reset ? 'reset-password' : 'forgot-password'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reset ? { password } : { email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Please try again.');
      setMessage(result.message);
      setPassword('');
      setConfirmation('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.008_260)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-100 mb-4"><KeyRound size={20} className="text-zinc-900" /></div>
          <h1 className="text-xl font-semibold text-zinc-100">{reset ? 'Set a new password' : 'Forgot password?'}</h1>
          <p className="text-sm text-zinc-400 mt-2">{reset ? 'Choose a password for your admin account.' : 'Enter your admin email to receive a reset link. Open the link in this browser.'}</p>
        </div>
        {message ? (
          <p role="status" className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{message}</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && <p role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</p>}
            {reset ? (
              <>
                <div>
                  <label htmlFor="new-password" className="block text-xs font-medium text-zinc-400 mb-1.5">New password</label>
                  <input id="new-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} aria-describedby="password-help" />
                  <p id="password-help" className="text-xs text-zinc-500 mt-2">Use at least 12 characters.</p>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm password</label>
                  <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} onChange={e => setConfirmation(e.target.value)} className={inputClass} />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="recovery-email" className="block text-xs font-medium text-zinc-400 mb-1.5">Admin email</label>
                <input id="recovery-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-sm font-semibold disabled:opacity-50">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Please wait…' : reset ? 'Update password' : 'Send reset link'}
            </button>
          </form>
        )}
        <p className="text-center text-sm text-zinc-400 mt-6"><Link href="/admin/login" className="hover:text-white">Back to admin sign in</Link></p>
        {reset && !message && <p className="text-center text-sm text-zinc-400 mt-3"><Link href="/admin/forgot-password" className="hover:text-white">Request a new reset link</Link></p>}
      </div>
    </div>
  );
}
