'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, FileText, FolderOpen, LogOut, PenSquare, Plus,
} from 'lucide-react';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/projects', label: 'Projects', icon: FolderOpen },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className="w-60 min-h-screen flex flex-col bg-zinc-950 border-r border-zinc-800/60">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <PenSquare size={15} className="text-zinc-900" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100 leading-none">Makezaa</p>
            <p className="text-xs text-zinc-500 mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'}
              `}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        <div className="pt-3 border-t border-zinc-800/60 mt-3 space-y-0.5">
          <Link
            href="/admin/posts/new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all duration-150"
          >
            <Plus size={16} /> New Post
          </Link>
          <Link
            href="/admin/projects/new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/8 transition-all duration-150"
          >
            <Plus size={16} /> New Project
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-zinc-800/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
