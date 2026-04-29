import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CompareTable, type CompareRow } from '../CompareTable';

export const metadata: Metadata = {
  title: 'APIDelta vs. Visualping — API Changelog Tool or Visual Diff?',
  description:
    'Honest comparison of APIDelta and Visualping. Visual screenshot diffs vs. structured API change classification — when to pick which.',
  alternates: { canonical: 'https://apidelta.dev/compare/apidelta-vs-visualping' },
  openGraph: {
    title: 'APIDelta vs. Visualping',
    description: 'Visual screenshot diffs vs. structured API change classification.',
    url: 'https://apidelta.dev/compare/apidelta-vs-visualping',
  },
};

const ROWS: CompareRow[] = [
  {
    feature: 'Primary mode',
    apidelta: 'Parses changelog text + classifies semantically',
    competitor: 'Screenshots the page + visual diff',
    verdict: 'win',
    note: 'Visualping was built for marketers tracking competitor pages. APIDelta was built for engineers tracking dependencies.',
  },
  {
    feature: 'AI classification (severity, change type)',
    apidelta: 'Per-entry LLM classification',
    competitor: 'AI text summary on top tiers',
    verdict: 'win',
    note: 'A &quot;summary&quot; is not a severity. We classify each change so you can route on it.',
  },
  {
    feature: 'Affected endpoint extraction',
    apidelta: true,
    competitor: false,
    verdict: 'win',
  },
  {
    feature: 'Curated catalog of monitorable APIs',
    apidelta: '39 vetted entries (and growing)',
    competitor: false,
    verdict: 'win',
  },
  {
    feature: 'CSS selector / page-region targeting',
    apidelta: false,
    competitor: true,
    verdict: 'lose',
    note: 'Visualping lets you crop to a specific region. We don\'t need to — we crawl text, not pixels.',
  },
  {
    feature: 'Visual screenshot history',
    apidelta: false,
    competitor: true,
    verdict: 'lose',
    note: 'If your stakeholders need before/after screenshots, Visualping has that. We store text excerpts and structured classifications.',
  },
  {
    feature: 'Notification channels',
    apidelta: 'Email, Slack, Webhooks (HMAC), GitHub Issues',
    competitor: 'Email, Slack, Teams, Zapier',
    verdict: 'tie',
  },
  {
    feature: 'GitHub Issues integration',
    apidelta: true,
    competitor: false,
    verdict: 'win',
  },
  {
    feature: 'MCP server (Claude / IDE access)',
    apidelta: true,
    competitor: false,
    verdict: 'win',
  },
  {
    feature: 'Severity-based alert routing',
    apidelta: true,
    competitor: false,
    verdict: 'win',
    note: 'Visualping fires on any change. APIDelta lets you say &quot;only CRITICAL+ to PagerDuty channel.&quot;',
  },
  {
    feature: 'Audit log + alert dedup',
    apidelta: true,
    competitor: false,
    verdict: 'win',
  },
  {
    feature: 'Use case fit — competitor / pricing pages',
    apidelta: false,
    competitor: true,
    verdict: 'lose',
    note: 'Visualping is the right tool for tracking marketing pages, pricing changes, terms-of-service edits.',
  },
  {
    feature: 'Use case fit — API changelogs',
    apidelta: true,
    competitor: false,
    verdict: 'win',
  },
];

export default function CompareApiVisualpingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 text-white">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>

      <header className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          APIDelta vs. Visualping
        </h1>
        <p className="mt-3 text-base text-gray-400">
          Visualping is a visual diff tool for any web page. It was built for
          marketers and competitive intelligence teams. APIDelta is purpose-built
          for engineering teams tracking API changelogs. The honest take on when
          each one fits.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">Where APIDelta wins</p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
            <li>· Changelogs become structured signal — severity, change type, affected endpoints</li>
            <li>· Severity-based routing into different channels</li>
            <li>· Curated catalog of monitorable APIs (no CSS selectors needed)</li>
            <li>· GitHub Issues + signed webhook integrations</li>
            <li>· MCP server for Claude / IDE access</li>
            <li>· Audit trail + alert dedup at rule × change pair</li>
          </ul>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">Where Visualping wins</p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
            <li>· Visual screenshot diffs (great for marketing / brand monitoring)</li>
            <li>· Tracks any web page, not just changelogs</li>
            <li>· CSS-selector / region targeting for specific page sections</li>
            <li>· Designed for competitor pricing / TOS / marketing copy</li>
            <li>· Larger user base + more notification integrations (Zapier)</li>
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Feature-by-feature</h2>
        <p className="mt-1 text-sm text-gray-500">
          Comparison data per Visualping&apos;s public pages and our hands-on review. Pricing
          tiers vary frequently — we update this if anything material changes.
        </p>
        <div className="mt-4">
          <CompareTable rows={ROWS} competitorName="Visualping" />
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <h2 className="text-lg font-semibold">Who should pick which?</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-emerald-400">Pick APIDelta if…</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>· You&apos;re an engineering team tracking API dependencies</li>
              <li>· You want classified severity, not a &quot;something changed&quot; ping</li>
              <li>· You want GitHub Issues filed automatically</li>
              <li>· You want Claude / your IDE to query change history live</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-400">Pick Visualping if…</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>· You&apos;re tracking marketing pages, pricing, terms-of-service</li>
              <li>· You need before/after screenshots for stakeholder reports</li>
              <li>· You need region-specific targeting on arbitrary pages</li>
              <li>· You&apos;re already using Visualping for non-API monitoring</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-8 text-center">
        <h2 className="text-xl font-bold tracking-tight">Try APIDelta free for 14 days</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
          No credit card. Browse the{' '}
          <Link href="/catalog" className="text-violet-400 hover:underline">catalog</Link>{' '}
          first if you&apos;re curious.
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
