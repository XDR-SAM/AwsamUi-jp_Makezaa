import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { SCOPES, type Scope } from './scope-list';
export { SCOPES, EDITOR_SCOPES, type Scope } from './scope-list';
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export const secret = (prefix = '') =>
  prefix + randomBytes(32).toString('base64url');
export const pkce = (verifier: string) =>
  createHash('sha256').update(verifier).digest('base64url');
export function safeEqual(a: string, b: string) {
  return (
    !!a && !!b && timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)))
  );
}
export function siteOrigin() {
  const url = new URL(
    process.env.MAKEZAA_SITE_URL || 'https://www.makezaa.com',
  );
  if (
    url.protocol !== 'https:' &&
    !(
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1'].includes(url.hostname)
    )
  )
    throw new Error('Invalid MAKEZAA_SITE_URL');
  return url.origin;
}
export const resourceUrl = () => `${siteOrigin()}/api/mcp`;
export function parseScopes(value: string | string[]) {
  const values = [
    ...new Set(
      Array.isArray(value) ? value : value.split(/\s+/).filter(Boolean),
    ),
  ];
  if (
    !values.length ||
    values.some((s) => !(SCOPES as readonly string[]).includes(s))
  )
    throw new AgentError('Invalid scope', 400);
  return values as Scope[];
}
export class AgentError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new AgentError('Invalid request origin', 403);
}
export function publicError(error: unknown) {
  if (error instanceof AgentError)
    return { error: error.message, status: error.status };
  return {
    error:
      'Makezaa could not complete this operation. Check configuration or retry with the same idempotency key.',
    status: 500,
  };
}
