'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploader } from './image-uploader';
import { RichEditor } from './rich-editor';
import type { Post } from '@/lib/types';
import { Loader2, Save, Eye, EyeOff, Tag, X } from 'lucide-react';

interface PostEditorProps {
  post?: Post;
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const isEdit = !!post;

  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [coverImage, setCoverImage] = useState(post?.cover_image ?? '');
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [published, setPublished] = useState(post?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from title (new posts only)
  useEffect(() => {
    if (!isEdit && title) setSlug(slugify(title));
  }, [title, isEdit]);

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,/g, '');
      if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const handleSave = async (asDraft = false) => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!slug.trim()) { setError('Slug is required'); return; }
    setSaving(true);
    setError(null);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content: content || null,
      cover_image: coverImage || null,
      tags: tags.length ? tags : null,
      published: asDraft ? false : published,
    };

    try {
      const url = isEdit ? `/api/admin/posts/${post.id}` : '/api/admin/posts';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      router.push('/admin/posts');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Cover Image */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <ImageUploader value={coverImage} onChange={setCoverImage} label="Cover Image" />
      </div>

      {/* Title & Slug */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Your post title…"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-lg font-medium transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Slug *</label>
          <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5">
            <span className="text-zinc-500 text-sm">/blog/</span>
            <input
              value={slug}
              onChange={e => setSlug(slugify(e.target.value))}
              className="flex-1 bg-transparent text-zinc-300 focus:outline-none text-sm font-mono"
              placeholder="post-url-slug"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Short description shown in listings…"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5 text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-sm resize-none transition-colors"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
        <label className="block text-sm font-medium text-zinc-300">Content</label>
        <RichEditor content={content} onChange={setContent} placeholder="Write your post content here…" />
      </div>

      {/* Tags */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <label className="block text-sm font-medium text-zinc-300 flex items-center gap-1.5">
          <Tag size={14} /> Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={addTag}
          placeholder="Type a tag and press Enter or comma…"
          className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5 text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-sm transition-colors"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <button
          type="button"
          onClick={() => setPublished(prev => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
            published
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
              : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {published ? <Eye size={14} /> : <EyeOff size={14} />}
          {published ? 'Published' : 'Draft'}
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/posts')}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isEdit ? 'Save Changes' : published ? 'Publish Post' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
