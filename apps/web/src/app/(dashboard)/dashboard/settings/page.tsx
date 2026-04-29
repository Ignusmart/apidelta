'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  CreditCard,
  Check,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Zap,
  Crown,
  Sparkles,
  UserPlus,
  Trash2,
  Copy,
  Mail,
  Key,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { getTeamId } from '@/lib/shared';
import type {
  PlanTier,
  PlanStatus,
  TeamPlan,
  TeamMember,
  PendingInvite,
  ApiKey,
  ApiKeyCreated,
} from '@/lib/types';
import Link from 'next/link';
import {
  trackBeginCheckout,
  trackPurchaseFromSession,
} from '@/app/_components/ga-events';

const PLANS = [
  {
    tier: 'FREE_TRIAL' as PlanTier,
    name: 'Free Trial',
    price: '$0',
    period: '14 days',
    icon: Zap,
    accent: 'violet',
    features: [
      'Up to 3 API sources',
      '1 team member',
      'Email alerts',
      'AI-classified change feed',
    ],
  },
  {
    tier: 'STARTER' as PlanTier,
    name: 'Starter',
    price: '$49',
    period: '/month',
    icon: Sparkles,
    accent: 'blue',
    popular: true,
    features: [
      'Up to 10 API sources',
      '2 team members',
      'Email + Slack alerts',
      'AI-powered classification',
      'Priority support',
    ],
  },
  {
    tier: 'PRO' as PlanTier,
    name: 'Pro',
    price: '$99',
    period: '/month',
    icon: Crown,
    accent: 'amber',
    features: [
      'Up to 50 API sources',
      '10 team members',
      'All alert channels',
      'AI-powered classification',
      'Weekly digest emails',
      'Priority support',
    ],
  },
];

const STATUS_BADGES: Record<PlanStatus, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-500/10 text-emerald-400' },
  PAST_DUE: { label: 'Past Due', cls: 'bg-red-500/10 text-red-400' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-gray-500/10 text-gray-400' },
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const teamId = getTeamId(session);
  const searchParams = useSearchParams();

  const [teamPlan, setTeamPlan] = useState<TeamPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanTier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Team members + pending invites
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // API keys (for MCP / programmatic access)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeyName, setApiKeyName] = useState('');
  const [apiKeySubmitting, setApiKeySubmitting] = useState(false);
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreated | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);

  // Show success/cancel messages from Stripe redirect
  useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success') {
      setSuccessMessage('Plan upgraded. Your new limits are active now.');
      trackPurchaseFromSession();
      // Clear URL param
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (billing === 'cancelled') {
      setError('Checkout cancelled. Your plan was not changed.');
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams]);

  const fetchPlan = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [plan, membersData, invitesData, keysData] = await Promise.all([
        apiFetch<TeamPlan>(`/billing/plan?teamId=${teamId}`),
        apiFetch<TeamMember[]>('/team/members'),
        apiFetch<PendingInvite[]>('/team/invites'),
        apiFetch<ApiKey[]>('/team/api-keys'),
      ]);
      setTeamPlan(plan);
      setMembers(membersData);
      setInvites(invitesData);
      setApiKeys(keysData);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load plan details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Pending invites that are still actionable (not accepted, not revoked, not expired).
  const pendingInvites = invites.filter(
    (i) => !i.acceptedAt && !i.revokedAt && new Date(i.expiresAt) > new Date(),
  );

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !inviteEmail.trim()) return;
    setInviteSubmitting(true);
    try {
      const created = await apiFetch<PendingInvite>('/team/invites', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      setInvites((prev) => [created, ...prev]);
      setInviteEmail('');
      // Auto-copy the share link so the owner can paste it into Slack/email immediately.
      const url = inviteUrl(created.token);
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Invite link copied to clipboard');
      } catch {
        toast.success('Invite created — copy the link from the list below');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create invite. Please try again.');
    } finally {
      setInviteSubmitting(false);
    }
  }

  async function handleCopyInvite(token: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast.success('Invite link copied to clipboard');
    } catch {
      toast.error('Could not copy — copy the URL manually from the address bar');
    }
  }

  async function handleRevokeInvite(id: string) {
    setRevokingId(id);
    try {
      await apiFetch(`/team/invites/${id}`, { method: 'DELETE' });
      setInvites((prev) =>
        prev.map((i) => (i.id === id ? { ...i, revokedAt: new Date().toISOString() } : i)),
      );
      toast.success('Invite revoked');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not revoke invite.');
    } finally {
      setRevokingId(null);
    }
  }

  function inviteUrl(token: string): string {
    if (typeof window === 'undefined') return `/invite/${token}`;
    return `${window.location.origin}/invite/${token}`;
  }

  // ── API key handlers ────────────────────────────

  // Active = not revoked. The DB returns revoked rows too so users can
  // see a paper trail, but we only render active rows in the UI for now.
  const activeApiKeys = apiKeys.filter((k) => !k.revokedAt);

  async function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKeyName.trim()) return;
    setApiKeySubmitting(true);
    try {
      const created = await apiFetch<ApiKeyCreated>('/team/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: apiKeyName.trim() }),
      });
      setApiKeys((prev) => [created, ...prev]);
      setRevealedKey(created);
      setApiKeyName('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create API key.');
    } finally {
      setApiKeySubmitting(false);
    }
  }

  async function handleCopyApiKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('API key copied');
    } catch {
      toast.error('Could not copy — copy manually');
    }
  }

  async function handleRevokeApiKey(id: string) {
    setRevokingKeyId(id);
    try {
      await apiFetch(`/team/api-keys/${id}`, { method: 'DELETE' });
      setApiKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)),
      );
      toast.success('API key revoked');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not revoke key.');
    } finally {
      setRevokingKeyId(null);
    }
  }

  async function handleCheckout(planTier: 'STARTER' | 'PRO') {
    if (!teamId) return;
    setCheckoutLoading(planTier);
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ teamId, planTier }),
      });
      if (url) {
        trackBeginCheckout(planTier);
        window.location.href = url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout. Please try again.');
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    if (!teamId) return;
    setPortalLoading(true);
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>('/billing/portal', {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      });
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open billing portal. Please try again.');
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8" role="status">
        <span className="sr-only">Loading settings...</span>
        {/* Header skeleton */}
        <div>
          <div className="h-7 w-24 animate-pulse rounded-lg bg-gray-800" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded-md bg-gray-800/60" />
        </div>
        {/* Current plan card skeleton */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-gray-800/60" />
              <div className="h-6 w-32 animate-pulse rounded-lg bg-gray-800" />
              <div className="h-4 w-48 animate-pulse rounded bg-gray-800/40" />
            </div>
            <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-800" />
          </div>
        </div>
        {/* Plan cards skeleton */}
        <div>
          <div className="mb-4 h-5 w-16 animate-pulse rounded bg-gray-800" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-800/60" />
                  <div className="h-5 w-20 animate-pulse rounded bg-gray-800" />
                </div>
                <div className="mb-5">
                  <div className="h-8 w-16 animate-pulse rounded-lg bg-gray-800" />
                </div>
                <div className="mb-6 space-y-2.5">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-pulse rounded bg-gray-800/40" />
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-800/40" />
                    </div>
                  ))}
                </div>
                <div className="h-10 w-full animate-pulse rounded-lg bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentTier = teamPlan?.plan ?? 'FREE_TRIAL';
  const currentStatus = teamPlan?.planStatus ?? 'ACTIVE';
  const statusBadge = STATUS_BADGES[currentStatus];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your plan, billing, and team limits.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div role="status" className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          <Check aria-hidden="true" className="mr-2 inline h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div role="alert" className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertTriangle aria-hidden="true" className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Plan</p>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-xl font-bold">
                {PLANS.find((p) => p.tier === currentTier)?.name ?? currentTier}
              </h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
            </div>
            {teamPlan?.limits && (
              <p className="mt-2 text-sm text-gray-500">
                {teamPlan.limits.maxSources} API sources &middot;{' '}
                {teamPlan.limits.maxMembers} team member{teamPlan.limits.maxMembers > 1 ? 's' : ''} &middot;{' '}
                {teamPlan.limits.channels.join(' + ')} alerts
              </p>
            )}
          </div>
          {teamPlan?.stripeSubscriptionId && (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-300 transition hover:border-gray-700 hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {portalLoading ? (
                <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard aria-hidden="true" className="h-4 w-4" />
              )}
              Manage Subscription
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Plans</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentTier === plan.tier;
            const isUpgrade =
              (currentTier === 'FREE_TRIAL' && plan.tier !== 'FREE_TRIAL') ||
              (currentTier === 'STARTER' && plan.tier === 'PRO');
            const isDowngrade =
              (currentTier === 'PRO' && plan.tier !== 'PRO') ||
              (currentTier === 'STARTER' && plan.tier === 'FREE_TRIAL');

            const Icon = plan.icon;

            return (
              <div
                key={plan.tier}
                className={`relative rounded-xl border p-6 transition ${
                  isCurrent
                    ? 'border-violet-500/50 bg-violet-500/5'
                    : 'border-gray-800 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    Popular
                  </span>
                )}

                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800/80">
                    <Icon aria-hidden="true" className="h-4 w-4 text-gray-400" />
                  </div>
                  <h3 className="font-semibold">{plan.name}</h3>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-gray-500">{plan.period}</span>
                </div>

                <ul className="mb-6 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-violet-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 py-2.5 text-center text-sm font-medium text-violet-400">
                    Current Plan
                  </div>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleCheckout(plan.tier as 'STARTER' | 'PRO')}
                    disabled={checkoutLoading !== null}
                    className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
                  >
                    {checkoutLoading === plan.tier ? (
                      <>
                        <Loader2 aria-hidden="true" className="mx-auto h-4 w-4 animate-spin" />
                        <span className="sr-only">Starting checkout...</span>
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                ) : isDowngrade && teamPlan?.stripeSubscriptionId ? (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full rounded-lg border border-gray-800 py-2.5 text-sm text-gray-400 transition hover:border-gray-700 hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    Manage Plan
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Team Members</h2>
            <p className="mt-1 text-sm text-gray-500">
              Invite teammates and manage access. {teamPlan?.limits ? (
                <span>
                  Plan allows {teamPlan.limits.maxMembers} member{teamPlan.limits.maxMembers === 1 ? '' : 's'}.
                </span>
              ) : null}
            </p>
          </div>
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
            {members.length}{teamPlan?.limits ? ` / ${teamPlan.limits.maxMembers}` : ''}
          </span>
        </div>

        {/* Members list */}
        <div className="mt-4 divide-y divide-gray-800/60 rounded-lg border border-gray-800/50 bg-gray-950/30">
          {members.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">Just you so far.</div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-sm font-medium text-violet-300">
                  {(m.name?.[0] ?? m.email[0] ?? 'A').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{m.name ?? m.email.split('@')[0]}</p>
                  <p className="truncate text-xs text-gray-500">
                    {m.email}
                    {m.isOwner && <span className="ml-2 text-violet-400">&middot; Owner</span>}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Invite form */}
        <form onSubmit={handleInviteSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="invite-email" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="w-full rounded-lg border border-gray-800 bg-gray-900 py-2.5 pl-9 pr-3.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={inviteSubmitting || !inviteEmail.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {inviteSubmitting ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus aria-hidden="true" className="h-4 w-4" />
            )}
            Send invite
          </button>
        </form>
        <p className="mt-2 text-[11px] text-gray-600">
          We&apos;ll generate a shareable invite link. Send it to your teammate — when they sign in with this email, they&apos;ll automatically join this team.
        </p>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              Pending invites
            </p>
            <div className="divide-y divide-gray-800/60 rounded-lg border border-gray-800/50 bg-gray-950/30">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-sm text-gray-400">
                    <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.email}</p>
                    <p className="text-xs text-gray-500">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyInvite(inv.token)}
                      aria-label={`Copy invite link for ${inv.email}`}
                      title="Copy invite link"
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <Copy aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRevokeInvite(inv.id)}
                      disabled={revokingId === inv.id}
                      aria-label={`Revoke invite for ${inv.email}`}
                      title="Revoke invite"
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      {revokingId === inv.id ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* API Keys (MCP / programmatic access) */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">API Keys</h2>
            <p className="mt-1 text-sm text-gray-500">
              Personal access keys for the MCP server and programmatic access. Keep secret —{' '}
              <Link href="/docs/mcp-setup" className="text-violet-400 hover:underline">
                MCP setup guide
              </Link>
              .
            </p>
          </div>
          <Key aria-hidden="true" className="h-5 w-5 text-gray-500" />
        </div>

        {/* One-time secret reveal banner */}
        {revealedKey && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4"
          >
            <p className="text-sm font-medium text-amber-300">
              Save this key now — you won&apos;t see it again.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-gray-950/40 px-3 py-2">
              <code className="flex-1 break-all font-mono text-xs text-amber-200">
                {revealedKey.key}
              </code>
              <button
                type="button"
                onClick={() => handleCopyApiKey(revealedKey.key)}
                aria-label="Copy API key"
                className="rounded-md p-1.5 text-amber-300 transition hover:bg-amber-500/10 hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <Copy aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setRevealedKey(null)}
              className="mt-3 text-xs text-amber-400 hover:text-amber-300"
            >
              I&apos;ve saved it — dismiss
            </button>
          </div>
        )}

        {/* Active keys list */}
        {activeApiKeys.length > 0 && (
          <div className="mt-4 divide-y divide-gray-800/60 rounded-lg border border-gray-800/50 bg-gray-950/30">
            {activeApiKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-3 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-gray-400">
                  <Key aria-hidden="true" className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{key.name}</p>
                  <p className="truncate font-mono text-[11px] text-gray-500">
                    {key.prefix}
                    <span className="ml-2 font-sans text-gray-600">
                      ·{' '}
                      {key.lastUsedAt
                        ? `last used ${new Date(key.lastUsedAt).toLocaleDateString()}`
                        : 'not used yet'}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevokeApiKey(key.id)}
                  disabled={revokingKeyId === key.id}
                  aria-label={`Revoke ${key.name}`}
                  title="Revoke key"
                  className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-800 hover:text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  {revokingKeyId === key.id ? (
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create form */}
        <form onSubmit={handleCreateApiKey} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            id="api-key-name"
            type="text"
            value={apiKeyName}
            onChange={(e) => setApiKeyName(e.target.value)}
            placeholder='Key name (e.g. "Claude Desktop")'
            className="flex-1 rounded-lg border border-gray-800 bg-gray-900 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
          />
          <button
            type="submit"
            disabled={apiKeySubmitting || !apiKeyName.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {apiKeySubmitting ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Plus aria-hidden="true" className="h-4 w-4" />
            )}
            Create key
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="mt-1 text-sm text-gray-500">Configure how and when you receive alerts.</p>
          </div>
          <span className="rounded-full border border-gray-700 bg-gray-800 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
            Coming Soon
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between rounded-lg border border-gray-800/50 bg-gray-950/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Email digest</p>
              <p className="text-xs text-gray-500">Receive a daily summary of all changes</p>
            </div>
            <input type="checkbox" disabled className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-violet-500 opacity-50" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-gray-800/50 bg-gray-950/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Breaking changes only</p>
              <p className="text-xs text-gray-500">Only notify on CRITICAL and HIGH severity</p>
            </div>
            <input type="checkbox" disabled defaultChecked className="h-4 w-4 rounded border-gray-700 bg-gray-900 text-violet-500 opacity-50" />
          </label>
        </div>
      </div>
    </div>
  );
}
