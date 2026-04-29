import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CompareTable, type CompareRow } from '../CompareTable';

export const metadata: Metadata = {
  title: 'APIDelta vs. API Drift Alert — Pricing, AI Classification, MCP',
  description:
    'Honest comparison of APIDelta and API Drift Alert. Pricing, AI classification, integrations, MCP server, and where each tool actually wins.',
  alternates: { canonical: 'https://apidelta.dev/compare/apidelta-vs-api-drift-alert' },
  openGraph: {
    title: 'APIDelta vs. API Drift Alert',
    description: 'A direct, honest comparison — including the things API Drift Alert does better.',
    url: 'https://apidelta.dev/compare/apidelta-vs-api-drift-alert',
  },
};

const ROWS: CompareRow[] = [
  {
    feature: 'Entry-tier price',
    apidelta: '$49 / mo',
    competitor: '$149 / mo',
    verdict: 'win',
    note: 'API Drift Alert\'s Starter is 3× our Starter. We\'re cheaper across every comparable tier.',
  },
  {
    feature: 'Free trial',
    apidelta: '14 days, no card',
    competitor: '7 days, no card',
    verdict: 'win',
  },
  {
    feature: 'AI classification',
    apidelta: 'LLM-classified severity, change type, affected endpoints',
    competitor: 'Rule-based diff comparison',
    verdict: 'win',
    note: 'Their changelog calls out "automatic version comparison" — we\'ve seen no public mention of LLM classification.',
  },
  {
    feature: 'API monitor count (entry tier)',
    apidelta: '10 (Starter) → 50 (Team)',
    competitor: '15 (Starter) → 40 (Growth)',
    verdict: 'lose',
    note: 'API Drift Alert\'s Starter ships 15 monitors vs. our 10 — a real point in their favor at the entry tier.',
  },
  {
    feature: 'Check frequency (entry tier)',
    apidelta: 'Hourly',
    competitor: '12 hours',
    verdict: 'win',
    note: 'Their 12hr Starter check frequency is too slow for critical dependencies. Our Starter is hourly.',
  },
  {
    feature: 'Curated catalog of monitorable APIs',
    apidelta: '39 vetted entries (and growing)',
    competitor: false,
    verdict: 'win',
    note: 'You can browse the full list at /catalog. They make you bring your own URLs.',
  },
  {
    feature: 'MCP server (Claude / IDE access)',
    apidelta: true,
    competitor: false,
    verdict: 'win',
    note: 'Our /api/mcp endpoint exposes your team\'s sources, recent changes, search, and alert history to any MCP client. Setup at /docs/mcp-setup.',
  },
  {
    feature: 'Slack + email alerts',
    apidelta: true,
    competitor: true,
    verdict: 'tie',
  },
  {
    feature: 'PagerDuty',
    apidelta: 'Roadmap',
    competitor: true,
    verdict: 'lose',
    note: 'They have native PagerDuty; we route via webhooks for now.',
  },
  {
    feature: 'Generic outbound webhooks (HMAC-signed)',
    apidelta: true,
    competitor: true,
    verdict: 'tie',
  },
  {
    feature: 'GitHub Issues integration',
    apidelta: true,
    competitor: false,
    verdict: 'win',
    note: 'File the breaking change directly into the team repo with labels + severity gating.',
  },
  {
    feature: 'Severity-based routing',
    apidelta: true,
    competitor: true,
    verdict: 'tie',
  },
  {
    feature: 'Business-hours awareness',
    apidelta: false,
    competitor: true,
    verdict: 'lose',
    note: 'They defer non-critical alerts off-hours. Useful — we don\'t have it yet.',
  },
  {
    feature: 'SOC 2 / SSO / RBAC',
    apidelta: 'Roadmap (Business plan)',
    competitor: true,
    verdict: 'lose',
    note: 'Real point in their favor for enterprise buyers today.',
  },
  {
    feature: 'Public docs + open changelog',
    apidelta: true,
    competitor: false,
    verdict: 'win',
    note: 'Ironically, they don\'t publish a changelog of their own.',
  },
];

export default function CompareApiDriftAlertPage() {
  return <CompareLayout rows={ROWS} />;
}

function CompareLayout({ rows }: { rows: CompareRow[] }) {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 text-white">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>

      <header className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          APIDelta vs. API Drift Alert
        </h1>
        <p className="mt-3 text-base text-gray-400">
          API Drift Alert is the closest direct competitor. It&apos;s a real product
          with real customers — and it has things APIDelta doesn&apos;t. Here&apos;s the
          honest scorecard, including where they&apos;re ahead.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <Verdict label="Where APIDelta wins" tint="emerald">
          <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
            <li>· $49 vs. $149 entry tier — 3× cheaper</li>
            <li>· LLM-classified severity, not rule-based diff</li>
            <li>· Curated catalog (39 APIs, growing) vs. bring-your-own URLs</li>
            <li>· MCP server for Claude / IDE access</li>
            <li>· GitHub Issues integration</li>
            <li>· Hourly check frequency on the entry tier (vs. 12hr)</li>
            <li>· Public docs + open changelog</li>
          </ul>
        </Verdict>
        <Verdict label="Where API Drift Alert wins" tint="amber">
          <ul className="mt-2 space-y-1.5 text-sm text-gray-300">
            <li>· 15 monitors on Starter vs. our 10</li>
            <li>· Native PagerDuty integration</li>
            <li>· Business-hours alert deferral</li>
            <li>· SOC 2 + SSO/SAML + RBAC shipped today</li>
            <li>· Mature alert grouping for high-volume teams</li>
            <li>· Several years of customer track record</li>
          </ul>
        </Verdict>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Feature-by-feature</h2>
        <p className="mt-1 text-sm text-gray-500">
          Pricing data per their public page; product data per their docs and our hands-on review.
          We update this if anything changes.
        </p>
        <div className="mt-4">
          <CompareTable rows={rows} competitorName="API Drift Alert" />
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-gray-800 bg-gray-900/40 p-6">
        <h2 className="text-lg font-semibold">Who should pick which?</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-emerald-400">Pick APIDelta if…</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>· You want LLM-classified severity, not raw diffs</li>
              <li>· You&apos;d use an MCP server with Claude / your IDE</li>
              <li>· $49–$199 fits the budget better than $149–$749</li>
              <li>· You&apos;re shipping integrations (GitHub Issues, signed webhooks) into your existing tooling</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-400">Pick API Drift Alert if…</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-400">
              <li>· You need SOC 2 / SSO / RBAC today, not on a roadmap</li>
              <li>· You&apos;ve got native PagerDuty as a hard requirement</li>
              <li>· Business-hours alert deferral is a deal-breaker</li>
              <li>· The vendor maturity trade-off matters more than the feature gap</li>
            </ul>
          </div>
        </div>
      </section>

      <CTA />
    </main>
  );
}

function Verdict({
  label,
  tint,
  children,
}: {
  label: string;
  tint: 'emerald' | 'amber';
  children: React.ReactNode;
}) {
  const cls =
    tint === 'emerald'
      ? 'border-emerald-500/30 bg-emerald-500/5'
      : 'border-amber-500/30 bg-amber-500/5';
  return (
    <div className={`rounded-xl border p-5 ${cls}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-300">{label}</p>
      {children}
    </div>
  );
}

function CTA() {
  return (
    <section className="mt-12 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-8 text-center">
      <h2 className="text-xl font-bold tracking-tight">Try APIDelta free for 14 days</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
        No credit card. Browse the{' '}
        <Link href="/catalog" className="text-violet-400 hover:underline">
          catalog
        </Link>{' '}
        first if you&apos;re still deciding.
      </p>
      <Link
        href="/sign-up"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"
      >
        Start free trial
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
