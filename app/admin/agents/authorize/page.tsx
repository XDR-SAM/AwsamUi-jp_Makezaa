import { redirect } from 'next/navigation';
import { assertAdmin } from '@/utils/supabase/require-admin';
import { createAdminClient } from '@/utils/supabase/admin';
import { validateAuthorization } from '@/lib/agents/oauth';
export const dynamic = 'force-dynamic';
export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request: id } = await searchParams;
  if (!id || !/^[0-9a-f-]{36}$/.test(id))
    return (
      <p className="p-10">
        Invalid connection request. Start again from your agent.
      </p>
    );
  try {
    await assertAdmin();
  } catch {
    redirect(
      `/admin/login?next=${encodeURIComponent(`/admin/agents/authorize?request=${id}`)}`,
    );
  }
  const { data, error } = await createAdminClient()
    .from('agent_oauth_requests')
    .select('params,expires_at')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  if (error || !data)
    return (
      <p className="p-10">
        This connection request expired. Start again from your agent.
      </p>
    );
  const { client, params, scopes } = await validateAuthorization(data.params);
  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto mt-16 max-w-xl space-y-5 rounded-2xl border border-zinc-800 p-6">
        <h1 className="text-2xl font-semibold">Connect to Makezaa</h1>
        <p>
          <strong>{client.name}</strong> requests access to your website.
        </p>
        <p className="break-all text-sm text-zinc-400">
          Callback: {params.redirect_uri}
        </p>
        <ul className="grid grid-cols-2 gap-2 text-sm text-zinc-300">
          {scopes.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {scopes.some((s) => s.endsWith(':delete')) && (
          <p className="text-sm text-amber-300">
            This connection includes permission to permanently delete content.
          </p>
        )}
        {scopes.includes('inbox:read') && (
          <p className="text-sm text-amber-300">
            This connection can read private customer contact details.
          </p>
        )}
        <p className="text-sm text-zinc-400">
          You can revoke this connection at any time from Agent control.
        </p>
        <form
          action="/api/oauth/authorize"
          method="POST"
          className="flex gap-3"
        >
          <input type="hidden" name="request" value={id} />
          <input type="hidden" name="scope" value={scopes.join(',')} />
          <button
            name="decision"
            value="allow"
            className="rounded-xl bg-white px-5 py-3 font-medium text-zinc-900"
          >
            Connect agent
          </button>
          <button
            name="decision"
            value="deny"
            className="rounded-xl border border-zinc-700 px-5 py-3"
          >
            Deny
          </button>
        </form>
      </div>
    </main>
  );
}
