'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import {
  GitCompareArrows,
  Filter,
  Calendar,
  X,
  ChevronDown,
  Search,
  Plus,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { ApiSource, ChangeEntry, Severity } from '@/lib/types';
import { SeverityBadge, ChangeTypeBadge } from '@/lib/components';
import { SEVERITY_ORDER, getTeamId } from '@/lib/shared';
import { useDemo } from '@/lib/use-demo';
import { DEMO_CHANGES, DEMO_SOURCES } from '@/lib/demo-data';

// Rank used to sort: lower number = more important
const SEVERITY_RANK: Record<Severity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export default function ChangesPage() {
  const { data: session } = useSession();
  const teamId = getTeamId(session);
  const isDemo = useDemo();

  const [changes, setChanges] = useState<ChangeEntry[]>(isDemo ? DEMO_CHANGES : []);
  const [sources, setSources] = useState<ApiSource[]>(isDemo ? DEMO_SOURCES : []);
  const [loading, setLoading] = useState(!isDemo);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showInfo, setShowInfo] = useState(false); // Default-hide INFO noise
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detail panel
  const [selected, setSelected] = useState<ChangeEntry | null>(null);

  // Debounced search — 300ms
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Close detail panel on Escape
  useEffect(() => {
    if (!selected) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const fetchData = useCallback(async () => {
    if (isDemo) return;
    if (!teamId) return;
    setLoading(true);
    try {
      const [changesData, sourcesData] = await Promise.all([
        apiFetch<{ changes: ChangeEntry[]; pagination: { total: number } }>(
          `/changes?teamId=${teamId}&page=1&pageSize=200`,
        ),
        apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`),
      ]);
      setChanges(changesData.changes ?? []);
      setSources(sourcesData);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Could not load changes. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [teamId, isDemo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters + sort by severity (breaking first), then date desc
  const filtered = useMemo(() => {
    const result = changes.filter((c) => {
      if (!showInfo && c.changeType === 'INFO') return false;
      if (severityFilter && c.severity !== severityFilter) return false;
      if (sourceFilter && c.crawlRun?.source?.id !== sourceFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesEndpoints = c.affectedEndpoints.some((ep) =>
          ep.toLowerCase().includes(q),
        );
        if (!matchesTitle && !matchesDesc && !matchesEndpoints) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rankDiff !== 0) return rankDiff;
      const aDate = a.changeDate
        ? new Date(a.changeDate).getTime()
        : new Date(a.createdAt).getTime();
      const bDate = b.changeDate
        ? new Date(b.changeDate).getTime()
        : new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    return result;
  }, [changes, severityFilter, sourceFilter, searchQuery, showInfo]);

  const hiddenInfoCount = useMemo(
    () => changes.filter((c) => c.changeType === 'INFO').length,
    [changes],
  );

  const activeFilterCount =
    (severityFilter ? 1 : 0) + (sourceFilter ? 1 : 0) + (searchInput ? 1 : 0);

  if (loading && !changes.length) {
    return (
      <div className="space-y-6" role="status">
        <span className="sr-only">Loading changes...</span>
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-800" />
            <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-gray-800/60" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-800" />
        </div>
        <div className="h-4 w-24 animate-pulse rounded bg-gray-800/40" />
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="h-11 animate-pulse rounded-lg border border-gray-800 bg-gray-900/30"
            />
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
          <h1 className="text-2xl font-bold tracking-tight">Changes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every API change detected across your monitored sources, classified by severity.
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            showFilters || activeFilterCount > 0
              ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
              : 'border-gray-800 bg-gray-900/50 text-gray-300 hover:border-gray-700 hover:text-white'
          }`}
        >
          <Filter aria-hidden="true" className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-5">
          <div className="mb-4">
            <label
              htmlFor="changes-search"
              className="mb-1.5 block text-xs font-medium text-gray-500"
            >
              Search
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
              />
              <input
                id="changes-search"
                type="search"
                inputMode="search"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search titles, descriptions, endpoints..."
                autoFocus
                className="w-full rounded-lg border border-gray-800 bg-gray-950 py-2.5 pl-9 pr-3.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-44">
              <label
                htmlFor="changes-severity"
                className="mb-1.5 block text-xs font-medium text-gray-500"
              >
                Severity
              </label>
              <div className="relative">
                <select
                  id="changes-severity"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as Severity | '')}
                  className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  <option value="">All severities</option>
                  {SEVERITY_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
                />
              </div>
            </div>

            <div className="w-full sm:w-52">
              <label
                htmlFor="changes-source"
                className="mb-1.5 block text-xs font-medium text-gray-500"
              >
                Source
              </label>
              <div className="relative">
                <select
                  id="changes-source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  <option value="">All sources</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
                />
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 pb-2.5 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={showInfo}
                onChange={(e) => setShowInfo(e.target.checked)}
                className="h-4 w-4 rounded border-gray-700 bg-gray-950 text-violet-500 focus:ring-violet-500/30"
              />
              Show INFO ({hiddenInfoCount})
            </label>

            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setSeverityFilter('');
                  setSourceFilter('');
                  setSearchInput('');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm text-gray-500 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {filtered.length} change{filtered.length !== 1 ? 's' : ''}{' '}
          {activeFilterCount > 0 && `(filtered from ${changes.length})`}
        </span>
        {!showInfo && hiddenInfoCount > 0 && (
          <button
            onClick={() => setShowInfo(true)}
            className="text-xs text-gray-600 transition hover:text-gray-400"
          >
            {hiddenInfoCount} INFO hidden — show
          </button>
        )}
      </div>

      {/* Changes list — compact rows */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
          <GitCompareArrows
            aria-hidden="true"
            className="mx-auto h-10 w-10 text-gray-700"
          />
          <p className="mt-4 text-sm text-gray-500">
            {changes.length === 0
              ? 'No changes detected yet'
              : 'No changes match your current filters'}
          </p>
          {changes.length === 0 ? (
            <>
              <p className="mt-1 text-xs text-gray-600">
                Changes appear here automatically after APIDelta crawls your API sources.
              </p>
              {sources.length === 0 && (
                <Link
                  href="/dashboard/sources"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Add your first API source
                </Link>
              )}
            </>
          ) : (
            <p className="mt-1 text-xs text-gray-600">
              Try adjusting your filters or search query.
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-900 overflow-hidden rounded-xl border border-gray-800 bg-gray-900/20">
          {filtered.map((change) => (
            <li key={change.id}>
              <button
                type="button"
                onClick={() => setSelected(change)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-900/60 focus-visible:bg-gray-900/60 focus-visible:outline-none"
              >
                <SeverityBadge severity={change.severity} />
                <ChangeTypeBadge type={change.changeType} />
                <span className="flex-1 truncate text-sm text-white">
                  {change.title}
                </span>
                {change.crawlRun?.source?.name && (
                  <span className="hidden shrink-0 text-xs text-gray-500 md:inline">
                    {change.crawlRun.source.name}
                  </span>
                )}
                <span className="hidden shrink-0 text-xs text-gray-600 md:inline">
                  {new Date(
                    change.changeDate ?? change.createdAt,
                  ).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Detail slide-over */}
      {selected && (
        <ChangeDetailPanel
          change={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── Detail slide-over panel ─────────────────────

function ChangeDetailPanel({
  change,
  onClose,
}: {
  change: ChangeEntry;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-detail-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative flex h-full w-full max-w-xl flex-col border-l border-gray-800 bg-gray-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-900 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={change.severity} />
            <ChangeTypeBadge type={change.changeType} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-gray-500 transition hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h2
            id="change-detail-title"
            className="text-lg font-semibold leading-snug text-white"
          >
            {change.title}
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {change.description}
          </p>

          {change.affectedEndpoints.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Affected endpoints
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {change.affectedEndpoints.map((ep) => (
                  <code
                    key={ep}
                    className="rounded bg-gray-900 px-2 py-0.5 font-mono text-xs text-violet-300"
                  >
                    {ep}
                  </code>
                ))}
              </div>
            </div>
          )}

          {change.rawExcerpt && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Raw excerpt
              </h3>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-gray-900 bg-gray-950/60 p-3 text-xs text-gray-400">
                {change.rawExcerpt}
              </pre>
            </div>
          )}

          <div className="mt-5 space-y-1.5 text-xs text-gray-500">
            {change.crawlRun?.source?.name && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Source</span>
                <span className="text-gray-400">
                  {change.crawlRun.source.name}
                </span>
              </div>
            )}
            {change.crawlRun?.source?.url && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">URL</span>
                <a
                  href={change.crawlRun.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300"
                >
                  Visit
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {change.changeDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Change date</span>
                <span className="inline-flex items-center gap-1 text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(change.changeDate).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Detected</span>
              <span className="text-gray-400">
                {new Date(change.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
