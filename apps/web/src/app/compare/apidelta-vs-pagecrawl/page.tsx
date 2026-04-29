import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CompareTable, type CompareRow } from '../CompareTable';

export const metadata: Metadata = {
  title: 'APIDelta vs. PageCrawl — Generic Page Monitor or API-Specific Tool?',
  description:
    'Honest comparison of APIDelta and PageCrawl.io. Where the cheap generic monitor is enough, and where you actually need API-specific intelligence.',
  alternates: { canonical: 'https://apidelta.dev/compare/apidelta-vs-pagecrawl' },
  openGraph: {
    title: 'APIDelta vs. PageCrawl',
    description: 'Generic page monitor vs. purpose-built API changelog tool.',
    url: 'https://apidelta.dev/compare/apidelta-vs-pagecrawl',
  },
};

const ROWS: CompareRow[] = [
  {
    feature: 'Entry-tier price',
    apidelta: '$49 / mo',
    competitor: '$13.33 / mo',
    verdict: 'lose',
    note: 'PageCrawl is materially cheaper. If price is the main constraint, this matters.',
  },
  {
    feature: 'Free tier',
    apidelta: '14-day trial',
    competitor: 'Yes (6 pages, 60-min checks)',
    verdict: 'lose',
  },
  {
    feature: 'Purpose',
    apidelta: 'API changelog monitoring',
    competitor: 'Generic web page change monitoring',
    verdict: 'win',
    note: 'PageCrawl watches any page. APIDelta watches changelogs and treats them as structured signal.',
  },
  {
    feature: 'AI classification (severity, change type)',
    apidelta: 'Per-entry LLM classification',
    competitor: 'AI summaries on top tiers',
    verdict: 'win',
    note: 'PageCrawl summarizes the diff. APIDelta classifies CRITICAL/HIGH/MEDIUM/LOW and BREAKING/DEPRECATION/NON_BREAKING separately so you can route on it.',
  },
  {
    feature: 'Affected endpoint extraction',
    apidelta: true,
    competitor: false,
    verdict: 'win',
    note: 'APIDelta pulls out the specific endpoints / SDK methods affected. PageCrawl just diffs the page.',
  },
  {
    feature: 'Severity-based alert routing',
    apidelta: true,
    competitor: false,
    verdict: 'win',
  },
  {
    feature: 'Curated catalog of monitorable APIs',
    apidelta: '39 vetted entries (and growing)',
    competitor: false,
    verdict: 'win',
    note: 'APIDelta\'s catalog is the data work — categorization, parser verification, format identification, vendor URL drift handling.',
  },
  {
    feature: 'CSS selector / page-section targeting',
    apidelta: false,
    competitor: true,
    verdict: 'lose',
    note: 'PageCrawl lets you target specific page regions. We don\'t — but for changelogs we don\'t need to.',
  },
  {
    feature: 'Notification channels',
    apidelta: 'Email, Slack, Webhooks (HMAC), GitHub Issues',
    competitor: 'Email, Slack, Teams, Telegram, Discord',
    verdict: 'tie',
    note: 'PageCrawl spans Discord/Telegram; APIDelta has GitHub Issues + signed webhooks. Different mixes for different teams.',
  },
  {
    feature: 'MCP server (Claude / IDE access)',
    apidelta: true,
    competitor: true,
    verdict: 'tie',
    note: 'Both have one. Ours exposes 5 tools tuned for API change queries; theirs covers their generic page diffs.',
  },
  {
    feature: 'API monitor count',
    apidelta: '10–50 (Starter / Team)',
    competitor: '6–1,000 pages',
    verdict: 'lose',
    note: 'PageCrawl scales to 1,000 pages on the top tier. We don\'t — but most teams don\'t need that count of changelogs.',
  },
  {
    feature: 'Check frequency',
    apidelta: 'Hourly',
    competitor: '60 min → 2 min (top tier)',
    verdict: 'lose',
  },
  {
    feature: 'Audit log + alert dedup at rule × change pair',
    apidelta: true,
    competitor: 'Unclear (no public docs on this)',
    verdict: 'win',
  },
];

export default function CompareApiPageCrawlPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 text-white">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>

      <header className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          APIDelta vs. PageCrawl
        </h1>
        <p className="mt-3 text-base text-gray-400">
          PageCrawl is a generic web-page change monitor. It&apos;s cheap, has a free
          tier, and works for any URL. APIDelta is purpose-built for API
          changelogs. Here&apos;s when each one is the right call — and where
          PageCrawl actually wins.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">Where APIDelta wins</p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
            <li>· LLM-classified severity, change type, and affected endpoints</li>
            <li>· Severity-based alert routing</li>
            <li>· Curated catalog (vs. bring-your-own URLs)</li>
            <li>· GitHub Issues integration with severity gating</li>
            <li>· Audit trail + alert dedup at rule × change pair</li>
          </ul>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">Where PageCrawl wins</p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
            <li>· $13/mo Standard tier — meaningfully cheaper</li>
            <li>· Free tier with 6 pages</li>
            <li>· Watches any web page (not just changelogs)</li>
            <li>· CSS selector targeting for specific page regions</li>
            <li>· Up to 1,000 pages and 2-minute checks on top tier</li>
            <li>· Discord + Telegram channels out of the box</li>
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Feature-by-feature</h2>
        <p className="mt-1 text-sm text-gray-500">
          Pricing data per PageCrawl&apos;s public pricing page; product data per their docs.
        </p>
        <div className="mt-4">
          <CompareTable rows={ROWS} competitorName="PageCrawl" />
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <h2 className="text-lg font-semibold">Who should pick which?</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-emerald-400">Pick APIDelta if…</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>· You want CRITICAL vs. NON_BREAKING classified for you</li>
              <li>· You&apos;re routing alerts by severity into different channels</li>
              <li>· You want GitHub Issues filed automatically with labels</li>
              <li>· You don&apos;t want to maintain CSS selectors across vendor redesigns</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-400">Pick PageCrawl if…</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>· You&apos;re also monitoring competitor pages, pricing pages, etc. (not just APIs)</li>
              <li>· $13/mo vs. $49/mo is the deciding factor</li>
              <li>· You only need &quot;something changed&quot; — not classification</li>
              <li>· You need Discord or Telegram routing</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-8 text-center">
        <h2 className="text-xl font-bold tracking-tight">Try APIDelta free for 14 days</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
          No credit card. Browse the{' '}
          <Link href="/catalog" className="text-violet-400 hover:underline">catalog</Link>{' '}
          to see what we already monitor.
        </p>
        <Link
          href="/sign-up"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          Start free trial
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
