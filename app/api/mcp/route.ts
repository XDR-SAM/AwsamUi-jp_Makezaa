import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { authenticateAgent } from '@/lib/agents/auth';
import { createMakezaaServer } from '@/lib/agents/mcp';
import { publicError, siteOrigin, AgentError } from '@/lib/agents/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
async function handle(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const allowed = [
      siteOrigin(),
      'https://chatgpt.com',
      'https://chat.openai.com',
      ...(process.env.MAKEZAA_MCP_ALLOWED_ORIGINS ?? '')
        .split(',')
        .filter(Boolean),
    ];
    if (origin && !allowed.includes(origin))
      throw new AgentError('Origin is not allowed', 403);
    const principal = await authenticateAgent(request);
    const server = createMakezaaServer(principal);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      maxRequestBodySize: 3 * 1024 * 1024,
    });
    await server.connect(transport);
    try {
      const response = await transport.handleRequest(request);
      response.headers.set('Cache-Control', 'no-store');
      return response;
    } finally {
      await server.close();
    }
  } catch (error) {
    const { error: message, status } = publicError(error);
    const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
    if (status === 401)
      headers['WWW-Authenticate'] =
        `Bearer resource_metadata="${siteOrigin()}/.well-known/oauth-protected-resource"`;
    return Response.json({ error: message }, { status, headers });
  }
}
export const POST = handle;
export const GET = async (request: Request) => {
  try {
    await authenticateAgent(request);
    return new Response(null, {
      status: 405,
      headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const { error: message, status } = publicError(error);
    return Response.json(
      { error: message },
      {
        status,
        headers: {
          'Cache-Control': 'no-store',
          ...(status === 401
            ? {
                'WWW-Authenticate': `Bearer resource_metadata="${siteOrigin()}/.well-known/oauth-protected-resource"`,
              }
            : {}),
        },
      },
    );
  }
};
export const DELETE = GET;
