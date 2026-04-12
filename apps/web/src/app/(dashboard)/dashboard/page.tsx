'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Rss,
  GitCompareArrows,
  Bell,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
  Zap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import type { ApiSource, Alert, ChangeEntry } from '@/lib/types';
import { SeverityBadge, ChangeTypeBadge, Tooltip } from '@/lib/components';
import { timeAgo, getTeamId } from '@/lib/shared';
import { useDemo } from '@/lib/use-demo';
import { DEMO_SOURCES, DEMO_ALERTS, DEMO_CHANGES, DEMO_CHANGES_STATS } from '@/lib/demo-data';
import { OnboardingChecklist } from '../onboarding-checklist';
import { ChangesOverTimeChart, SeverityDistributionChart } from '@/lib/charts';

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  tooltip,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
  tooltip?: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-5 transition-all duration-150 hover:border-gray-700 hover:bg-gray-900/70">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.07] blur-2xl ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          {tooltip ? (
            <Tooltip text={tooltip}>
              <p className="text-sm text-gray-500 underline decoration-dotted decoration-gray-700 underline-offset-4 cursor-help">{label}</p>
            </Tooltip>
          ) : (
            <p className="text-sm text-gray-500">{label}</p>
          )}
          <div className="mt-1.5 flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && trend.value !== 0 && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                trend.value > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {trend.value > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.label}
              </span>
            )}
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800/80`}>
          <Icon aria-hidden="true" className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const teamId = getTeamId(session);
  const isDemo = useDemo();

  const [sources, setSources] = useState<ApiSource[]>(isDemo ? DEMO_SOURCES : []);
  const [alerts, setAlerts] = useState<Alert[]>(isDemo ? DEMO_ALERTS : []);
  const [recentChangeEntries, setRecentChangeEntries] = useState<ChangeEntry[]>(isDemo ? DEMO_CHANGES.slice(0, 8) : []);
  const [changesStats, setChangesStats] = useState<{
    daily: Array<{ date: string; critical: number; high: number; medium: number; low: number }>;
    totals: { critical: number; high: number; medium: number; low: number };
  }>(isDemo ? DEMO_CHANGES_STATS : { daily: [], totals: { critical: 0, high: 0, medium: 0, low: 0 } });
  const [attentionItems, setAttentionItems] = useState<ChangeEntry[]>([]);
  const [loading, setLoading] = useState(!isDemo);

  const fetchData = useCallback(async () => {
    if (isDemo) return;
    if (!teamId) return;
    setLoading(true);
    try {
      const [srcData, alertData, statsData, changesData, recentData] = await Promise.all([
        apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`),
        apiFetch<{ data: Alert[] }>(`/alerts?teamId=${teamId}&page=1&pageSize=10`),
        apiFetch<typeof changesStats>(`/changes/stats?days=30`),
        apiFetch<{ data: ChangeEntry[] }>(`/changes?teamId=${teamId}&triageStatus=OPEN&page=1&pageSize=5`),
        apiFetch<{ changes: ChangeEntry[] }>(`/changes?teamId=${teamId}&page=1&pageSize=8`),
      ]);
      setSources(srcData);
      setAlerts(alertData.data ?? []);
      setChangesStats(statsData);
      setRecentChangeEntries(recentData.changes ?? []);
      // Filter to only CRITICAL and HIGH unresolved changes
      const urgent = (changesData.data ?? []).filter(
        (c) => c.severity === 'CRITICAL' || c.severity === 'HIGH'
      );
      setAttentionItems(urgent);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [teamId, isDemo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute weekly trend from daily stats (last 7d vs prior 7d)
  // Deferred to client-only to avoid hydration mismatch from demo data timestamps
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const changesTrend = useMemo(() => {
    if (!mounted) return null;
    const daily = changesStats.daily;
    if (daily.length < 14) return null;
    const sum = (arr: typeof daily) => arr.reduce((s, d) => s + d.critical + d.high + d.medium + d.low, 0);
    const recent = sum(daily.slice(-7));
    const prior = sum(daily.slice(-14, -7));
    if (prior === 0) return null;
    const pct = Math.round(((recent - prior) / prior) * 100);
    return { value: pct, label: `${Math.abs(pct)}% vs last week` };
  }, [changesStats.daily, mounted]);

  // Derive stats
  const totalSources = sources.length;
  const totalChanges = changesStats.totals.critical + changesStats.totals.high + changesStats.totals.medium + changesStats.totals.low;
  const activeAlerts = alerts.filter((a) => a.status === 'SENT').length;
  const lastCrawl = sources
    .map((s) => s.lastCrawledAt)
    .filter(Boolean)
    .sort()
    .pop();

  if (loading && !sources.length) {
    return (
      <div className="space-y-8" role="status">
        <span className="sr-only">Loading dashboard data...</span>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-800" />
            <div className="mt-2 h-4 w-56 animate-pulse rounded-md bg-gray-800/60" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-800" />
        </div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-800/60" />
                  <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-gray-800" />
                </div>
                <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-800/60" />
              </div>
            </div>
          ))}
        </div>
        {/* Two-column skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900/30">
              <div className="border-b border-gray-800 px-5 py-4">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-800" />
              </div>
              <div className="divide-y divide-gray-800/50">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-800/60" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-800" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-800/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900/30">
              <div className="border-b border-gray-800 px-5 py-4">
                <div className="h-4 w-28 animate-pulse rounded bg-gray-800" />
              </div>
              <div className="divide-y divide-gray-800/50">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-gray-800" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-800" />
                      <div className="h-3 w-40 animate-pulse rounded bg-gray-800/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Your API dependencies at a glance.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 px-3.5 py-2 text-sm text-gray-300 transition hover:border-gray-700 hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <RefreshCw aria-hidden="true" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Onboarding checklist — shown until user completes setup or dismisses */}
      <OnboardingChecklist />

      {/* Welcome hero for brand-new users (zero sources) */}
      {totalSources === 0 && !loading && (
        <div className="relative overflow-hidden rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-gray-900 to-gray-950 p-8 text-center">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500 opacity-[0.04] blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-blue-500 opacity-[0.04] blur-3xl" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
              <Zap aria-hidden="true" className="h-7 w-7 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Welcome to APIDelta</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
              Add your first API changelog and see classified changes in minutes.
              No agents to install, no code changes needed.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard/sources"
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add your first API source
              </Link>
              <span className="text-xs text-gray-600">Takes less than 30 seconds</span>
            </div>
          </div>
        </div>
      )}

      {/* Needs Attention — unresolved CRITICAL/HIGH changes */}
      {attentionItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 border-b border-amber-500/10 px-5 py-3">
            <AlertTriangle aria-hidden="true" className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-300">
              Needs Attention ({attentionItems.length})
            </h2>
          </div>
          <div className="divide-y divide-amber-500/10">
            {attentionItems.map((change) => (
              <div key={change.id} className="flex items-center gap-4 px-5 py-3">
                <SeverityBadge severity={change.severity} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{change.title}</p>
                  <p className="text-xs text-gray-500">
                    {change.crawlRun?.source?.name ?? 'Unknown'}
                    {change.changeDate && (
                      <> &middot; {new Date(change.changeDate).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <Link
                  href="/dashboard/changes"
                  className="shrink-0 rounded-lg border border-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-500/10"
                >
                  Triage
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All clear state — only show if sources exist but nothing needs attention */}
      {attentionItems.length === 0 && totalSources > 0 && !loading && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3.5">
          <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-400" />
          <p className="text-sm text-emerald-300">
            All clear — no unresolved critical or high-severity changes.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Rss} label="Monitored APIs" value={totalSources} accent="bg-violet-500" tooltip="Total API changelog sources being monitored" />
        <StatCard icon={GitCompareArrows} label="Changes (30d)" value={totalChanges} accent="bg-blue-500" tooltip="Total changes detected across all sources in the last 30 days" trend={changesTrend ?? undefined} />
        <StatCard icon={Bell} label="Alerts Sent" value={activeAlerts} accent="bg-amber-500" tooltip="Alerts successfully delivered to your configured channels" />
        <StatCard icon={Clock} label="Last Crawl" value={timeAgo(lastCrawl ?? null)} accent="bg-emerald-500" tooltip="When APIDelta last checked your API sources for changes" />
      </div>

      {/* Trends charts */}
      {totalSources > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-5">
              <h2 className="mb-4 text-sm font-semibold">Changes Over Time</h2>
              <ChangesOverTimeChart data={changesStats.daily} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-5">
              <h2 className="mb-4 text-sm font-semibold">Severity Distribution</h2>
              <SeverityDistributionChart totals={changesStats.totals} />
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout: Recent changes + Sources */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Recent changes */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-800 bg-gray-900/30">
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <h2 className="text-sm font-semibold">Recent Changes</h2>
              <Link
                href="/dashboard/changes"
                className="inline-flex items-center gap-1 rounded text-xs text-violet-400 transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                View all <ArrowRight aria-hidden="true" className="h-3 w-3" />
              </Link>
            </div>
            {recentChangeEntries.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <GitCompareArrows aria-hidden="true" className="mx-auto h-8 w-8 text-gray-700" />
                <p className="mt-3 text-sm text-gray-500">No changes detected yet</p>
                <p className="mt-1 text-xs text-gray-600">
                  Changes will appear here once APIDelta crawls your API sources.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {recentChangeEntries.map((change) => (
                  <div key={change.id} className="flex items-start gap-4 px-5 py-3.5 transition-colors duration-150 hover:bg-gray-900/50">
                    <div className="mt-0.5 shrink-0">
                      <SeverityBadge severity={change.severity} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{change.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {change.crawlRun?.source?.name ?? 'Unknown source'}
                        {change.changeDate && (
                          <> &middot; {new Date(change.changeDate).toLocaleDateString()}</>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {change.changeType.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sources list */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900/30">
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <h2 className="text-sm font-semibold">Monitored APIs</h2>
              <Link
                href="/dashboard/sources"
                className="inline-flex items-center gap-1 rounded text-xs text-violet-400 transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                Manage <ArrowRight aria-hidden="true" className="h-3 w-3" />
              </Link>
            </div>
            {sources.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Rss aria-hidden="true" className="mx-auto h-8 w-8 text-gray-700" />
                <p className="mt-3 text-sm text-gray-500">No APIs monitored yet</p>
                <p className="mt-1 text-xs text-gray-600">
                  Add a changelog URL and start getting alerts in minutes.
                </p>
                <Link
                  href="/dashboard/sources"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                >
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Add your first API source
                </Link>
                <p className="mt-2 text-[11px] text-gray-600">
                  Stripe, GitHub, Twilio, and more
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {sources.slice(0, 6).map((src) => (
                  <div key={src.id} className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-gray-900/50">
                    <div className={`h-2 w-2 rounded-full ${src.isActive ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{src.name}</p>
                      <p className="truncate text-xs text-gray-600">{src.url}</p>
                    </div>
                    <span className="text-xs text-gray-600">{timeAgo(src.lastCrawledAt)}</span>
                  </div>
                ))}
                {sources.length > 6 && (
                  <div className="px-5 py-3 text-center text-xs text-gray-600">
                    +{sources.length - 6} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
