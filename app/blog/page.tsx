import Link from 'next/link';
import { Navigation } from '@/components/landing/navigation';
import { FooterSection } from '@/components/landing/footer-section';
import { getPublishedPosts } from '@/lib/blog';
import { Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Blog | Makezaa',
  description: 'Insights on web development, digital strategy, and building products that ship.',
};

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>

          <div className="mb-12">
            <h1 className="font-display text-4xl md:text-5xl text-foreground tracking-tight">Blog</h1>
            <p className="text-muted-foreground mt-3 text-lg max-w-xl">
              Updates, tutorials, and thoughts from the Makezaa team.
            </p>
            {posts.length > 0 && (
              <p className="text-sm text-muted-foreground/70 mt-2">{posts.length} published {posts.length === 1 ? 'post' : 'posts'}</p>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="border border-border rounded-2xl p-12 text-center bg-card/40">
              <p className="text-muted-foreground">No posts published yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-2">
                Publish a post from the admin dashboard to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className={`group block border border-border rounded-2xl overflow-hidden bg-card/40 hover:border-foreground/20 hover:bg-card/60 transition-all duration-300 ${
                    index === 0 ? 'md:flex md:flex-row-reverse' : ''
                  }`}
                >
                  <div className={`flex flex-col sm:flex-row ${index === 0 ? 'md:flex-1' : ''}`}>
                    {post.cover_image && (
                      <div className={`shrink-0 ${index === 0 ? 'md:w-80' : 'sm:w-64'}`}>
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className={`w-full object-cover ${index === 0 ? 'h-56 md:h-full' : 'h-48 sm:h-full'}`}
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col justify-center min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar size={12} />
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                        {index === 0 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full border border-border text-foreground/60 text-[10px] uppercase tracking-wider">
                            Latest
                          </span>
                        )}
                      </div>
                      <h2 className={`font-semibold text-foreground group-hover:text-white transition-colors ${
                        index === 0 ? 'text-2xl' : 'text-xl'
                      }`}>
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm mt-2 line-clamp-3">{post.excerpt}</p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full border border-border text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm text-foreground/70 mt-4 group-hover:gap-2 transition-all">
                        Read more <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <FooterSection />
    </main>
  );
}
