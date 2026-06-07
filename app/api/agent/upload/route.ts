import { NextRequest, NextResponse } from 'next/server';

const AGENT_TOKEN = process.env.MAKEZAA_AGENT_TOKEN ?? '';

function unauthorized(message: string, hint?: string, status = 401) {
  return NextResponse.json({ error: message, ...(hint ? { hint } : {}) }, { status });
}

function assertAgentToken(request: NextRequest) {
  const header = request.headers.get('x-makezaa-agent-token') ?? '';
  if (!AGENT_TOKEN) return { ok: false as const, reason: 'not configured', hint: 'Set MAKEZAA_AGENT_TOKEN in the server environment' };
  if (header !== AGENT_TOKEN) return { ok: false as const, reason: 'Unauthorized' };
  return { ok: true as const };
}

export async function POST(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, 'reason' in check && check.reason === 'not configured' ? 500 : 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const { createAdminClient } = await import('@/utils/supabase/admin');
    const supabase = createAdminClient();
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('blog-images')
      .upload(filename, file, { contentType: file.type, upsert: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (error) {
    console.error('[agent/upload]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
