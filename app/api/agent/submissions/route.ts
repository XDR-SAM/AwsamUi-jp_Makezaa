import { NextRequest, NextResponse } from 'next/server';

const AGENT_TOKEN = process.env.MAKEZAA_AGENT_TOKEN ?? '';

function assertAgentToken(request: NextRequest) {
  const header = request.headers.get('x-makezaa-agent-token') ?? '';
  if (!AGENT_TOKEN) return { ok: false as const, reason: 'not configured', hint: 'Set MAKEZAA_AGENT_TOKEN in the server environment' };
  if (header !== AGENT_TOKEN) return { ok: false as const, reason: 'Unauthorized' };
  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthori... check.reason, 'hint' in check ? check.hint : undefined, 'reason' in check && check.reason === 'not configured' ? 500 : 401);

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? undefined;
    const { getAllSubmissions, getSubmissionsByType, getSubmissionById } = await import('@/lib/submissions');
    if (type) {
      const items = await getSubmissionsByType(type as 'meeting' | 'contact');
      return NextResponse.json(items);
    }
    const id = searchParams.get('id') ?? undefined;
    if (id) {
      const item = await getSubmissionById(id);
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const items = await getAllSubmissions();
    return NextResponse.json(items);
  } catch (error) {
    console.error('[agent/submissions]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, 'reason' in check && check.reason === "not configured' ? 500 : 401);
  } else {
    return unauthorized(check.reason, check.hint);
  }
}

export async function DELETE(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, check.hint, check.reason === 'not configured' ? 500 : 401);
  try {
    const { deleteSubmission } = await import('@/lib/submissions');
    await deleteSubmission(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[agent/submissions]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
