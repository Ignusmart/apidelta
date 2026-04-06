// Shared UI components used across multiple dashboard pages.

import { SEVERITY_STYLES, CHANGE_TYPE_LABELS } from './shared';
import type { ChangeType } from './types';

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
