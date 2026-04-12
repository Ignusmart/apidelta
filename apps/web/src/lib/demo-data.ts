/**
 * Static demo data for ?demo=true mode.
 * Renders a fully populated dashboard without hitting the backend.
 * Used for GIF recording and screenshot capture.
 */

import type {
  ApiSource,
  ChangeEntry,
  AlertRule,
  Alert,
  TeamPlan,
} from './types';

// ── Stable IDs for referencing ──

const SRC_STRIPE = 'demo-src-stripe';
const SRC_TWILIO = 'demo-src-twilio';
const SRC_CLOUDFLARE = 'demo-src-cloudflare';
const SRC_SLACK = 'demo-src-slack';
const SRC_OPENAI = 'demo-src-openai';

const CRAWL_STRIPE = 'demo-crawl-stripe';
const CRAWL_TWILIO = 'demo-crawl-twilio';
const CRAWL_CLOUDFLARE = 'demo-crawl-cf';
const CRAWL_SLACK = 'demo-crawl-slack';
const CRAWL_OPENAI = 'demo-crawl-openai';

const RULE_SLACK = 'demo-rule-slack';
const RULE_EMAIL = 'demo-rule-email';

const TEAM_ID = 'demo-team-id';

function minsAgo(m: number): string {
  return new Date(Date.now() - m * 60_000).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString();
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

// ── Sources ──

export const DEMO_SOURCES: ApiSource[] = [
  {
    id: SRC_STRIPE,
    name: 'Stripe',
    url: 'https://stripe.com/docs/changelog',
    sourceType: 'HTML_CHANGELOG',
    teamId: TEAM_ID,
    isActive: true,
    crawlIntervalHours: 6,
    lastCrawledAt: minsAgo(23),
    createdAt: daysAgo(12),
    updatedAt: minsAgo(23),
    _count: { crawlRuns: 48 },
  },
  {
    id: SRC_TWILIO,
    name: 'Twilio',
    url: 'https://www.twilio.com/en-us/changelog',
    sourceType: 'HTML_CHANGELOG',
    teamId: TEAM_ID,
    isActive: true,
    crawlIntervalHours: 6,
    lastCrawledAt: minsAgo(23),
    createdAt: daysAgo(12),
    updatedAt: minsAgo(23),
    _count: { crawlRuns: 47 },
  },
  {
    id: SRC_CLOUDFLARE,
    name: 'Cloudflare',
    url: 'https://developers.cloudflare.com/changelog/',
    sourceType: 'HTML_CHANGELOG',
    teamId: TEAM_ID,
    isActive: true,
    crawlIntervalHours: 6,
    lastCrawledAt: minsAgo(23),
    createdAt: daysAgo(10),
    updatedAt: minsAgo(23),
    _count: { crawlRuns: 40 },
  },
  {
    id: SRC_SLACK,
    name: 'Slack API',
    url: 'https://api.slack.com/changelog',
    sourceType: 'HTML_CHANGELOG',
    teamId: TEAM_ID,
    isActive: true,
    crawlIntervalHours: 6,
    lastCrawledAt: hoursAgo(2),
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(2),
    _count: { crawlRuns: 32 },
  },
  {
    id: SRC_OPENAI,
    name: 'OpenAI',
    url: 'https://platform.openai.com/docs/changelog',
    sourceType: 'HTML_CHANGELOG',
    teamId: TEAM_ID,
    isActive: true,
    crawlIntervalHours: 6,
    lastCrawledAt: hoursAgo(4),
    createdAt: daysAgo(7),
    updatedAt: hoursAgo(4),
    _count: { crawlRuns: 28 },
  },
];

// ── Changes ──

export const DEMO_CHANGES: ChangeEntry[] = [
  {
    id: 'demo-ch-1',
    crawlRunId: CRAWL_STRIPE,
    changeType: 'BREAKING',
    severity: 'CRITICAL',
    title: 'Payment Intents: `source` parameter removed',
    description:
      'The `source` parameter on /v1/payment_intents has been removed. All integrations must migrate to `payment_method` before June 1, 2026. Requests using `source` will return 400 Bad Request.',
    affectedEndpoints: ['/v1/payment_intents', '/v1/payment_intents/confirm'],
    rawExcerpt: 'Breaking: The source parameter is no longer accepted on PaymentIntents.',
    changeDate: daysAgo(1),
    isNew: true,
    triageStatus: 'OPEN' as const,
    createdAt: minsAgo(23),
    crawlRun: {
      id: CRAWL_STRIPE,
      sourceId: SRC_STRIPE,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: minsAgo(24),
      completedAt: minsAgo(23),
      durationMs: 1340,
      source: DEMO_SOURCES[0],
    },
  },
  {
    id: 'demo-ch-2',
    crawlRunId: CRAWL_TWILIO,
    changeType: 'BREAKING',
    severity: 'CRITICAL',
    title: 'Programmable Voice: legacy TwiML endpoints sunset',
    description:
      'Legacy TwiML endpoints (/2010-04-01/Accounts/*/Calls) now return 410 Gone. All voice apps must use the v2 API.',
    affectedEndpoints: ['/2010-04-01/Accounts/*/Calls', '/2010-04-01/Accounts/*/Calls/*/Recordings'],
    rawExcerpt: 'Legacy voice endpoints permanently removed.',
    changeDate: daysAgo(2),
    isNew: true,
    triageStatus: 'OPEN' as const,
    createdAt: minsAgo(23),
    crawlRun: {
      id: CRAWL_TWILIO,
      sourceId: SRC_TWILIO,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: minsAgo(24),
      completedAt: minsAgo(23),
      durationMs: 1580,
      source: DEMO_SOURCES[1],
    },
  },
  {
    id: 'demo-ch-3',
    crawlRunId: CRAWL_STRIPE,
    changeType: 'DEPRECATION',
    severity: 'HIGH',
    title: 'Charges API deprecated in favor of PaymentIntents',
    description:
      'The /v1/charges endpoint is officially deprecated. Stripe recommends migrating to PaymentIntents by Q4 2026.',
    affectedEndpoints: ['/v1/charges', '/v1/charges/capture'],
    rawExcerpt: 'The Charges API is deprecated.',
    changeDate: daysAgo(3),
    isNew: false,
    triageStatus: 'ACKNOWLEDGED' as const,
    createdAt: daysAgo(3),
    crawlRun: {
      id: CRAWL_STRIPE,
      sourceId: SRC_STRIPE,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: minsAgo(24),
      completedAt: minsAgo(23),
      durationMs: 1340,
      source: DEMO_SOURCES[0],
    },
  },
  {
    id: 'demo-ch-4',
    crawlRunId: CRAWL_CLOUDFLARE,
    changeType: 'DEPRECATION',
    severity: 'HIGH',
    title: 'Workers KV: `list()` pagination cursor format changing',
    description:
      'The cursor format returned by KV list() will change from opaque string to base64-encoded JSON on May 15, 2026.',
    affectedEndpoints: ['/client/v4/accounts/*/storage/kv/namespaces/*/keys'],
    rawExcerpt: 'KV list pagination cursors transitioning to new format.',
    changeDate: daysAgo(1),
    isNew: true,
    triageStatus: 'OPEN' as const,
    createdAt: minsAgo(23),
    crawlRun: {
      id: CRAWL_CLOUDFLARE,
      sourceId: SRC_CLOUDFLARE,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: minsAgo(24),
      completedAt: minsAgo(23),
      durationMs: 1120,
      source: DEMO_SOURCES[2],
    },
  },
  {
    id: 'demo-ch-5',
    crawlRunId: CRAWL_SLACK,
    changeType: 'BREAKING',
    severity: 'HIGH',
    title: 'Events API: `team_join` payload schema changed',
    description:
      'The `team_join` event now includes a `profile` object instead of flat fields. Bots parsing user data must update their handlers.',
    affectedEndpoints: ['/api/events'],
    rawExcerpt: 'Breaking: team_join event payload restructured.',
    changeDate: daysAgo(1),
    isNew: true,
    triageStatus: 'OPEN' as const,
    createdAt: hoursAgo(2),
    crawlRun: {
      id: CRAWL_SLACK,
      sourceId: SRC_SLACK,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: hoursAgo(2),
      completedAt: hoursAgo(2),
      durationMs: 980,
      source: DEMO_SOURCES[3],
    },
  },
  {
    id: 'demo-ch-6',
    crawlRunId: CRAWL_OPENAI,
    changeType: 'DEPRECATION',
    severity: 'HIGH',
    title: 'Completions API (/v1/completions) sunset date announced',
    description:
      'The legacy Completions API will be removed on July 1, 2026. All users must migrate to Chat Completions.',
    affectedEndpoints: ['/v1/completions'],
    rawExcerpt: 'Completions API being sunset.',
    changeDate: daysAgo(5),
    isNew: false,
    triageStatus: 'RESOLVED' as const,
    createdAt: daysAgo(5),
    crawlRun: {
      id: CRAWL_OPENAI,
      sourceId: SRC_OPENAI,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: hoursAgo(4),
      completedAt: hoursAgo(4),
      durationMs: 1050,
      source: DEMO_SOURCES[4],
    },
  },
  {
    id: 'demo-ch-7',
    crawlRunId: CRAWL_STRIPE,
    changeType: 'NON_BREAKING',
    severity: 'MEDIUM',
    title: 'New `request_incremental_authorization` field on card options',
    description:
      'A new field allows requesting incremental authorization for card payments. Additive — no impact on existing integrations.',
    affectedEndpoints: ['/v1/payment_intents'],
    rawExcerpt: 'New: request_incremental_authorization field.',
    changeDate: daysAgo(1),
    isNew: true,
    triageStatus: 'OPEN' as const,
    createdAt: minsAgo(23),
    crawlRun: {
      id: CRAWL_STRIPE,
      sourceId: SRC_STRIPE,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: minsAgo(24),
      completedAt: minsAgo(23),
      durationMs: 1340,
      source: DEMO_SOURCES[0],
    },
  },
  {
    id: 'demo-ch-8',
    crawlRunId: CRAWL_OPENAI,
    changeType: 'NON_BREAKING',
    severity: 'MEDIUM',
    title: 'GPT-4.1 model available in Chat Completions',
    description:
      'GPT-4.1 is now available via /v1/chat/completions. Supports 1M token context. Pricing: $2/1M input, $8/1M output.',
    affectedEndpoints: ['/v1/chat/completions', '/v1/models'],
    rawExcerpt: 'GPT-4.1 is now generally available.',
    changeDate: daysAgo(0),
    isNew: true,
    triageStatus: 'OPEN' as const,
    createdAt: hoursAgo(4),
    crawlRun: {
      id: CRAWL_OPENAI,
      sourceId: SRC_OPENAI,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: hoursAgo(4),
      completedAt: hoursAgo(4),
      durationMs: 1050,
      source: DEMO_SOURCES[4],
    },
  },
  {
    id: 'demo-ch-9',
    crawlRunId: CRAWL_SLACK,
    changeType: 'NON_BREAKING',
    severity: 'MEDIUM',
    title: 'Conversations API: new `canvas` message subtype',
    description:
      'Slack now supports a `canvas` subtype in conversations.history. Canvas messages appear when a channel canvas is updated.',
    affectedEndpoints: ['/api/conversations.history', '/api/conversations.replies'],
    rawExcerpt: 'New message subtype: canvas.',
    changeDate: daysAgo(2),
    isNew: false,
    triageStatus: 'RESOLVED' as const,
    createdAt: daysAgo(2),
    crawlRun: {
      id: CRAWL_SLACK,
      sourceId: SRC_SLACK,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: hoursAgo(2),
      completedAt: hoursAgo(2),
      durationMs: 980,
      source: DEMO_SOURCES[3],
    },
  },
  {
    id: 'demo-ch-10',
    crawlRunId: CRAWL_CLOUDFLARE,
    changeType: 'NON_BREAKING',
    severity: 'MEDIUM',
    title: 'Workers AI: Llama 4 Scout model available',
    description:
      'Llama 4 Scout (17B active params, 109B total) is now available on Workers AI. Free during beta.',
    affectedEndpoints: ['/client/v4/accounts/*/ai/run/@cf/meta/llama-4-scout'],
    rawExcerpt: 'New model: @cf/meta/llama-4-scout.',
    changeDate: daysAgo(0),
    isNew: true,
    triageStatus: 'OPEN' as const,
    createdAt: minsAgo(23),
    crawlRun: {
      id: CRAWL_CLOUDFLARE,
      sourceId: SRC_CLOUDFLARE,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: minsAgo(24),
      completedAt: minsAgo(23),
      durationMs: 1120,
      source: DEMO_SOURCES[2],
    },
  },
  {
    id: 'demo-ch-11',
    crawlRunId: CRAWL_CLOUDFLARE,
    changeType: 'NON_BREAKING',
    severity: 'LOW',
    title: 'Pages: build output includes asset manifest v2',
    description:
      'Cloudflare Pages builds now emit an asset manifest v2 alongside v1. Backward-compatible, no action required.',
    affectedEndpoints: [],
    rawExcerpt: 'Pages asset manifest v2 included in builds.',
    changeDate: daysAgo(3),
    isNew: false,
    triageStatus: 'ACKNOWLEDGED' as const,
    createdAt: daysAgo(3),
    crawlRun: {
      id: CRAWL_CLOUDFLARE,
      sourceId: SRC_CLOUDFLARE,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: minsAgo(24),
      completedAt: minsAgo(23),
      durationMs: 1120,
      source: DEMO_SOURCES[2],
    },
  },
  {
    id: 'demo-ch-12',
    crawlRunId: CRAWL_TWILIO,
    changeType: 'NON_BREAKING',
    severity: 'LOW',
    title: 'Verify API: added `channel` field to verification check response',
    description:
      'The verification check response now includes a `channel` field indicating the delivery channel used.',
    affectedEndpoints: ['/v2/Services/*/VerificationCheck'],
    rawExcerpt: 'New: channel field in VerificationCheck response.',
    changeDate: daysAgo(4),
    isNew: false,
    triageStatus: 'RESOLVED' as const,
    createdAt: daysAgo(4),
    crawlRun: {
      id: CRAWL_TWILIO,
      sourceId: SRC_TWILIO,
      status: 'COMPLETED',
      errorMessage: null,
      startedAt: minsAgo(24),
      completedAt: minsAgo(23),
      durationMs: 1580,
      source: DEMO_SOURCES[1],
    },
  },
];

// ── Alert rules ──

export const DEMO_ALERT_RULES: AlertRule[] = [
  {
    id: RULE_SLACK,
    teamId: TEAM_ID,
    name: 'Critical → Slack',
    channel: 'SLACK',
    destination: 'https://hooks.slack.com/services/T00/B00/xxx',
    minSeverity: 'HIGH',
    sourceFilter: null,
    keywordFilter: [],
    isActive: true,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
  },
  {
    id: RULE_EMAIL,
    teamId: TEAM_ID,
    name: 'All breaking → Email',
    channel: 'EMAIL',
    destination: 'alex@acme.dev',
    minSeverity: 'MEDIUM',
    sourceFilter: null,
    keywordFilter: [],
    isActive: true,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
  },
];

// ── Alerts (CRITICAL + HIGH changes × 2 rules) ──

const alertableChanges = DEMO_CHANGES.filter(
  (c) => c.severity === 'CRITICAL' || c.severity === 'HIGH',
);

export const DEMO_ALERTS: Alert[] = alertableChanges.flatMap((change, i) => [
  {
    id: `demo-alert-slack-${i}`,
    alertRuleId: RULE_SLACK,
    changeEntryId: change.id,
    teamId: TEAM_ID,
    status: 'SENT' as const,
    sentAt: change.createdAt,
    errorMessage: null,
    createdAt: change.createdAt,
    alertRule: DEMO_ALERT_RULES[0],
    changeEntry: change,
  },
  {
    id: `demo-alert-email-${i}`,
    alertRuleId: RULE_EMAIL,
    changeEntryId: change.id,
    teamId: TEAM_ID,
    status: 'SENT' as const,
    sentAt: change.createdAt,
    errorMessage: null,
    createdAt: change.createdAt,
    alertRule: DEMO_ALERT_RULES[1],
    changeEntry: change,
  },
]);

// ── Team plan ──

// Chart demo data — 30 days of realistic change activity
// Deterministic daily stats — avoids hydration mismatch from Math.random()
const DEMO_DAILY_STATS = [
  { critical: 0, high: 0, medium: 2, low: 3 },
  { critical: 0, high: 1, medium: 1, low: 2 },
  { critical: 0, high: 0, medium: 0, low: 1 },
  { critical: 1, high: 2, medium: 2, low: 3 },
  { critical: 0, high: 1, medium: 1, low: 2 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 1, low: 1 },
  { critical: 0, high: 1, medium: 0, low: 3 },
  { critical: 0, high: 0, medium: 2, low: 2 },
  { critical: 0, high: 1, medium: 1, low: 1 },
  { critical: 0, high: 0, medium: 0, low: 2 },
  { critical: 1, high: 1, medium: 3, low: 3 },
  { critical: 0, high: 2, medium: 1, low: 2 },
  { critical: 0, high: 0, medium: 1, low: 0 },
  { critical: 0, high: 0, medium: 2, low: 1 },
  { critical: 0, high: 1, medium: 0, low: 2 },
  { critical: 0, high: 0, medium: 1, low: 3 },
  { critical: 0, high: 1, medium: 2, low: 1 },
  { critical: 0, high: 0, medium: 0, low: 2 },
  { critical: 0, high: 0, medium: 1, low: 1 },
  { critical: 0, high: 1, medium: 2, low: 3 },
  { critical: 0, high: 0, medium: 1, low: 0 },
  { critical: 0, high: 0, medium: 0, low: 2 },
  { critical: 0, high: 1, medium: 1, low: 1 },
  { critical: 0, high: 0, medium: 2, low: 3 },
  { critical: 0, high: 0, medium: 1, low: 2 },
  { critical: 0, high: 1, medium: 0, low: 1 },
  { critical: 0, high: 0, medium: 2, low: 0 },
  { critical: 0, high: 0, medium: 1, low: 2 },
  { critical: 0, high: 1, medium: 1, low: 3 },
];

export const DEMO_CHANGES_STATS = {
  daily: DEMO_DAILY_STATS.map((d, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return { date: date.toISOString().slice(0, 10), ...d };
  }),
  totals: { critical: 2, high: 8, medium: 24, low: 42 },
};

export const DEMO_TEAM_PLAN: TeamPlan = {
  plan: 'STARTER',
  planStatus: 'ACTIVE',
  stripeCustomerId: 'demo-team',
  stripeSubscriptionId: null,
  limits: {
    maxSources: 10,
    maxMembers: 2,
    channels: ['EMAIL', 'SLACK'],
  },
};
