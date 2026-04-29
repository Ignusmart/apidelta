import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Globe, Github, Rss, Zap } from 'lucide-react';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001/api';

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

async function fetchEntry(slug: string): Promise<CatalogEntry | null> {
  try {
    const res = await fetch(`${API_BASE}/catalog/${encodeURIComponent(slug)}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await fetchEntry(slug);
  if (!entry) {
    return { title: 'Not found — APIDelta Catalog' };
  }
  const title = `Monitor ${entry.name} changelog with APIDelta`;
  const description = `${entry.description} Get AI-classified breaking change alerts on Slack, email, GitHub Issues, or generic webhooks.`;
  return {
    title,
    description,
    alternates: { canonical: `https://apidelta.dev/catalog/${entry.slug}` },
    openGraph: { title, description, url: `https://apidelta.dev/catalog/${entry.slug}` },
  };
}

export default async function CatalogEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await fetchEntry(slug);
  if (!entry) notFound();

  const SourceTypeIcon =
    entry.sourceType === 'GITHUB_RELEASES'
      ? Github
      : entry.sourceType === 'RSS_FEED'
        ? Rss
        : Globe;
  const sourceTypeLabel =
    entry.sourceType === 'GITHUB_RELEASES'
      ? 'GitHub Releases'
      : entry.sourceType === 'RSS_FEED'
        ? 'RSS / Atom feed'
        : 'HTML changelog';

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 text-white">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to catalog
      </Link>

      <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900/40 p-8">
        <div className="flex flex-wrap items-center gap-4">
          {entry.logoUrl ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/95">
              <Image
                src={entry.logoUrl}
                alt=""
                width={48}
                height={48}
                className="h-10 w-10 object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-violet-400">
              <Globe aria-hidden="true" className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight">{entry.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {entry.category}
              <span className="mx-2 text-gray-700">·</span>
              <span className="inline-flex items-center gap-1">
                <SourceTypeIcon aria-hidden="true" className="h-3.5 w-3.5" />
                {sourceTypeLabel}
              </span>
              {entry.requiresJs && (
                <>
                  <span className="mx-2 text-gray-700">·</span>
                  <span title="Requires JavaScript rendering — APIDelta uses headless Chromium for these.">
                    SPA-rendered
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="mt-6 text-base text-gray-300">{entry.description}</p>

        {entry.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-gray-800/60 bg-gray-950/30 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Changelog</p>
            <a
              href={entry.changelogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1.5 break-all text-violet-400 hover:text-violet-300"
            >
              {entry.changelogUrl}
              <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
            </a>
          </div>
          {entry.websiteUrl && (
            <div className="rounded-lg border border-gray-800/60 bg-gray-950/30 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500">Website</p>
              <a
                href={entry.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-violet-400 hover:text-violet-300"
              >
                {new URL(entry.websiteUrl).hostname}
                <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <div className="mt-8 flex flex-col gap-3 rounded-xl border border-violet-500/30 bg-violet-500/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold">Monitor {entry.name} with APIDelta</p>
            <p className="mt-1 text-xs text-gray-400">
              Crawled hourly, AI-classified breaking changes, Slack / email / GitHub Issues alerts.
            </p>
          </div>
          <Link
            href={`/sign-up?source=${encodeURIComponent(entry.slug)}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <Zap aria-hidden="true" className="h-4 w-4" />
            Add to APIDelta
          </Link>
        </div>
      </div>
    </main>
  );
}
