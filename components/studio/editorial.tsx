import Link from "next/link";
import type { Post } from "@/lib/types";
import { studioAssets } from "@/lib/studio-assets";
import { SplitText } from "./motion";

export function PostCards({ posts }: { posts: Post[] }) {
  return (
    <div className="studio-editorial-grid">
      {posts.map((post, index) => (
        <Link
          href={`/blog/${post.slug}`}
          className="editorial-card"
          key={post.id}
        >
          <div className="editorial-image">
            <img
              src={post.cover_image || studioAssets.loaderImages[index % 8]}
              alt={post.cover_image ? post.title : ""}
              loading="lazy"
            />
            <span>Read insight ↗</span>
          </div>
          <div className="editorial-meta">
            <time dateTime={post.created_at}>
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "Asia/Dhaka",
              })}
            </time>
            <span>{post.tags?.[0] || "Studio insight"}</span>
          </div>
          <h2>{post.title}</h2>
          {post.excerpt ? <p>{post.excerpt}</p> : null}
        </Link>
      ))}
    </div>
  );
}
export function StudioInsights({ posts }: { posts: Post[] }) {
  return (
    <section
      id="blog"
      className="studio-insights studio-section"
      data-nav-theme="light"
    >
      <div className="section-heading">
        <span className="eyebrow">From the studio</span>
        <h2>
          <SplitText text="Ideas worth sharing." />
        </h2>
        <Link className="glass-pill rolling-link" href="/blog">
          <span data-text="View all insights">View all insights</span>↗
        </Link>
      </div>
      {posts.length ? (
        <PostCards posts={posts} />
      ) : (
        <p className="section-intro">
          Our thinking on websites, AI, and building better digital businesses.
          New insights are on their way.
        </p>
      )}
    </section>
  );
}
