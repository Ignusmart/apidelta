'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Plus,
  Trash2,
  Play,
  Loader2,
  ExternalLink,
  X,
  Rss,
  Globe,
  Github,
  ArrowUpRight,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { ApiSource, SourceType } from '@/lib/types';
import { timeAgo, getTeamId } from '@/lib/shared';
import { useDemo } from '@/lib/use-demo';
import { DEMO_SOURCES } from '@/lib/demo-data';
import { QuickAddGrid, type QuickAddSource } from '../../quick-add-sources';

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string; icon: React.ElementType }[] = [
  { value: 'HTML_CHANGELOG', label: 'HTML Changelog', icon: Globe },
  { value: 'RSS_FEED', label: 'RSS / Atom Feed', icon: Rss },
  { value: 'GITHUB_RELEASES', label: 'GitHub Releases', icon: Github },
];

/** Try to auto-detect source type from URL */
function detectSourceType(url: string): SourceType | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'github.com' && /\/releases/i.test(u.pathname)) return 'GITHUB_RELEASES';
    if (/\.(rss|xml|atom)$/i.test(u.pathname) || /\/feed/i.test(u.pathname) || /\/rss/i.test(u.pathname)) return 'RSS_FEED';
    return null;
  } catch {
    return null;
  }
}

/** Try to derive a friendly name from the URL */
function deriveNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    // GitHub: "owner/repo" -> "Repo"
    if (u.hostname === 'github.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const repo = parts[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return `${repo} (GitHub)`;
      }
    }
    // Otherwise derive from hostname — e.g. "stripe.com" -> "Stripe"
    const host = u.hostname.replace(/^www\./, '');
    const name = host.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return '';
  }
}

function SourceTypeIcon({ type }: { type: SourceType }) {
  const opt = SOURCE_TYPE_OPTIONS.find((o) => o.value === type);
  if (!opt) return null;
  const Icon = opt.icon;
  return <Icon className="h-4 w-4 text-gray-500" />;
}

export default function SourcesPage() {
  const { data: session } = useSession();
  const teamId = getTeamId(session);
  const isDemo = useDemo();

  const [sources, setSources] = useState<ApiSource[]>(isDemo ? DEMO_SOURCES : []);
  const [loading, setLoading] = useState(!isDemo);
  const [showAddForm, setShowAddForm] = useState(false);
  const [crawlingId, setCrawlingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sourceLimit, setSourceLimit] = useState<{ allowed: boolean; current: number; max: number; plan: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNameTouched, setFormNameTouched] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [formUrlTouched, setFormUrlTouched] = useState(false);
  const [formType, setFormType] = useState<SourceType>('HTML_CHANGELOG');
  const [formTypeAutoDetected, setFormTypeAutoDetected] = useState(false);
  const [formInterval, setFormInterval] = useState(6);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect source type and name when URL changes
  function handleUrlChange(url: string) {
    setFormUrl(url);
    setFormErrors((prev) => ({ ...prev, url: '' }));

    if (url.length > 10) {
      // Auto-detect source type
      const detected = detectSourceType(url);
      if (detected) {
        setFormType(detected);
        setFormTypeAutoDetected(true);
      } else {
        setFormTypeAutoDetected(false);
      }

      // Auto-fill name if user hasn't manually typed one
      if (!formNameTouched) {
        const derived = deriveNameFromUrl(url);
        if (derived) setFormName(derived);
      }
    }
  }

  function validateSourceForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formUrl.trim()) {
      errors.url = 'Changelog URL is required';
    } else {
      try {
        new URL(formUrl);
      } catch {
        errors.url = 'Enter a valid URL (e.g. https://stripe.com/docs/changelog)';
      }
    }
    if (!formName.trim()) {
      errors.name = 'Give this source a name so you can find it later';
    }
    if (formInterval < 1 || formInterval > 168) {
      errors.interval = 'Interval must be between 1 and 168 hours';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  const fetchSources = useCallback(async () => {
    if (isDemo) return;
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

    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load API sources');
    } finally {
      setLoading(false);
    }
  }, [teamId, isDemo]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  function resetSourceForm() {
    setFormName('');
    setFormNameTouched(false);
    setFormUrl('');
    setFormUrlTouched(false);
    setFormType('HTML_CHANGELOG');
    setFormTypeAutoDetected(false);
    setFormInterval(6);
    setShowAdvanced(false);
    setFormErrors({});
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) return;
    if (!validateSourceForm()) return;
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
      resetSourceForm();
      setShowAddForm(false);
      toast.success('Source added — first crawl starting now');
      await fetchSources();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add this source. Check the URL and try again.');
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
      toast.success('Source deleted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete this source');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCrawl(id: string) {
    setCrawlingId(id);
    try {
      await apiFetch(`/sources/${id}/crawl`, { method: 'POST' });
      toast.success('Crawl triggered');
      // Refresh to get updated lastCrawledAt
      setTimeout(() => fetchSources(), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start crawl');
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
            Add, remove, and monitor the API changelogs APIDelta crawls for your team.
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

      {/* Add source form (modal overlay) */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-backdrop p-4" role="dialog" aria-modal="true" aria-labelledby="add-source-title" onClick={(e) => { if (e.target === e.currentTarget) { resetSourceForm(); setShowAddForm(false); } }} onKeyDown={(e) => { if (e.key === 'Escape') { resetSourceForm(); setShowAddForm(false); } }}>
          <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl animate-modal-content">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="add-source-title" className="text-lg font-semibold">Add API Source</h2>
                <p className="mt-0.5 text-xs text-gray-500">Paste a changelog URL and we&apos;ll start monitoring it.</p>
              </div>
              <button
                onClick={() => { resetSourceForm(); setShowAddForm(false); }}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4" noValidate>
              {/* URL first — the primary input */}
              <div>
                <label htmlFor="source-url" className="mb-1.5 block text-sm font-medium text-gray-300">Changelog URL</label>
                <input
                  ref={urlInputRef}
                  id="source-url"
                  type="url"
                  value={formUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={() => setFormUrlTouched(true)}
                  placeholder="https://stripe.com/docs/changelog"
                  autoFocus
                  aria-describedby={formErrors.url ? 'source-url-error' : 'source-url-hint'}
                  aria-invalid={formUrlTouched && !!formErrors.url}
                  className={`w-full rounded-lg border bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:ring-1 ${
                    formUrlTouched && formErrors.url
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-gray-800 focus:border-violet-500 focus:ring-violet-500/30'
                  }`}
                />
                {formUrlTouched && formErrors.url ? (
                  <p id="source-url-error" className="mt-1 text-xs text-red-400">{formErrors.url}</p>
                ) : (
                  <p id="source-url-hint" className="mt-1 text-xs text-gray-600">HTML changelog page, RSS feed, or GitHub releases URL</p>
                )}
              </div>

              {/* Name — auto-filled from URL, editable */}
              <div>
                <label htmlFor="source-name" className="mb-1.5 block text-sm font-medium text-gray-300">Display Name</label>
                <input
                  id="source-name"
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setFormNameTouched(true); setFormErrors((prev) => ({ ...prev, name: '' })); }}
                  onBlur={() => setFormNameTouched(true)}
                  placeholder="e.g. Stripe API"
                  aria-describedby={formErrors.name ? 'source-name-error' : 'source-name-hint'}
                  aria-invalid={formNameTouched && !!formErrors.name}
                  className={`w-full rounded-lg border bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:ring-1 ${
                    formNameTouched && formErrors.name
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-gray-800 focus:border-violet-500 focus:ring-violet-500/30'
                  }`}
                />
                {formNameTouched && formErrors.name ? (
                  <p id="source-name-error" className="mt-1 text-xs text-red-400">{formErrors.name}</p>
                ) : (
                  <p id="source-name-hint" className="mt-1 text-xs text-gray-600">
                    {formName && !formNameTouched ? 'Auto-detected from URL — edit if you prefer a different name' : 'A short name to identify this source in your dashboard'}
                  </p>
                )}
              </div>

              {/* Source type — with auto-detection indicator */}
              <div>
                <label htmlFor="source-type" className="mb-1.5 block text-sm font-medium text-gray-300">Source Type</label>
                <div className="relative">
                  <select
                    id="source-type"
                    value={formType}
                    onChange={(e) => { setFormType(e.target.value as SourceType); setFormTypeAutoDetected(false); }}
                    className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                  >
                    {SOURCE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                </div>
                {formTypeAutoDetected && (
                  <p className="mt-1 text-xs text-violet-400">Auto-detected from URL</p>
                )}
              </div>

              {/* Advanced settings — progressive disclosure */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
                  aria-expanded={showAdvanced}
                >
                  <Settings2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Advanced settings
                  <ChevronDown aria-hidden="true" className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                {showAdvanced && (
                  <div className="mt-3">
                    <label htmlFor="source-interval" className="mb-1.5 block text-sm font-medium text-gray-300">
                      Crawl Interval
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="source-interval"
                        type="number"
                        min={1}
                        max={168}
                        value={formInterval}
                        onChange={(e) => { setFormInterval(Number(e.target.value)); setFormErrors((prev) => ({ ...prev, interval: '' })); }}
                        aria-describedby={formErrors.interval ? 'source-interval-error' : 'source-interval-hint'}
                        aria-invalid={!!formErrors.interval}
                        className={`w-24 rounded-lg border bg-gray-900 px-3.5 py-2.5 text-sm text-white outline-none transition focus:ring-1 ${
                          formErrors.interval
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                            : 'border-gray-800 focus:border-violet-500 focus:ring-violet-500/30'
                        }`}
                      />
                      <span className="text-sm text-gray-500">hours</span>
                    </div>
                    {formErrors.interval ? (
                      <p id="source-interval-error" className="mt-1 text-xs text-red-400">{formErrors.interval}</p>
                    ) : (
                      <p id="source-interval-hint" className="mt-1 text-xs text-gray-600">Default: every 6 hours. Most changelogs update daily at most.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetSourceForm(); setShowAddForm(false); }}
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
        <div className="rounded-xl border border-dashed border-gray-800 px-6 py-12 text-center">
          <Rss aria-hidden="true" className="mx-auto h-10 w-10 text-gray-700" />
          <p className="mt-4 text-sm text-gray-500">No API sources yet.</p>
          <p className="mt-1 text-xs text-gray-600">
            Paste a changelog URL and APIDelta starts monitoring within minutes.
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
                  <td className="px-5 py-4">
                    <div className="text-sm text-gray-500">{timeAgo(src.lastCrawledAt)}</div>
                    {src.lastCrawledAt && src.isActive && (
                      <div className="mt-0.5 text-[11px] text-gray-600">
                        Next in ~{Math.max(1, src.crawlIntervalHours - Math.round((Date.now() - new Date(src.lastCrawledAt).getTime()) / 3_600_000))}h
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {(() => {
                      const lastRun = (src as ApiSource & { crawlRuns?: Array<{ status: string; errorMessage?: string | null }> }).crawlRuns?.[0];
                      if (!src.isActive) {
                        return (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
                            Paused
                          </span>
                        );
                      }
                      if (lastRun?.status === 'FAILED') {
                        return (
                          <span className="group inline-flex items-center gap-1.5 text-xs font-medium text-red-400" title={lastRun.errorMessage ?? 'Crawl failed'}>
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            Failed
                          </span>
                        );
                      }
                      if (lastRun?.status === 'RUNNING') {
                        return (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400">
                            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-violet-500" />
                            Crawling
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Healthy
                        </span>
                      );
                    })()}
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

      {/* Quick-add popular APIs */}
      <QuickAddGrid
        onSelect={(source: QuickAddSource) => {
          setFormUrl(source.url);
          setFormName(source.name);
          setFormType(source.sourceType);
          setFormTypeAutoDetected(true);
          setShowAddForm(true);
        }}
        disabled={sourceLimit !== null && !sourceLimit.allowed}
        existingUrls={sources.map((s) => s.url)}
      />
    </div>
  );
}
