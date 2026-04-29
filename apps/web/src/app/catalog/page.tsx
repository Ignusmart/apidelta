import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, Github, Rss, Search } from 'lucide-react';
import { CatalogSearch } from './CatalogSearch';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001/api';

export const metadata: Metadata = {
  title: 'API Catalog — Curated changelogs you can monitor with APIDelta',
  description:
    'Browse 35+ curated APIs APIDelta monitors out of the box — Stripe, OpenAI, GitHub, Vercel, Anthropic, AWS, and more. Pick a source, paste your alert routing, ship.',
  alternates: { canonical: 'https://apidelta.dev/catalog' },
  openGraph: {
    title: 'APIDelta — Curated API Changelog Catalog',
    description: '35+ APIs APIDelta crawls and classifies for you.',
    url: 'https://apidelta.dev/catalog',
  },
};

interface CatalogEntry {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  changelogUrl: string;
  sourceType: 'HTML_CHANGELOG' | 'RSS_FEED' | 'GITHUB_RELEASES';
  requiresJs: boolean;
  logoUrl: string | null;
  websiteUrl: string | null;
  popular: boolean;
  featured: boolean;
}

async function fetchCatalog(params: {
  q?: string;
  category?: string;
}): Promise<{ entries: CatalogEntry[]; categories: string[] }> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.category) search.set('category', params.category);
  const qs = search.toString();
  try {
    const [entriesRes, categoriesRes] = await Promise.all([
      fetch(`${API_BASE}/catalog${qs ? `?${qs}` : ''}`, { next: { revalidate: 300 } }),
      fetch(`${API_BASE}/catalog/categories`, { next: { revalidate: 600 } }),
    ]);
    if (!entriesRes.ok || !categoriesRes.ok) {
      return { entries: [], categories: [] };
    }
    return {
      entries: await entriesRes.json(),
      categories: await categoriesRes.json(),
    };
  } catch {
    return { entries: [], categories: [] };
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const category = params.category?.trim() ?? '';
  const { entries, categories } = await fetchCatalog({ q, category });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-12 sm:py-16 text-white">
      {/* Hero */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">API Catalog</h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-gray-400">
          The curated changelogs APIDelta crawls and classifies. Add any to your dashboard in two clicks — or paste your own URL.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-500"
          >
            Start free trial
          </Link>
          <Link
            href="/dashboard/sources"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition hover:border-gray-600 hover:text-white"
          >
            Already have an account?
          </Link>
        </div>
      </header>

      {/* Search + categories */}
      <CatalogSearch
        initialQuery={q}
        currentCategory={category}
        categories={categories}
      />

      {/* Entries grid */}
      {entries.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-gray-800 px-6 py-16 text-center">
          <Search aria-hidden="true" className="mx-auto h-10 w-10 text-gray-700" />
          <p className="mt-4 text-sm text-gray-400">
            No catalog entries match {q ? `“${q}”` : 'this filter'}.
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Try clearing the filters above, or{' '}
            <Link href="/dashboard/sources" className="text-violet-400 hover:underline">
              paste any changelog URL
            </Link>{' '}
            in your dashboard.
          </p>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/catalog/${entry.slug}`}
                className="group flex h-full flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900/40 p-5 transition hover:border-violet-500/40 hover:bg-violet-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <div className="flex items-center gap-3">
                  <CatalogLogo entry={entry} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-white">{entry.name}</p>
                    <p className="truncate text-xs text-gray-500">{entry.category}</p>
                  </div>
                  <SourceTypeIcon type={entry.sourceType} />
                </div>
                <p className="line-clamp-2 text-sm text-gray-400">{entry.description}</p>
                {entry.tags.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-center text-xs text-gray-600">
        {entries.length} of 35+ catalog entries shown. Don&apos;t see what you need?{' '}
        <Link href="/dashboard/sources" className="text-violet-400 hover:underline">
          Add any changelog URL
        </Link>{' '}
        to your dashboard.
      </p>
    </main>
  );
}

function CatalogLogo({ entry }: { entry: CatalogEntry }) {
  if (entry.logoUrl) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/95">
        <Image
          src={entry.logoUrl}
          alt=""
          width={32}
          height={32}
          className="h-7 w-7 object-contain"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800 text-violet-400">
      <Globe aria-hidden="true" className="h-5 w-5" />
    </div>
  );
}

function SourceTypeIcon({ type }: { type: CatalogEntry['sourceType'] }) {
  const Icon = type === 'GITHUB_RELEASES' ? Github : type === 'RSS_FEED' ? Rss : Globe;
  const label =
    type === 'GITHUB_RELEASES'
      ? 'GitHub Releases'
      : type === 'RSS_FEED'
        ? 'RSS Feed'
        : 'HTML Changelog';
  return (
    <span title={label} aria-label={label} className="text-gray-600">
      <Icon aria-hidden="true" className="h-4 w-4" />
    </span>
  );
}
