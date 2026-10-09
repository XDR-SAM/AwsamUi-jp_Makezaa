import { authenticateAgent } from '@/lib/agents/auth';
import { runOperation } from '@/lib/agents/operations';
import { AgentError, publicError } from '@/lib/agents/security';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const p = await authenticateAgent(request);
    if (Number(request.headers.get('content-length') ?? 0) > 3 * 1024 * 1024)
      throw new AgentError('Request too large', 413);
    const form = await request.formData(),
      file = form.get('file');
    if (!(file instanceof File) || file.size > 2 * 1024 * 1024)
      throw new AgentError('Provide an image file up to 2 MiB.', 413);
    const result = await runOperation('media_upload', p, {
      base64: Buffer.from(await file.arrayBuffer()).toString('base64'),
      mime: file.type,
      alt: form.get('alt'),
      provenance: form.get('provenance'),
      idempotency_key: form.get('idempotency_key'),
      ...(form.get('source_url') ? { source_url: form.get('source_url') } : {}),
    });
    return Response.json(result, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const { error: message, status } = publicError(error);
    return Response.json(
      { error: message },
      { status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
