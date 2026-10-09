import 'server-only';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { parse } from './validation';
import {
  AgentError,
  SCOPES,
  parseScopes,
  pkce,
  resourceUrl,
  secret,
  siteOrigin,
  hash,
} from './security';

export function oauthMetadata() {
  const origin = siteOrigin();
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/api/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: SCOPES,
    authorization_response_iss_parameter_supported: true,
  };
}
export const authorizeSchema = z
  .object({
    client_id: z.string().min(1).max(200),
    redirect_uri: z.string().url().max(2048),
    response_type: z.literal('code'),
    code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    code_challenge_method: z.literal('S256'),
    resource: z.literal(resourceUrl()),
    state: z.string().max(2000).optional(),
    scope: z.string().max(1000).default(SCOPES.join(' ')),
  })
  .strict();
export async function validateAuthorization(params: unknown) {
  const a = parse(authorizeSchema, params);
  const { data: client, error } = await createAdminClient()
    .from('agent_oauth_clients')
    .select('*')
    .eq('id', a.client_id)
    .maybeSingle();
  if (error) throw new Error('Client lookup failed');
  if (!client || !client.redirect_uris.includes(a.redirect_uri))
    throw new AgentError('Invalid client or redirect URI');
  const scopes = parseScopes(a.scope);
  // OAuth connections may request all scopes; the admin explicitly chooses the grant on the consent screen.
  return { params: a, client, scopes };
}
export function callback(
  params: { redirect_uri: string; state?: string },
  values: Record<string, string>,
) {
  const url = new URL(params.redirect_uri);
  if (params.state !== undefined) url.searchParams.set('state', params.state);
  url.searchParams.set('iss', siteOrigin());
  for (const [k, v] of Object.entries(values)) url.searchParams.set(k, v);
  return url.toString();
}
export async function exchangeToken(input: Record<string, string>) {
  const kind = input.grant_type;
  if (kind !== 'authorization_code' && kind !== 'refresh_token')
    throw new AgentError('unsupported_grant_type');
  if (input.resource !== resourceUrl()) throw new AgentError('invalid_target');
  if (!input.client_id || input.client_id.length > 200)
    throw new AgentError('invalid_client');
  let proof = '';
  if (kind === 'authorization_code') {
    if (
      !/^[A-Za-z0-9._~-]{43,128}$/.test(input.code_verifier ?? '') ||
      !input.code ||
      !input.redirect_uri
    )
      throw new AgentError('invalid_grant');
    proof = pkce(input.code_verifier);
  } else if (!input.refresh_token) throw new AgentError('invalid_grant');
  const access = secret('access_'),
    refresh = secret('refresh_');
  const { data, error } = await createAdminClient().rpc(
    'makezaa_oauth_exchange',
    {
      p_kind: kind,
      p_hash: hash(
        kind === 'authorization_code' ? input.code : input.refresh_token,
      ),
      p_client: input.client_id,
      p_redirect: input.redirect_uri ?? '',
      p_challenge: proof,
      p_resource: input.resource,
      p_access: hash(access),
      p_refresh: hash(refresh),
    },
  );
  if (error) throw new AgentError('invalid_grant');
  return {
    access_token: access,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refresh,
    scope: data.scope,
  };
}
export async function smallForm(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 16384)
    throw new AgentError('Request too large', 413);
  const text = await request.text();
  if (Buffer.byteLength(text) > 16384)
    throw new AgentError('Request too large', 413);
  if (
    !request.headers
      .get('content-type')
      ?.startsWith('application/x-www-form-urlencoded')
  )
    throw new AgentError('Use application/x-www-form-urlencoded', 415);
  return Object.fromEntries(new URLSearchParams(text));
}
export function oauthFailure(error: unknown) {
  return Response.json(
    { error: error instanceof AgentError ? error.message : 'server_error' },
    {
      status: error instanceof AgentError ? error.status : 500,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
