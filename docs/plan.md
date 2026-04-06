# DriftWatch — MVP Build Plan

**Goal**: Ship a working MVP that crawls third-party API changelogs, classifies breaking vs non-breaking changes with AI, and alerts engineering teams via Slack/email.

**Target**: $49-99/mo per team. Buyer: engineering leads at B2B SaaS (10-100 person teams).

**Kill criteria**:
- If after 4 weeks of build, zero teams sign up for free beta → kill
- If crawler accuracy < 70% on breaking change classification → pivot approach
- If competitor ships identical AI-classification feature before our launch → reassess differentiation

---

## Phase 1: Core Engine (Week 1-2)

The ONE thing: a working crawler + AI classifier + alert pipeline. No UI auth, no billing — prove the core value loop works.

### Deliverables

- [x] **Prisma schema** (`apps/api/prisma/schema.prisma`)
  - Models: `ApiSource`, `CrawlRun`, `ChangeEntry`, `AlertRule`, `Alert`, `User`, `Team`
  - Seed script with 8 popular API changelog URLs (Stripe, Twilio, GitHub, Slack, SendGrid, OpenAI, Vercel, Prisma)
- [x] **Changelog crawler service** (`apps/api/src/modules/crawler/`)
  - `crawler.service.ts` — Cheerio-based HTML scraper with multi-pattern extraction
  - `crawler.processor.ts` — Cron-based scheduled crawl processor (no Redis dependency)
  - `sources.controller.ts` — Full CRUD endpoints for API sources + manual crawl trigger
  - `dto/create-source.dto.ts` — Input validation with class-validator
  - Supports: HTML changelog pages (RSS + GitHub releases next iteration)
  - Stores raw HTML + extracted text per crawl run
- [x] **AI classification service** (`apps/api/src/modules/classifier/`)
  - `classifier.service.ts` — Anthropic Claude API integration (claude-haiku-4-5, tool_use for structured output)
  - Prompt: given changelog text, classify each change as BREAKING / DEPRECATION / NON_BREAKING / INFO
  - Output: structured JSON with change type, severity (critical/high/medium/low), affected endpoints, summary
  - `classifier.controller.ts` — Manual trigger endpoint, auto-triggered after crawl (no Bull/Redis needed)
- [x] **Alert service** (`apps/api/src/modules/alerts/`)
  - `alerts.service.ts` — evaluates alert rules against classified changes
  - `email.transport.ts` — Nodemailer SMTP email sender (with dry-run mode)
  - `slack.transport.ts` — Slack webhook sender (with dry-run mode)
  - Alert rules: severity threshold, specific API filter, keyword match
  - Alert rule CRUD endpoints + paginated alert history + manual evaluation trigger
- [ ] **REST API endpoints** (`apps/api/src/modules/`)
  - `GET /api/sources` — list monitored APIs
  - `POST /api/sources` — add new API source (url, name, type)
  - `GET /api/sources/:id/changes` — list detected changes
  - `GET /api/changes` — list all changes (filterable by severity, source, date)
  - `POST /api/alerts/rules` — create alert rule
  - `POST /api/crawl/:sourceId` — manually trigger crawl
- [ ] **Cron job** — scheduled crawl every 6 hours for all sources
- [ ] **Integration tests** for crawler → classifier → alert pipeline (happy path)

### Validation checkpoint
- Can add a Stripe changelog URL, trigger crawl, get classified changes, receive Slack/email alert
- AI classification accuracy > 70% on manual review of 20 changes

---

## Phase 2: Landing Page + Auth + Billing (Week 2-3)

### Deliverables

- [x] **Landing page** (`apps/web/src/app/page.tsx`)
  - Hero: "Stop finding out about breaking API changes from your error logs"
  - Feature grid: AI classification, multi-channel alerts, changelog crawling
  - Pricing section: Starter ($49/mo, 10 APIs), Pro ($99/mo, 50 APIs)
  - CTA: "Start free trial" → sign up
- [x] **Auth flow** (`apps/web/src/app/(auth)/`)
  - NextAuth.js v5 with email magic link + GitHub OAuth
  - `sign-in/page.tsx`, `sign-up/page.tsx`, `verify-request/page.tsx`
  - JWT session stored in cookie
  - Middleware protects `/dashboard/*` routes, redirects to sign-in
- [x] **Dashboard** (`apps/web/app/(dashboard)/`)
  - `dashboard/page.tsx` — overview: monitored APIs, recent changes, alert count
  - `dashboard/sources/page.tsx` — list/add/remove monitored APIs
  - `dashboard/changes/page.tsx` — filterable change feed with severity badges
  - `dashboard/alerts/page.tsx` — alert rules CRUD + alert history
  - `dashboard/settings/page.tsx` — Slack webhook config, email prefs, team members
- [x] **Stripe integration** (`apps/api/src/modules/billing/`)
  - `billing.service.ts` — Stripe Checkout session creation
  - `billing.controller.ts` — webhook handler for subscription events
  - `billing.guard.ts` — NestJS guard checking subscription status
  - Customer Portal link for self-service plan changes
  - Enforce API source limits per plan tier
- [ ] **API auth middleware** — JWT validation, team-scoped data access

### Validation checkpoint
- User can sign up, add API sources, see classified changes, receive alerts
- User can subscribe via Stripe, plan limits enforced

---

## Phase 3: Polish + Deploy + Launch Prep (Week 3-4)

### Deliverables

- [x] **Deployment configuration**
  - `apps/api/Dockerfile` — multi-stage build (deps → build → production Alpine image)
  - `apps/api/scripts/start.sh` — runs `prisma migrate deploy` then starts app
  - `apps/api/.dockerignore` — excludes node_modules, .env, dist, .git
  - `apps/web/next.config.ts` — `output: 'standalone'` for Vercel
  - `.env.example` — comprehensive audit of all 18 environment variables
  - `README.md` — full setup instructions, env var table, deployment guide
  - Deploy targets: `apps/web/` → Vercel, `apps/api/` → Railway or Fly.io
  - PostgreSQL → Railway managed or Neon
  - Domain: driftwatch.dev or driftwatch.io (check availability)
- [x] **Onboarding flow** (`apps/web/src/app/(dashboard)/`)
  - Activation checklist (3 steps: add source, create alert, see crawl results)
  - Quick-add popular API sources (Stripe, Twilio, GitHub, OpenAI, Slack, SendGrid)
  - Welcome hero for zero-state users on dashboard
  - Context-aware empty states on alerts page
  - Smart defaults (email + medium severity) on first alert creation
- [ ] **Email templates**
  - Welcome email
  - Change alert email (with severity badge, affected endpoints, link to dashboard)
  - Weekly digest email
- [ ] **SEO + meta tags** on landing page
- [ ] **Error handling + logging** — structured logs, Sentry integration
- [ ] **Rate limiting** on public API endpoints
- [ ] **Security hardening** — CORS, helmet, input validation, SQL injection prevention (Prisma handles most)
- [ ] **Launch prep**
  - Product Hunt draft
  - 3 social posts (LinkedIn, Twitter/X)
  - 5 target beta users identified and contacted

### Validation checkpoint
- Full flow works in production: sign up → add source → get alert → pay
- Landing page loads < 2s, Lighthouse score > 90
- Zero critical security issues on manual review

---

## MVP Checklist (10 items)

1. [x] Changelog crawler works for 5+ API sources
2. [x] AI classification distinguishes breaking vs non-breaking (>70% accuracy)
3. [x] Email alerts sent on breaking changes
4. [x] Slack alerts sent on breaking changes
5. [x] Landing page with pricing and sign-up CTA
6. [x] Auth (sign up / sign in / sign out)
7. [x] Dashboard showing monitored APIs and change feed
8. [x] Stripe billing (Starter + Pro tiers)
9. [x] Deployment configuration (Dockerfile, start script, Vercel standalone, .env.example, README)
10. [x] README with setup instructions, env var table, deployment guide
