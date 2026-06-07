import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubmissionById, formatPreferredTime } from '@/lib/submissions';
import { DeleteItemButton } from '@/components/admin/delete-item-button';
import { ArrowLeft, Calendar, Mail, Building2, Clock, ExternalLink } from 'lucide-react';

export default async function AdminInboxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmissionById(id);
  if (!submission) notFound();

  const isMeeting = submission.type === 'meeting';

  return (
    <div className="p-8 space-y-6 max-w-3xl">
      <Link
        href="/admin/inbox"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft size={14} /> Back to inbox
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
              isMeeting
                ? 'text-blue-400 border-blue-500/30 bg-blue-500/10'
                : 'text-purple-400 border-purple-500/30 bg-purple-500/10'
            }`}>
              {isMeeting ? <Calendar size={11} /> : <Mail size={11} />}
              {isMeeting ? 'Meeting request' : 'Contact message'}
            </span>
            <span className="text-xs text-zinc-600">
              {new Date(submission.created_at).toLocaleString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-100">{submission.name}</h1>
        </div>
        <DeleteItemButton
          apiUrl={`/api/admin/submissions/${submission.id}`}
          redirectTo="/admin/inbox"
          label="Delete"
        />
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl divide-y divide-zinc-800">
        <div className="p-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Email</span>
          <a
            href={`mailto:${submission.email}`}
            className="text-sm text-zinc-200 hover:text-white flex items-center gap-1.5"
          >
            {submission.email}
            <ExternalLink size={12} className="text-zinc-500" />
          </a>
        </div>

        {submission.company && (
          <div className="p-5 grid grid-cols-[auto_1fr] gap-x-4">
            <span className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Building2 size={12} /> Company
            </span>
            <span className="text-sm text-zinc-200">{submission.company}</span>
          </div>
        )}

        {isMeeting && (
          <div className="p-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <span className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Preferred
            </span>
            <div className="text-sm text-zinc-200 space-y-1">
              <p>
                {submission.preferred_date
                  ? new Date(submission.preferred_date + 'T12:00:00').toLocaleDateString(undefined, {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })
                  : 'No date selected'}
              </p>
              {submission.preferred_time && (
                <p className="flex items-center gap-1.5 text-zinc-400">
                  <Clock size={13} />
                  {formatPreferredTime(submission.preferred_time)}
                </p>
              )}
            </div>
          </div>
        )}

        {submission.message && (
          <div className="p-5">
            <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-3">Message</span>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{submission.message}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <a
          href={`mailto:${submission.email}?subject=${encodeURIComponent(
            isMeeting ? 'Re: Your meeting request — Makezaa' : 'Re: Your message — Makezaa'
          )}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-semibold transition-colors"
        >
          <Mail size={14} /> Reply by email
        </a>
      </div>
    </div>
  );
}
