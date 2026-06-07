import { getAllPosts } from '@/lib/blog';
import { getAllProjects } from '@/lib/projects';
import { FileText, FolderOpen, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [posts, projects] = await Promise.all([getAllPosts(), getAllProjects()]);

  const publishedPosts = posts.filter(p => p.published);
  const draftPosts = posts.filter(p => !p.published);
  const publishedProjects = projects.filter(p => p.published);
  const draftProjects = projects.filter(p => !p.published);

  const stats = [
    { label: 'Total Posts', value: posts.length, icon: FileText, sub: `${publishedPosts.length} published · ${draftPosts.length} drafts`, href: '/admin/posts', color: 'text-blue-400' },
    { label: 'Total Projects', value: projects.length, icon: FolderOpen, sub: `${publishedProjects.length} published · ${draftProjects.length} drafts`, href: '/admin/projects', color: 'text-purple-400' },
    { label: 'Published', value: publishedPosts.length + publishedProjects.length, icon: Eye, sub: 'Posts & projects live', href: '#', color: 'text-emerald-400' },
    { label: 'Drafts', value: draftPosts.length + draftProjects.length, icon: EyeOff, sub: 'Not yet published', href: '#', color: 'text-amber-400' },
  ];

  const recentPosts = posts.slice(0, 5);
  const recentProjects = projects.slice(0, 5);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Welcome back. Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, sub, href, color }) => (
          <Link key={label} href={href} className="group bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center ${color}`}>
                <Icon size={16} />
              </div>
            </div>
            <p className="text-3xl font-bold text-zinc-100 tabular-nums">{value}</p>
            <p className="text-sm font-medium text-zinc-300 mt-0.5">{label}</p>
            <p className="text-xs text-zinc-500 mt-1">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Recent content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">Recent Posts</h2>
            <Link href="/admin/posts/new" className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors">+ New</Link>
          </div>
          <div className="space-y-2">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No posts yet. <Link href="/admin/posts/new" className="text-zinc-300 hover:underline">Create one</Link></p>
            ) : recentPosts.map(post => (
              <Link key={post.id} href={`/admin/posts/${post.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/60 transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate group-hover:text-white">{post.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full border ${post.published ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-zinc-500 border-zinc-700 bg-zinc-800'}`}>
                  {post.published ? 'Live' : 'Draft'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">Recent Projects</h2>
            <Link href="/admin/projects/new" className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors">+ New</Link>
          </div>
          <div className="space-y-2">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">No projects yet. <Link href="/admin/projects/new" className="text-zinc-300 hover:underline">Create one</Link></p>
            ) : recentProjects.map(project => (
              <Link key={project.id} href={`/admin/projects/${project.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/60 transition-colors group">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 font-medium truncate group-hover:text-white">{project.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {project.tech_stack?.slice(0, 3).join(', ') || 'No tech stack'}
                  </p>
                </div>
                <span className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full border ${project.published ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-zinc-500 border-zinc-700 bg-zinc-800'}`}>
                  {project.published ? 'Live' : 'Draft'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
