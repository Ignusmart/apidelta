// ── Enums matching Prisma schema ──

export type SourceType = 'HTML_CHANGELOG' | 'RSS_FEED' | 'GITHUB_RELEASES';
export type CrawlStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type ChangeType = 'BREAKING' | 'DEPRECATION' | 'NON_BREAKING' | 'INFO';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertChannel = 'EMAIL' | 'SLACK';
export type AlertStatus = 'SENT' | 'FAILED' | 'PENDING';

// ── API response types ──

export interface ApiSource {
  id: string;
  name: string;
  url: string;
  sourceType: SourceType;
  teamId: string;
  isActive: boolean;
  crawlIntervalHours: number;
  lastCrawledAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { crawlRuns: number };
}

export interface CrawlRun {
  id: string;
  sourceId: string;
  status: CrawlStatus;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  changes?: ChangeEntry[];
}

export interface ChangeEntry {
  id: string;
  crawlRunId: string;
  changeType: ChangeType;
  severity: Severity;
  title: string;
  description: string;
  affectedEndpoints: string[];
  rawExcerpt: string | null;
  changeDate: string | null;
  isNew: boolean;
  createdAt: string;
  crawlRun?: CrawlRun & { source?: ApiSource };
}

export interface AlertRule {
  id: string;
  teamId: string;
  name: string;
  channel: AlertChannel;
  destination: string;
  minSeverity: Severity;
  sourceFilter: string | null;
  keywordFilter: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  alertRuleId: string;
  changeEntryId: string;
  teamId: string;
  status: AlertStatus;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  alertRule?: AlertRule;
  changeEntry?: ChangeEntry;
}

export interface SourceDetail extends ApiSource {
  crawlRuns: CrawlRun[];
}

export interface PaginatedAlerts {
  data: Alert[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Billing types ──

export type PlanTier = 'FREE_TRIAL' | 'STARTER' | 'PRO';
export type PlanStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export interface TeamPlan {
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

export interface SourceLimitCheck {
  allowed: boolean;
  current: number;
  max: number;
  plan: PlanTier;
}
