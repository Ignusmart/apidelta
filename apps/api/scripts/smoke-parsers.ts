/**
 * Ad-hoc parser smoke test. Fetches a representative set of changelog
 * sources (newly-fixed Phase 0 sources + a few currently-working ones for
 * regression coverage) and runs them through `CrawlerService.parseChangelog`
 * / `parseRssFeed` so you can see real entry counts + sample titles without
 * standing up the full crawler pipeline.
 *
 * Run from apps/api: pnpm exec tsx scripts/smoke-parsers.ts
 *
 * Edit the `targets` array below to focus on a specific source while
 * iterating on parser changes.
 */
import { CrawlerService } from '../src/modules/crawler/crawler.service';

async function main(): Promise<void> {
  // The parser methods don't touch `this.prisma` / classifier / alerts —
  // we can instantiate with nulls just to call them.
  const svc = new CrawlerService(null as never);

  const targets: Array<{ name: string; url: string; kind: 'html' | 'rss' }> = [
    // Phase 0 fixes (added 2026-04-28).
    {
      name: 'AWS RSS',
      url: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
      kind: 'rss',
    },
    {
      name: 'GitHub Blog',
      url: 'https://github.blog/changelog/',
      kind: 'html',
    },
    {
      name: 'GitLab Atom',
      url: 'https://about.gitlab.com/atom.xml',
      kind: 'rss',
    },
    // Regression check — these sources were working before the Phase 0
    // changes and should continue to work.
    {
      name: 'Cloudflare',
      url: 'https://developers.cloudflare.com/changelog/',
      kind: 'html',
    },
    {
      name: 'Twilio',
      url: 'https://www.twilio.com/en-us/changelog',
      kind: 'html',
    },
    {
      name: 'Vercel',
      url: 'https://vercel.com/changelog',
      kind: 'html',
    },
  ];

  for (const t of targets) {
    console.log(`\n=== ${t.name} (${t.kind}) ===`);
    console.log(`URL: ${t.url}`);

    let body: string;
    try {
      const res = await fetch(t.url, {
        headers: {
          'User-Agent': 'APIDelta/1.0 (changelog-monitor)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        console.log(`Fetch failed: HTTP ${res.status}`);
        continue;
      }
      body = await res.text();
      console.log(`Fetched ${body.length} bytes`);
    } catch (e) {
      console.log(`Fetch error: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const rawEntries =
      t.kind === 'rss'
        ? svc.parseRssFeed(body)
        : svc.parseChangelog(body, t.url);
    console.log(`Raw entries: ${rawEntries.length}`);

    console.log(`-- first 5 raw entries (pre-filter): --`);
    for (const e of rawEntries.slice(0, 5)) {
      console.log(`  - title (${e.title.length} chars): ${e.title.slice(0, 110)}`);
      console.log(
        `    desc  (${e.description.length} chars): ${e.description.slice(0, 120).replace(/\s+/g, ' ')}${e.description.length > 120 ? '…' : ''}`,
      );
    }

    const filtered = svc.filterNoiseAndDedupe(rawEntries);
    console.log(`After noise filter + dedupe: ${filtered.length}`);

    for (const e of filtered.slice(0, 3)) {
      console.log(`  - title: ${e.title.slice(0, 110)}`);
      console.log(
        `    desc:  ${e.description.slice(0, 120).replace(/\s+/g, ' ')}${e.description.length > 120 ? '…' : ''}`,
      );
      console.log(`    date:  ${e.date?.toISOString() ?? 'none'}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
