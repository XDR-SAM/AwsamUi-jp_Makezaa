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
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, check.reason === 'not configured' ? 500 : 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') ?? undefined;
    if (id) {
      const { getProjectById } = await import('@/lib/projects');
      const project = await getProjectById(id);
      if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(project);
    }
    const { getAllProjects } = await import('@/lib/projects');
    const projects = await getAllProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('[agent/projects]', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, check.reason === 'not configured' ? 500 : 401);

  try {
    const body = await request.json();
    const { createProject } = await import('@/lib/projects');

    if (!body?.title?.trim() || !body?.slug?.trim()) {
      return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
    }

    const project = await createProject({
      title: body.title.trim(),
      slug: body.slug.trim(),
      description: (body.description ?? '').trim() || null,
      content: body.content?.trim() ?? null,
      cover_image: body.cover_image ?? null,
      tech_stack: Array.isArray(body.tech_stack) ? body.tech_stack : null,
      live_url: body.live_url ?? null,
      github_url: body.github_url ?? null,
      featured: typeof body.featured === 'boolean' ? body.featured : false,
      published: typeof body.published === 'boolean' ? body.published : false,
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('[agent/projects]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, check.reason === 'not configured' ? 500 : 401);

  try {
    const body = await request.json();
    const { id, ...patch } = body ?? {};
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { updateProject } = await import('@/lib/projects');
    const project = await updateProject(id, patch);
    return NextResponse.json(project);
  } catch (error) {
    console.error('[agent/projects]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const check = assertAgentToken(request);
  if (!check.ok) return unauthorized(check.reason, 'hint' in check ? check.hint : undefined, check.reason === 'not configured' ? 500 : 401);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const { deleteProject } = await import('@/lib/projects');
    await deleteProject(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[agent/projects]', error);
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
