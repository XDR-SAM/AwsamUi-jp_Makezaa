import { oauthMetadata } from '@/lib/agents/oauth';
export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json(oauthMetadata(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
