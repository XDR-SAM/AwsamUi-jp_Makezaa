import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/utils/supabase/admin';
import { assertAdmin } from '@/utils/supabase/require-admin';
import {
  AgentError,
  hash,
  parseScopes,
  sameOrigin,
  secret,
  SCOPES,
} from '@/lib/agents/security';
import {
  callback,
  oauthFailure,
  validateAuthorization,
  smallForm,
} from '@/lib/agents/oauth';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const { params } = await validateAuthorization(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const nonce = secret();
    const { data, error } = await createAdminClient().rpc(
      'makezaa_oauth_request',
      { p_client: params.client_id, p_params: params, p_csrf: hash(nonce) },
    );
    if (error)
      throw new AgentError('Authorization temporarily unavailable', 429);
    const response = NextResponse.redirect(
      new URL(`/admin/agents/authorize?request=${data}`, request.url),
    );
    response.cookies.set(`makezaa_consent_${data}`, nonce, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/api/oauth/authorize',
      maxAge: 600,
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    return oauthFailure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const { user } = await assertAdmin();
    const form = await smallForm(request);
    if (!/^[0-9a-f-]{36}$/.test(form.request ?? ''))
      throw new AgentError('Invalid authorization request');
    const cookieStore = await cookies(),
      nonce = cookieStore.get(`makezaa_consent_${form.request}`)?.value;
    if (!nonce)
      throw new AgentError(
        'Authorization expired. Reconnect from your agent.',
        403,
      );
    const db = createAdminClient();
    const { data: pending, error } = await db
      .from('agent_oauth_requests')
      .select('*')
      .eq('id', form.request)
      .eq('csrf_hash', hash(nonce))
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    if (error || !pending)
      throw new AgentError(
        'Authorization expired. Reconnect from your agent.',
        403,
      );
    const { params, scopes: requested } = await validateAuthorization(
      pending.params,
    );
    const scopes = parseScopes((form.scope ?? '').split(','));
    if (scopes.some((s) => !requested.includes(s) || !SCOPES.includes(s)))
      throw new AgentError('Invalid granted scope');
    const code = secret('code_');
    // Atomically consume consent, issue one short-lived authorization code, and record the grant.
    const { error: e } = await db.rpc('makezaa_oauth_consent', {
      p_request: form.request,
      p_csrf: hash(nonce),
      p_owner: user.id,
      p_code: hash(code),
      p_scopes: scopes,
      p_allow: form.decision === 'allow',
    });
    if (e)
      throw new AgentError(
        'Authorization expired. Reconnect from your agent.',
        403,
      );
    const response = NextResponse.redirect(
      callback(
        params,
        form.decision === 'allow' ? { code } : { error: 'access_denied' },
      ),
      303,
    );
    response.cookies.set(`makezaa_consent_${form.request}`, '', {
      path: '/api/oauth/authorize',
      maxAge: 0,
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    return oauthFailure(error);
  }
}
