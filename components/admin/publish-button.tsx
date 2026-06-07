'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Globe } from 'lucide-react';

interface PublishButtonProps {
  apiUrl: string;
  label?: string;
}

export function PublishButton({ apiUrl, label = 'Publish' }: PublishButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Publish failed');
      }
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
      {label}
    </button>
  );
}
