'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export function AcceptInviteForm({
  token,
  teamName,
  currentTeamId,
}: {
  token: string;
  teamName: string;
  currentTeamId: string | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Accept failed (${res.status})`);
      }
      router.push('/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept invite. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold tracking-tight">Join {teamName}</h1>
        <p className="mt-2 text-sm text-gray-400">
          {currentTeamId
            ? `You'll leave your current team and join ${teamName}.`
            : `Accept the invite to join ${teamName} on APIDelta.`}
        </p>
      </div>
      {error && (
        <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handleAccept}
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        {submitting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
        Accept invite
      </button>
    </div>
  );
}
