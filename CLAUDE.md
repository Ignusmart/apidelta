# DriftWatch

API dependency change monitor. Crawls third-party API changelogs, uses AI to classify breaking vs non-breaking changes, and alerts engineering teams.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui → Vercel
- **Backend**: NestJS 11 + TypeScript + Prisma + PostgreSQL → Railway/Fly.io
- **Payments**: Stripe (Checkout + webhooks + Customer Portal)
- **AI**: Anthropic Claude API for change classification
- **Queue**: Bull + Redis for crawl job scheduling
- **Crawler**: Cheerio (HTML parsing) + Playwright (JS-rendered pages)
- **Auth**: NextAuth.js v5 (email magic link + GitHub OAuth)
- **Monorepo**: pnpm workspaces

## Repo Structure

```
driftwatch/
├── apps/
│   ├── web/          # Next.js frontend (dashboard + landing page)
│   └── api/          # NestJS backend (REST API + crawler + classifier)
├── packages/         # Shared types, utils (future)
├── docs/             # Plan, audit log, competitive research
├── .env.example      # Environment variable template
├── package.json      # Root workspace config
└── pnpm-workspace.yaml
```

## Running Locally

```bash
# Prerequisites: Node 20+, pnpm 9+, PostgreSQL, Redis

# 1. Install dependencies
pnpm install

# 2. Copy env and fill in values
cp .env.example .env

# 3. Run database migrations
pnpm db:migrate

# 4. Start dev servers
pnpm dev:web   # http://localhost:3000
pnpm dev:api   # http://localhost:3001
```

## Key Constraints

- NO Python backends — everything is TypeScript
- NO TypeORM or Drizzle — use Prisma only
- NO MUI, Chakra, or other component libs — shadcn/ui only
- NO Supabase Auth or Firebase Auth — NextAuth.js only
- NO AWS services for MVP — Railway/Fly.io + Vercel + Upstash
- Crawler must handle: static HTML, RSS feeds, GitHub release pages
- AI classification must output structured JSON with severity levels
- All user data must be team-scoped (multi-tenant from day 1)

## Pricing Model

- **Starter**: $49/mo — 10 monitored APIs, 2 team members, email + Slack alerts
- **Pro**: $99/mo — 50 monitored APIs, 10 team members, all alert channels, weekly digest
- **Free trial**: 14 days, 3 APIs

## Competitive Context

Primary competitor is API Drift Alert ($149-749/mo). We undercut on price ($49-99) and differentiate with AI-powered classification (they do basic diff comparison). Secondary competitors are generic website change monitors (PageCrawl, Visualping) that lack API-specific intelligence. oasdiff is open-source but only handles OpenAPI spec diffing in CI/CD, not third-party changelog monitoring.
