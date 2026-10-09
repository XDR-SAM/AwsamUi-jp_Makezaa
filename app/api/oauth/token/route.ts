import { exchangeToken, smallForm, oauthFailure } from '@/lib/agents/oauth';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    return Response.json(await exchangeToken(await smallForm(request)), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return oauthFailure(error);
  }
}
