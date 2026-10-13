import Link from "next/link";
import { notFound } from "next/navigation";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { CmsContent } from "@/components/cms-content";
import { StudioMotion, SplitText } from "@/components/studio/motion";
import { getPostBySlug, getPublishedPosts } from "@/lib/blog";
import { JsonLd } from "@/components/json-ld";
import { postMetadata, postSchema, PRIVATE_ROBOTS } from "@/lib/seo";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return post
    ? postMetadata(post)
    : { title: "Post Not Found", robots: PRIVATE_ROBOTS };
}
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Dhaka",
  });
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const related = (await getPublishedPosts())
    .filter((p) => p.id !== post.id)
    .slice(0, 3);
  return (
    <StudioMotion>
      <main id="top" data-nav-theme="light">
        <JsonLd data={postSchema(post)} />
        <Navigation />
        <article className="studio-article">
          <header className="studio-article-header">
            <Link href="/blog" className="eyebrow">
              ← Back to insights
            </Link>
            <div className="article-info">
              <time dateTime={post.created_at}>{date(post.created_at)}</time>
              <span>
                By <Link href="/">Makezaa Studio</Link>
              </span>
              <span>
                Updated{" "}
                <time dateTime={post.updated_at}>{date(post.updated_at)}</time>
              </span>
            </div>
            <h1>
              <SplitText text={post.title} />
            </h1>
            {post.excerpt ? (
              <p className="detail-description">{post.excerpt}</p>
            ) : null}
            <div className="detail-tags">
              {post.tags?.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </header>
          {post.cover_image ? (
            <img
              className="article-cover"
              src={post.cover_image}
              alt={post.title}
              fetchPriority="high"
            />
          ) : null}
          {post.content ? <CmsContent html={post.content} /> : null}
          {related.length ? (
            <section className="studio-related">
              <h2>Keep exploring.</h2>
              {related.map((p) => (
                <Link
                  className="related-link"
                  href={`/blog/${p.slug}`}
                  key={p.id}
                >
                  <span>{p.title}</span>
                  <span>↗</span>
                </Link>
              ))}
            </section>
          ) : null}
        </article>
        <FooterSection />
      </main>
    </StudioMotion>
  );
}
