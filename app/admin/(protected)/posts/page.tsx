import Link from 'next/link';
import { getAllPosts } from '@/lib/blog';
import { DeleteItemButton } from '@/components/admin/delete-item-button';
import { PublishButton } from '@/components/admin/publish-button';
import { Plus, FileText, Pencil, ExternalLink } from 'lucide-react';

export default async function AdminPostsPage() {
  const posts = await getAllPosts();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Posts</h1>
          <p className="text-sm text-zinc-500 mt-1">{posts.length} total · manage blog content</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center">
          <FileText size={32} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-sm">No posts yet.</p>
          <Link href="/admin/posts/new" className="inline-block mt-4 text-sm text-zinc-200 hover:underline">
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <span>Title</span>
            <span>Status</span>
            <span>Date</span>
            <span>Actions</span>
          </div>
          {posts.map(post => (
            <div
              key={post.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="min-w-0">
                <Link href={`/admin/posts/${post.id}`} className="text-sm font-medium text-zinc-200 hover:text-white truncate block">
                  {post.title}
                </Link>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">/blog/{post.slug}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${
                post.published
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : 'text-zinc-500 border-zinc-700 bg-zinc-800'
              }`}>
                {post.published ? 'Published' : 'Draft'}
              </span>
              <span className="text-xs text-zinc-500 whitespace-nowrap">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                {!post.published && (
                  <PublishButton apiUrl={`/api/admin/posts/${post.id}`} />
                )}
                {post.published && (
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <ExternalLink size={13} /> View
                  </Link>
                )}
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <Pencil size={13} /> Edit
                </Link>
                <DeleteItemButton
                  apiUrl={`/api/admin/posts/${post.id}`}
                  redirectTo="/admin/posts"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
