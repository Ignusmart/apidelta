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
import { chromium } from 'playwright';
import { CrawlerService } from '../src/modules/crawler/crawler.service';

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'APIDelta/1.0 (changelog-monitor)',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchPlaywright(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);
    return await page.content();
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  // The parser methods don't touch `this.prisma` / classifier / alerts —
  // we can instantiate with nulls just to call them.
  const svc = new CrawlerService(null as never);

  const targets: Array<{
    name: string;
    url: string;
    kind: 'html' | 'rss';
    fetcher?: 'fetch' | 'playwright';
  }> = [
    // Phase 0.1 — Playwright-rendered SPAs.
    {
      name: 'Stripe (Playwright)',
      url: 'https://stripe.com/docs/changelog',
      kind: 'html',
      fetcher: 'playwright',
    },
    {
      name: 'OpenAI (Playwright)',
      url: 'https://platform.openai.com/docs/changelog',
      kind: 'html',
      fetcher: 'playwright',
    },
    {
      name: 'GitLab docs (Playwright)',
      url: 'https://docs.gitlab.com/releases/',
      kind: 'html',
      fetcher: 'playwright',
    },
    // Phase 0 (already shipped) fixes.
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
    // Regression checks — must still work after <main>-narrowing change.
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
    const fetcher = t.fetcher ?? 'fetch';
    console.log(`\n=== ${t.name} (${t.kind}, via ${fetcher}) ===`);
    console.log(`URL: ${t.url}`);

    let body: string;
    try {
      body =
        fetcher === 'playwright'
          ? await fetchPlaywright(t.url)
          : await fetchHtml(t.url);
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
