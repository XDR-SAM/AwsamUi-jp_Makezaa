import { z } from 'zod';
import { assertAdmin } from '@/utils/supabase/require-admin';
import { createAdminClient } from '@/utils/supabase/admin';
import {
  AgentError,
  hash,
  parseScopes,
  publicError,
  sameOrigin,
  secret,
  resourceUrl,
} from '@/lib/agents/security';
import { parse, uuid } from '@/lib/agents/validation';
export const dynamic = 'force-dynamic';
function failure(error: unknown) {
  const e =
    error instanceof Error && error.message === 'Unauthorized'
      ? new AgentError('Unauthorized', 401)
      : error;
  const { error: message, status } = publicError(e);
  return Response.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function GET() {
  try {
    await assertAdmin();
    const db = createAdminClient();
    const results = await Promise.all([
      db
        .from('agent_credentials')
        .select('id,name,scopes,expires_at,revoked_at,created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      db
        .from('agent_jobs')
        .select(
          'id,prompt,expected_posts,status,run_at,attempts,progress,report,created_at,updated_at',
        )
        .order('created_at', { ascending: false })
        .limit(100),
      db
        .from('agent_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    if (results.some((r) => r.error)) throw new Error('Dashboard unavailable');
    return Response.json(
      {
        endpoint: resourceUrl(),
        credentials: results[0].data,
        jobs: results[1].data,
        audit: results[2].data,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await assertAdmin();
    const text = await request.text();
    if (Buffer.byteLength(text) > 16384)
      throw new AgentError('Request too large', 413);
    const input = JSON.parse(text),
      db = createAdminClient();
    if (input.action === 'create_key') {
      const a = parse(
        z
          .object({
            action: z.literal('create_key'),
            name: z.string().trim().min(1).max(100),
            scopes: z.array(z.string()).min(1).max(20),
            days: z.number().int().min(1).max(365).default(30),
          })
          .strict(),
        input,
      );
      const token = secret('mza_');
      const { data, error } = await db
        .from('agent_credentials')
        .insert({
          owner_id: user.id,
          name: a.name,
          scopes: parseScopes(a.scopes),
          token_hash: hash(token),
          expires_at: new Date(Date.now() + a.days * 86400000).toISOString(),
        })
        .select('id,name,scopes,expires_at')
        .single();
      if (error) throw new Error('Credential creation failed');
      const { error: e } = await db
        .from('agent_audit')
        .insert({
          actor: user.id,
          operation: 'key_created',
          entity_id: data.id,
          detail: { name: a.name, scopes: a.scopes },
        });
      if (e) throw new Error('Audit unavailable');
      return Response.json(
        { ...data, token },
        { status: 201, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (input.action === 'revoke_key') {
      const a = parse(
        z.object({ action: z.literal('revoke_key'), id: uuid }).strict(),
        input,
      );
      const { error } = await db
        .from('agent_credentials')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', a.id)
        .eq('owner_id', user.id);
      if (error) throw new Error('Revocation failed');
      const { error: e } = await db
        .from('agent_audit')
        .insert({ actor: user.id, operation: 'key_revoked', entity_id: a.id });
      if (e) throw new Error('Audit unavailable');
      return Response.json(
        { revoked: true },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (input.action === 'create_job') {
      const a = parse(
        z
          .object({
            action: z.literal('create_job'),
            prompt: z.string().trim().min(1).max(10000),
            expected_posts: z.number().int().min(1).max(50).optional(),
            run_at: z.string().datetime({ offset: true }).optional(),
            idempotency_key: z.string().min(8).max(160),
          })
          .strict(),
        input,
      );
      const data = {
        prompt: a.prompt,
        expected_posts: a.expected_posts ?? null,
        run_at: a.run_at ?? null,
      };
      const { data: job, error } = await db.rpc('makezaa_agent_mutate', {
        p_actor: user.id,
        p_operation: 'job_create',
        p_key: a.idempotency_key,
        p_hash: hash(JSON.stringify(data)),
        p_id: null,
        p_data: data,
        p_job: null,
        p_lease: null,
      });
      if (error) throw new Error('Task creation failed');
      return Response.json(job, {
        status: 201,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (input.action === 'cancel_job') {
      const a = parse(
        z.object({ action: z.literal('cancel_job'), id: uuid }).strict(),
        input,
      );
      const { data, error } = await db.rpc('makezaa_job_transition', {
        p_id: a.id,
        p_actor: user.id,
        p_action: 'cancel',
        p_lease: null,
        p_data: {},
      });
      if (error) throw new AgentError('This task cannot be cancelled.', 409);
      return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
    }
    throw new AgentError('Unknown action');
  } catch (error) {
    return failure(error);
  }
}
