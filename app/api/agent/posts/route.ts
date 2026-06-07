import { NextRequest, NextResponse } from 'next/server';

const AGENT_TOKEN = process.env.MAKEZAA_AGENT_TOKEN ?? '';

function unauthorized(message: string, hint?: string, status = 401) {
  return NextResponse.json(
    { error: message, ...(hint ? { hint } : {}) },
    { status }
  );
}

function assertAgentToken(request: NextRequest) {
  const header = request.headers.get('x-makezaa-agent-token') ?? '';
  if (!AGENT_TOKEN) return { ok: false as const, reason: 'not configured', hint: 'Set MAKEZAA_AGENT_TOKEN in the server environment' };
  if (header !== AGENT_TOKEN) return { ok: false as const, reason: 'Unauthorized' };
  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, 'reason' in check && check.reason === 'not configured' ? 500 : 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') ?? undefined;
    if (id) {
      const { getPostById } = await import('@/lib/blog');
      const post = await getPostById(id);
      if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(post);
    }

    const { getAllPosts } = await import('@/lib/blog');
    const posts = await getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('[agent/posts]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, 'reason' in check && check.reason === 'not configured' ? 500 : 401);

  try {
    const body = await request.json();
    const { createPost } = await import('@/lib/blog');

    if (!body?.title?.trim() || !body?.slug?.trim() || !body?.content?.trim()) {
      return NextResponse.json({ error: 'title, slug, and content are required' }, { status: 400 });
    }

    const post = await createPost({
      title: body.title.trim(),
      slug: body.slug.trim(),
      excerpt: (body.excerpt ?? body.excerpt ?? '').trim() || null,
      content: body.content.trim(),
      cover_image: body.cover_image ?? null,
      tags: Array.isArray(body.tags) ? body.tags : null,
      published: typeof body.published === 'boolean' ? body.published : false,
    });
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('[agent/posts]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, 'reason' in check && check.reason === 'not configured' ? 500 : 401);

  try {
    const body = await request.json();
    const { id, ...patch } = body ?? {};
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { updatePost } = await import('@/lib/blog');
    const post = await updatePost(id, patch);
    return NextResponse.json(post);
  } catch (error) {
    console.error('[agent/posts]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, 'reason' in check && check.reason === 'not configured' ? 500 : 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { deletePost } = await import('@/lib/blog');
    await deletePost(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[agent/posts]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
