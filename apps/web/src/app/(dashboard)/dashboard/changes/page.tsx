'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  GitCompareArrows,
  Loader2,
  AlertTriangle,
  Filter,
  Calendar,
  X,
  ChevronDown,
  Search,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type {
  ApiSource,
  ChangeEntry,
  Severity,
  ChangeType,
} from '@/lib/types';

// ── Severity config ──
const SEVERITY_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  CRITICAL: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
  HIGH: { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  MEDIUM: { dot: 'bg-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  LOW: { dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
};

const CHANGE_TYPE_LABELS: Record<ChangeType, { label: string; color: string }> = {
  BREAKING: { label: 'Breaking', color: 'text-red-400 bg-red-500/10' },
  DEPRECATION: { label: 'Deprecation', color: 'text-amber-400 bg-amber-500/10' },
  NON_BREAKING: { label: 'Non-Breaking', color: 'text-blue-400 bg-blue-500/10' },
  INFO: { label: 'Info', color: 'text-gray-400 bg-gray-500/10' },
};

const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

function ChangeTypeBadge({ type }: { type: ChangeType }) {
  const cfg = CHANGE_TYPE_LABELS[type] ?? CHANGE_TYPE_LABELS.INFO;
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

// Response type for changes endpoint (uses paginated alerts as proxy)
interface ChangesResponse {
  data: ChangeEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export default function ChangesPage() {
  const { data: session } = useSession();
  const teamId = (session?.user as Record<string, unknown>)?.teamId as
    | string
    | undefined;

  const [changes, setChanges] = useState<ChangeEntry[]>([]);
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [alertsData, sourcesData] = await Promise.all([
        apiFetch<{ data: Array<{ changeEntry?: ChangeEntry }> }>(
          `/alerts?teamId=${teamId}&page=1&pageSize=100`,
        ),
        apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`),
      ]);
      // Extract unique change entries from alerts
      const changeMap = new Map<string, ChangeEntry>();
      for (const alert of alertsData.data ?? []) {
        if (alert.changeEntry) {
          changeMap.set(alert.changeEntry.id, alert.changeEntry);
        }
      }
      setChanges(
        Array.from(changeMap.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
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
    (severityFilter ? 1 : 0) + (sourceFilter ? 1 : 0) + (searchQuery ? 1 : 0);

  if (loading && !changes.length) {
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
          <h1 className="text-2xl font-bold tracking-tight">Changes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every API change detected across your monitored sources, classified by severity.
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition ${
            showFilters || activeFilterCount > 0
              ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
              : 'border-gray-800 bg-gray-900/50 text-gray-300 hover:border-gray-700 hover:text-white'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-5">
          <div className="flex flex-wrap items-end gap-4">
            {/* Search */}
            <div className="min-w-[200px] flex-1">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, endpoints..."
                  className="w-full rounded-lg border border-gray-800 bg-gray-950 py-2 pl-9 pr-3.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>
            </div>

            {/* Severity */}
            <div className="w-44">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Severity
              </label>
              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={(e) =>
                    setSeverityFilter(e.target.value as Severity | '')
                  }
                  className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  <option value="">All severities</option>
                  {SEVERITY_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              </div>
            </div>

            {/* Source */}
            <div className="w-52">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Source
              </label>
              <div className="relative">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950 px-3.5 py-2 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                >
                  <option value="">All sources</option>
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
              </div>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setSeverityFilter('');
                  setSourceFilter('');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
                Clear
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
          <GitCompareArrows className="mx-auto h-10 w-10 text-gray-700" />
          <p className="mt-4 text-sm text-gray-500">
            {changes.length === 0
              ? 'No changes detected yet.'
              : 'No changes match your current filters.'}
          </p>
          {changes.length === 0 && (
            <p className="mt-1 text-xs text-gray-600">
              Changes will appear here after DriftWatch crawls your API sources.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((change) => (
            <div
              key={change.id}
              className="rounded-xl border border-gray-800 bg-gray-900/30 p-5 transition hover:border-gray-700"
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
                        <Calendar className="h-3 w-3" />
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
