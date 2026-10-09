import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { parse } from '@/lib/agents/validation';
import { secret, AgentError } from '@/lib/agents/security';
import { oauthFailure } from '@/lib/agents/oauth';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (Buffer.byteLength(text) > 16384)
      throw new AgentError('Request too large', 413);
    const schema = z
      .object({
        client_name: z.string().min(1).max(150).default('Connected agent'),
        redirect_uris: z
          .array(
            z
              .string()
              .url()
              .max(2048)
              .refine((v) => {
                const u = new URL(v);
                return (
                  !u.username &&
                  !u.password &&
                  !u.hash &&
                  (u.protocol === 'https:' ||
                    (u.protocol === 'http:' &&
                      ['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)))
                );
              }, 'HTTPS or loopback callback required'),
          )
          .min(1)
          .max(10),
        token_endpoint_auth_method: z.literal('none').default('none'),
        grant_types: z
          .array(z.enum(['authorization_code', 'refresh_token']))
          .optional(),
        response_types: z.array(z.literal('code')).optional(),
      })
      .passthrough();
    const a = parse(schema, JSON.parse(text));
    const client = secret('client_');
    const { error } = await createAdminClient().rpc('makezaa_oauth_register', {
      p_id: client,
      p_name: a.client_name,
      p_redirects: a.redirect_uris,
    });
    if (error)
      throw new AgentError('Registration temporarily unavailable', 429);
    return Response.json(
      {
        client_id: client,
        client_id_issued_at: Math.floor(Date.now() / 1000),
        client_name: a.client_name,
        redirect_uris: a.redirect_uris,
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return oauthFailure(error);
  }
}
