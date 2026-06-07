'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const tabs = [
  { label: 'All', value: 'all' },
  { label: 'Meetings', value: 'meeting' },
  { label: 'Messages', value: 'contact' },
] as const;

export function InboxTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('type') ?? 'all';

  return (
    <div className="flex gap-2">
      {tabs.map(({ label, value }) => {
        const href = value === 'all' ? pathname : `${pathname}?type=${value}`;
        const active = current === value;
        return (
          <Link
            key={value}
            href={href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-zinc-100 text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
