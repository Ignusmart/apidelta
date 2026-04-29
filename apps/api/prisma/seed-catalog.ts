/**
 * Seed the public CatalogEntry table — V2 Phase 2.1 (the moat).
 *
 * Idempotent: every entry is upserted by `slug`, so re-running this
 * script is a no-op for unchanged rows and a column-update for changed ones.
 *
 * Run from apps/api:
 *
 *   pnpm exec tsx prisma/seed-catalog.ts
 */
import { PrismaClient, SourceType } from '@prisma/client';

const prisma = new PrismaClient();

interface CatalogSeed {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  changelogUrl: string;
  sourceType: SourceType;
  requiresJs?: boolean;
  logoUrl?: string;
  websiteUrl?: string;
  popular?: boolean;
  featured?: boolean;
}

/** Logo URLs use the Logo.dev free tier (CDN-cached SVG by domain). */
const logo = (domain: string) => `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ`;

const ENTRIES: CatalogSeed[] = [
  // ── Payments ───────────────────────────────────
  {
    slug: 'stripe',
    name: 'Stripe',
    description: 'Online payments, billing, and financial infrastructure for developers.',
    category: 'Payments',
    tags: ['payments', 'billing', 'subscriptions', 'fintech'],
    changelogUrl: 'https://stripe.com/docs/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    requiresJs: true,
    logoUrl: logo('stripe.com'),
    websiteUrl: 'https://stripe.com',
    popular: true,
    featured: true,
  },
  {
    slug: 'paypal',
    name: 'PayPal',
    description: 'Global payments network with REST APIs for merchants and platforms.',
    category: 'Payments',
    tags: ['payments', 'merchants', 'fintech'],
    changelogUrl: 'https://developer.paypal.com/api/rest/release-notes/',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('paypal.com'),
    websiteUrl: 'https://developer.paypal.com',
    popular: true,
  },
  {
    slug: 'plaid',
    name: 'Plaid',
    description: 'Connect users\' financial accounts to your application.',
    category: 'Payments',
    tags: ['banking', 'financial-data', 'fintech'],
    changelogUrl: 'https://plaid.com/docs/changelog/',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('plaid.com'),
    websiteUrl: 'https://plaid.com',
  },

  // ── AI / ML ────────────────────────────────────
  {
    slug: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, embeddings, fine-tuning, vision, and audio APIs.',
    category: 'AI / ML',
    tags: ['llm', 'gpt', 'embeddings', 'vision'],
    changelogUrl: 'https://platform.openai.com/docs/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    requiresJs: true,
    logoUrl: logo('openai.com'),
    websiteUrl: 'https://openai.com',
    popular: true,
    featured: true,
  },
  {
    slug: 'anthropic',
    name: 'Anthropic',
    description: 'Claude API — long-context reasoning, vision, and tool use.',
    category: 'AI / ML',
    tags: ['llm', 'claude', 'reasoning'],
    changelogUrl: 'https://docs.anthropic.com/en/release-notes/api',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('anthropic.com'),
    websiteUrl: 'https://anthropic.com',
    popular: true,
    featured: true,
  },
  {
    slug: 'huggingface',
    name: 'Hugging Face',
    description: 'Open-source models, datasets, and inference endpoints.',
    category: 'AI / ML',
    tags: ['models', 'transformers', 'open-source'],
    changelogUrl: 'https://github.com/huggingface/transformers/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('huggingface.co'),
    websiteUrl: 'https://huggingface.co',
  },
  {
    slug: 'replicate',
    name: 'Replicate',
    description: 'Run open-source ML models in the cloud via a simple API.',
    category: 'AI / ML',
    tags: ['inference', 'open-source-models'],
    changelogUrl: 'https://replicate.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('replicate.com'),
    websiteUrl: 'https://replicate.com',
  },

  // ── Communications ─────────────────────────────
  {
    slug: 'twilio',
    name: 'Twilio',
    description: 'Programmable SMS, voice, video, and email APIs.',
    category: 'Communications',
    tags: ['sms', 'voice', 'video', 'messaging'],
    changelogUrl: 'https://www.twilio.com/en-us/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('twilio.com'),
    websiteUrl: 'https://twilio.com',
    popular: true,
  },
  {
    slug: 'sendgrid',
    name: 'SendGrid',
    description: 'Transactional and marketing email at scale.',
    category: 'Communications',
    tags: ['email', 'transactional'],
    changelogUrl: 'https://github.com/sendgrid/sendgrid-nodejs/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('sendgrid.com'),
    websiteUrl: 'https://sendgrid.com',
  },
  {
    slug: 'mailgun',
    name: 'Mailgun',
    description: 'Email API for sending, tracking, and validating messages.',
    category: 'Communications',
    tags: ['email', 'transactional', 'validation'],
    changelogUrl: 'https://documentation.mailgun.com/en/latest/changelog.html',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('mailgun.com'),
    websiteUrl: 'https://mailgun.com',
  },
  {
    slug: 'slack-api',
    name: 'Slack API',
    description: 'Bots, webhooks, and the events API for Slack workspaces.',
    category: 'Communications',
    tags: ['chat', 'bots', 'webhooks'],
    changelogUrl: 'https://api.slack.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('slack.com'),
    websiteUrl: 'https://slack.com',
    popular: true,
  },

  // ── Cloud ──────────────────────────────────────
  {
    slug: 'aws',
    name: 'AWS',
    description: 'Amazon Web Services — every product, all the time.',
    category: 'Cloud',
    tags: ['cloud', 'iaas', 'serverless'],
    changelogUrl: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
    sourceType: SourceType.RSS_FEED,
    logoUrl: logo('aws.amazon.com'),
    websiteUrl: 'https://aws.amazon.com',
    popular: true,
  },
  {
    slug: 'google-cloud',
    name: 'Google Cloud',
    description: 'GCP product release notes across every service.',
    category: 'Cloud',
    tags: ['cloud', 'iaas', 'gcp'],
    changelogUrl: 'https://cloud.google.com/feeds/gcp-release-notes.xml',
    sourceType: SourceType.RSS_FEED,
    logoUrl: logo('cloud.google.com'),
    websiteUrl: 'https://cloud.google.com',
    popular: true,
  },
  {
    slug: 'cloudflare',
    name: 'Cloudflare',
    description: 'CDN, DNS, Workers, R2, D1, and edge compute.',
    category: 'Cloud',
    tags: ['cdn', 'edge', 'workers'],
    changelogUrl: 'https://developers.cloudflare.com/changelog/',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('cloudflare.com'),
    websiteUrl: 'https://cloudflare.com',
    popular: true,
  },

  // ── Developer Tools ────────────────────────────
  {
    slug: 'github-blog',
    name: 'GitHub',
    description: 'GitHub.com platform changes — Actions, Issues, security, billing.',
    category: 'Developer Tools',
    tags: ['git', 'collaboration', 'ci'],
    changelogUrl: 'https://github.blog/changelog/',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('github.com'),
    websiteUrl: 'https://github.com',
    popular: true,
    featured: true,
  },
  {
    slug: 'gitlab',
    name: 'GitLab',
    description: 'GitLab.com release announcements and platform updates.',
    category: 'Developer Tools',
    tags: ['git', 'devops', 'ci'],
    changelogUrl: 'https://about.gitlab.com/atom.xml',
    sourceType: SourceType.RSS_FEED,
    logoUrl: logo('gitlab.com'),
    websiteUrl: 'https://gitlab.com',
  },
  {
    slug: 'vercel',
    name: 'Vercel',
    description: 'Frontend cloud platform — Next.js hosting, edge functions, AI gateway.',
    category: 'Developer Tools',
    tags: ['hosting', 'serverless', 'next-js'],
    changelogUrl: 'https://vercel.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('vercel.com'),
    websiteUrl: 'https://vercel.com',
    popular: true,
  },
  {
    slug: 'netlify',
    name: 'Netlify',
    description: 'JAMstack hosting, edge functions, and form handling.',
    category: 'Developer Tools',
    tags: ['hosting', 'jamstack', 'serverless'],
    changelogUrl: 'https://www.netlify.com/changelog/',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('netlify.com'),
    websiteUrl: 'https://netlify.com',
  },
  {
    slug: 'railway',
    name: 'Railway',
    description: 'Infrastructure platform for shipping apps in minutes.',
    category: 'Developer Tools',
    tags: ['hosting', 'paas'],
    changelogUrl: 'https://blog.railway.app/changelog/rss.xml',
    sourceType: SourceType.RSS_FEED,
    logoUrl: logo('railway.app'),
    websiteUrl: 'https://railway.app',
  },

  // ── Frameworks & Libraries ────────────────────
  {
    slug: 'next-js',
    name: 'Next.js',
    description: 'The React framework for production.',
    category: 'Frameworks',
    tags: ['react', 'ssr', 'app-router'],
    changelogUrl: 'https://github.com/vercel/next.js/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('nextjs.org'),
    websiteUrl: 'https://nextjs.org',
    popular: true,
  },
  {
    slug: 'react',
    name: 'React',
    description: 'JavaScript library for building user interfaces.',
    category: 'Frameworks',
    tags: ['ui', 'frontend', 'library'],
    changelogUrl: 'https://github.com/facebook/react/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('react.dev'),
    websiteUrl: 'https://react.dev',
  },
  {
    slug: 'django',
    name: 'Django',
    description: 'High-level Python web framework — batteries-included.',
    category: 'Frameworks',
    tags: ['python', 'backend'],
    changelogUrl: 'https://github.com/django/django/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('djangoproject.com'),
    websiteUrl: 'https://djangoproject.com',
  },
  {
    slug: 'rails',
    name: 'Ruby on Rails',
    description: 'Full-stack web framework written in Ruby — convention over configuration.',
    category: 'Frameworks',
    tags: ['ruby', 'backend'],
    changelogUrl: 'https://github.com/rails/rails/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('rubyonrails.org'),
    websiteUrl: 'https://rubyonrails.org',
  },

  // ── Databases ──────────────────────────────────
  {
    slug: 'prisma',
    name: 'Prisma',
    description: 'TypeScript ORM with type-safe queries and migrations.',
    category: 'Databases',
    tags: ['orm', 'typescript', 'postgres'],
    changelogUrl: 'https://github.com/prisma/prisma/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('prisma.io'),
    websiteUrl: 'https://prisma.io',
    popular: true,
  },
  {
    slug: 'supabase',
    name: 'Supabase',
    description: 'Open-source Firebase alternative — Postgres, auth, storage, edge functions.',
    category: 'Databases',
    tags: ['baas', 'postgres', 'realtime'],
    changelogUrl: 'https://supabase.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('supabase.com'),
    websiteUrl: 'https://supabase.com',
    popular: true,
  },
  {
    slug: 'planetscale',
    name: 'PlanetScale',
    description: 'Serverless MySQL platform with branching and zero-downtime migrations.',
    category: 'Databases',
    tags: ['mysql', 'serverless'],
    changelogUrl: 'https://planetscale.com/changelog/feed.xml',
    sourceType: SourceType.RSS_FEED,
    logoUrl: logo('planetscale.com'),
    websiteUrl: 'https://planetscale.com',
  },
  {
    slug: 'mongodb',
    name: 'MongoDB',
    description: 'Document database with Atlas managed cloud service.',
    category: 'Databases',
    tags: ['nosql', 'document'],
    changelogUrl: 'https://github.com/mongodb/mongo/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('mongodb.com'),
    websiteUrl: 'https://mongodb.com',
  },

  // ── Auth & Identity ────────────────────────────
  {
    slug: 'auth0',
    name: 'Auth0',
    description: 'Authentication and authorization platform with social, enterprise, and passwordless.',
    category: 'Auth',
    tags: ['authentication', 'sso', 'oauth'],
    changelogUrl: 'https://auth0.com/changelog/feed',
    sourceType: SourceType.RSS_FEED,
    logoUrl: logo('auth0.com'),
    websiteUrl: 'https://auth0.com',
  },
  {
    slug: 'clerk',
    name: 'Clerk',
    description: 'User management and authentication for modern web apps.',
    category: 'Auth',
    tags: ['authentication', 'user-management'],
    changelogUrl: 'https://clerk.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('clerk.com'),
    websiteUrl: 'https://clerk.com',
  },
  {
    slug: 'workos',
    name: 'WorkOS',
    description: 'Enterprise-ready features — SSO, SCIM, audit logs, directory sync.',
    category: 'Auth',
    tags: ['sso', 'scim', 'enterprise'],
    changelogUrl: 'https://workos.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('workos.com'),
    websiteUrl: 'https://workos.com',
  },

  // ── Observability ──────────────────────────────
  {
    slug: 'sentry',
    name: 'Sentry',
    description: 'Application monitoring — errors, performance, profiling.',
    category: 'Observability',
    tags: ['monitoring', 'errors', 'apm'],
    changelogUrl: 'https://sentry.io/changelog/feed/',
    sourceType: SourceType.RSS_FEED,
    logoUrl: logo('sentry.io'),
    websiteUrl: 'https://sentry.io',
  },
  {
    slug: 'datadog',
    name: 'Datadog',
    description: 'Cloud monitoring, logs, APM, and security across infrastructure.',
    category: 'Observability',
    tags: ['monitoring', 'logs', 'apm'],
    changelogUrl: 'https://docs.datadoghq.com/api/changelog/',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('datadoghq.com'),
    websiteUrl: 'https://datadoghq.com',
  },

  // ── Productivity ───────────────────────────────
  {
    slug: 'linear',
    name: 'Linear',
    description: 'Issue tracking, sprints, and roadmaps for software teams.',
    category: 'Productivity',
    tags: ['project-management', 'issues'],
    changelogUrl: 'https://linear.app/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('linear.app'),
    websiteUrl: 'https://linear.app',
  },
  {
    slug: 'notion',
    name: 'Notion',
    description: 'Notes, docs, wikis, and databases — public API for integrations.',
    category: 'Productivity',
    tags: ['docs', 'wiki', 'database'],
    changelogUrl: 'https://developers.notion.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('notion.so'),
    websiteUrl: 'https://notion.so',
  },

  // ── Web3 ───────────────────────────────────────
  {
    slug: 'alchemy',
    name: 'Alchemy',
    description: 'Web3 development platform — RPC, NFT API, webhooks.',
    category: 'Web3',
    tags: ['web3', 'rpc', 'ethereum'],
    changelogUrl: 'https://docs.alchemy.com/changelog',
    sourceType: SourceType.HTML_CHANGELOG,
    logoUrl: logo('alchemy.com'),
    websiteUrl: 'https://alchemy.com',
  },
  {
    slug: 'openzeppelin',
    name: 'OpenZeppelin',
    description: 'Audited smart contract libraries for Solidity.',
    category: 'Web3',
    tags: ['solidity', 'security', 'contracts'],
    changelogUrl: 'https://github.com/OpenZeppelin/openzeppelin-contracts/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('openzeppelin.com'),
    websiteUrl: 'https://openzeppelin.com',
  },
  {
    slug: 'hardhat',
    name: 'Hardhat',
    description: 'Ethereum development environment for Solidity contracts.',
    category: 'Web3',
    tags: ['ethereum', 'solidity', 'tooling'],
    changelogUrl: 'https://github.com/NomicFoundation/hardhat/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('hardhat.org'),
    websiteUrl: 'https://hardhat.org',
  },
  {
    slug: 'viem',
    name: 'viem',
    description: 'TypeScript Interface for Ethereum — typed actions, ABIs, contracts.',
    category: 'Web3',
    tags: ['ethereum', 'typescript'],
    changelogUrl: 'https://github.com/wevm/viem/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('viem.sh'),
    websiteUrl: 'https://viem.sh',
  },
  {
    slug: 'wagmi',
    name: 'wagmi',
    description: 'React Hooks for Ethereum — wallets, contracts, ENS.',
    category: 'Web3',
    tags: ['ethereum', 'react', 'wallets'],
    changelogUrl: 'https://github.com/wevm/wagmi/releases',
    sourceType: SourceType.GITHUB_RELEASES,
    logoUrl: logo('wagmi.sh'),
    websiteUrl: 'https://wagmi.sh',
  },
];

async function main(): Promise<void> {
  console.log(`Seeding ${ENTRIES.length} catalog entries...`);

  let created = 0;
  let updated = 0;
  for (const entry of ENTRIES) {
    const existing = await prisma.catalogEntry.findUnique({ where: { slug: entry.slug } });
    await prisma.catalogEntry.upsert({
      where: { slug: entry.slug },
      create: {
        slug: entry.slug,
        name: entry.name,
        description: entry.description,
        category: entry.category,
        tags: entry.tags,
        changelogUrl: entry.changelogUrl,
        sourceType: entry.sourceType,
        requiresJs: entry.requiresJs ?? false,
        logoUrl: entry.logoUrl ?? null,
        websiteUrl: entry.websiteUrl ?? null,
        popular: entry.popular ?? false,
        featured: entry.featured ?? false,
      },
      update: {
        name: entry.name,
        description: entry.description,
        category: entry.category,
        tags: entry.tags,
        changelogUrl: entry.changelogUrl,
        sourceType: entry.sourceType,
        requiresJs: entry.requiresJs ?? false,
        logoUrl: entry.logoUrl ?? null,
        websiteUrl: entry.websiteUrl ?? null,
        popular: entry.popular ?? false,
        featured: entry.featured ?? false,
      },
    });
    if (existing) updated++;
    else created++;
  }

  console.log(`Done — ${created} created, ${updated} updated.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
