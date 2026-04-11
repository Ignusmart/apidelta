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
  Filter,
  Rss,
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type {
  AlertRule,
  Alert,
  ApiSource,
  AlertChannel,
  Severity,
  AlertStatus,
} from '@/lib/types';
import { SEVERITY_ORDER, timeAgo, getTeamId } from '@/lib/shared';
import { useDemo } from '@/lib/use-demo';
import { DEMO_ALERT_RULES, DEMO_ALERTS, DEMO_SOURCES } from '@/lib/demo-data';

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

export default function AlertsPage() {
  const { data: session } = useSession();
  const teamId = getTeamId(session);
  const isDemo = useDemo();

  // Data
  const [rules, setRules] = useState<AlertRule[]>(isDemo ? DEMO_ALERT_RULES : []);
  const [alerts, setAlerts] = useState<Alert[]>(isDemo ? DEMO_ALERTS : []);
  const [sources, setSources] = useState<ApiSource[]>(isDemo ? DEMO_SOURCES : []);
  const [loading, setLoading] = useState(!isDemo);
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ruleFormErrors, setRuleFormErrors] = useState<Record<string, string>>({});
  const [ruleFieldsTouched, setRuleFieldsTouched] = useState<Record<string, boolean>>({});

  const fetchData = useCallback(async () => {
    if (isDemo) return;
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
  }, [teamId, isDemo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const SEVERITY_DESCRIPTIONS: Record<Severity, string> = {
    CRITICAL: 'Only critical breaking changes',
    HIGH: 'Critical + high-impact changes',
    MEDIUM: 'Most breaking changes and deprecations',
    LOW: 'All changes including minor updates',
  };

  function validateRuleForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Give this rule a name to identify it later';
    if (!formDestination.trim()) {
      errors.destination = formChannel === 'EMAIL' ? 'Enter the email address to receive alerts' : 'Enter your Slack webhook URL';
    } else if (formChannel === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formDestination)) {
      errors.destination = 'Enter a valid email address';
    } else if (formChannel === 'SLACK') {
      try { new URL(formDestination); } catch { errors.destination = 'Enter a valid Slack webhook URL (starts with https://)'; }
    }
    setRuleFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function resetRuleForm() {
    setFormName('');
    setFormChannel('EMAIL');
    setFormDestination('');
    setFormMinSeverity('MEDIUM');
    setFormSourceFilter('');
    setFormKeywordFilter('');
    setShowAdvancedFilters(false);
    setRuleFormErrors({});
    setRuleFieldsTouched({});
  }

  function touchRuleField(field: string) {
    setRuleFieldsTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) return;
    // Touch all fields to show errors
    setRuleFieldsTouched({ name: true, destination: true });
    if (!validateRuleForm()) return;
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
      resetRuleForm();
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
      <div className="space-y-6" role="status">
        <span className="sr-only">Loading alerts...</span>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-20 animate-pulse rounded-lg bg-gray-800" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-gray-800/60" />
          </div>
          <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-800" />
        </div>
        {/* Tabs skeleton */}
        <div className="flex gap-1 rounded-lg border border-gray-800 bg-gray-900/30 p-1">
          <div className="h-9 flex-1 animate-pulse rounded-md bg-gray-800" />
          <div className="h-9 flex-1 animate-pulse rounded-md bg-gray-800/40" />
        </div>
        {/* Rule cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/30 p-5">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-800/60" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-800" />
                <div className="h-3 w-64 animate-pulse rounded bg-gray-800/40" />
              </div>
              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-800/60" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-backdrop p-4" role="dialog" aria-modal="true" aria-labelledby="create-rule-title" onClick={(e) => { if (e.target === e.currentTarget) { resetRuleForm(); setShowCreateForm(false); } }} onKeyDown={(e) => { if (e.key === 'Escape') { resetRuleForm(); setShowCreateForm(false); } }}>
          <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl animate-modal-content max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="create-rule-title" className="text-lg font-semibold">Create Alert Rule</h2>
                <p className="mt-0.5 text-xs text-gray-500">Get notified when API changes match your criteria.</p>
              </div>
              <button
                onClick={() => { resetRuleForm(); setShowCreateForm(false); }}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateRule} className="space-y-4" noValidate>
              {/* Rule Name */}
              <div>
                <label htmlFor="rule-name" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Rule Name
                </label>
                <input
                  id="rule-name"
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setRuleFormErrors((prev) => ({ ...prev, name: '' })); }}
                  onBlur={() => touchRuleField('name')}
                  placeholder="e.g. Critical Stripe changes"
                  autoFocus
                  aria-describedby={ruleFieldsTouched.name && ruleFormErrors.name ? 'rule-name-error' : undefined}
                  aria-invalid={ruleFieldsTouched.name && !!ruleFormErrors.name}
                  className={`w-full rounded-lg border bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:ring-1 ${
                    ruleFieldsTouched.name && ruleFormErrors.name
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-gray-800 focus:border-violet-500 focus:ring-violet-500/30'
                  }`}
                />
                {ruleFieldsTouched.name && ruleFormErrors.name && (
                  <p id="rule-name-error" className="mt-1 text-xs text-red-400">{ruleFormErrors.name}</p>
                )}
              </div>

              {/* Channel — full-width select with icon indicators */}
              <div>
                <label htmlFor="rule-channel" className="mb-1.5 block text-sm font-medium text-gray-300">
                  Notify via
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setFormChannel('EMAIL'); setFormDestination(''); setRuleFormErrors((prev) => ({ ...prev, destination: '' })); }}
                    className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      formChannel === 'EMAIL'
                        ? 'border-violet-500/50 bg-violet-500/10 text-white'
                        : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white'
                    }`}
                  >
                    <Mail aria-hidden="true" className="h-4 w-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormChannel('SLACK'); setFormDestination(''); setRuleFormErrors((prev) => ({ ...prev, destination: '' })); }}
                    className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                      formChannel === 'SLACK'
                        ? 'border-violet-500/50 bg-violet-500/10 text-white'
                        : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-700 hover:text-white'
                    }`}
                  >
                    <MessageSquare aria-hidden="true" className="h-4 w-4" />
                    Slack
                  </button>
                </div>
              </div>

              {/* Destination — dynamic label and input type */}
              <div>
                <label htmlFor="rule-destination" className="mb-1.5 block text-sm font-medium text-gray-300">
                  {formChannel === 'EMAIL' ? 'Email Address' : 'Slack Webhook URL'}
                </label>
                <input
                  id="rule-destination"
                  type={formChannel === 'EMAIL' ? 'email' : 'url'}
                  inputMode={formChannel === 'EMAIL' ? 'email' : 'url'}
                  value={formDestination}
                  onChange={(e) => { setFormDestination(e.target.value); setRuleFormErrors((prev) => ({ ...prev, destination: '' })); }}
                  onBlur={() => touchRuleField('destination')}
                  placeholder={
                    formChannel === 'EMAIL'
                      ? 'team@company.com'
                      : 'https://hooks.slack.com/services/...'
                  }
                  aria-describedby={ruleFieldsTouched.destination && ruleFormErrors.destination ? 'rule-dest-error' : 'rule-dest-hint'}
                  aria-invalid={ruleFieldsTouched.destination && !!ruleFormErrors.destination}
                  className={`w-full rounded-lg border bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:ring-1 ${
                    ruleFieldsTouched.destination && ruleFormErrors.destination
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-gray-800 focus:border-violet-500 focus:ring-violet-500/30'
                  }`}
                />
                {ruleFieldsTouched.destination && ruleFormErrors.destination ? (
                  <p id="rule-dest-error" className="mt-1 text-xs text-red-400">{ruleFormErrors.destination}</p>
                ) : (
                  <p id="rule-dest-hint" className="mt-1 text-xs text-gray-600">
                    {formChannel === 'EMAIL'
                      ? 'Alerts are sent to this address when a matching change is detected'
                      : 'Create a webhook in your Slack workspace settings'}
                  </p>
                )}
              </div>

              {/* Minimum Severity — full-width with description */}
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
                <p className="mt-1 text-xs text-gray-600">{SEVERITY_DESCRIPTIONS[formMinSeverity]}</p>
              </div>

              {/* Advanced filters — progressive disclosure */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
                  aria-expanded={showAdvancedFilters}
                >
                  <Filter aria-hidden="true" className="h-3.5 w-3.5" />
                  Advanced filters
                  <ChevronDown aria-hidden="true" className={`h-3 w-3 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                {showAdvancedFilters && (
                  <div className="mt-3 space-y-4">
                    {/* Source filter */}
                    <div>
                      <label htmlFor="rule-source-filter" className="mb-1.5 block text-sm font-medium text-gray-300">
                        Limit to Source
                      </label>
                      <div className="relative">
                        <select
                          id="rule-source-filter"
                          value={formSourceFilter}
                          onChange={(e) => setFormSourceFilter(e.target.value)}
                          className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                        >
                          <option value="">All sources (default)</option>
                          {sources.map((src) => (
                            <option key={src.id} value={src.id}>
                              {src.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
                      </div>
                    </div>

                    {/* Keyword filter */}
                    <div>
                      <label htmlFor="rule-keywords" className="mb-1.5 block text-sm font-medium text-gray-300">
                        Keyword Filter
                      </label>
                      <input
                        id="rule-keywords"
                        type="text"
                        value={formKeywordFilter}
                        onChange={(e) => setFormKeywordFilter(e.target.value)}
                        placeholder="authentication, billing, v2"
                        className="w-full rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                      />
                      <p className="mt-1 text-xs text-gray-600">
                        Comma-separated. Only triggers when changes mention at least one keyword. Leave blank to match all.
                      </p>
                      {formKeywordFilter && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {formKeywordFilter.split(',').map((k) => k.trim()).filter(Boolean).map((keyword, i) => (
                            <span key={i} className="inline-flex items-center rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-300">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetRuleForm(); setShowCreateForm(false); }}
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
            <div className="rounded-xl border border-dashed border-gray-800 px-6 py-12 text-center">
              <Bell aria-hidden="true" className="mx-auto h-10 w-10 text-gray-700" />
              <p className="mt-4 text-sm text-gray-500">
                No alert rules yet.
              </p>
              <p className="mt-1 max-w-sm mx-auto text-xs text-gray-600">
                {sources.length === 0
                  ? 'Add an API source first, then create an alert rule to get notified about changes.'
                  : 'Create a rule to start receiving Slack or email notifications when API changes are detected.'}
              </p>
              {sources.length === 0 ? (
                <Link
                  href="/dashboard/sources"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg border border-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <Rss aria-hidden="true" className="h-4 w-4" />
                  Add an API source first
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => {
                      // Pre-fill with email channel and medium severity — sensible defaults
                      setFormChannel('EMAIL');
                      setFormMinSeverity('MEDIUM');
                      setShowCreateForm(true);
                    }}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  >
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Create your first alert rule
                  </button>
                  <p className="mt-3 text-[11px] text-gray-600">
                    Most teams start with an email rule for MEDIUM+ severity changes.
                  </p>
                </>
              )}
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
                    className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/30 p-5 transition-colors duration-150 hover:border-gray-700 hover:bg-gray-900/50"
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
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full min-w-[640px]">
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
                        className="transition-colors duration-150 hover:bg-gray-900/40"
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
