import { createAdminClient } from '@/utils/supabase/admin';
import { hash } from '@/lib/agents/security';
import { smallForm, oauthFailure } from '@/lib/agents/oauth';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const a = await smallForm(request),
      db = createAdminClient();
    if (a.token && a.client_id) {
      const field = a.token.startsWith('refresh_')
        ? 'refresh_hash'
        : 'access_hash';
      const { data, error } = await db
        .from('agent_oauth_tokens')
        .select('credential_id')
        .eq(field, hash(a.token))
        .eq('client_id', a.client_id)
        .maybeSingle();
      if (error) throw new Error('Revocation lookup failed');
      if (data) {
        const { error: e } = await db
          .from('agent_credentials')
          .update({ revoked_at: new Date().toISOString() })
          .eq('id', data.credential_id);
        if (e) throw new Error('Revocation failed');
      }
    }
    return new Response(null, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return oauthFailure(error);
  }
}
