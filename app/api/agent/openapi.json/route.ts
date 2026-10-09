import { zodToJsonSchema } from 'zod-to-json-schema';
import { operations } from '@/lib/agents/operations';
import { siteOrigin } from '@/lib/agents/security';
export const dynamic = 'force-dynamic';
export function GET() {
  const paths: Record<string, unknown> = {};
  for (const [name, op] of Object.entries(operations))
    paths[`/api/agent/v1/${name}`] = {
      post: {
        operationId: name,
        description: op.description,
        security: [{ agentBearer: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: zodToJsonSchema(op.schema, {
                $refStrategy: 'none',
                effectStrategy: 'input',
              }),
            },
          },
        },
        responses: {
          200: {
            description: 'Operation completed',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          401: { description: 'Invalid or expired agent token' },
          403: { description: 'Missing permission' },
          409: { description: 'Conflict or stale task lease' },
        },
      },
    };
  return Response.json(
    {
      openapi: '3.1.0',
      info: {
        title: 'Makezaa Control',
        version: '1.0.0',
        description:
          'Private CMS tools for authorized agents. Use a dedicated revocable key from Agent control.',
      },
      servers: [{ url: siteOrigin() }],
      components: {
        securitySchemes: { agentBearer: { type: 'http', scheme: 'bearer' } },
      },
      paths,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
