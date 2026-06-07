import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navigation } from '@/components/landing/navigation';
import { FooterSection } from '@/components/landing/footer-section';
import { CmsContent } from '@/components/cms-content';
import { getPostBySlug, getPublishedPosts } from '@/lib/blog';
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found | Makezaa' };
  return {
    title: `${post.title} | Makezaa Blog`,
    description: post.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = await getPublishedPosts();
  const relatedPosts = allPosts.filter(p => p.id !== post.id).slice(0, 3);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <article className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to blog
          </Link>

          {post.cover_image && (
            <div className="rounded-2xl overflow-hidden border border-border mb-8">
              <img src={post.cover_image} alt={post.title} className="w-full h-64 md:h-80 object-cover" />
            </div>
          )}

          <header className="mb-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar size={14} />
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-foreground tracking-tight leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-lg text-muted-foreground mt-4">{post.excerpt}</p>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {post.tags.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {post.content && <CmsContent html={post.content} />}

          {relatedPosts.length > 0 && (
            <section className="mt-16 pt-10 border-t border-border">
              <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-wider mb-6">More posts</h2>
              <div className="space-y-4">
                {relatedPosts.map(related => (
                  <Link
                    key={related.id}
                    href={`/blog/${related.slug}`}
                    className="group flex items-center justify-between p-4 rounded-xl border border-border hover:border-foreground/20 hover:bg-card/40 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-white transition-colors truncate">
                        {related.title}
                      </p>
                      {related.excerpt && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{related.excerpt}</p>
                      )}
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground shrink-0 ml-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
      <FooterSection />
    </main>
  );
}
