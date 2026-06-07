import { PostEditor } from '@/components/admin/post-editor';

export default function NewPostPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">New Post</h1>
        <p className="text-sm text-zinc-500 mt-1">Write and publish a blog post</p>
      </div>
      <PostEditor />
    </div>
  );
}
