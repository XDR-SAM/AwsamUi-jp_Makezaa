import 'server-only';
import { createAdminClient } from '@/utils/supabase/admin';
import { isAdmin } from '@/utils/supabase/authorization';
import { AgentError, AgentScopeError, hash, type Scope } from './security';

export type AgentPrincipal = {
  id: string;
  ownerId: string;
  scopes: Scope[];
  name: string;
};
export async function authenticateAgent(
  request: Request,
): Promise<AgentPrincipal> {
  const token = request.headers
    .get('authorization')
    ?.match(/^Bearer ([A-Za-z0-9_-]{20,200})$/i)?.[1];
  if (!token)
    throw new AgentError(
      'Connect Makezaa or supply an agent access token.',
      401,
    );
  const db = createAdminClient();
  let credential;
  if (token.startsWith('mza_')) {
    const { data, error } = await db
      .from('agent_credentials')
      .select('*')
      .eq('token_hash', hash(token))
      .maybeSingle();
    if (error) throw new Error('Credential lookup failed');
    credential = data;
  } else {
    const { data, error } = await db
      .from('agent_oauth_tokens')
      .select('credential_id,resource,access_expires_at')
      .eq('access_hash', hash(token))
      .maybeSingle();
    if (error) throw new Error('OAuth token lookup failed');
    const { resourceUrl } = await import('./security');
    if (
      !data ||
      data.resource !== resourceUrl() ||
      Date.parse(data.access_expires_at) <= Date.now()
    )
      throw new AgentError('Invalid or expired access token', 401);
    const { data: c, error: e } = await db
      .from('agent_credentials')
      .select('*')
      .eq('id', data.credential_id)
      .maybeSingle();
    if (e) throw new Error('Credential lookup failed');
    credential = c;
  }
  if (
    !credential?.owner_id ||
    credential.revoked_at ||
    Date.parse(credential.expires_at) <= Date.now()
  )
    throw new AgentError('Invalid, revoked, or expired access token', 401);
  const {
    data: { user },
    error,
  } = await db.auth.admin.getUserById(credential.owner_id);
  if (error || !isAdmin(user))
    throw new AgentError(
      'The connecting account no longer has admin access.',
      401,
    );
  return {
    id: credential.id,
    ownerId: credential.owner_id,
    name: credential.name,
    scopes: credential.scopes,
  };
}
export function need(principal: AgentPrincipal, ...scopes: Scope[]) {
  if (scopes.some((s) => !principal.scopes.includes(s)))
    throw new AgentScopeError(scopes);
}
