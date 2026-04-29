import {
  Mail,
  MessageSquare,
  Webhook,
  Github,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type { AlertChannel, AlertStatus } from './types';

export const CHANNEL_ICON: Record<AlertChannel, React.ElementType> = {
  EMAIL: Mail,
  SLACK: MessageSquare,
  WEBHOOK: Webhook,
  GITHUB: Github,
};

export const CHANNEL_LABEL: Record<AlertChannel, string> = {
  EMAIL: 'Email',
  SLACK: 'Slack',
  WEBHOOK: 'Webhook',
  GITHUB: 'GitHub',
};

export const ALERT_STATUS_CONFIG: Record<
  AlertStatus,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  SENT: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    label: 'Sent',
  },
  FAILED: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    label: 'Failed',
  },
  PENDING: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'Pending',
  },
};

/**
 * Format a destination for display in the Changes feed delivery row.
 * Slack/Webhook URLs are shortened to host + path tail; email + repo are
 * shown as-is. Long destinations get truncated by parent containers via CSS.
 */
export function formatDestination(channel: AlertChannel, destination: string): string {
  if (channel === 'EMAIL' || channel === 'GITHUB') return destination;
  try {
    const url = new URL(destination);
    return url.host;
  } catch {
    return destination;
  }
}
