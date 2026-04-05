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
} from 'lucide-react';
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
      const data = await apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`);
      setSources(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sources');
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
      setError(e instanceof Error ? e.message : 'Failed to add source');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this source? All crawl data will be lost.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/sources/${id}`, { method: 'DELETE' });
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
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
      setError(e instanceof Error ? e.message : 'Failed to trigger crawl');
    } finally {
      setCrawlingId(null);
    }
  }

  if (loading && !sources.length) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
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
            Manage the APIs and changelogs DriftWatch monitors for you.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add Source
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-300">
            <X className="inline h-3 w-3" />
          </button>
        </div>
      )}

      {/* Add source form (modal overlay) */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add API Source</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Stripe API"
                  required
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Changelog URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://stripe.com/docs/changelog"
                  required
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Source Type</label>
                <select
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
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  Crawl Interval (hours)
                </label>
                <input
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
                  className="flex-1 rounded-lg border border-gray-800 px-4 py-2.5 text-sm text-gray-400 transition hover:border-gray-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    'Add Source'
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
          <Rss className="mx-auto h-10 w-10 text-gray-700" />
          <p className="mt-4 text-sm text-gray-500">No API sources yet.</p>
          <p className="mt-1 text-xs text-gray-600">
            Add a changelog URL to start monitoring for changes.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            Add your first source
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full">
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
                <tr key={src.id} className="transition hover:bg-gray-900/30">
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
                        title="Trigger crawl"
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-violet-400 disabled:opacity-50"
                      >
                        {crawlingId === src.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(src.id)}
                        disabled={deletingId === src.id}
                        title="Delete source"
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-red-400 disabled:opacity-50"
                      >
                        {deletingId === src.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
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
