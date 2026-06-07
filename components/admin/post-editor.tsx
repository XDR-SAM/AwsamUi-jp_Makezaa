'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImageUploader } from './image-uploader';
import { RichEditor } from './rich-editor';
import type { Post } from '@/lib/types';
import { Loader2, Save, Eye, EyeOff, Tag, X, Globe, ExternalLink } from 'lucide-react';

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
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!slug.trim()) { setError('Slug is required'); return; }
    setSaving(publish ? 'publish' : 'draft');
    setError(null);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content: content || null,
      cover_image: coverImage || null,
      tags: tags.length ? tags : null,
      published: publish,
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
      setPublished(publish);
      router.push('/admin/posts');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status bar */}
      <div className={`flex items-center justify-between px-5 py-3 rounded-xl border ${
        published
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-zinc-900/60 border-zinc-800'
      }`}>
        <div className="flex items-center gap-2">
          {published ? (
            <>
              <Globe size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Live on site</span>
              <span className="text-xs text-emerald-400/60">— visible at /blog/{slug || '…'}</span>
            </>
          ) : (
            <>
              <EyeOff size={16} className="text-zinc-500" />
              <span className="text-sm font-medium text-zinc-400">Draft</span>
              <span className="text-xs text-zinc-600">— not visible on /blog until you publish</span>
            </>
          )}
        </div>
        {published && slug && (
          <Link
            href={`/blog/${slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View post <ExternalLink size={12} />
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <ImageUploader value={coverImage} onChange={setCoverImage} label="Cover Image" />
      </div>

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

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
        <label className="block text-sm font-medium text-zinc-300">Content</label>
        <RichEditor content={content} onChange={setContent} placeholder="Write your post content here…" />
      </div>

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

      {/* Actions — two explicit buttons */}
      <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <button
          type="button"
          onClick={() => router.push('/admin/posts')}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving !== null}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            {saving === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving !== null}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white transition-colors disabled:opacity-50"
          >
            {saving === 'publish' ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            {published ? 'Update & Keep Live' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
