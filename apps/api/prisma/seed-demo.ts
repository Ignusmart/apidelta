/**
 * Demo seed script — creates photogenic data for demo GIF recording.
 *
 * Usage: tsx prisma/seed-demo.ts
 *
 * Creates:
 * - Demo team + user (reuses existing if present)
 * - 5 active API sources with realistic last-crawl times
 * - 3 completed crawl runs with timing data
 * - 12 classified change entries (good severity spread)
 * - 2 alert rules (Slack + Email)
 * - 8 sent alerts linked to real changes
 */

import {
  PrismaClient,
  SourceType,
  PlanTier,
  CrawlStatus,
  ChangeType,
  Severity,
  AlertChannel,
  AlertStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

// ── Helpers ──

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600_000);
}

function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 86_400_000);
}

function minsAgo(m: number): Date {
  return new Date(Date.now() - m * 60_000);
}

// ── Demo data ──

const SOURCES = [
  { name: 'Stripe', url: 'https://stripe.com/docs/changelog', sourceType: SourceType.HTML_CHANGELOG, lastCrawledAt: minsAgo(23) },
  { name: 'Twilio', url: 'https://www.twilio.com/en-us/changelog', sourceType: SourceType.HTML_CHANGELOG, lastCrawledAt: minsAgo(23) },
  { name: 'Cloudflare', url: 'https://developers.cloudflare.com/changelog/', sourceType: SourceType.HTML_CHANGELOG, lastCrawledAt: minsAgo(23) },
  { name: 'Slack API', url: 'https://api.slack.com/changelog', sourceType: SourceType.HTML_CHANGELOG, lastCrawledAt: hoursAgo(2) },
  { name: 'OpenAI', url: 'https://platform.openai.com/docs/changelog', sourceType: SourceType.HTML_CHANGELOG, lastCrawledAt: hoursAgo(4) },
];

const CHANGES: Array<{
  sourceIndex: number;
  changeType: ChangeType;
  severity: Severity;
  title: string;
  description: string;
  affectedEndpoints: string[];
  rawExcerpt: string;
  changeDate: Date;
  isNew: boolean;
}> = [
  // ── CRITICAL / BREAKING ──
  {
    sourceIndex: 0,
    changeType: ChangeType.BREAKING,
    severity: Severity.CRITICAL,
    title: 'Payment Intents: `source` parameter removed',
    description:
      'The `source` parameter on /v1/payment_intents has been removed. All integrations must migrate to `payment_method` before June 1, 2026. Requests using `source` will return 400 Bad Request.',
    affectedEndpoints: ['/v1/payment_intents', '/v1/payment_intents/confirm'],
    rawExcerpt:
      'Breaking: The source parameter is no longer accepted on PaymentIntents. Use payment_method instead.',
    changeDate: daysAgo(1),
    isNew: true,
  },
  {
    sourceIndex: 1,
    changeType: ChangeType.BREAKING,
    severity: Severity.CRITICAL,
    title: 'Programmable Voice: legacy TwiML endpoints sunset',
    description:
      'Legacy TwiML endpoints (/2010-04-01/Accounts/*/Calls) are now returning 410 Gone. All voice applications must use the v2 API.',
    affectedEndpoints: ['/2010-04-01/Accounts/*/Calls', '/2010-04-01/Accounts/*/Calls/*/Recordings'],
    rawExcerpt: 'Legacy voice endpoints have been permanently removed as of April 2026.',
    changeDate: daysAgo(2),
    isNew: true,
  },
  // ── HIGH / DEPRECATION ──
  {
    sourceIndex: 0,
    changeType: ChangeType.DEPRECATION,
    severity: Severity.HIGH,
    title: 'Charges API deprecated in favor of PaymentIntents',
    description:
      'The /v1/charges endpoint is now officially deprecated. While still functional, no new features will be added. Stripe recommends migrating to PaymentIntents by Q4 2026.',
    affectedEndpoints: ['/v1/charges', '/v1/charges/capture'],
    rawExcerpt: 'The Charges API is deprecated. Migrate to the Payment Intents API.',
    changeDate: daysAgo(3),
    isNew: false,
  },
  {
    sourceIndex: 2,
    changeType: ChangeType.DEPRECATION,
    severity: Severity.HIGH,
    title: 'Workers KV: `list()` pagination cursor format changing',
    description:
      'The cursor format returned by KV list() will change from opaque string to base64-encoded JSON on May 15, 2026. Code that parses cursors directly will break.',
    affectedEndpoints: ['/client/v4/accounts/*/storage/kv/namespaces/*/keys'],
    rawExcerpt: 'KV list pagination cursors are transitioning to a new format.',
    changeDate: daysAgo(1),
    isNew: true,
  },
  // ── MEDIUM / NON-BREAKING ──
  {
    sourceIndex: 0,
    changeType: ChangeType.NON_BREAKING,
    severity: Severity.MEDIUM,
    title: 'New `payment_method_options.card.request_incremental_authorization` field',
    description:
      'A new field allows requesting incremental authorization for card payments. This is additive and does not affect existing integrations.',
    affectedEndpoints: ['/v1/payment_intents'],
    rawExcerpt: 'New: request_incremental_authorization field on card payment method options.',
    changeDate: daysAgo(1),
    isNew: true,
  },
  {
    sourceIndex: 4,
    changeType: ChangeType.NON_BREAKING,
    severity: Severity.MEDIUM,
    title: 'GPT-4.1 model available in Chat Completions',
    description:
      'GPT-4.1 is now available via the /v1/chat/completions endpoint. Supports 1M token context window. Pricing: $2/1M input, $8/1M output.',
    affectedEndpoints: ['/v1/chat/completions', '/v1/models'],
    rawExcerpt: 'GPT-4.1 is now generally available.',
    changeDate: daysAgo(0),
    isNew: true,
  },
  {
    sourceIndex: 3,
    changeType: ChangeType.NON_BREAKING,
    severity: Severity.MEDIUM,
    title: 'Conversations API: new `canvas` message subtype',
    description:
      'Slack now supports a `canvas` subtype in the conversations.history response. Canvas messages appear when a channel canvas is updated.',
    affectedEndpoints: ['/api/conversations.history', '/api/conversations.replies'],
    rawExcerpt: 'New message subtype: canvas.',
    changeDate: daysAgo(2),
    isNew: false,
  },
  // ── LOW / NON-BREAKING & INFO ──
  {
    sourceIndex: 2,
    changeType: ChangeType.NON_BREAKING,
    severity: Severity.LOW,
    title: 'Pages: build output now includes asset manifest v2',
    description:
      'Cloudflare Pages builds now emit an asset manifest v2 alongside v1. This is backward-compatible and requires no action.',
    affectedEndpoints: [],
    rawExcerpt: 'Pages asset manifest v2 is now included in build output.',
    changeDate: daysAgo(3),
    isNew: false,
  },
  {
    sourceIndex: 1,
    changeType: ChangeType.NON_BREAKING,
    severity: Severity.LOW,
    title: 'Verify API: added `channel` field to verification check response',
    description:
      'The verification check response now includes a `channel` field indicating the delivery channel used.',
    affectedEndpoints: ['/v2/Services/*/VerificationCheck'],
    rawExcerpt: 'New: channel field in VerificationCheck response.',
    changeDate: daysAgo(4),
    isNew: false,
  },
  {
    sourceIndex: 4,
    changeType: ChangeType.DEPRECATION,
    severity: Severity.HIGH,
    title: 'Completions API (/v1/completions) sunset date announced',
    description:
      'The legacy Completions API will be removed on July 1, 2026. All users must migrate to Chat Completions (/v1/chat/completions).',
    affectedEndpoints: ['/v1/completions'],
    rawExcerpt: 'The Completions API is being sunset. Please migrate to Chat Completions.',
    changeDate: daysAgo(5),
    isNew: false,
  },
  {
    sourceIndex: 3,
    changeType: ChangeType.BREAKING,
    severity: Severity.HIGH,
    title: 'Events API: `team_join` payload schema changed',
    description:
      'The `team_join` event now includes a `profile` object instead of flat fields. Bots parsing user data from this event must update their handlers.',
    affectedEndpoints: ['/api/events'],
    rawExcerpt: 'Breaking: team_join event payload restructured.',
    changeDate: daysAgo(1),
    isNew: true,
  },
  {
    sourceIndex: 2,
    changeType: ChangeType.NON_BREAKING,
    severity: Severity.MEDIUM,
    title: 'Workers AI: Llama 4 Scout model available',
    description:
      'Llama 4 Scout (17B active params, 109B total) is now available on Workers AI. Free during beta.',
    affectedEndpoints: ['/client/v4/accounts/*/ai/run/@cf/meta/llama-4-scout'],
    rawExcerpt: 'New model: @cf/meta/llama-4-scout available on Workers AI.',
    changeDate: daysAgo(0),
    isNew: true,
  },
];

async function main() {
  console.log('🎬 Seeding demo data for GIF recording...\n');

  // ── Team ──
  const team = await prisma.team.upsert({
    where: { stripeCustomerId: 'demo-team' },
    update: { plan: PlanTier.STARTER, planStatus: 'ACTIVE' },
    create: {
      name: 'Acme Engineering',
      plan: PlanTier.STARTER,
      planStatus: 'ACTIVE',
      stripeCustomerId: 'demo-team',
      trialEndsAt: new Date(Date.now() + 30 * 86_400_000),
    },
  });
  console.log(`✓ Team: ${team.name} (${team.id})`);

  // ── User ──
  const user = await prisma.user.upsert({
    where: { email: 'demo@apidelta.dev' },
    update: { name: 'Alex Chen', teamId: team.id },
    create: {
      email: 'demo@apidelta.dev',
      name: 'Alex Chen',
      teamId: team.id,
      isOwner: true,
    },
  });
  console.log(`✓ User: ${user.name} (${user.email})`);

  // ── Clean up old demo data ──
  await prisma.alert.deleteMany({ where: { teamId: team.id } });
  await prisma.alertRule.deleteMany({ where: { teamId: team.id } });
  await prisma.changeEntry.deleteMany({
    where: { crawlRun: { source: { teamId: team.id } } },
  });
  await prisma.crawlRun.deleteMany({
    where: { source: { teamId: team.id } },
  });
  await prisma.apiSource.deleteMany({ where: { teamId: team.id } });
  console.log('✓ Cleaned old demo data');

  // ── Sources ──
  const createdSources = [];
  for (const src of SOURCES) {
    const created = await prisma.apiSource.create({
      data: {
        name: src.name,
        url: src.url,
        sourceType: src.sourceType,
        teamId: team.id,
        isActive: true,
        crawlIntervalHours: 6,
        lastCrawledAt: src.lastCrawledAt,
      },
    });
    createdSources.push(created);
    console.log(`  + Source: ${created.name}`);
  }

  // ── Crawl runs (one per source that was "recently crawled") ──
  const crawlRuns = [];
  for (let i = 0; i < 3; i++) {
    const src = createdSources[i];
    const run = await prisma.crawlRun.create({
      data: {
        sourceId: src.id,
        status: CrawlStatus.COMPLETED,
        startedAt: minsAgo(24),
        completedAt: minsAgo(23),
        durationMs: 1200 + Math.floor(Math.random() * 800),
      },
    });
    crawlRuns.push(run);
  }
  // Add crawl runs for Slack and OpenAI too
  for (let i = 3; i < 5; i++) {
    const src = createdSources[i];
    const ago = i === 3 ? 2 : 4;
    const run = await prisma.crawlRun.create({
      data: {
        sourceId: src.id,
        status: CrawlStatus.COMPLETED,
        startedAt: hoursAgo(ago),
        completedAt: hoursAgo(ago),
        durationMs: 900 + Math.floor(Math.random() * 600),
      },
    });
    crawlRuns.push(run);
  }
  console.log(`✓ ${crawlRuns.length} crawl runs created`);

  // ── Change entries ──
  const createdChanges = [];
  for (const change of CHANGES) {
    const crawlRun = crawlRuns[change.sourceIndex];
    const entry = await prisma.changeEntry.create({
      data: {
        crawlRunId: crawlRun.id,
        changeType: change.changeType,
        severity: change.severity,
        title: change.title,
        description: change.description,
        affectedEndpoints: change.affectedEndpoints,
        rawExcerpt: change.rawExcerpt,
        changeDate: change.changeDate,
        isNew: change.isNew,
      },
    });
    createdChanges.push(entry);
  }
  console.log(`✓ ${createdChanges.length} change entries created`);

  // ── Alert rules ──
  const slackRule = await prisma.alertRule.create({
    data: {
      teamId: team.id,
      name: 'Critical → Slack',
      channel: AlertChannel.SLACK,
      destination: 'https://hooks.slack.com/services/T00/B00/xxx',
      minSeverity: Severity.HIGH,
      isActive: true,
    },
  });

  const emailRule = await prisma.alertRule.create({
    data: {
      teamId: team.id,
      name: 'All breaking → Email',
      channel: AlertChannel.EMAIL,
      destination: 'alex@acme.dev',
      minSeverity: Severity.MEDIUM,
      isActive: true,
    },
  });
  console.log(`✓ 2 alert rules created (Slack + Email)`);

  // ── Alerts (link critical/high changes to rules) ──
  const alertableChanges = createdChanges.filter(
    (c) =>
      c.severity === 'CRITICAL' || c.severity === 'HIGH',
  );

  let alertCount = 0;
  for (const change of alertableChanges) {
    // Slack alert
    await prisma.alert.create({
      data: {
        alertRuleId: slackRule.id,
        changeEntryId: change.id,
        teamId: team.id,
        status: AlertStatus.SENT,
        sentAt: new Date(change.createdAt.getTime() + 5000),
      },
    });
    alertCount++;

    // Email alert
    await prisma.alert.create({
      data: {
        alertRuleId: emailRule.id,
        changeEntryId: change.id,
        teamId: team.id,
        status: AlertStatus.SENT,
        sentAt: new Date(change.createdAt.getTime() + 8000),
      },
    });
    alertCount++;
  }
  console.log(`✓ ${alertCount} alerts created\n`);

  // ── Summary ──
  console.log('╔══════════════════════════════════════╗');
  console.log('║  Demo data ready for GIF recording!  ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Sources:  ${createdSources.length.toString().padStart(2)}                        ║`);
  console.log(`║  Changes:  ${createdChanges.length.toString().padStart(2)}                        ║`);
  console.log(`║  Alerts:   ${alertCount.toString().padStart(2)}                        ║`);
  console.log(`║  Rules:     2                        ║`);
  console.log('╠══════════════════════════════════════╣');
  console.log('║  Login as: demo@apidelta.dev         ║');
  console.log('║  Team:     Acme Engineering           ║');
  console.log('╚══════════════════════════════════════╝');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
