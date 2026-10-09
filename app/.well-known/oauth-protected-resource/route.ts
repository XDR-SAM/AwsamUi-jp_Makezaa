import { resourceUrl, SCOPES, siteOrigin } from '@/lib/agents/security';
export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json(
    {
      resource: resourceUrl(),
      authorization_servers: [siteOrigin()],
      scopes_supported: SCOPES,
      bearer_methods_supported: ['header'],
      resource_name: 'Makezaa Control',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
