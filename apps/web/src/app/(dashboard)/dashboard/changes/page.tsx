'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
  CheckCircle2,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { ApiSource, ChangeEntry, Severity, TriageStatus } from '@/lib/types';
import { SeverityBadge, ChangeTypeBadge, TriageStatusBadge } from '@/lib/components';
import { SEVERITY_ORDER, getTeamId, timeAgo } from '@/lib/shared';
import { useDemo, useDemoHref } from '@/lib/use-demo';
import { DEMO_CHANGES, DEMO_SOURCES } from '@/lib/demo-data';
import { useSavedFilters } from '@/lib/use-saved-filters';
import { usePrompt } from '@/lib/dialogs';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { OnboardingChecklist } from '../../onboarding-checklist';
import {
  CHANNEL_ICON,
  CHANNEL_LABEL,
  ALERT_STATUS_CONFIG,
  formatDestination,
} from '@/lib/alert-display';

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

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const highlightId = searchParams.get('highlight');
  const sourceIdFromUrl = searchParams.get('sourceId');
  const ruleIdFromUrl = searchParams.get('ruleId');

  const [changes, setChanges] = useState<ChangeEntry[]>(isDemo ? DEMO_CHANGES : []);
  const [sources, setSources] = useState<ApiSource[]>(isDemo ? DEMO_SOURCES : []);
  const [loading, setLoading] = useState(!isDemo);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<Severity | ''>('');
  const [sourceFilter, setSourceFilter] = useState(sourceIdFromUrl ?? '');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showInfo, setShowInfo] = useState(false); // Default-hide INFO noise
  // Two-state triage view: "Needs review" merges OPEN + legacy ACKNOWLEDGED
  // rows; "Done" matches RESOLVED. The schema enum still has all three for
  // backwards compatibility with pre-cleanup data; the UI never sets
  // ACKNOWLEDGED on new actions.
  const [triageFilter, setTriageFilter] = useState<'OPEN' | 'DONE' | 'ALL'>('OPEN');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Saved filters
  const { filters: savedFilters, save: saveFilter, remove: removeFilter } = useSavedFilters();
  const { prompt: showPrompt, dialog: promptDialog } = usePrompt();

  // Detail panel
  const [selected, setSelected] = useState<ChangeEntry | null>(null);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);

  // Closing the detail panel must also strip ?highlight=… from the URL —
  // otherwise the auto-open effect re-fires the moment `selected` is null
  // and the panel pops back open.
  const closeDetail = useCallback(() => {
    setSelected(null);
    if (highlightId) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete('highlight');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [highlightId, pathname, router, searchParams]);

  // Mirror sourceFilter into the URL so the Source ↔ Changes deep-link
  // round-trips (changing the in-page dropdown updates the URL; clearing
  // strips the param). Effect runs on every sourceFilter change; same-value
  // replaces are deduped by Next.
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (sourceFilter) next.set('sourceId', sourceFilter);
    else next.delete('sourceId');
    const qs = next.toString();
    const target = qs ? `${pathname}?${qs}` : pathname;
    router.replace(target, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter]);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Auto-open detail panel when navigating from alerts with ?highlight=ID.
  // The ref tracks which highlight ID we've already opened so closing the
  // panel can't trigger an immediate re-open during the brief render where
  // `selected` has been cleared but the URL hasn't yet caught up.
  const lastAutoOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      highlightId &&
      changes.length > 0 &&
      !selected &&
      lastAutoOpenedRef.current !== highlightId
    ) {
      const match = changes.find((c) => c.id === highlightId);
      if (match) {
        setSelected(match);
        lastAutoOpenedRef.current = highlightId;
      }
    }
  }, [highlightId, changes, selected]);

  // Triage counts (computed before other filters for tab badges).
  // OPEN bucket includes legacy ACKNOWLEDGED rows so they don't appear to
  // disappear after the cleanup — they sit under "Needs review" until a
  // user marks them done.
  const triageCounts = useMemo(() => {
    const counts = { OPEN: 0, DONE: 0, ALL: 0 };
    for (const c of changes) {
      if (!showInfo && c.changeType === 'INFO') continue;
      const status = c.triageStatus ?? 'OPEN';
      if (status === 'RESOLVED') counts.DONE++;
      else counts.OPEN++;
      counts.ALL++;
    }
    return counts;
  }, [changes, showInfo]);

  // Compute date cutoff for range filter
  const dateCutoff = useMemo(() => {
    if (dateRange === 'all') return null;
    const now = Date.now();
    const ms = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }[dateRange];
    return new Date(now - ms);
  }, [dateRange]);

  // Apply filters + sort by severity (breaking first), then date desc
  const filtered = useMemo(() => {
    const result = changes.filter((c) => {
      if (!showInfo && c.changeType === 'INFO') return false;
      if (triageFilter !== 'ALL') {
        const isDone = (c.triageStatus ?? 'OPEN') === 'RESOLVED';
        if (triageFilter === 'OPEN' && isDone) return false;
        if (triageFilter === 'DONE' && !isDone) return false;
      }
      if (severityFilter && c.severity !== severityFilter) return false;
      if (sourceFilter && c.crawlRun?.source?.id !== sourceFilter) return false;
      if (ruleIdFromUrl && !c.alerts?.some((a) => a.alertRule.id === ruleIdFromUrl)) return false;
      if (dateCutoff) {
        const changeTime = new Date(c.changeDate ?? c.createdAt).getTime();
        if (changeTime < dateCutoff.getTime()) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (c.title ?? '').toLowerCase().includes(q);
        const matchesDesc = (c.description ?? '').toLowerCase().includes(q);
        const matchesEndpoints = (c.affectedEndpoints ?? []).some((ep) =>
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
  }, [changes, severityFilter, sourceFilter, ruleIdFromUrl, searchQuery, showInfo, triageFilter, dateCutoff]);

  const hiddenInfoCount = useMemo(
    () => changes.filter((c) => c.changeType === 'INFO').length,
    [changes],
  );

  const activeFilterCount =
    (severityFilter ? 1 : 0) + (sourceFilter ? 1 : 0) + (searchInput ? 1 : 0) + (dateRange !== 'all' ? 1 : 0);

  // Rule-filter pill: when navigating from Settings → "View deliveries",
  // the URL carries ?ruleId=. Resolve the rule name from any change's
  // alerts (cheap; if no changes have alerts from that rule, fall back).
  const activeRuleName = useMemo(() => {
    if (!ruleIdFromUrl) return null;
    for (const c of changes) {
      const a = c.alerts?.find((a) => a.alertRule.id === ruleIdFromUrl);
      if (a) return a.alertRule.name;
    }
    return null;
  }, [ruleIdFromUrl, changes]);

  const clearRuleFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete('ruleId');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  // Triage handler — shared between inline actions and detail panel
  const handleTriage = useCallback(async (id: string, status: TriageStatus) => {
    // Capture previous status for undo
    const prev = changes.find((c) => c.id === id);
    const previousStatus = prev?.triageStatus ?? 'OPEN';

    const applyLocally = (s: TriageStatus) => {
      setChanges((list) =>
        list.map((c) => (c.id === id ? { ...c, triageStatus: s } : c)),
      );
      setSelected((sel) => sel && sel.id === id ? { ...sel, triageStatus: s } : sel);
    };

    if (isDemo) {
      applyLocally(status);
      toast.success(`Marked as ${status.toLowerCase()}`, {
        action: {
          label: 'Undo',
          onClick: () => applyLocally(previousStatus),
        },
      });
      return;
    }
    try {
      await apiFetch(`/changes/${id}/triage`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      applyLocally(status);
      toast.success(`Marked as ${status.toLowerCase()}`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await apiFetch(`/changes/${id}/triage`, {
                method: 'PATCH',
                body: JSON.stringify({ status: previousStatus }),
              });
              applyLocally(previousStatus);
            } catch {
              toast.error('Could not undo');
            }
          },
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update triage status');
    }
  }, [isDemo, changes]);

  const handleBulkTriage = useCallback(async (status: TriageStatus) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    for (const id of ids) {
      await handleTriage(id, status);
    }
    setSelectedIds(new Set());
  }, [selectedIds, handleTriage]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  }, [filtered, selectedIds.size]);

  // Keyboard navigation: j/k to move, Enter to open, Escape to close, x to toggle select
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        closeDetail();
        return;
      }
      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        setFocusedIdx((prev) => {
          const max = filtered.length - 1;
          if (max < 0) return -1;
          if (e.key === 'j') return Math.min(prev + 1, max);
          return Math.max(prev - 1, 0);
        });
        return;
      }
      if (e.key === 'x' && focusedIdx >= 0 && focusedIdx < filtered.length) {
        e.preventDefault();
        toggleSelect(filtered[focusedIdx].id);
        return;
      }
      if (e.key === 'Enter' && focusedIdx >= 0 && focusedIdx < filtered.length) {
        e.preventDefault();
        setSelected(filtered[focusedIdx]);
        return;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, filtered, focusedIdx, toggleSelect, closeDetail]);

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
      {/* Onboarding checklist — only shows for new teams; self-dismisses */}
      <OnboardingChecklist />

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
        {filtered.length > 0 && (
          <button
            onClick={() => {
              const headers = ['Title', 'Severity', 'Type', 'Source', 'Status', 'Date', 'Affected Endpoints'];
              const rows = filtered.map((c) => [
                `"${(c.title ?? '').replace(/"/g, '""')}"`,
                c.severity,
                c.changeType,
                c.crawlRun?.source?.name ?? '',
                c.triageStatus ?? 'OPEN',
                c.changeDate ?? c.createdAt,
                `"${(c.affectedEndpoints ?? []).join(', ')}"`,
              ]);
              const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `apidelta-changes-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success(`Exported ${filtered.length} changes`);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 px-3.5 py-2 text-sm text-gray-300 transition hover:border-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Export
          </button>
        )}
      </div>

      {/* Rule-filter pill — visible when deep-linked from Settings */}
      {ruleIdFromUrl && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-2.5 text-sm">
          <span className="text-violet-300">
            Filtered by alert rule:{' '}
            <span className="font-medium text-white">
              {activeRuleName ?? 'this rule'}
            </span>
          </span>
          <button
            type="button"
            onClick={clearRuleFilter}
            className="rounded text-xs font-medium text-violet-300 underline underline-offset-2 transition hover:text-violet-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Clear
          </button>
        </div>
      )}

      {/* Triage status tabs */}
      <div className="flex gap-1 rounded-lg border border-gray-800 bg-gray-900/30 p-1" role="tablist" aria-label="Filter by triage status">
        {(['OPEN', 'DONE', 'ALL'] as const).map((tab) => {
          const labels: Record<typeof tab, string> = {
            OPEN: 'Needs review',
            DONE: 'Done',
            ALL: 'All',
          };
          const isActive = triageFilter === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => { setTriageFilter(tab); setFocusedIdx(-1); }}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                isActive
                  ? 'bg-gray-800 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {labels[tab]}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                isActive ? 'bg-gray-700 text-gray-300' : 'bg-gray-800/50 text-gray-600'
              }`}>
                {triageCounts[tab]}
              </span>
            </button>
          );
        })}
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

            <div className="w-full sm:w-auto">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">
                Date range
              </label>
              <div className="flex gap-1">
                {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setDateRange(range)}
                    className={`rounded-md px-2.5 py-2 text-xs font-medium transition ${
                      dateRange === range
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {range === 'all' ? 'All time' : `Last ${range}`}
                  </button>
                ))}
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
                  setDateRange('all');
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

      {/* Saved filters bar */}
      {(savedFilters.length > 0 || activeFilterCount > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {savedFilters.map((sf) => (
            <button
              key={sf.name}
              onClick={() => {
                setSeverityFilter(sf.severityFilter as Severity | '');
                setSourceFilter(sf.sourceFilter);
                setSearchInput(sf.searchQuery);
                setSearchQuery(sf.searchQuery);
                setShowInfo(sf.showInfo);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-1.5 text-xs text-gray-400 transition hover:border-gray-700 hover:text-white"
            >
              {sf.name}
              <button
                onClick={(e) => { e.stopPropagation(); removeFilter(sf.name); }}
                aria-label={`Remove ${sf.name} filter`}
                className="ml-0.5 rounded text-gray-600 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </button>
          ))}
          {activeFilterCount > 0 && savedFilters.length < 5 && (
            <button
              onClick={async () => {
                const name = await showPrompt({ title: 'Save filter', placeholder: 'Filter name', submitLabel: 'Save' });
                if (!name) return;
                saveFilter({
                  name,
                  severityFilter,
                  sourceFilter,
                  searchQuery,
                  showInfo,
                });
                toast.success(`Filter "${name}" saved`);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-700 px-3 py-1.5 text-xs text-gray-500 transition hover:border-violet-500/50 hover:text-violet-400"
            >
              <Plus className="h-3 w-3" />
              Save filter
            </button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-2.5">
          <span className="text-sm font-medium text-violet-300">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkTriage('RESOLVED')}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="h-3 w-3" />
              Mark all done
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-xs text-gray-500 transition hover:text-white"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Results count + keyboard hints */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span aria-live="polite" aria-atomic="true">
          {filtered.length} change{filtered.length !== 1 ? 's' : ''}{' '}
          {activeFilterCount > 0 && `(filtered from ${changes.length})`}
        </span>
        <span className="hidden items-center gap-3 text-xs text-gray-600 md:flex">
          <span>
            <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px]">j</kbd>
            <kbd className="ml-0.5 rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px]">k</kbd>
            {' '}navigate
          </span>
          <span>
            <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px]">x</kbd>
            {' '}select
          </span>
          <span>
            <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px]">Enter</kbd>
            {' '}open
          </span>
          <span>
            <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px]">Esc</kbd>
            {' '}close
          </span>
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
                {sources.length === 0
                  ? 'Add an API source and changes will appear within minutes.'
                  : 'Changes appear here automatically after APIDelta crawls your API sources.'}
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
              {sources.length > 0 && (
                <p className="mt-3 text-xs text-gray-600">
                  Your {sources.length} source{sources.length !== 1 ? 's are' : ' is'} being monitored. Changes will appear after the next crawl cycle.
                </p>
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
          {/* Select all header */}
          {filtered.length > 0 && (
            <li className="flex items-center gap-3 border-b border-gray-800/50 px-4 py-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded border-gray-700 bg-gray-950 text-violet-500 focus:ring-violet-500/30"
                aria-label="Select all changes"
              />
              <span>{selectedIds.size === filtered.length ? 'Deselect all' : 'Select all'}</span>
            </li>
          )}
          {filtered.map((change, idx) => {
            const status = change.triageStatus ?? 'OPEN';
            const isSelected = selectedIds.has(change.id);
            return (
              <li key={change.id} className="group/row relative">
                <div
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-900/60 ${
                    focusedIdx === idx ? 'bg-gray-900/60 ring-1 ring-inset ring-violet-500/40' : ''
                  } ${isSelected ? 'bg-violet-500/5' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(change.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 shrink-0 rounded border-gray-700 bg-gray-950 text-violet-500 focus:ring-violet-500/30"
                    aria-label={`Select ${change.title}`}
                  />
                  <button
                    type="button"
                    onClick={() => { setSelected(change); setFocusedIdx(idx); }}
                    className="flex min-w-0 flex-1 items-center gap-3 focus-visible:outline-none"
                  >
                    <SeverityBadge severity={change.severity} />
                    <ChangeTypeBadge type={change.changeType} />
                    <span className="flex-1 truncate text-sm text-white">
                      {change.title}
                    </span>
                    {change.alerts && change.alerts.length > 0 && (
                      <span
                        className="hidden shrink-0 items-center gap-1 md:inline-flex"
                        aria-label={`${change.alerts.length} delivery ${change.alerts.length === 1 ? 'attempt' : 'attempts'}`}
                      >
                        {change.alerts.slice(0, 3).map((a) => {
                          const Icon = CHANNEL_ICON[a.alertRule.channel];
                          const cfg = ALERT_STATUS_CONFIG[a.status];
                          return (
                            <span
                              key={a.id}
                              className={`inline-flex h-5 w-5 items-center justify-center rounded ${cfg.bg}`}
                              title={`${cfg.label} → ${a.alertRule.name} (${CHANNEL_LABEL[a.alertRule.channel]})`}
                            >
                              <Icon aria-hidden="true" className={`h-3 w-3 ${cfg.color}`} />
                            </span>
                          );
                        })}
                        {change.alerts.length > 3 && (
                          <span className="text-[10px] text-gray-500">+{change.alerts.length - 3}</span>
                        )}
                      </span>
                    )}
                    {status === 'RESOLVED' && (
                      <TriageStatusBadge status={status} />
                    )}
                  </button>
                  {change.crawlRun?.source?.name && change.crawlRun.source.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const sourceId = change.crawlRun!.source!.id;
                        const target = isDemo
                          ? `/dashboard/sources?detail=${sourceId}&demo=true`
                          : `/dashboard/sources?detail=${sourceId}`;
                        router.push(target);
                      }}
                      title={`View source: ${change.crawlRun.source.name}`}
                      className="hidden shrink-0 rounded text-xs text-gray-500 transition hover:text-violet-300 md:inline group-hover/row:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      {change.crawlRun.source.name}
                    </button>
                  )}
                  <span className="hidden shrink-0 text-xs text-gray-600 md:inline group-hover/row:hidden">
                    {new Date(
                      change.changeDate ?? change.createdAt,
                    ).toLocaleDateString()}
                  </span>
                  {/* Inline triage actions — visible on hover */}
                  <div className="hidden shrink-0 items-center gap-1 group-hover/row:flex">
                    {status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleTriage(change.id, 'RESOLVED'); }}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400 transition hover:bg-emerald-500/20"
                        title="Mark done"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Detail slide-over */}
      {selected && (
        <ChangeDetailPanel
          change={selected}
          onClose={closeDetail}
          onTriage={handleTriage}
        />
      )}

      {/* Dialogs */}
      {promptDialog}
    </div>
  );
}

// ─── Detail slide-over panel ─────────────────────

function ChangeDetailPanel({
  change,
  onClose,
  onTriage,
}: {
  change: ChangeEntry;
  onClose: () => void;
  onTriage: (id: string, status: TriageStatus) => void;
}) {
  const trapRef = useFocusTrap(true);
  const sourceDetailHref = useDemoHref(
    change.crawlRun?.source?.id
      ? `/dashboard/sources?detail=${change.crawlRun.source.id}`
      : '/dashboard/sources',
  );

  return (
    <div
      ref={trapRef}
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
        className="animate-modal-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="animate-slide-in-right relative flex h-full w-full max-w-xl flex-col border-l border-gray-800 bg-gray-950 shadow-2xl">
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

          {/* Triage actions */}
          <div className="mt-3 flex items-center gap-2">
            {(change.triageStatus ?? 'OPEN') === 'RESOLVED' && (
              <TriageStatusBadge status={change.triageStatus ?? 'OPEN'} />
            )}
            {(change.triageStatus ?? 'OPEN') !== 'RESOLVED' && (
              <button
                onClick={() => onTriage(change.id, 'RESOLVED')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20"
              >
                <CheckCircle2 className="h-3 w-3" />
                Mark done
              </button>
            )}
            {(change.triageStatus ?? 'OPEN') === 'RESOLVED' && (
              <button
                onClick={() => onTriage(change.id, 'OPEN')}
                className="rounded-lg px-3 py-1.5 text-xs text-gray-500 transition hover:bg-gray-800 hover:text-gray-300"
              >
                Reopen
              </button>
            )}
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {change.description}
          </p>

          {(change.affectedEndpoints ?? []).length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Affected endpoints
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(change.affectedEndpoints ?? []).map((ep) => (
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

          {change.alerts && change.alerts.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Delivery
                </h3>
                <Link
                  href="/dashboard/settings#alert-rules"
                  className="text-[11px] text-gray-500 transition hover:text-violet-300"
                >
                  Manage rules →
                </Link>
              </div>
              <ul className="mt-2 space-y-2">
                {change.alerts.map((a) => {
                  const Icon = CHANNEL_ICON[a.alertRule.channel];
                  const cfg = ALERT_STATUS_CONFIG[a.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <li
                      key={a.id}
                      className="rounded-lg border border-gray-900 bg-gray-950/40 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                          <span className="truncate text-gray-300">{a.alertRule.name}</span>
                        </span>
                        <span className={`inline-flex shrink-0 items-center gap-1 ${cfg.color}`}>
                          <StatusIcon aria-hidden="true" className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-gray-500">
                        <span className="truncate">
                          {CHANNEL_LABEL[a.alertRule.channel]} &rarr;{' '}
                          {formatDestination(a.alertRule.channel, a.alertRule.destination)}
                        </span>
                        <span className="shrink-0">{timeAgo(a.sentAt ?? null)}</span>
                      </div>
                      {a.status === 'FAILED' && a.errorMessage && (
                        <p className="mt-1 text-[11px] text-red-400">{a.errorMessage}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
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
                {change.crawlRun.source.id ? (
                  <Link
                    href={sourceDetailHref}
                    className="rounded text-violet-400 transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    {change.crawlRun.source.name}
                  </Link>
                ) : (
                  <span className="text-gray-400">{change.crawlRun.source.name}</span>
                )}
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
