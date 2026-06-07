import Link from 'next/link';
import { Suspense } from 'react';
import { getAllSubmissions, formatPreferredTime } from '@/lib/submissions';
import { DeleteItemButton } from '@/components/admin/delete-item-button';
import { InboxTabs } from '@/components/admin/inbox-tabs';
import { Inbox, Calendar, Mail, Eye } from 'lucide-react';
import type { SubmissionType } from '@/lib/types';

export default async function AdminInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const filter = type === 'meeting' || type === 'contact' ? type : null;

  const all = await getAllSubmissions();
  const submissions = filter ? all.filter(s => s.type === filter) : all;
  const meetingCount = all.filter(s => s.type === 'meeting').length;
  const messageCount = all.filter(s => s.type === 'contact').length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Inbox</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {meetingCount} meeting{meetingCount !== 1 ? 's' : ''} · {messageCount} message{messageCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-48 bg-zinc-800 rounded-lg animate-pulse" />}>
          <InboxTabs />
        </Suspense>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-12 text-center">
          <Inbox size={32} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400 text-sm">
            {filter === 'meeting' && 'No meeting requests yet.'}
            {filter === 'contact' && 'No contact messages yet.'}
            {!filter && 'No submissions yet. They will appear here when users book a meeting or send a message.'}
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">
            <span>From</span>
            <span>Type</span>
            <span>Date</span>
            <span>Actions</span>
          </div>
          {submissions.map(sub => (
            <div
              key={sub.id}
              className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 md:gap-4 items-start md:items-center px-5 py-4 border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30 transition-colors"
            >
              <div className="min-w-0">
                <Link href={`/admin/inbox/${sub.id}`} className="text-sm font-medium text-zinc-200 hover:text-white block">
                  {sub.name}
                </Link>
                <p className="text-xs text-zinc-500 mt-0.5">{sub.email}</p>
                {sub.message && (
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{sub.message}</p>
                )}
                {sub.type === 'meeting' && (sub.preferred_date || sub.preferred_time) && (
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <Calendar size={11} />
                    {sub.preferred_date
                      ? new Date(sub.preferred_date + 'T12:00:00').toLocaleDateString()
                      : 'No date'}
                    {sub.preferred_time && ` · ${formatPreferredTime(sub.preferred_time)}`}
                  </p>
                )}
              </div>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border whitespace-nowrap w-fit ${
                sub.type === 'meeting'
                  ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                  : 'text-purple-400 border-purple-500/30 bg-purple-500/10'
              }`}>
                {sub.type === 'meeting' ? <Calendar size={11} /> : <Mail size={11} />}
                {sub.type === 'meeting' ? 'Meeting' : 'Message'}
              </span>
              <span className="text-xs text-zinc-500 whitespace-nowrap">
                {new Date(sub.created_at).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/inbox/${sub.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <Eye size={13} /> View
                </Link>
                <DeleteItemButton
                  apiUrl={`/api/admin/submissions/${sub.id}`}
                  redirectTo={filter ? `/admin/inbox?type=${filter}` : '/admin/inbox'}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
