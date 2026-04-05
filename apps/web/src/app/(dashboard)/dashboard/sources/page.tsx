'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Trash2,
  Play,
  Loader2,
  ExternalLink,
  AlertTriangle,
  X,
  Rss,
  Globe,
  Github,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { ApiSource, SourceType } from '@/lib/types';

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string; icon: React.ElementType }[] = [
  { value: 'HTML_CHANGELOG', label: 'HTML Changelog', icon: Globe },
  { value: 'RSS_FEED', label: 'RSS / Atom Feed', icon: Rss },
  { value: 'GITHUB_RELEASES', label: 'GitHub Releases', icon: Github },
];

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function SourceTypeIcon({ type }: { type: SourceType }) {
  const opt = SOURCE_TYPE_OPTIONS.find((o) => o.value === type);
  if (!opt) return null;
  const Icon = opt.icon;
  return <Icon className="h-4 w-4 text-gray-500" />;
}

export default function SourcesPage() {
  const { data: session } = useSession();
  const teamId = (session?.user as Record<string, unknown>)?.teamId as string | undefined;

  const [sources, setSources] = useState<ApiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [crawlingId, setCrawlingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sourceLimit, setSourceLimit] = useState<{ allowed: boolean; current: number; max: number; plan: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formType, setFormType] = useState<SourceType>('HTML_CHANGELOG');
  const [formInterval, setFormInterval] = useState(6);
  const [submitting, setSubmitting] = useState(false);

  const fetchSources = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [data, limitData] = await Promise.all([
        apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`),
        apiFetch<{ allowed: boolean; current: number; max: number; plan: string }>(
          `/billing/check-source-limit?teamId=${teamId}`,
        ),
      ]);
      setSources(data);
      setSourceLimit(limitData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load API sources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) return;
    setSubmitting(true);
    try {
      await apiFetch('/sources', {
        method: 'POST',
        body: JSON.stringify({
          name: formName,
          url: formUrl,
          sourceType: formType,
          teamId,
          crawlIntervalHours: formInterval,
        }),
      });
      setFormName('');
      setFormUrl('');
      setFormType('HTML_CHANGELOG');
      setFormInterval(6);
      setShowAddForm(false);
      await fetchSources();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add this source. Check the URL and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this API source? All crawl history and change data for this source will be permanently removed.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/sources/${id}`, { method: 'DELETE' });
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this source. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCrawl(id: string) {
    setCrawlingId(id);
    try {
      await apiFetch(`/sources/${id}/crawl`, { method: 'POST' });
      // Refresh to get updated lastCrawledAt
      setTimeout(() => fetchSources(), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start crawl. Please try again.');
    } finally {
      setCrawlingId(null);
    }
  }

  if (loading && !sources.length) {
    return (
      <div className="space-y-6" role="status">
        <span className="sr-only">Loading API sources...</span>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-36 animate-pulse rounded-lg bg-gray-800" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-gray-800/60" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-800" />
        </div>
        {/* Table skeleton */}
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <div className="border-b border-gray-800 bg-gray-900/50 px-5 py-3">
            <div className="flex gap-16">
              {[80, 60, 48, 64, 48, 40].map((w, i) => (
                <div key={i} className="h-3 animate-pulse rounded bg-gray-800/60" style={{ width: `${w}px` }} />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-6 border-b border-gray-800/50 px-5 py-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-4 w-4 animate-pulse rounded bg-gray-800/60" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 animate-pulse rounded bg-gray-800" />
                  <div className="h-3 w-48 animate-pulse rounded bg-gray-800/40" />
                </div>
              </div>
              <div className="h-5 w-20 animate-pulse rounded bg-gray-800/60" />
              <div className="h-4 w-16 animate-pulse rounded bg-gray-800/40" />
              <div className="h-4 w-14 animate-pulse rounded bg-gray-800/40" />
              <div className="h-4 w-12 animate-pulse rounded bg-gray-800/40" />
              <div className="flex gap-1">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-800/60" />
                <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Sources</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add, remove, and monitor the API changelogs DriftWatch crawls for your team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sourceLimit && (
            <span className="text-xs text-gray-500">
              {sourceLimit.current}/{sourceLimit.max} sources
            </span>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            disabled={sourceLimit !== null && !sourceLimit.allowed}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add Source
          </button>
        </div>
      </div>

      {/* Upgrade prompt when at source limit */}
      {sourceLimit && !sourceLimit.allowed && (
        <div className="rounded-lg border border-violet-900/50 bg-violet-950/20 px-4 py-3 text-sm">
          <span className="text-violet-300">
            You&apos;ve reached the limit of {sourceLimit.max} API sources on your{' '}
            {sourceLimit.plan === 'FREE_TRIAL' ? 'free trial' : sourceLimit.plan.toLowerCase()} plan.
          </span>{' '}
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 font-medium text-violet-400 transition hover:text-violet-300"
          >
            Upgrade to monitor more APIs
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertTriangle aria-hidden="true" className="mr-2 inline h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error" className="ml-2 rounded text-red-500 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <X aria-hidden="true" className="inline h-3 w-3" />
          </button>
        </div>
      )}

      {/* Add source form (modal overlay) */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-source-title" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setShowAddForm(false); }}>
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl animate-modal-content">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="add-source-title" className="text-lg font-semibold">Add API Source</h2>
              <button
                onClick={() => setShowAddForm(false)}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label htmlFor="source-name" className="mb-1.5 block text-sm font-medium text-gray-300">Name</label>
                <input
                  id="source-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Stripe API"
                  required
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label htmlFor="source-url" className="mb-1.5 block text-sm font-medium text-gray-300">Changelog URL</label>
                <input
                  id="source-url"
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://stripe.com/docs/changelog"
                  required
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label htmlFor="source-type" className="mb-1.5 block text-sm font-medium text-gray-300">Source Type</label>
                <select
                  id="source-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as SourceType)}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  {SOURCE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="source-interval" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Crawl Interval (hours)
                </label>
                <input
                  id="source-interval"
                  type="number"
                  min={1}
                  max={168}
                  value={formInterval}
                  onChange={(e) => setFormInterval(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-lg border border-gray-800 px-4 py-2.5 text-sm text-gray-400 transition hover:border-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                >
                  {submitting ? (
                    <>
                      <Loader2 aria-hidden="true" className="mx-auto h-4 w-4 animate-spin" />
                      <span className="sr-only">Adding source...</span>
                    </>
                  ) : (
                    'Add and Start Monitoring'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sources table */}
      {sources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
          <Rss aria-hidden="true" className="mx-auto h-10 w-10 text-gray-700" />
          <p className="mt-4 text-sm text-gray-500">No API sources yet.</p>
          <p className="mt-1 text-xs text-gray-600">
            Paste a changelog URL and DriftWatch starts monitoring within minutes.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add your first API source
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Source
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Interval
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Last Crawled
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {sources.map((src) => (
                <tr key={src.id} className="transition-colors duration-150 hover:bg-gray-900/40">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <SourceTypeIcon type={src.sourceType} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{src.name}</p>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 truncate text-xs text-gray-600 transition hover:text-violet-400"
                        >
                          {src.url}
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                      {src.sourceType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    Every {src.crawlIntervalHours}h
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {timeAgo(src.lastCrawledAt)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        src.isActive ? 'text-emerald-400' : 'text-gray-600'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          src.isActive ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                      />
                      {src.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleCrawl(src.id)}
                        disabled={crawlingId === src.id}
                        aria-label={`Trigger crawl for ${src.name}`}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-violet-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      >
                        {crawlingId === src.id ? (
                          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play aria-hidden="true" className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(src.id)}
                        disabled={deletingId === src.id}
                        aria-label={`Delete ${src.name}`}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      >
                        {deletingId === src.id ? (
                          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
