import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { StudioMotion, SplitText } from "@/components/studio/motion";
import { PostCards } from "@/components/studio/editorial";
import { StudioCta } from "@/components/studio/cta";
import { getPublishedPosts } from "@/lib/blog";
import { pageMetadata, previewImage } from "@/lib/seo";
export const dynamic = "force-dynamic";
export const metadata = pageMetadata(
  "Blog",
  "Updates, tutorials, and insights on web development, AI, and digital strategy from the Makezaa team.",
  "/blog",
  previewImage("site", "blog"),
);
export default async function BlogPage() {
  const posts = await getPublishedPosts();
  return (
    <StudioMotion>
      <main id="top" data-nav-theme="light">
        <Navigation />
        <header className="studio-page-header">
          <span className="eyebrow">Insights / From Makezaa Studio</span>
          <h1>
            <SplitText text="Ideas. Perspective." />
            <br />
            <SplitText text="What comes next." />
          </h1>
          <p>
            Thoughts on websites, AI, technology, and building a better digital
            business.
          </p>
        </header>
        <div className="editorial-page">
          {posts.length ? (
            <PostCards posts={posts} />
          ) : (
            <div className="studio-empty">
              <h2>Good ideas take a little time.</h2>
              <p>New insights from the studio are on their way.</p>
            </div>
          )}
        </div>
        <StudioCta meeting={false} />
        <FooterSection />
      </main>
    </StudioMotion>
  );
}
