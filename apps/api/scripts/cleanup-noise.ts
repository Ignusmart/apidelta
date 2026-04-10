/**
 * One-off cleanup script: delete existing noise from the ChangeEntry table.
 *
 * Matches the same heuristics the crawler now applies pre-persistence, so this
 * is how we backfill: anything that would be rejected today gets deleted.
 *
 * Usage:
 *   pnpm tsx scripts/cleanup-noise.ts          # dry-run, prints what would go
 *   pnpm tsx scripts/cleanup-noise.ts --apply  # actually delete
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN = !process.argv.includes('--apply');

// Mirrors CrawlerService.isLikelyNoise — keep these in sync.
function isLikelyNoise(entry: {
  title: string;
  description: string;
}): boolean {
  const title = entry.title.trim();
  const description = entry.description.trim();

  if (title.length < 15 && description.length < 40) return true;
  if (/^\d{4}$/.test(title)) return true;
  if (
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s*\d{4}$/i.test(
      title,
    )
  )
    return true;
  if (/^\d{4}-\d{2}-\d{2}$/.test(title)) return true;

  const noisePatterns = [
    /^filter\b/i,
    /^filter by/i,
    /^loading\b/i,
    /^error[:\s]/i,
    /^no results/i,
    /^an icon of/i,
    /^view all/i,
    /^choose a tag/i,
    /^sorry, something went wrong/i,
    /^insights for the future/i,
    /^suggested$/i,
    /^read the latest$/i,
    /^contributors?$/i,
    /^assets$/i,
    /^dahlia$/i,
    /^(pre-)?release$/i,
  ];
  if (noisePatterns.some((p) => p.test(title))) return true;

  if (
    /^(pre-release|latest|verified|this commit was created)/i.test(
      description.slice(0, 60),
    ) &&
    description.length < 200
  )
    return true;

  if (
    description.length > 0 &&
    description.length < title.length * 1.3 &&
    description.toLowerCase().startsWith(title.toLowerCase().slice(0, 30))
  )
    return true;

  const tokens = description.split(/\s+/).filter(Boolean);
  if (tokens.length > 10) {
    const lines = description.split('\n');
    const singleTokenRatio =
      lines.map((l) => l.trim()).filter((l) => l.length > 0 && l.split(/\s+/).length === 1)
        .length / Math.max(lines.length, 1);
    if (singleTokenRatio > 0.6) return true;
  }

  return false;
}

async function main() {
  console.log(`Running cleanup (${DRY_RUN ? 'DRY-RUN' : 'APPLY'})`);

  const entries = await prisma.changeEntry.findMany({
    select: { id: true, title: true, description: true },
  });

  console.log(`Scanned ${entries.length} change entries`);

  const toDelete: string[] = [];
  const samples: Array<{ id: string; title: string }> = [];

  for (const entry of entries) {
    if (
      isLikelyNoise({
        title: entry.title ?? '',
        description: entry.description ?? '',
      })
    ) {
      toDelete.push(entry.id);
      if (samples.length < 20) {
        samples.push({ id: entry.id, title: entry.title });
      }
    }
  }

  console.log(`Flagged ${toDelete.length} entries as noise`);
  if (samples.length > 0) {
    console.log('\nSample of entries to delete:');
    for (const s of samples) {
      const preview = s.title.length > 80 ? `${s.title.slice(0, 77)}...` : s.title;
      console.log(`  - [${s.id}] ${preview}`);
    }
  }

  if (DRY_RUN) {
    console.log('\nDry-run — no deletes performed. Rerun with --apply to delete.');
    return;
  }

  if (toDelete.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  // Delete in chunks so we don't blow through parameter limits.
  const CHUNK = 500;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += CHUNK) {
    const chunk = toDelete.slice(i, i + CHUNK);
    const result = await prisma.changeEntry.deleteMany({
      where: { id: { in: chunk } },
    });
    deleted += result.count;
  }

  console.log(`Deleted ${deleted} noise entries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
