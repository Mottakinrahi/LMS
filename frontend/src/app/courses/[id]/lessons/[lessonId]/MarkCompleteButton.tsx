'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  lessonId: string;
  isCompleted: boolean;
}

export default function MarkCompleteButton({ lessonId, isCompleted }: Props) {
  const [completed, setCompleted] = useState(isCompleted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleMarkComplete() {
    if (completed) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
      });

      if (res.ok) {
        setCompleted(true);
        // Refresh the page server data so the badge appears
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to mark as complete');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
        <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          ✓ Lesson Completed — great work!
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        id="mark-complete-btn"
        onClick={handleMarkComplete}
        disabled={loading}
        className="
          flex items-center gap-2 px-6 py-2.5
          bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900
          text-white font-semibold text-sm rounded-xl
          transition-all shadow-lg shadow-emerald-500/20
          disabled:cursor-not-allowed
        "
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving…
          </>
        ) : (
          <>✓ Mark as Complete</>
        )}
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
