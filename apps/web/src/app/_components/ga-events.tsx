'use client';

import { useEffect } from 'react';
import { sendGAEvent } from '@next/third-parties/google';

const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_ID);

type CheckoutPlan = 'STARTER' | 'PRO' | 'TEAM';

const PLAN_VALUE: Record<CheckoutPlan, number> = {
  STARTER: 49,
  PRO: 99,
  TEAM: 199,
};

export function track(event: string, params: Record<string, unknown> = {}) {
  if (!GA_ENABLED) return;
  sendGAEvent('event', event, params);
}

export function trackBeginCheckout(plan: CheckoutPlan) {
  if (!GA_ENABLED) return;
  try {
    sessionStorage.setItem('apidelta_pending_plan', plan);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
  track('begin_checkout', {
    currency: 'USD',
    value: PLAN_VALUE[plan],
    items: [{ item_id: plan, item_name: plan, price: PLAN_VALUE[plan], quantity: 1 }],
  });
}

export function trackPurchaseFromSession() {
  if (!GA_ENABLED) return;
  let plan: CheckoutPlan | null = null;
  try {
    plan = sessionStorage.getItem('apidelta_pending_plan') as CheckoutPlan | null;
    sessionStorage.removeItem('apidelta_pending_plan');
  } catch {
    // ignore
  }
  const value = plan ? PLAN_VALUE[plan] : undefined;
  track('purchase', {
    currency: 'USD',
    value,
    items: plan
      ? [{ item_id: plan, item_name: plan, price: value, quantity: 1 }]
      : undefined,
    transaction_id: `apidelta_${Date.now()}`,
  });
}

export function SignupSuccessEvent() {
  useEffect(() => {
    if (!GA_ENABLED) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('welcome') !== '1') return;
    const method = url.searchParams.get('method') ?? 'unknown';
    track('sign_up', { method });
    url.searchParams.delete('welcome');
    url.searchParams.delete('method');
    window.history.replaceState(
      {},
      '',
      url.pathname + (url.search ? url.search : '') + url.hash,
    );
  }, []);
  return null;
}
