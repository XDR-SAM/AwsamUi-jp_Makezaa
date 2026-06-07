import Link from 'next/link';
import { getAllProjects } from '@/lib/projects';
import { DeleteItemButton } from '@/components/admin/delete-item-button';
import { PublishButton } from '@/components/admin/publish-button';
import { Plus, FolderOpen, Pencil, Star, ExternalLink } from 'lucide-react';

export default async function AdminProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Projects</h1>
          <p className="text-sm text-zinc-500 mt-1">{projects.length} total · manage portfolio work</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center">
          <FolderOpen size={32} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-sm">No projects yet.</p>
          <Link href="/admin/projects/new" className="inline-block mt-4 text-sm text-zinc-200 hover:underline">
            Add your first project →
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <span>Title</span>
            <span>Status</span>
            <span>Tech</span>
            <span>Actions</span>
          </div>
          {projects.map(project => (
            <div
              key={project.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-4 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="min-w-0 flex items-center gap-2">
                {project.featured && <Star size={14} className="text-amber-400 shrink-0 fill-amber-400" />}
                <div className="min-w-0">
                  <Link href={`/admin/projects/${project.id}`} className="text-sm font-medium text-zinc-200 hover:text-white truncate block">
                    {project.title}
                  </Link>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">/projects/{project.slug}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${
                project.published
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : 'text-zinc-500 border-zinc-700 bg-zinc-800'
              }`}>
                {project.published ? 'Published' : 'Draft'}
              </span>
              <span className="text-xs text-zinc-500 font-mono truncate max-w-[140px]">
                {project.tech_stack?.slice(0, 2).join(', ') || '—'}
              </span>
              <div className="flex items-center gap-2">
                {!project.published && (
                  <PublishButton apiUrl={`/api/admin/projects/${project.id}`} />
                )}
                {project.published && (
                  <Link
                    href={`/projects/${project.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <ExternalLink size={13} /> View
                  </Link>
                )}
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <Pencil size={13} /> Edit
                </Link>
                <DeleteItemButton
                  apiUrl={`/api/admin/projects/${project.id}`}
                  redirectTo="/admin/projects"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
