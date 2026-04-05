'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Rss,
  GitCompareArrows,
  Bell,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { ApiSource, ChangeEntry, Alert } from '@/lib/types';

// ── Severity config ──
const SEVERITY_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  CRITICAL: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
  HIGH: { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  MEDIUM: { dot: 'bg-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  LOW: { dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
  INFO: { dot: 'bg-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.INFO;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-5 transition-colors hover:border-gray-700">
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.07] blur-2xl ${accent}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800/80`}>
          <Icon aria-hidden="true" className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </div>
  );
}

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

export default function DashboardPage() {
  const { data: session } = useSession();
  const teamId = (session?.user as Record<string, unknown>)?.teamId as string | undefined;

  const [sources, setSources] = useState<ApiSource[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [srcData, alertData] = await Promise.all([
        apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`),
        apiFetch<{ data: Alert[] }>(`/alerts?teamId=${teamId}&page=1&pageSize=10`),
      ]);
      setSources(srcData);
      setAlerts(alertData.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive stats
  const totalSources = sources.length;
  const recentChanges = alerts.length; // from recent alerts as proxy
  const activeAlerts = alerts.filter((a) => a.status === 'SENT').length;
  const lastCrawl = sources
    .map((s) => s.lastCrawledAt)
    .filter(Boolean)
    .sort()
    .pop();

  // Flatten recent changes from alerts
  const recentChangeEntries = alerts
    .filter((a) => a.changeEntry)
    .map((a) => a.changeEntry!)
    .slice(0, 8);

  if (loading && !sources.length) {
    return (
      <div className="flex h-96 items-center justify-center" role="status">
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-violet-400" />
        <span className="sr-only">Loading dashboard data...</span>
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

      {error && (
        <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertTriangle aria-hidden="true" className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Rss} label="Monitored APIs" value={totalSources} accent="bg-violet-500" />
        <StatCard icon={GitCompareArrows} label="Recent Changes" value={recentChanges} accent="bg-blue-500" />
        <StatCard icon={Bell} label="Alerts Sent" value={activeAlerts} accent="bg-amber-500" />
        <StatCard icon={Clock} label="Last Crawl" value={timeAgo(lastCrawl ?? null)} accent="bg-emerald-500" />
      </div>

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
              <div className="px-5 py-12 text-center text-sm text-gray-600">
                No changes detected yet. Changes will appear here once your API sources are crawled.
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {recentChangeEntries.map((change) => (
                  <div key={change.id} className="flex items-start gap-4 px-5 py-3.5 transition hover:bg-gray-900/40">
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
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-gray-600">No APIs monitored yet.</p>
                <Link
                  href="/dashboard/sources"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                >
                  Add your first API source
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {sources.slice(0, 6).map((src) => (
                  <div key={src.id} className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-900/40">
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
