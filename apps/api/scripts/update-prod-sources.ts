/**
 * One-off production data fix for V2 Phase 0 + 0.1.
 *
 * The schema migrations (`requiresJs` column, `WEBHOOK` enum, `webhookSecret`
 * column) ran fine, but the existing `ApiSource` rows in the production DB
 * still hold the old broken URLs / wrong sourceType / requiresJs=false. This
 * script flips them to the values the new crawler expects, in a single
 * transaction, and prints a before/after diff.
 *
 * Run from apps/api:
 *
 *   pnpm exec tsx scripts/update-prod-sources.ts            # dry-run, prints diff
 *   pnpm exec tsx scripts/update-prod-sources.ts --apply    # commit changes
 *
 * Idempotent — re-running after `--apply` is a no-op.
 *
 * Targets (matched by `name`, applied across all teams):
 *   - Stripe   -> requiresJs=true, isActive=true
 *   - OpenAI   -> requiresJs=true, isActive=true
 *   - SendGrid -> url=https://github.com/sendgrid/sendgrid-nodejs/releases,
 *                 sourceType=GITHUB_RELEASES, isActive=true
 *   - AWS      -> url=https://aws.amazon.com/about-aws/whats-new/recent/feed/,
 *                 sourceType=RSS_FEED, isActive=true
 *   - GitLab   -> url=https://about.gitlab.com/atom.xml,
 *                 sourceType=RSS_FEED, isActive=true
 */
import { PrismaClient, SourceType } from '@prisma/client';

interface SourceUpdate {
  name: string;
  url?: string;
  sourceType?: SourceType;
  requiresJs?: boolean;
  isActive: true;
}

const UPDATES: SourceUpdate[] = [
  { name: 'Stripe', requiresJs: true, isActive: true },
  { name: 'OpenAI', requiresJs: true, isActive: true },
  {
    name: 'SendGrid',
    url: 'https://github.com/sendgrid/sendgrid-nodejs/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    isActive: true,
  },
  {
    name: 'AWS',
    url: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
    sourceType: SourceType.RSS_FEED,
    isActive: true,
  },
  {
    name: 'GitLab',
    url: 'https://about.gitlab.com/atom.xml',
    sourceType: SourceType.RSS_FEED,
    isActive: true,
  },
];

function fmt(s: {
  id: string;
  teamId: string;
  name: string;
  url: string;
  sourceType: string;
  isActive: boolean;
  requiresJs: boolean;
}) {
  return `  ${s.id} team=${s.teamId.slice(0, 8)}.. name=${s.name.padEnd(10)} active=${s.isActive ? 'Y' : 'n'} js=${s.requiresJs ? 'Y' : 'n'} type=${s.sourceType.padEnd(15)} url=${s.url}`;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();

  try {
    console.log('═'.repeat(78));
    console.log(`Mode: ${apply ? 'APPLY (committing changes)' : 'DRY-RUN (no writes)'}`);
    console.log('═'.repeat(78));

    // Snapshot all rows we care about, plus everything else for context.
    const allRows = await prisma.apiSource.findMany({
      orderBy: [{ name: 'asc' }, { teamId: 'asc' }],
    });

    console.log(`\nAll ApiSource rows in DB (${allRows.length} total):`);
    for (const r of allRows) console.log(fmt(r));

    const targetNames = new Set(UPDATES.map((u) => u.name));
    const matched = allRows.filter((r) => targetNames.has(r.name));

    console.log(`\nRows matching update targets (${matched.length}):`);
    for (const r of matched) console.log(fmt(r));

    if (matched.length === 0) {
      console.log('\nNo matching rows — nothing to update.');
      return;
    }

    // Build the per-row diff.
    console.log('\nPlanned changes:');
    const ops: Array<{ id: string; data: Partial<SourceUpdate> }> = [];
    for (const row of matched) {
      const update = UPDATES.find((u) => u.name === row.name);
      if (!update) continue;
      const data: Partial<SourceUpdate> = {};
      const diffs: string[] = [];
      if (update.url !== undefined && row.url !== update.url) {
        data.url = update.url;
        diffs.push(`url:\n      ${row.url}\n   -> ${update.url}`);
      }
      if (update.sourceType !== undefined && row.sourceType !== update.sourceType) {
        data.sourceType = update.sourceType;
        diffs.push(`sourceType: ${row.sourceType} -> ${update.sourceType}`);
      }
      if (update.requiresJs !== undefined && row.requiresJs !== update.requiresJs) {
        data.requiresJs = update.requiresJs;
        diffs.push(`requiresJs: ${row.requiresJs} -> ${update.requiresJs}`);
      }
      if (row.isActive !== update.isActive) {
        data.isActive = update.isActive;
        diffs.push(`isActive: ${row.isActive} -> ${update.isActive}`);
      }
      if (Object.keys(data).length === 0) {
        console.log(`  ${row.name} (${row.id}): up-to-date — skip`);
        continue;
      }
      console.log(`  ${row.name} (${row.id}):`);
      for (const d of diffs) console.log(`    ${d}`);
      ops.push({ id: row.id, data });
    }

    if (ops.length === 0) {
      console.log('\nNothing to change — all matching rows already up-to-date.');
      return;
    }

    if (!apply) {
      console.log(
        `\nDRY-RUN: would update ${ops.length} rows. Re-run with --apply to commit.`,
      );
      return;
    }

    console.log(`\nApplying ${ops.length} updates in a transaction...`);
    await prisma.$transaction(
      ops.map((op) =>
        prisma.apiSource.update({
          where: { id: op.id },
          data: op.data as never,
        }),
      ),
    );

    // Verify by re-fetching.
    const after = await prisma.apiSource.findMany({
      where: { name: { in: Array.from(targetNames) } },
      orderBy: [{ name: 'asc' }, { teamId: 'asc' }],
    });
    console.log(`\nAfter (${after.length} rows):`);
    for (const r of after) console.log(fmt(r));
    console.log('\nDone.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
