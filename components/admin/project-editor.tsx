'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ImageUploader } from './image-uploader';
import { RichEditor } from './rich-editor';
import type { Project } from '@/lib/types';
import { Loader2, Save, Eye, EyeOff, Star, X, ExternalLink, Github, Globe } from 'lucide-react';

interface ProjectEditorProps {
  project?: Project;
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function ProjectEditor({ project }: ProjectEditorProps) {
  const router = useRouter();
  const isEdit = !!project;

  const [title, setTitle] = useState(project?.title ?? '');
  const [slug, setSlug] = useState(project?.slug ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [content, setContent] = useState(project?.content ?? '');
  const [coverImage, setCoverImage] = useState(project?.cover_image ?? '');
  const [techStack, setTechStack] = useState<string[]>(project?.tech_stack ?? []);
  const [techInput, setTechInput] = useState('');
  const [liveUrl, setLiveUrl] = useState(project?.live_url ?? '');
  const [githubUrl, setGithubUrl] = useState(project?.github_url ?? '');
  const [featured, setFeatured] = useState(project?.featured ?? false);
  const [published, setPublished] = useState(project?.published ?? false);
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit && title) setSlug(slugify(title));
  }, [title, isEdit]);

  const addTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && techInput.trim()) {
      e.preventDefault();
      const tech = techInput.trim().replace(/,/g, '');
      if (tech && !techStack.includes(tech)) setTechStack(prev => [...prev, tech]);
      setTechInput('');
    }
  };

  const removeTech = (tech: string) => setTechStack(prev => prev.filter(t => t !== tech));

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!slug.trim()) { setError('Slug is required'); return; }
    setSaving(publish ? 'publish' : 'draft');
    setError(null);

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      content: content || null,
      cover_image: coverImage || null,
      tech_stack: techStack.length ? techStack : null,
      live_url: liveUrl.trim() || null,
      github_url: githubUrl.trim() || null,
      featured,
      published: publish,
    };

    try {
      const url = isEdit ? `/api/admin/projects/${project.id}` : '/api/admin/projects';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setPublished(publish);
      router.push('/admin/projects');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
              <span className="text-xs text-emerald-400/60">— visible at /projects/{slug || '…'}</span>
            </>
          ) : (
            <>
              <EyeOff size={16} className="text-zinc-500" />
              <span className="text-sm font-medium text-zinc-400">Draft</span>
              <span className="text-xs text-zinc-600">— not visible on /projects until you publish</span>
            </>
          )}
        </div>
        {published && slug && (
          <Link
            href={`/projects/${slug}`}
            target="_blank"
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View project <ExternalLink size={12} />
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <ImageUploader value={coverImage} onChange={setCoverImage} label="Project Cover Image" />
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Project name…"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-lg font-medium transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Slug *</label>
          <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5">
            <span className="text-zinc-500 text-sm">/projects/</span>
            <input
              value={slug}
              onChange={e => setSlug(slugify(e.target.value))}
              className="flex-1 bg-transparent text-zinc-300 focus:outline-none text-sm font-mono"
              placeholder="project-url-slug"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Short Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief project summary shown in the listing…"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5 text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-sm resize-none transition-colors"
          />
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-zinc-300">Project Links</h3>
        <div>
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
            <ExternalLink size={12} /> Live URL
          </label>
          <input
            value={liveUrl}
            onChange={e => setLiveUrl(e.target.value)}
            placeholder="https://yourproject.com"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5 text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-sm transition-colors"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
            <Github size={12} /> GitHub URL
          </label>
          <input
            value={githubUrl}
            onChange={e => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5 text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-sm transition-colors"
          />
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-2">
        <label className="block text-sm font-medium text-zinc-300">Project Details</label>
        <RichEditor content={content} onChange={setContent} placeholder="Describe the project in detail — challenges, solutions, technologies used…" />
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <label className="block text-sm font-medium text-zinc-300">Tech Stack</label>
        <div className="flex flex-wrap gap-2">
          {techStack.map(tech => (
            <span key={tech} className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs text-zinc-300 font-mono">
              {tech}
              <button type="button" onClick={() => removeTech(tech)} className="text-zinc-500 hover:text-zinc-200 transition-colors">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <input
          value={techInput}
          onChange={e => setTechInput(e.target.value)}
          onKeyDown={addTech}
          placeholder="e.g. Next.js, TypeScript, Supabase — press Enter to add…"
          className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-lg px-4 py-2.5 text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 text-sm font-mono transition-colors"
        />
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <button
          type="button"
          onClick={() => setFeatured(prev => !prev)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
            featured
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25'
              : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Star size={14} className={featured ? 'fill-amber-400' : ''} />
          {featured ? 'Featured on homepage' : 'Mark as featured'}
        </button>
      </div>

      <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
        <button
          type="button"
          onClick={() => router.push('/admin/projects')}
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
            {published ? 'Update & Keep Live' : 'Publish Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
