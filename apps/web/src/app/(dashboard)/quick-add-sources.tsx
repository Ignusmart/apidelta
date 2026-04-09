'use client';

import { Globe, Github, Rss } from 'lucide-react';
import type { SourceType } from '@/lib/types';

export interface QuickAddSource {
  name: string;
  url: string;
  sourceType: SourceType;
  icon: React.ElementType;
  category: string;
}

export const POPULAR_SOURCES: QuickAddSource[] = [
  {
    name: 'Stripe',
    url: 'https://stripe.com/docs/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Payments',
  },
  {
    name: 'Twilio',
    url: 'https://www.twilio.com/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Communications',
  },
  {
    name: 'GitHub',
    url: 'https://github.blog/changelog/',
    sourceType: 'HTML_CHANGELOG',
    icon: Github,
    category: 'Developer Tools',
  },
  {
    name: 'OpenAI',
    url: 'https://platform.openai.com/docs/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'AI / ML',
  },
  {
    name: 'Slack API',
    url: 'https://api.slack.com/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Communications',
  },
  {
    name: 'SendGrid',
    url: 'https://docs.sendgrid.com/release-notes',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Email',
  },
  {
    name: 'AWS',
    url: 'https://docs.aws.amazon.com/general/latest/gr/rss/aws-general.rss',
    sourceType: 'RSS_FEED',
    icon: Rss,
    category: 'Cloud',
  },
  {
    name: 'Google Cloud',
    url: 'https://cloud.google.com/feeds/gcp-release-notes.xml',
    sourceType: 'RSS_FEED',
    icon: Rss,
    category: 'Cloud',
  },
  {
    name: 'Cloudflare',
    url: 'https://developers.cloudflare.com/changelog/',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Infrastructure',
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Developer Tools',
  },
  {
    name: 'Next.js',
    url: 'https://github.com/vercel/next.js/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Frameworks',
  },
  {
    name: 'Prisma',
    url: 'https://github.com/prisma/prisma/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Databases',
  },
  {
    name: 'Linear',
    url: 'https://linear.app/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Project Management',
  },
  {
    name: 'Supabase',
    url: 'https://supabase.com/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Backend / BaaS',
  },
  {
    name: 'GitLab',
    url: 'https://about.gitlab.com/releases/categories/releases/',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Developer Tools',
  },
];

export function QuickAddGrid({
  onSelect,
  disabled,
  existingUrls = [],
}: {
  onSelect: (source: QuickAddSource) => void;
  disabled?: boolean;
  existingUrls?: string[];
}) {
  const available = POPULAR_SOURCES.filter((s) => !existingUrls.includes(s.url));
  if (available.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
        Popular APIs — add with one click
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {available.map((source) => {
          const Icon = source.icon;
          return (
            <button
              key={source.name}
              onClick={() => onSelect(source)}
              disabled={disabled}
              className="flex items-center gap-2.5 rounded-lg border border-gray-800 bg-gray-900/30 px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:border-violet-500/30 hover:bg-violet-500/5 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-500" />
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{source.name}</p>
                <p className="truncate text-[10px] text-gray-600">{source.category}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
