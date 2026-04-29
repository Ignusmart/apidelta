'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  Plus,
  Trash2,
  Play,
  Pause,
  Loader2,
  ExternalLink,
  X,
  Rss,
  Globe,
  Github,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Settings2,
  MoreHorizontal,
  RefreshCw,
  Eye,
  Search,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { ApiSource, SourceType } from '@/lib/types';
import { timeAgo, getTeamId } from '@/lib/shared';
import { useDemo } from '@/lib/use-demo';
import { DEMO_SOURCES } from '@/lib/demo-data';
import { useConfirm } from '@/lib/dialogs';
import { QuickAddGrid, type QuickAddSource } from '../../quick-add-sources';

const SOURCE_TYPE_OPTIONS: { value: SourceType; label: string; icon: React.ElementType }[] = [
  { value: 'HTML_CHANGELOG', label: 'HTML Changelog', icon: Globe },
  { value: 'RSS_FEED', label: 'RSS / Atom Feed', icon: Rss },
  { value: 'GITHUB_RELEASES', label: 'GitHub Releases', icon: Github },
];

type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'FAILED' | 'NEVER';
type SortKey = 'LAST_CRAWLED' | 'NAME' | 'CHANGES';
type SourceStatus = 'HEALTHY' | 'PAUSED' | 'FAILED' | 'CRAWLING' | 'NEVER';

type SourceWithRuns = ApiSource & {
  crawlRuns?: Array<{
    status: string;
    errorMessage?: string | null;
    _count?: { changes: number };
  }>;
};

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

/** Derive a friendly name from the URL */
function deriveNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'github.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length >= 2) {
        const repo = parts[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return `${repo} (GitHub)`;
      }
    }
    const host = u.hostname.replace(/^www\./, '');
    const name = host.split('.')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return '';
  }
}

/** Short, readable URL: hostname + the last meaningful path segment. */
function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/$/, '');
    if (!path || path === '/') return host;
    const segments = path.split('/').filter(Boolean);
    const tail = segments.slice(-2).join('/');
    return `${host}/${tail}`;
  } catch {
    return url;
  }
}

function getSourceStatus(src: SourceWithRuns): SourceStatus {
  if (!src.isActive) return 'PAUSED';
  const lastRun = src.crawlRuns?.[0];
  if (lastRun?.status === 'FAILED') return 'FAILED';
  if (lastRun?.status === 'RUNNING') return 'CRAWLING';
  if (!src.lastCrawledAt) return 'NEVER';
  return 'HEALTHY';
}

function getChangesCount(src: SourceWithRuns): number {
  return src.crawlRuns?.[0]?._count?.changes ?? 0;
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

  const { confirm, dialog: confirmDialog } = useConfirm();
  const [sources, setSources] = useState<SourceWithRuns[]>(isDemo ? DEMO_SOURCES : []);
  const [loading, setLoading] = useState(!isDemo);
  const [showAddForm, setShowAddForm] = useState(false);
  const [crawlingId, setCrawlingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sourceLimit, setSourceLimit] = useState<{ allowed: boolean; current: number; max: number; plan: string } | null>(null);
  const [detailSource, setDetailSource] = useState<ApiSource | null>(null);
  const [detailCrawls, setDetailCrawls] = useState<import('@/lib/types').CrawlRun[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cross-link target: deep-link from a Change → Sources?detail=<id>.
  // ?detail= auto-opens the slide-over once sources load; closing strips
  // the param so refreshing doesn't re-open the panel.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const detailIdFromUrl = searchParams.get('detail');
  const lastAutoOpenedRef = useRef<string | null>(null);

  const closeDetail = useCallback(() => {
    setDetailSource(null);
    if (detailIdFromUrl) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete('detail');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [detailIdFromUrl, pathname, router, searchParams]);

  // View state (filter/search/sort/menu)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('LAST_CRAWLED');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the action menu on outside click / Escape
  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenMenuId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openMenuId]);

  // Auto-open the slide-over when navigating from a Change row with
  // ?detail=<sourceId>. Tracks the last opened id so closing the panel
  // doesn't immediately re-open it on the next render.
  useEffect(() => {
    if (
      detailIdFromUrl &&
      !detailSource &&
      lastAutoOpenedRef.current !== detailIdFromUrl &&
      sources.length > 0
    ) {
      const match = sources.find((s) => s.id === detailIdFromUrl);
      if (match) {
        handleOpenDetail(match);
        lastAutoOpenedRef.current = detailIdFromUrl;
      }
    }
  }, [detailIdFromUrl, sources, detailSource]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleUrlChange(url: string) {
    setFormUrl(url);
    setFormErrors((prev) => ({ ...prev, url: '' }));

    if (url.length > 10) {
      const detected = detectSourceType(url);
      if (detected) {
        setFormType(detected);
        setFormTypeAutoDetected(true);
      } else {
        setFormTypeAutoDetected(false);
      }
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
        apiFetch<SourceWithRuns[]>(`/sources?teamId=${teamId}`),
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

  function closeAddForm() {
    resetSourceForm();
    setShowAddForm(false);
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
      closeAddForm();
      toast.success('Source added — first crawl starting now');
      await fetchSources();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add this source. Check the URL and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setOpenMenuId(null);
    const confirmed = await confirm({
      title: 'Delete API source',
      description: 'All crawl history and change data for this source will be permanently removed.',
      confirmLabel: 'Delete',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;
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
    setOpenMenuId(null);
    setCrawlingId(id);
    try {
      await apiFetch(`/sources/${id}/crawl`, { method: 'POST' });
      toast.success('Crawl triggered');
      setTimeout(() => fetchSources(), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start crawl');
    } finally {
      setCrawlingId(null);
    }
  }

  async function handleOpenDetail(src: ApiSource) {
    setOpenMenuId(null);
    setDetailSource(src);
    if (isDemo) {
      setDetailCrawls([]);
      return;
    }
    setDetailLoading(true);
    try {
      const data = await apiFetch<import('@/lib/types').SourceDetail>(`/sources/${src.id}`);
      setDetailCrawls(data.crawlRuns ?? []);
    } catch {
      setDetailCrawls([]);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleToggleActive(id: string, currentlyActive: boolean) {
    setOpenMenuId(null);
    if (isDemo) {
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !currentlyActive } : s));
      toast.success(currentlyActive ? 'Source paused' : 'Source resumed');
      return;
    }
    try {
      await apiFetch(`/sources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !currentlyActive } : s));
      toast.success(currentlyActive ? 'Source paused' : 'Source resumed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update source');
    }
  }

  // Derived stats for the header and filter pills
  const stats = useMemo(() => {
    const total = sources.length;
    let active = 0, paused = 0, failed = 0, never = 0, recentChanges = 0;
    for (const src of sources) {
      const status = getSourceStatus(src);
      if (status === 'PAUSED') paused++;
      else if (status === 'FAILED') failed++;
      else if (status === 'NEVER') never++;
      else active++;
      recentChanges += getChangesCount(src);
    }
    return { total, active, paused, failed, never, recentChanges };
  }, [sources]);

  const filteredSources = useMemo(() => {
    let result = sources;
    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter((src) => {
        const status = getSourceStatus(src);
        if (statusFilter === 'ACTIVE') return status === 'HEALTHY' || status === 'CRAWLING';
        if (statusFilter === 'PAUSED') return status === 'PAUSED';
        if (statusFilter === 'FAILED') return status === 'FAILED';
        if (statusFilter === 'NEVER') return status === 'NEVER';
        return true;
      });
    }
    // Search
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (src) => src.name.toLowerCase().includes(q) || src.url.toLowerCase().includes(q),
      );
    }
    // Sort
    result = [...result].sort((a, b) => {
      if (sortKey === 'NAME') return a.name.localeCompare(b.name);
      if (sortKey === 'CHANGES') return getChangesCount(b) - getChangesCount(a);
      // LAST_CRAWLED — never-crawled float to the bottom
      const aTs = a.lastCrawledAt ? new Date(a.lastCrawledAt).getTime() : 0;
      const bTs = b.lastCrawledAt ? new Date(b.lastCrawledAt).getTime() : 0;
      return bTs - aTs;
    });
    return result;
  }, [sources, statusFilter, searchQuery, sortKey]);

  if (loading && !sources.length) {
    return (
      <div className="space-y-6" role="status">
        <span className="sr-only">Loading API sources...</span>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-36 animate-pulse rounded-lg bg-gray-800" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-gray-800/60" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-800" />
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-800">
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
              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-800/60" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const limitReached = sourceLimit !== null && !sourceLimit.allowed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Sources</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add, remove, and monitor the API changelogs APIDelta crawls for your team.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={limitReached}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add Source
        </button>
      </div>

      {/* Stats bar + source-limit progress */}
      {sources.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <StatCard
            icon={Activity}
            label="Total"
            value={stats.total}
            sub={sourceLimit ? `of ${sourceLimit.max} on ${sourceLimit.plan === 'FREE_TRIAL' ? 'trial' : sourceLimit.plan.toLowerCase()}` : undefined}
            progress={sourceLimit ? sourceLimit.current / sourceLimit.max : undefined}
          />
          <StatCard icon={Activity} label="Active" value={stats.active} tone="emerald" />
          <StatCard icon={Pause} label="Paused" value={stats.paused} tone="gray" />
          <StatCard icon={AlertTriangle} label="Failed" value={stats.failed} tone={stats.failed > 0 ? 'red' : 'gray'} />
          <StatCard icon={RefreshCw} label="Recent changes" value={stats.recentChanges} tone="violet" />
        </div>
      )}

      {/* Upgrade prompt when at source limit */}
      {limitReached && (
        <div className="rounded-lg border border-violet-900/50 bg-violet-950/20 px-4 py-3 text-sm">
          <span className="text-violet-300">
            You&apos;ve reached the limit of {sourceLimit!.max} API sources on your{' '}
            {sourceLimit!.plan === 'FREE_TRIAL' ? 'free trial' : sourceLimit!.plan.toLowerCase()} plan.
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

      {/* Filters + search + sort */}
      {sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter sources by status">
            <FilterPill label="All" count={stats.total} active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
            <FilterPill label="Active" count={stats.active} active={statusFilter === 'ACTIVE'} onClick={() => setStatusFilter('ACTIVE')} tone="emerald" />
            <FilterPill label="Paused" count={stats.paused} active={statusFilter === 'PAUSED'} onClick={() => setStatusFilter('PAUSED')} tone="gray" />
            <FilterPill label="Failed" count={stats.failed} active={statusFilter === 'FAILED'} onClick={() => setStatusFilter('FAILED')} tone="red" />
            <FilterPill label="Never crawled" count={stats.never} active={statusFilter === 'NEVER'} onClick={() => setStatusFilter('NEVER')} tone="amber" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or URL"
                aria-label="Search sources"
                className="w-48 rounded-lg border border-gray-800 bg-gray-900/50 py-2 pl-8 pr-3 text-xs text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
              />
            </div>

            <div className="relative">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                aria-label="Sort sources"
                className="appearance-none rounded-lg border border-gray-800 bg-gray-900/50 py-2 pl-8 pr-8 text-xs text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
              >
                <option value="LAST_CRAWLED">Last crawled</option>
                <option value="NAME">Name (A–Z)</option>
                <option value="CHANGES">Most changes</option>
              </select>
              <ArrowUpDown aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
            </div>
          </div>
        </div>
      )}

      {/* Add source modal — presets INSIDE the modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm animate-modal-backdrop p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-source-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeAddForm(); }}
          onKeyDown={(e) => { if (e.key === 'Escape') closeAddForm(); }}
        >
          <div className="my-8 w-full max-w-3xl rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl animate-modal-content">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="add-source-title" className="text-lg font-semibold">Add API Source</h2>
                <p className="mt-0.5 text-xs text-gray-500">Start from a preset or paste a custom changelog URL.</p>
              </div>
              <button
                onClick={closeAddForm}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            {/* Quick-add presets */}
            <div className="mb-6">
              <QuickAddGrid
                onSelect={(source: QuickAddSource) => {
                  setFormUrl(source.url);
                  setFormName(source.name);
                  setFormType(source.sourceType);
                  setFormTypeAutoDetected(true);
                  // Focus the URL input so users can tweak before submitting
                  setTimeout(() => urlInputRef.current?.focus(), 50);
                }}
                disabled={limitReached}
                existingUrls={sources.map((s) => s.url)}
              />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800" /></div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-gray-950 px-2 text-gray-600">Or add a custom source</span>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-4" noValidate>
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

              <div className="grid gap-4 sm:grid-cols-2">
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
                      {formName && !formNameTouched ? 'Auto-detected from URL' : 'How this source appears in your dashboard'}
                    </p>
                  )}
                </div>

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
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  </div>
                  {formTypeAutoDetected && (
                    <p className="mt-1 text-xs text-violet-400">Auto-detected from URL</p>
                  )}
                </div>
              </div>

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
                    <label htmlFor="source-interval" className="mb-1.5 block text-sm font-medium text-gray-300">Crawl Interval</label>
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
                  onClick={closeAddForm}
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

      {/* Sources table or empty state */}
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
      ) : filteredSources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 px-6 py-10 text-center">
          <p className="text-sm text-gray-500">No sources match the current filters.</p>
          <button
            onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); }}
            className="mt-3 text-xs text-violet-400 transition hover:text-violet-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Source</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Interval</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Last Crawled</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="w-14 px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredSources.map((src) => {
                const status = getSourceStatus(src);
                const changes = getChangesCount(src);
                const isMenuOpen = openMenuId === src.id;
                const rowTone =
                  status === 'FAILED' ? 'border-l-2 border-l-red-500/60' :
                  status === 'NEVER' ? 'border-l-2 border-l-amber-500/60' :
                  status === 'PAUSED' ? 'opacity-60' : '';

                return (
                  <tr key={src.id} className={`transition-colors duration-150 hover:bg-gray-900/40 ${rowTone}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <SourceTypeIcon type={src.sourceType} />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(src)}
                            className="truncate text-sm font-medium text-white transition hover:text-violet-400 focus-visible:outline-none focus-visible:text-violet-400"
                          >
                            {src.name}
                          </button>
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={src.url}
                            className="flex items-center gap-1 truncate text-xs text-gray-500 transition hover:text-violet-400"
                          >
                            {shortUrl(src.url)}
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
                    <td className="px-5 py-4 text-sm text-gray-400">Every {src.crawlIntervalHours}h</td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-gray-500">{timeAgo(src.lastCrawledAt)}</div>
                      {src.lastCrawledAt && src.isActive && (
                        <div className="mt-0.5 text-[11px] text-gray-600">
                          Next in ~{Math.max(1, src.crawlIntervalHours - Math.round((Date.now() - new Date(src.lastCrawledAt).getTime()) / 3_600_000))}h
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={status} changes={changes} errorMessage={src.crawlRuns?.[0]?.errorMessage ?? null} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end" ref={isMenuOpen ? menuRef : undefined}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(isMenuOpen ? null : src.id)}
                            aria-label={`Actions for ${src.name}`}
                            aria-expanded={isMenuOpen}
                            aria-haspopup="menu"
                            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                          >
                            <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                          </button>
                          {isMenuOpen && (
                            <div
                              role="menu"
                              className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-lg border border-gray-800 bg-gray-950 py-1 shadow-xl"
                            >
                              <MenuItem
                                icon={Eye}
                                label="View details"
                                onClick={() => handleOpenDetail(src)}
                              />
                              <MenuItem
                                icon={RefreshCw}
                                label="Crawl now"
                                onClick={() => handleCrawl(src.id)}
                                disabled={crawlingId === src.id || !src.isActive}
                                loading={crawlingId === src.id}
                              />
                              <MenuItem
                                icon={src.isActive ? Pause : Play}
                                label={src.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                                onClick={() => handleToggleActive(src.id, src.isActive)}
                              />
                              <div className="my-1 border-t border-gray-800" />
                              <MenuItem
                                icon={Trash2}
                                label="Delete source"
                                onClick={() => handleDelete(src.id)}
                                disabled={deletingId === src.id}
                                loading={deletingId === src.id}
                                danger
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Source detail slide-over */}
      {detailSource && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="source-detail-title">
          <button type="button" aria-label="Close details" onClick={closeDetail} className="animate-modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="animate-slide-in-right relative flex h-full w-full max-w-xl flex-col border-l border-gray-800 bg-gray-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-900 px-6 py-4">
              <h2 id="source-detail-title" className="text-base font-semibold">{detailSource.name}</h2>
              <button type="button" onClick={closeDetail} aria-label="Close" className="rounded-md p-1 text-gray-500 transition hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">URL</span><a href={detailSource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300">{new URL(detailSource.url).hostname} <ExternalLink className="h-3 w-3" /></a></div>
                <div className="flex justify-between"><span className="text-gray-600">Type</span><span className="text-gray-300">{detailSource.sourceType.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Interval</span><span className="text-gray-300">Every {detailSource.crawlIntervalHours}h</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Status</span><span className={detailSource.isActive ? 'text-emerald-400' : 'text-gray-500'}>{detailSource.isActive ? 'Active' : 'Paused'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Last crawled</span><span className="text-gray-300">{timeAgo(detailSource.lastCrawledAt)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Added</span><span className="text-gray-300">{new Date(detailSource.createdAt).toLocaleDateString()}</span></div>
              </div>

              <Link
                href={isDemo ? `/dashboard/changes?sourceId=${detailSource.id}&demo=true` : `/dashboard/changes?sourceId=${detailSource.id}`}
                onClick={closeDetail}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                View changes for this source
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Crawl History</h3>
                {detailLoading ? (
                  <div className="mt-3 space-y-2">
                    {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-800/40" />)}
                  </div>
                ) : detailCrawls.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-600">No crawl history available yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {detailCrawls.slice(0, 10).map((crawl) => (
                      <div key={crawl.id} className="rounded-lg border border-gray-800 bg-gray-900/30 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            crawl.status === 'COMPLETED' ? 'text-emerald-400' :
                            crawl.status === 'FAILED' ? 'text-red-400' :
                            crawl.status === 'RUNNING' ? 'text-amber-400' : 'text-gray-500'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              crawl.status === 'COMPLETED' ? 'bg-emerald-500' :
                              crawl.status === 'FAILED' ? 'bg-red-500' :
                              crawl.status === 'RUNNING' ? 'bg-amber-500' : 'bg-gray-600'
                            }`} />
                            {crawl.status}
                          </span>
                          <span className="text-xs text-gray-600">{new Date(crawl.startedAt).toLocaleString()}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
                          {crawl.durationMs != null && <span>{(crawl.durationMs / 1000).toFixed(1)}s</span>}
                          {crawl.changes && <span>{crawl.changes.length} change{crawl.changes.length !== 1 ? 's' : ''}</span>}
                        </div>
                        {crawl.errorMessage && (
                          <p className="mt-1.5 rounded bg-red-500/10 px-2 py-1 text-xs text-red-400">{crawl.errorMessage}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────

type Tone = 'emerald' | 'red' | 'amber' | 'violet' | 'gray';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  tone = 'violet',
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  sub?: string;
  progress?: number;
  tone?: Tone;
}) {
  const toneMap: Record<Tone, string> = {
    emerald: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
    violet: 'text-violet-400',
    gray: 'text-gray-400',
  };
  const progressTone: Record<Tone, string> = {
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-gray-500">
        <span>{label}</span>
        <Icon aria-hidden="true" className={`h-3.5 w-3.5 ${toneMap[tone]}`} />
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-white">{value}</span>
        {sub && <span className="text-[11px] text-gray-600">{sub}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${progress >= 0.9 ? 'bg-amber-500' : progressTone[tone]}`}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: 'emerald' | 'gray' | 'red' | 'amber';
}) {
  const toneDot: Record<string, string> = {
    emerald: 'bg-emerald-500',
    gray: 'bg-gray-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
  };
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? 'border-violet-500/40 bg-violet-500/10 text-white'
          : 'border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-gray-200'
      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
    >
      {tone && <span className={`h-1.5 w-1.5 rounded-full ${toneDot[tone]}`} />}
      {label}
      <span className={`rounded px-1.5 text-[10px] ${active ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-800 text-gray-500'}`}>{count}</span>
    </button>
  );
}

function StatusBadge({
  status,
  changes,
  errorMessage,
}: {
  status: SourceStatus;
  changes: number;
  errorMessage: string | null;
}) {
  if (status === 'PAUSED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
        <span className="h-1.5 w-1.5 rounded-full bg-gray-600" />
        Paused
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400" title={errorMessage ?? 'Crawl failed'}>
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Failed
        {errorMessage && <AlertTriangle className="h-3 w-3 text-red-400/70" />}
      </span>
    );
  }
  if (status === 'CRAWLING') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400">
        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-violet-500" />
        Crawling
      </span>
    );
  }
  if (status === 'NEVER') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
        <Clock className="h-3 w-3" />
        Needs first crawl
      </span>
    );
  }
  // HEALTHY
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Healthy
      </span>
      {changes > 0 && (
        <span className="text-[11px] text-gray-500">
          {changes} {changes === 1 ? 'change' : 'changes'} last run
        </span>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  disabled,
  loading,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-gray-300 hover:bg-gray-900 hover:text-white'
      } focus-visible:outline-none focus-visible:bg-gray-900`}
    >
      {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Icon aria-hidden="true" className="h-4 w-4" />}
      {label}
    </button>
  );
}
