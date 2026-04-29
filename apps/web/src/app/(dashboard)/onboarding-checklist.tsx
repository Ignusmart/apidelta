'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  CheckCircle2,
  Circle,
  Rss,
  Bell,
  Play,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { ApiSource, AlertRule, Alert } from '@/lib/types';
import { getTeamId } from '@/lib/shared';

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  completed: boolean;
}

/** Persists dismissed state per user in localStorage */
function useDismissed(userId: string | undefined): [boolean, () => void] {
  const key = `dw-onboarding-dismissed-${userId ?? 'anon'}`;
  const [dismissed, setDismissed] = useState(true); // default hidden until we check

  useEffect(() => {
    if (!userId) return;
    setDismissed(localStorage.getItem(key) === 'true');
  }, [key, userId]);

  const dismiss = useCallback(() => {
    localStorage.setItem(key, 'true');
    setDismissed(true);
  }, [key]);

  return [dismissed, dismiss];
}

export function OnboardingChecklist() {
  const { data: session } = useSession();
  const teamId = getTeamId(session);
  const userId = (session?.user as Record<string, unknown>)?.id as string | undefined;

  const [dismissed, dismiss] = useDismissed(userId);
  const [collapsed, setCollapsed] = useState(false);
  const [sources, setSources] = useState<ApiSource[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    Promise.all([
      apiFetch<ApiSource[]>(`/sources?teamId=${teamId}`),
      apiFetch<AlertRule[]>(`/alerts/rules?teamId=${teamId}`),
      apiFetch<{ data: Alert[] }>(`/alerts?teamId=${teamId}&page=1&pageSize=5`),
    ])
      .then(([srcData, rulesData, alertsData]) => {
        setSources(srcData);
        setRules(rulesData);
        setAlerts(alertsData.data ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [teamId]);

  const steps: OnboardingStep[] = [
    {
      id: 'add-source',
      label: 'Add your first API source',
      description: 'Paste a changelog URL to start monitoring',
      href: '/dashboard/sources',
      icon: Rss,
      completed: sources.length > 0,
    },
    {
      id: 'create-alert',
      label: 'Set up an alert rule',
      description: 'Get notified via email or Slack when changes happen',
      href: '/dashboard/settings#alert-rules',
      icon: Bell,
      completed: rules.length > 0,
    },
    {
      id: 'first-crawl',
      label: 'See your first crawl results',
      description: 'Trigger a crawl or wait for the automatic schedule',
      href: '/dashboard/changes',
      icon: Play,
      completed: sources.some((s) => s.lastCrawledAt !== null),
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allComplete = completedCount === steps.length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Show celebration briefly when all steps complete
  useEffect(() => {
    if (allComplete && loaded && !dismissed) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, loaded, dismissed]);

  // Don't render if dismissed, not loaded, or no teamId
  if (!loaded || !teamId || dismissed) return null;

  // Auto-dismiss after all steps complete and user has seen the celebration
  if (allComplete && !showCelebration) {
    return null;
  }

  return (
    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
            <Sparkles aria-hidden="true" className="h-4.5 w-4.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {allComplete ? 'Setup complete!' : 'Get started with APIDelta'}
            </h3>
            <p className="text-xs text-gray-500">
              {allComplete
                ? 'You are all set to monitor API changes.'
                : `${completedCount} of ${steps.length} steps completed`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand setup checklist' : 'Collapse setup checklist'}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {collapsed ? (
              <ChevronDown aria-hidden="true" className="h-4 w-4" />
            ) : (
              <ChevronUp aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={dismiss}
            aria-label="Dismiss setup checklist"
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full rounded-full bg-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Celebration message */}
      {showCelebration && (
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
          <p className="text-sm font-medium text-emerald-400">
            You are ready to go! APIDelta is now monitoring your APIs.
          </p>
          <button
            onClick={dismiss}
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Got it
          </button>
        </div>
      )}

      {/* Steps */}
      {!collapsed && !showCelebration && (
        <div className="mt-4 space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const nextIncomplete = steps.find((s) => !s.completed);
            const isNext = nextIncomplete?.id === step.id;

            return (
              <Link
                key={step.id}
                href={step.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 ${
                  step.completed
                    ? 'bg-transparent opacity-60'
                    : isNext
                      ? 'bg-gray-800/50 hover:bg-gray-800'
                      : 'hover:bg-gray-800/30'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {step.completed ? (
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Circle aria-hidden="true" className={`h-5 w-5 ${isNext ? 'text-violet-400' : 'text-gray-600'}`} />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${step.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>

                {/* Arrow for next step */}
                {isNext && !step.completed && (
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-violet-400 transition-transform group-hover:translate-x-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
