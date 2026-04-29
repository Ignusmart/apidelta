import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'APIDelta — Compare to API Drift Alert, PageCrawl, Visualping',
  description:
    'Honest, named-competitor comparisons. We say where each tool actually wins instead of pretending APIDelta is best at everything.',
  alternates: { canonical: 'https://apidelta.dev/compare' },
};

const PAGES = [
  {
    slug: 'apidelta-vs-api-drift-alert',
    name: 'API Drift Alert',
    summary:
      'The closest direct competitor. We\'re cheaper and ship AI classification + MCP; they have more enterprise polish (SOC 2, SSO, business-hours deferral).',
    tag: 'Direct competitor',
    tagTint: 'rose',
  },
  {
    slug: 'apidelta-vs-pagecrawl',
    name: 'PageCrawl',
    summary:
      'Generic page-change monitor. Cheaper and more flexible (any URL, region targeting). APIDelta wins on API-specific intelligence and routing.',
    tag: 'Generic monitor',
    tagTint: 'amber',
  },
  {
    slug: 'apidelta-vs-visualping',
    name: 'Visualping',
    summary:
      'Visual screenshot diffs. The right tool for tracking marketing / pricing pages. APIDelta wins for engineering teams tracking dependencies.',
    tag: 'Visual diff',
    tagTint: 'amber',
  },
];

const TINT_CLASSES: Record<string, string> = {
  rose: 'bg-rose-500/10 text-rose-400',
  amber: 'bg-amber-500/10 text-amber-400',
};

export default function CompareIndexPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 text-white">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>

      <header className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          APIDelta vs. the alternatives
        </h1>
        <p className="mt-3 text-base text-gray-400">
          Direct comparisons against the tools devs actually evaluate when looking
          at API changelog monitoring. We say where each one wins, not just where
          we win — so you can pick the right tool for your team, even if it
          isn&apos;t us.
        </p>
      </header>

      <ul className="mt-10 space-y-3">
        {PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/compare/${page.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-gray-800 bg-gray-900/40 p-6 transition hover:border-violet-500/40 hover:bg-violet-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">APIDelta vs. {page.name}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${TINT_CLASSES[page.tagTint]}`}
                  >
                    {page.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{page.summary}</p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="mt-1 h-5 w-5 shrink-0 text-gray-600 transition group-hover:text-violet-400 group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-gray-500">
        Want a comparison we don&apos;t have yet? Email{' '}
        <a href="mailto:hello@apidelta.dev" className="text-violet-400 hover:underline">
          hello@apidelta.dev
        </a>{' '}
        and we&apos;ll add it.
      </p>
    </main>
  );
}
