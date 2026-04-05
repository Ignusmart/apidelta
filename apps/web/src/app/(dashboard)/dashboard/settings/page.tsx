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
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

type PlanTier = 'FREE_TRIAL' | 'STARTER' | 'PRO';
type PlanStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

interface TeamPlan {
  plan: PlanTier;
  planStatus: PlanStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  limits: {
    maxSources: number;
    maxMembers: number;
    channels: string[];
  };
}

const PLANS = [
  {
    tier: 'FREE_TRIAL' as PlanTier,
    name: 'Free Trial',
    price: '$0',
    period: '14 days',
    icon: Zap,
    accent: 'violet',
    features: [
      '3 API sources',
      '1 team member',
      'Email alerts only',
      'Basic change feed',
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
      '10 API sources',
      '2 team members',
      'Email + Slack alerts',
      'AI change classification',
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
      '50 API sources',
      '10 team members',
      'All alert channels',
      'AI change classification',
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
  const teamId = (session?.user as Record<string, unknown>)?.teamId as string | undefined;
  const searchParams = useSearchParams();

  const [teamPlan, setTeamPlan] = useState<TeamPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanTier | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Show success/cancel messages from Stripe redirect
  useEffect(() => {
    const billing = searchParams.get('billing');
    if (billing === 'success') {
      setSuccessMessage('Subscription activated successfully! Your plan has been upgraded.');
      // Clear URL param
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (billing === 'cancelled') {
      setError('Checkout was cancelled. No changes were made.');
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams]);

  const fetchPlan = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const data = await apiFetch<TeamPlan>(`/billing/plan?teamId=${teamId}`);
      setTeamPlan(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

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
        window.location.href = url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create checkout session');
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
      setError(e instanceof Error ? e.message : 'Failed to open billing portal');
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
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
          Manage your subscription and billing.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          <Check className="mr-2 inline h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
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
              className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-2.5 text-sm text-gray-300 transition hover:border-gray-700 hover:text-white disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Manage Subscription
              <ExternalLink className="h-3 w-3" />
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
                    : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    Popular
                  </span>
                )}

                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800/80">
                    <Icon className="h-4 w-4 text-gray-400" />
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
                      <Check className="h-4 w-4 shrink-0 text-violet-400" />
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
                    className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    {checkoutLoading === plan.tier ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                ) : isDowngrade && teamPlan?.stripeSubscriptionId ? (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full rounded-lg border border-gray-800 py-2.5 text-sm text-gray-400 transition hover:border-gray-700 hover:text-white disabled:opacity-50"
                  >
                    Manage Plan
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
