import { authenticateAgent } from '@/lib/agents/auth';
import { runOperation } from '@/lib/agents/operations';
import { AgentError, publicError } from '@/lib/agents/security';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(
  request: Request,
  context: { params: Promise<{ operation: string }> },
) {
  try {
    const p = await authenticateAgent(request);
    if (Number(request.headers.get('content-length') || 0) > 3 * 1024 * 1024)
      throw new AgentError('Request too large', 413);
    const text = await request.text();
    if (Buffer.byteLength(text) > 3 * 1024 * 1024)
      throw new AgentError('Request too large', 413);
    let input;
    try {
      input = JSON.parse(text);
    } catch {
      throw new AgentError('Invalid JSON');
    }
    return Response.json(
      await runOperation((await context.params).operation, p, input),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    const { error: message, status } = publicError(error);
    return Response.json(
      { error: message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
