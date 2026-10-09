import { AgentError } from './security';
export async function fetchImage(url: string) {
  const u = new URL(url),
    supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  const allowed = [
    'images.unsplash.com',
    'images.pexels.com',
    supabaseHost,
    ...(process.env.MAKEZAA_IMAGE_HOSTS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ];
  if (
    u.protocol !== 'https:' ||
    u.username ||
    u.password ||
    (u.port && u.port !== '443') ||
    !allowed.includes(u.hostname) ||
    (u.hostname === supabaseHost &&
      !u.pathname.startsWith('/storage/v1/object/public/blog-images/'))
  )
    throw new AgentError(
      'Image host is not allowed. Upload the file directly, or configure MAKEZAA_IMAGE_HOSTS with a trusted image host.',
    );
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(u, {
      redirect: 'error',
      signal: controller.signal,
      headers: { Accept: 'image/png,image/jpeg,image/webp,image/gif' },
    });
    if (!response.ok || !response.body)
      throw new AgentError('Image download failed');
    if (Number(response.headers.get('content-length') ?? 0) > 2 * 1024 * 1024)
      throw new AgentError('Image exceeds 2 MiB', 413);
    const reader = response.body.getReader(),
      chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 2 * 1024 * 1024) {
          await reader.cancel();
          throw new AgentError('Image exceeds 2 MiB', 413);
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    return {
      bytes: Buffer.concat(chunks),
      mime: response.headers.get('content-type')?.split(';')[0] ?? '',
    };
  } finally {
    clearTimeout(timeout);
  }
}
