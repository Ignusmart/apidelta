// Shared UI components used across multiple dashboard pages.

import { SEVERITY_STYLES, CHANGE_TYPE_LABELS } from './shared';
import type { ChangeType, TriageStatus } from './types';

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.INFO;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
}

export function ChangeTypeBadge({ type }: { type: ChangeType }) {
  const cfg = CHANGE_TYPE_LABELS[type] ?? CHANGE_TYPE_LABELS.INFO;
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
}

const TRIAGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  OPEN: { bg: 'bg-gray-800/60', text: 'text-gray-400', label: 'Open' },
  ACKNOWLEDGED: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Acknowledged' },
  RESOLVED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Resolved' },
};

export function TriageStatusBadge({ status }: { status: TriageStatus }) {
  const s = TRIAGE_STYLES[status] ?? TRIAGE_STYLES.OPEN;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
