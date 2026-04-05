'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Mail,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type {
  AlertRule,
  Alert,
  ApiSource,
  AlertChannel,
  Severity,
  AlertStatus,
} from '@/lib/types';

const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const ALERT_STATUS_CONFIG: Record<
  AlertStatus,
  { icon: React.ElementType; color: string; label: string }
> = {
  SENT: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Sent' },
  FAILED: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  PENDING: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400',
  HIGH: 'bg-orange-500/10 text-orange-400',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400',
  LOW: 'bg-green-500/10 text-green-400',
};

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

export default function AlertsPage() {
  const { data: session } = useSession();
  const teamId = (session?.user as Record<string, unknown>)?.teamId as
    | string
    | undefined;

  // Data
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formChannel, setFormChannel] = useState<AlertChannel>('EMAIL');
  const [formDestination, setFormDestination] = useState('');
  const [formMinSeverity, setFormMinSeverity] = useState<Severity>('MEDIUM');
  const [formSourceFilter, setFormSourceFilter] = useState('');
  const [formKeywordFilter, setFormKeywordFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [rulesData, alertsData, sourcesData] = await Promise.all([
        apiFetch<AlertRule[]>(`/alerts/rules?teamId=${teamId}`),
        apiFetch<{ data: Alert[] }>(
          `/alerts?teamId=${teamId}&page=1&pageSize=50`,
        ),
        apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`),
      ]);
      setRules(rulesData);
      setAlerts(alertsData.data ?? []);
      setSources(sourcesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load alert data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) return;
    setSubmitting(true);
    try {
      const keywords = formKeywordFilter
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      await apiFetch('/alerts/rules', {
        method: 'POST',
        body: JSON.stringify({
          teamId,
          name: formName,
          channel: formChannel,
          destination: formDestination,
          minSeverity: formMinSeverity,
          sourceFilter: formSourceFilter || null,
          keywordFilter: keywords,
        }),
      });
      // Reset form
      setFormName('');
      setFormChannel('EMAIL');
      setFormDestination('');
      setFormMinSeverity('MEDIUM');
      setFormSourceFilter('');
      setFormKeywordFilter('');
      setShowCreateForm(false);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create alert rule. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteRule(id: string) {
    if (!confirm('Delete this alert rule? You will stop receiving notifications from this rule.'))
      return;
    setDeletingId(id);
    try {
      await apiFetch(`/alerts/rules/${id}`, { method: 'DELETE' });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete alert rule. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && !rules.length && !alerts.length) {
    return (
      <div className="flex h-96 items-center justify-center" role="status">
        <Loader2 aria-hidden="true" className="h-6 w-6 animate-spin text-violet-400" />
        <span className="sr-only">Loading alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up rules for when and where you get notified about API changes.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Create Rule
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertTriangle aria-hidden="true" className="mr-2 inline h-4 w-4" />
          {error}
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="ml-2 rounded text-red-500 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <X aria-hidden="true" className="inline h-3 w-3" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div role="tablist" aria-label="Alert views" className="flex gap-1 rounded-lg border border-gray-800 bg-gray-900/30 p-1">
        <button
          role="tab"
          aria-selected={activeTab === 'rules'}
          aria-controls="tabpanel-rules"
          id="tab-rules"
          onClick={() => setActiveTab('rules')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            activeTab === 'rules'
              ? 'bg-gray-800 text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Alert Rules ({rules.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'history'}
          aria-controls="tabpanel-history"
          id="tab-history"
          onClick={() => setActiveTab('history')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
            activeTab === 'history'
              ? 'bg-gray-800 text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          History ({alerts.length})
        </button>
      </div>

      {/* Create rule modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="create-rule-title" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateForm(false); }} onKeyDown={(e) => { if (e.key === 'Escape') setShowCreateForm(false); }}>
          <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="create-rule-title" className="text-lg font-semibold">Create Alert Rule</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRule} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="rule-name" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Rule Name
                </label>
                <input
                  id="rule-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Critical Stripe changes"
                  required
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
              </div>

              {/* Channel + Destination */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rule-channel" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Channel
                  </label>
                  <div className="relative">
                    <select
                      id="rule-channel"
                      value={formChannel}
                      onChange={(e) =>
                        setFormChannel(e.target.value as AlertChannel)
                      }
                      className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                    >
                      <option value="EMAIL">Email</option>
                      <option value="SLACK">Slack Webhook</option>
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  </div>
                </div>
                <div>
                  <label htmlFor="rule-destination" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Destination
                  </label>
                  <input
                    id="rule-destination"
                    type={formChannel === 'EMAIL' ? 'email' : 'url'}
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder={
                      formChannel === 'EMAIL'
                        ? 'team@example.com'
                        : 'https://hooks.slack.com/...'
                    }
                    required
                    className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                  />
                </div>
              </div>

              {/* Min severity + Source filter */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rule-min-severity" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Minimum Severity
                  </label>
                  <div className="relative">
                    <select
                      id="rule-min-severity"
                      value={formMinSeverity}
                      onChange={(e) =>
                        setFormMinSeverity(e.target.value as Severity)
                      }
                      className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                    >
                      {SEVERITY_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {s} and above
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                  </div>
                </div>
                <div>
                  <label htmlFor="rule-source-filter" className="mb-1.5 block text-sm font-medium text-gray-300">
                    Source (optional)
                  </label>
                  <div className="relative">
                    <select
                      id="rule-source-filter"
                      value={formSourceFilter}
                      onChange={(e) => setFormSourceFilter(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
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
              </div>

              {/* Keyword filter */}
              <div>
                <label htmlFor="rule-keywords" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Keywords (optional)
                </label>
                <input
                  id="rule-keywords"
                  type="text"
                  value={formKeywordFilter}
                  onChange={(e) => setFormKeywordFilter(e.target.value)}
                  placeholder="e.g. authentication, billing, v2 (comma-separated)"
                  className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                />
                <p className="mt-1 text-xs text-gray-600">
                  Only notify when changes mention these keywords. Leave blank to match all changes.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
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
                      <span className="sr-only">Creating rule...</span>
                    </>
                  ) : (
                    'Create Alert Rule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab content */}
      {activeTab === 'rules' && (
        <div role="tabpanel" id="tabpanel-rules" aria-labelledby="tab-rules">
          {rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
              <Bell aria-hidden="true" className="mx-auto h-10 w-10 text-gray-700" />
              <p className="mt-4 text-sm text-gray-500">
                No alert rules yet.
              </p>
              <p className="mt-1 text-xs text-gray-600">
                Create a rule to start receiving Slack or email notifications when API changes are detected.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Create your first alert rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const source = sources.find(
                  (s) => s.id === rule.sourceFilter,
                );
                return (
                  <div
                    key={rule.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/30 p-5 transition hover:border-gray-700"
                  >
                    {/* Channel icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800/80">
                      {rule.channel === 'EMAIL' ? (
                        <Mail className="h-5 w-5 text-gray-400" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {/* Rule info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{rule.name}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-xs ${
                            rule.isActive
                              ? 'text-emerald-400'
                              : 'text-gray-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              rule.isActive
                                ? 'bg-emerald-500'
                                : 'bg-gray-600'
                            }`}
                          />
                          {rule.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>
                          {rule.channel === 'EMAIL' ? 'Email' : 'Slack'}{' '}
                          &rarr; {rule.destination}
                        </span>
                        <span className="text-gray-700">&middot;</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            SEVERITY_BADGE[rule.minSeverity] ??
                            'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {rule.minSeverity}+
                        </span>
                        {source && (
                          <>
                            <span className="text-gray-700">&middot;</span>
                            <span>{source.name}</span>
                          </>
                        )}
                        {rule.keywordFilter.length > 0 && (
                          <>
                            <span className="text-gray-700">&middot;</span>
                            <span>
                              Keywords: {rule.keywordFilter.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      disabled={deletingId === rule.id}
                      aria-label={`Delete rule ${rule.name}`}
                      className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      {deletingId === rule.id ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div role="tabpanel" id="tabpanel-history" aria-labelledby="tab-history">
          {alerts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 py-16 text-center">
              <Clock aria-hidden="true" className="mx-auto h-10 w-10 text-gray-700" />
              <p className="mt-4 text-sm text-gray-500">
                No alerts sent yet.
              </p>
              <p className="mt-1 text-xs text-gray-600">
                When a detected change matches one of your alert rules, the notification will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-800">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/50">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Change
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Rule
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Channel
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Sent
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {alerts.map((alert) => {
                    const statusCfg =
                      ALERT_STATUS_CONFIG[alert.status] ??
                      ALERT_STATUS_CONFIG.PENDING;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr
                        key={alert.id}
                        className="transition hover:bg-gray-900/30"
                      >
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusCfg.color}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="max-w-xs truncate text-sm font-medium">
                            {alert.changeEntry?.title ?? 'Unknown change'}
                          </p>
                          {alert.changeEntry?.severity && (
                            <span
                              className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                SEVERITY_BADGE[
                                  alert.changeEntry.severity
                                ] ?? 'bg-gray-800 text-gray-400'
                              }`}
                            >
                              {alert.changeEntry.severity}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-400">
                          {alert.alertRule?.name ?? '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                            {alert.alertRule?.channel === 'SLACK' ? (
                              <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
                            ) : (
                              <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                            )}
                            {alert.alertRule?.channel ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {timeAgo(alert.sentAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
