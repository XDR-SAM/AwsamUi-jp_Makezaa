import { notFound } from 'next/navigation';
import { getPostById } from '@/lib/blog';
import { PostEditor } from '@/components/admin/post-editor';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Edit Post</h1>
        <p className="text-sm text-zinc-500 mt-1">{post.title}</p>
      </div>
      <PostEditor post={post} />
    </div>
  );
}
