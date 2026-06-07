'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteItemButtonProps {
  apiUrl: string;
  redirectTo: string;
  label?: string;
}

export function DeleteItemButton({ apiUrl, redirectTo, label = 'Delete' }: DeleteItemButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(apiUrl, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 size={12} className="animate-spin" /> : null}
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/8 transition-colors"
      title={label}
    >
      <Trash2 size={13} />
      {label}
    </button>
  );
}
