# DriftWatch

> Stop finding out about breaking API changes from your error logs.

DriftWatch monitors third-party API changelogs and uses AI to classify changes as breaking, deprecation, or informational. When something matters, it alerts your team via Slack or email — before it hits production.

## The Problem

Engineering teams depend on dozens of third-party APIs (Stripe, Twilio, SendGrid, etc.). When these APIs ship breaking changes, teams find out the hard way: production errors, failed integrations, and 2 AM pages. Manually checking changelogs doesn't scale.

## How It Works

1. **Add your API dependencies** — paste changelog URLs or pick from our catalog
2. **We crawl and classify** — scheduled crawls + AI-powered breaking change detection
3. **Get alerted** — Slack, email, or webhook. Only when it matters.

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Backend**: NestJS 11 + TypeScript + Prisma + PostgreSQL
- **AI**: Anthropic Claude (claude-haiku-4-5) for change classification
- **Payments**: Stripe (Checkout + webhooks + Customer Portal)
- **Auth**: NextAuth.js v5 (email magic link + GitHub OAuth)
- **Monorepo**: pnpm workspaces

## Architecture

```
driftwatch/
├── apps/
│   ├── web/          # Next.js frontend — landing page, auth, dashboard
│   │   └── src/
│   │       ├── app/          # App Router pages
│   │       ├── auth.ts       # NextAuth.js config
│   │       └── lib/          # API client, Prisma, utils
│   └── api/          # NestJS backend — REST API + background jobs
│       ├── src/
│       │   ├── modules/
│       │   │   ├── crawler/      # Changelog scraping (Cheerio + cron)
│       │   │   ├── classifier/   # AI classification (Anthropic Claude)
│       │   │   ├── alerts/       # Alert rules + email/Slack transports
│       │   │   └── billing/      # Stripe checkout, webhooks, plan enforcement
│       │   └── prisma/           # Prisma service (global module)
│       └── prisma/
│           ├── schema.prisma     # Database schema (shared by web + api)
│           └── seed.ts           # Demo data seeder
├── packages/         # Shared types, utils (future)
├── docs/             # Plan, audit log, competitive research
└── .env.example      # Environment variable template
```

**Data flow**: Cron triggers crawl → Cheerio parses changelog HTML → AI classifies each entry → alert rules evaluated → Slack/email sent.

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 14+ (local or hosted)

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url> driftwatch
cd driftwatch
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL, AUTH_SECRET, GITHUB_ID, GITHUB_SECRET

# 3. Set up database
cd apps/api
npx prisma migrate dev
npx prisma db seed
cd ../..

# 4. Start dev servers (in separate terminals)
pnpm dev:web   # → http://localhost:3000
pnpm dev:api   # → http://localhost:3001
```

## Environment Variables

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Your DB provider (local, Railway, Neon) |
| `AUTH_SECRET` | JWT signing secret | `openssl rand -base64 32` |
| `GITHUB_ID` | GitHub OAuth client ID | [GitHub Developer Settings](https://github.com/settings/developers) |
| `GITHUB_SECRET` | GitHub OAuth client secret | Same as above |
| `EMAIL_FROM` | Sender address for magic link emails | Your domain email |
| `SMTP_HOST` | SMTP server hostname | Your email provider (Resend, SendGrid, etc.) |
| `SMTP_PORT` | SMTP server port | Usually 465 (SSL) or 587 (TLS) |
| `SMTP_USER` | SMTP username | Your email provider |
| `SMTP_PASS` | SMTP password or API key | Your email provider |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI classification | [Anthropic Console](https://console.anthropic.com/) |
| `STRIPE_SECRET_KEY` | Stripe secret key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Stripe Dashboard → Webhooks |
| `STRIPE_PRICE_ID_STARTER` | Stripe Price ID for Starter plan ($49/mo) | Stripe Dashboard → Products |
| `STRIPE_PRICE_ID_PRO` | Stripe Price ID for Pro plan ($99/mo) | Stripe Dashboard → Products |
| `SLACK_WEBHOOK_URL` | Default Slack webhook for testing | [Slack API](https://api.slack.com/messaging/webhooks) |
| `NEXT_PUBLIC_API_URL` | Frontend → Backend URL | `http://localhost:3001/api` locally |
| `NEXTAUTH_URL` | Base URL for NextAuth (used for Stripe redirects too) | `http://localhost:3000` locally |
| `API_PORT` | Port for NestJS API server | Default: `3001` |
| `NODE_ENV` | Environment mode | `development` or `production` |

## Deployment

### Frontend (Vercel)

The Next.js app at `apps/web/` deploys to Vercel with zero config.

1. Import the repo in Vercel
2. Set **Root Directory** to `apps/web`
3. Vercel auto-detects Next.js — build command and output are handled automatically
4. Add all `AUTH_SECRET`, `GITHUB_*`, `SMTP_*`, `EMAIL_FROM`, `DATABASE_URL`, and `NEXT_PUBLIC_API_URL` env vars
5. `output: 'standalone'` is enabled in `next.config.ts` for optimal deployment

### Backend (Railway / Fly.io)

The NestJS API at `apps/api/` deploys via Docker.

**Railway:**
1. Create new service, point to the repo
2. Set **Dockerfile path** to `apps/api/Dockerfile` and **build context** to repo root
3. Add all backend env vars (`DATABASE_URL`, `STRIPE_*`, `ANTHROPIC_API_KEY`, `SMTP_*`, etc.)
4. Railway provisions PostgreSQL — use its `DATABASE_URL`

**Fly.io:**
```bash
cd apps/api
fly launch --dockerfile Dockerfile
fly secrets set DATABASE_URL=... STRIPE_SECRET_KEY=... ANTHROPIC_API_KEY=...
```

The `start.sh` script automatically runs `prisma migrate deploy` before starting the server, so migrations apply on every deployment.

### Database

- **Railway**: Managed PostgreSQL (provisioned alongside the API)
- **Neon**: Serverless PostgreSQL (generous free tier)

## Pricing Model

| | Free Trial | Starter ($49/mo) | Pro ($99/mo) |
|---|---|---|---|
| Monitored APIs | 3 | 10 | 50 |
| Team members | 1 | 2 | 10 |
| Alert channels | Email | Email + Slack | Email + Slack |
| Trial period | 14 days | — | — |

## Development

```bash
# Run both apps
pnpm dev:web    # Next.js on :3000
pnpm dev:api    # NestJS on :3001

# Build both apps
pnpm build:web
pnpm build:api

# Database
pnpm db:migrate      # Run migrations
pnpm db:generate     # Regenerate Prisma client

# Prisma Studio (DB browser)
cd apps/api && npx prisma studio
```

## Status

MVP complete. See `docs/plan.md` for the build roadmap and `docs/audit-log.md` for iteration history.
