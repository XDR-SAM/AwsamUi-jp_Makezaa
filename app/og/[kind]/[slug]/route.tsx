import { ImageResponse } from 'next/og';
import { createPublicClient } from '@/utils/supabase/public';
import { plainText } from '@/lib/seo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const siteCards: Record<string, { title: string; label: string; subtitle: string }> = {
  home: { title: 'Ideas into websites.\nBuilt to make a difference.', label: 'WEB DEVELOPMENT & DIGITAL SOLUTIONS', subtitle: 'Websites · Apps · Digital strategy' },
  blog: { title: 'Fresh thinking.\nPractical insights.', label: 'THE MAKEZAA BLOG', subtitle: 'Development · AI · Digital strategy' },
  projects: { title: 'Our work.\nYour next possibility.', label: 'MAKEZAA PROJECTS', subtitle: 'Websites · Apps · Digital products' },
  contact: { title: 'Let’s build\nsomething together.', label: 'CONTACT MAKEZAA', subtitle: 'Dhaka, Bangladesh · Working worldwide' },
};

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  let card = kind === 'site' && Object.hasOwn(siteCards, slug) ? siteCards[slug] : undefined;
  if (kind === 'blog' || kind === 'projects') {
    const summaryField = kind === 'blog' ? 'excerpt' : 'description';
    const { data, error } = await createPublicClient().from(kind === 'blog' ? 'posts' : 'projects')
      .select(`title,${summaryField}`).eq('slug', slug).eq('published', true).maybeSingle();
    if (error) return new Response('Preview temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
    if (data) {
      const row = data as unknown as Record<string, string | null>;
      card = { title: plainText(row.title).slice(0, 150), label: kind === 'blog' ? 'MAKEZAA BLOG' : 'MAKEZAA PROJECT',
        subtitle: plainText(row[summaryField]).slice(0, 125) || 'Explore more at makezaa.com' };
    }
  }
  if (!card) return new Response('Not found', { status: 404, headers: { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'no-store' } });
  // Satori cannot reliably shape Indic conjuncts. Keep the original title in the
  // page's social metadata; a neutral brand card backs up its actual cover photo.
  if (/[\u0900-\u0dff]/.test(card.title + card.subtitle)) {
    card = { ...card, title: kind === 'projects' ? 'Thoughtfully designed.\nBuilt by Makezaa.' : 'Fresh thinking.\nPractical insights.',
      subtitle: kind === 'projects' ? 'Explore this project at makezaa.com' : 'Read the full story at makezaa.com' };
  }

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#090b0b', color: '#faf8f2', padding: '60px 70px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, letterSpacing: '-1.5px' }}>Makezaa<span style={{ color: '#9baba3', fontSize: 20, marginLeft: 12, marginTop: 17 }}>Labs</span></div>
        <div style={{ display: 'flex', color: '#9fbba8', fontSize: 19 }}>makezaa.com</div>
      </div>
      <div style={{ display: 'flex', marginTop: 56, color: '#b6d4c0', fontSize: 16, letterSpacing: '3px' }}>{card.label}</div>
      <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', fontWeight: 700, fontSize: card.title.length > 95 ? 48 : 65, lineHeight: 1.1, letterSpacing: '-2px', whiteSpace: 'pre-wrap' }}>{card.title}</div>
      <div style={{ display: 'flex', borderTop: '1px solid #33433a', paddingTop: 24, color: '#b2bdb6', fontSize: 23, lineHeight: 1.35 }}>{card.subtitle}</div>
    </div>,
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60' } },
  );
}
