'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  GitCompareArrows,
  AlertTriangle,
  Filter,
  Calendar,
  X,
  ChevronDown,
  Search,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type {
  ApiSource,
  ChangeEntry,
  Severity,
} from '@/lib/types';
import { SeverityBadge, ChangeTypeBadge } from '@/lib/components';
import { SEVERITY_ORDER, getTeamId } from '@/lib/shared';

export default function ChangesPage() {
  const { data: session } = useSession();
  const teamId = getTeamId(session);

  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search — 300ms delay to avoid filtering on every keystroke
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }

  // Clear debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [changesData, sourcesData] = await Promise.all([
        apiFetch<{ changes: ChangeEntry[]; pagination: { total: number } }>(
          `/changes?teamId=${teamId}&page=1&pageSize=100`,
        ),
        apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`),
      ]);
      setChanges(changesData.changes ?? []);
      setSources(sourcesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load changes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters
  const filtered = changes.filter((c) => {
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

  const activeFilterCount =
    (severityFilter ? 1 : 0) + (sourceFilter ? 1 : 0) + (searchInput ? 1 : 0);

  if (loading && !changes.length) {
    return (
      <div className="space-y-6" role="status">
        <span className="sr-only">Loading changes...</span>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-28 animate-pulse rounded-lg bg-gray-800" />
            <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-gray-800/60" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-800" />
        </div>
        {/* Results count skeleton */}
        <div className="h-4 w-24 animate-pulse rounded bg-gray-800/40" />
        {/* Change cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/30 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-5 w-16 animate-pulse rounded-full bg-gray-800/60" />
                <div className="h-5 w-20 animate-pulse rounded bg-gray-800/40" />
              </div>
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-gray-800" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-800/40" />
              <div className="mt-3 flex gap-2">
                <div className="h-5 w-24 animate-pulse rounded bg-gray-800/60" />
                <div className="h-5 w-20 animate-pulse rounded bg-gray-800/60" />
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

      {error && (
        <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertTriangle aria-hidden="true" className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-5">
          {/* Search — full width on its own row */}
          <div className="mb-4">
            <label htmlFor="changes-search" className="mb-1.5 block text-xs font-medium text-gray-500">
              Search
            </label>
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
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
            {/* Severity */}
            <div className="w-full sm:w-44">
              <label htmlFor="changes-severity" className="mb-1.5 block text-xs font-medium text-gray-500">
                Severity
              </label>
              <div className="relative">
                <select
                  id="changes-severity"
                  value={severityFilter}
                  onChange={(e) =>
                    setSeverityFilter(e.target.value as Severity | '')
                  }
                  className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  <option value="">All severities</option>
                  {SEVERITY_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              </div>
            </div>

            {/* Source */}
            <div className="w-full sm:w-52">
              <label htmlFor="changes-source" className="mb-1.5 block text-xs font-medium text-gray-500">
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
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              </div>
            </div>

            {/* Clear filters */}
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
      <div className="text-sm text-gray-500">
        {filtered.length} change{filtered.length !== 1 ? 's' : ''}{' '}
        {activeFilterCount > 0 && `(filtered from ${changes.length})`}
      </div>

      {/* Changes list */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
          <GitCompareArrows aria-hidden="true" className="mx-auto h-10 w-10 text-gray-700" />
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
        <div className="space-y-3">
          {filtered.map((change) => (
            <div
              key={change.id}
              className="rounded-xl border border-gray-800 bg-gray-900/30 p-5 transition-colors duration-150 hover:border-gray-700 hover:bg-gray-900/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Top row: severity + change type */}
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={change.severity} />
                    <ChangeTypeBadge type={change.changeType} />
                  </div>

                  {/* Title */}
                  <h3 className="mt-2.5 text-sm font-medium leading-snug">
                    {change.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                    {change.description}
                  </p>

                  {/* Affected endpoints */}
                  {change.affectedEndpoints.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {change.affectedEndpoints.map((ep) => (
                        <code
                          key={ep}
                          className="rounded bg-gray-800/80 px-2 py-0.5 font-mono text-xs text-violet-300"
                        >
                          {ep}
                        </code>
                      ))}
                    </div>
                  )}

                  {/* Meta row */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    {change.crawlRun?.source?.name && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-gray-700" />
                        {change.crawlRun.source.name}
                      </span>
                    )}
                    {change.changeDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar aria-hidden="true" className="h-3 w-3" />
                        {new Date(change.changeDate).toLocaleDateString()}
                      </span>
                    )}
                    <span>
                      Detected{' '}
                      {new Date(change.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
