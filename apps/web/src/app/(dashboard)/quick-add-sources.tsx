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

export const WEB3_SOURCES: QuickAddSource[] = [
  {
    name: 'Alchemy',
    url: 'https://www.alchemy.com/docs/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Web3',
  },
  {
    name: 'Moralis',
    url: 'https://docs.moralis.com/changelog',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Web3',
  },
  {
    name: 'thirdweb',
    url: 'https://blog.thirdweb.com/changelog/',
    sourceType: 'HTML_CHANGELOG',
    icon: Globe,
    category: 'Web3',
  },
  {
    name: 'OpenZeppelin',
    url: 'https://github.com/OpenZeppelin/openzeppelin-contracts/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Web3',
  },
  {
    name: 'Solidity',
    url: 'https://github.com/ethereum/solidity/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Web3',
  },
  {
    name: 'Foundry',
    url: 'https://github.com/foundry-rs/foundry/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Web3',
  },
  {
    name: 'viem',
    url: 'https://github.com/wevm/viem/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Web3',
  },
  {
    name: 'ethers.js',
    url: 'https://github.com/ethers-io/ethers.js/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Web3',
  },
  {
    name: 'wagmi',
    url: 'https://github.com/wevm/wagmi/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Web3',
  },
  {
    name: 'Hardhat',
    url: 'https://github.com/NomicFoundation/hardhat/releases',
    sourceType: 'GITHUB_RELEASES',
    icon: Github,
    category: 'Web3',
  },
];

function SourceGrid({
  sources,
  onSelect,
  disabled,
  accentColor,
}: {
  sources: QuickAddSource[];
  onSelect: (source: QuickAddSource) => void;
  disabled?: boolean;
  accentColor: 'violet' | 'blue';
}) {
  const iconTint = accentColor === 'violet' ? 'text-violet-400' : 'text-blue-400';
  const borderHover = accentColor === 'violet' ? 'hover:border-violet-500/40' : 'hover:border-blue-500/40';
  const bgHover = accentColor === 'violet' ? 'hover:bg-violet-500/5' : 'hover:bg-blue-500/5';

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {sources.map((source) => {
        const Icon = source.icon;
        return (
          <button
            key={source.name}
            onClick={() => onSelect(source)}
            disabled={disabled}
            className={`group flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-3 text-left transition-all duration-150 ${borderHover} ${bgHover} disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-800/60 ${iconTint} transition-colors group-hover:bg-gray-800`}>
              <Icon aria-hidden="true" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{source.name}</p>
              <p className="truncate text-[11px] text-gray-500">{source.category}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function QuickAddGrid({
  onSelect,
  disabled,
  existingUrls = [],
}: {
  onSelect: (source: QuickAddSource) => void;
  disabled?: boolean;
  existingUrls?: string[];
}) {
  const availablePopular = POPULAR_SOURCES.filter((s) => !existingUrls.includes(s.url));
  const availableWeb3 = WEB3_SOURCES.filter((s) => !existingUrls.includes(s.url));
  if (availablePopular.length === 0 && availableWeb3.length === 0) return null;

  return (
    <div className="space-y-6">
      {availablePopular.length > 0 && (
        <section aria-labelledby="quick-add-popular-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 id="quick-add-popular-heading" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Popular APIs
            </h3>
            <span className="text-[11px] text-gray-600">{availablePopular.length} available</span>
          </div>
          <SourceGrid sources={availablePopular} onSelect={onSelect} disabled={disabled} accentColor="violet" />
        </section>
      )}
      {availableWeb3.length > 0 && (
        <section aria-labelledby="quick-add-web3-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 id="quick-add-web3-heading" className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Web3 — SDKs, libraries &amp; infrastructure
            </h3>
            <span className="text-[11px] text-gray-600">{availableWeb3.length} available</span>
          </div>
          <SourceGrid sources={availableWeb3} onSelect={onSelect} disabled={disabled} accentColor="blue" />
        </section>
      )}
    </div>
  );
}
