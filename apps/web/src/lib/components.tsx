// Shared UI components used across multiple dashboard pages.

import { SEVERITY_STYLES, CHANGE_TYPE_LABELS } from './shared';
import type { ChangeType, TriageStatus } from './types';

const SEVERITY_TOOLTIPS: Record<string, string> = {
  CRITICAL: 'Breaking change that will cause immediate failures in production',
  HIGH: 'Significant change that likely requires code updates',
  MEDIUM: 'Notable change that may affect some integrations',
  LOW: 'Minor change with minimal impact',
  INFO: 'Informational update, no action needed',
};

export function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-[11px] text-gray-300 opacity-0 shadow-lg transition-opacity group-hover/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.INFO;
  const tooltip = SEVERITY_TOOLTIPS[severity];
  const badge = (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {severity}
    </span>
  );
  if (!tooltip) return badge;
  return <Tooltip text={tooltip}>{badge}</Tooltip>;
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
