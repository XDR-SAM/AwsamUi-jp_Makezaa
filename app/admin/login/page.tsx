'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';
import { isAdmin } from '@/utils/supabase/authorization';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (!isAdmin(data.user)) {
        await supabase.auth.signOut();
        throw new Error('This account does not have admin access.');
      }
      const next = new URLSearchParams(window.location.search).get('next');
      router.push(next?.startsWith('/admin/agents/authorize?request=') ? next : '/admin');
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.06_0.008_260)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-100 mb-4">
            <LogIn size={20} className="text-zinc-900" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">Admin Access</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to manage your content</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-sm transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 text-sm transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-400 mt-4">
          <Link href="/admin/forgot-password" className="hover:text-white">Forgot password?</Link>
        </p>

        <p className="text-center text-xs text-zinc-600 mt-6">
          <a href="/" className="hover:text-zinc-400 transition-colors">← Back to site</a>
        </p>
      </div>
    </div>
  );
}
