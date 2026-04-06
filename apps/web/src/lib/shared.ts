// Shared constants and utilities used across multiple dashboard pages.
// Extracted during simplify pass to eliminate duplication.

import type { Severity, ChangeType } from './types';

// ── Severity display config ──

export const SEVERITY_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  CRITICAL: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-400' },
  HIGH: { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400' },
  MEDIUM: { dot: 'bg-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  LOW: { dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-400' },
  INFO: { dot: 'bg-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

export const CHANGE_TYPE_LABELS: Record<ChangeType, { label: string; color: string }> = {
  BREAKING: { label: 'Breaking', color: 'text-red-400 bg-red-500/10' },
  DEPRECATION: { label: 'Deprecation', color: 'text-amber-400 bg-amber-500/10' },
  NON_BREAKING: { label: 'Non-Breaking', color: 'text-blue-400 bg-blue-500/10' },
  INFO: { label: 'Info', color: 'text-gray-400 bg-gray-500/10' },
};

export const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

// ── Relative time formatting ──

export function timeAgo(dateStr: string | null): string {
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

// ── Session teamId extraction ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTeamId(session: any): string | undefined {
  return (session?.user as Record<string, unknown> | undefined)?.teamId as string | undefined;
}
