# DriftWatch — Deployment Guide

Step-by-step guide to deploy DriftWatch to production.

**Architecture**: Next.js frontend on Vercel, NestJS API on Railway (or Fly.io), PostgreSQL on Neon, Stripe for billing.

---

## 1. Neon PostgreSQL Setup

1. Go to [neon.tech](https://neon.tech) and create a project named `driftwatch`
2. Choose the **US East (N. Virginia)** region (closest to Vercel iad1)
3. Copy the connection string — it looks like:
   ```
   postgresql://neondb_owner:xxxx@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save this as `DATABASE_URL` — you will need it for both the API and the web app

**Important**: Neon's free tier includes 0.5 GB storage and autoscaling. This is plenty for MVP validation.

---

## 2. Stripe Configuration

### Create products and prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) > Products
2. Create **Starter** product:
   - Name: `DriftWatch Starter`
   - Price: `$49.00/month` (recurring, monthly)
   - Copy the price ID (`price_xxx`) — this is `STRIPE_PRICE_ID_STARTER`
3. Create **Pro** product:
   - Name: `DriftWatch Pro`
   - Price: `$99.00/month` (recurring, monthly)
   - Copy the price ID (`price_xxx`) — this is `STRIPE_PRICE_ID_PRO`

### Set up webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint URL: `https://api.driftwatch.dev/api/billing/webhook`
   (Replace `api.driftwatch.dev` with your actual API domain)
3. Select these events:
   - `checkout.session.completed` — user completes payment
   - `customer.subscription.updated` — plan change or renewal
   - `customer.subscription.deleted` — subscription cancelled
   - `invoice.payment_failed` — payment failure (to downgrade or notify)
4. Copy the webhook signing secret (`whsec_xxx`) — this is `STRIPE_WEBHOOK_SECRET`

### Get API keys

1. Stripe Dashboard > Developers > API keys
2. Copy the **Secret key** (`sk_live_xxx` or `sk_test_xxx` for testing) — this is `STRIPE_SECRET_KEY`

**Tip**: Use test mode first. Set up the same products/prices/webhooks in test mode to validate the flow before going live.

---

## 3. Auth Providers

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) > OAuth Apps > New
2. Application name: `DriftWatch`
3. Homepage URL: `https://driftwatch.dev`
4. Authorization callback URL: `https://driftwatch.dev/api/auth/callback/github`
5. Copy Client ID → `GITHUB_ID`
6. Generate a client secret → `GITHUB_SECRET`

### Email (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain (`driftwatch.dev`)
3. Create an API key → use as `SMTP_PASS`
4. SMTP settings:
   - `SMTP_HOST=smtp.resend.com`
   - `SMTP_PORT=465`
   - `SMTP_USER=resend`

### Auth secret

Generate a random secret for JWT signing:
```bash
openssl rand -base64 32
```
Save as `AUTH_SECRET`.

---

## 4. Deploy the API (Railway)

### Option A: Railway (recommended for simplicity)

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repo or deploy from Docker image
3. If deploying from repo:
   - Set **Root Directory**: `/` (repo root — Dockerfile uses workspace context)
   - Set **Dockerfile Path**: `apps/api/Dockerfile`
   - Railway will auto-detect the Dockerfile
4. Add environment variables (Settings > Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string |
   | `AUTH_SECRET` | Generated secret |
   | `ANTHROPIC_API_KEY` | Your Anthropic key |
   | `STRIPE_SECRET_KEY` | Stripe secret key |
   | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
   | `STRIPE_PRICE_ID_STARTER` | Starter price ID |
   | `STRIPE_PRICE_ID_PRO` | Pro price ID |
   | `SMTP_HOST` | `smtp.resend.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `resend` |
   | `SMTP_PASS` | Resend API key |
   | `EMAIL_FROM` | `DriftWatch <noreply@driftwatch.dev>` |
   | `NEXTAUTH_URL` | `https://driftwatch.dev` |
   | `API_PORT` | `3001` |
   | `NODE_ENV` | `production` |

5. Set **Custom Domain**: `api.driftwatch.dev` (or use Railway's generated domain)
6. Deploy — Railway builds the Docker image and starts the container
7. The `start.sh` script auto-runs `prisma migrate deploy` on every deploy

### Option B: Fly.io

1. Install flyctl: `brew install flyctl`
2. From the repo root:
   ```bash
   fly launch --name driftwatch-api --dockerfile apps/api/Dockerfile --region iad --no-deploy
   ```
3. Set secrets:
   ```bash
   fly secrets set DATABASE_URL="postgresql://..." \
     AUTH_SECRET="..." \
     ANTHROPIC_API_KEY="..." \
     STRIPE_SECRET_KEY="..." \
     STRIPE_WEBHOOK_SECRET="..." \
     STRIPE_PRICE_ID_STARTER="..." \
     STRIPE_PRICE_ID_PRO="..." \
     SMTP_HOST="smtp.resend.com" \
     SMTP_PORT="465" \
     SMTP_USER="resend" \
     SMTP_PASS="..." \
     EMAIL_FROM="DriftWatch <noreply@driftwatch.dev>" \
     NEXTAUTH_URL="https://driftwatch.dev" \
     API_PORT="3001" \
     NODE_ENV="production"
   ```
4. Deploy: `fly deploy`
5. Set custom domain: `fly certs add api.driftwatch.dev`

---

## 5. Deploy the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and import the DriftWatch repo
2. Set **Root Directory**: `apps/web`
3. Vercel auto-detects Next.js — the `vercel.json` handles build/install commands for the monorepo
4. Add environment variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string |
   | `AUTH_SECRET` | Same secret as API |
   | `GITHUB_ID` | GitHub OAuth client ID |
   | `GITHUB_SECRET` | GitHub OAuth client secret |
   | `NEXTAUTH_URL` | `https://driftwatch.dev` |
   | `NEXT_PUBLIC_API_URL` | `https://api.driftwatch.dev/api` |
   | `EMAIL_FROM` | `DriftWatch <noreply@driftwatch.dev>` |
   | `SMTP_HOST` | `smtp.resend.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `resend` |
   | `SMTP_PASS` | Resend API key |

5. Deploy
6. Set custom domain: `driftwatch.dev` in Vercel project settings

**Note**: The web app needs `DATABASE_URL` because NextAuth uses the Prisma adapter to store sessions directly in the database.

---

## 6. Domain and DNS

### Register domain

Register `driftwatch.dev` (or `.io`) at your preferred registrar (Namecheap, Cloudflare, Google Domains).

### DNS records

| Type | Name | Value | Purpose |
|---|---|---|---|
| CNAME | `@` | `cname.vercel-dns.com` | Vercel frontend |
| CNAME | `www` | `cname.vercel-dns.com` | www redirect |
| CNAME | `api` | Railway/Fly.io domain | API backend |

Vercel and Railway/Fly.io will provide the exact CNAME targets during custom domain setup.

### SSL

Both Vercel and Railway/Fly.io provision SSL certificates automatically. No manual configuration needed.

---

## 7. Post-Deploy Verification

Run through this checklist after deploying:

- [ ] `https://api.driftwatch.dev/api/health` returns `{"status":"ok","db":"connected"}`
- [ ] `https://driftwatch.dev` loads the landing page
- [ ] Sign up with GitHub OAuth works
- [ ] Sign up with email magic link works (check email delivery)
- [ ] Dashboard loads after sign-in
- [ ] Add a source (e.g., Stripe changelog) — verify it saves
- [ ] Trigger a manual crawl — verify crawl runs and changes appear
- [ ] Create an alert rule — verify it saves
- [ ] Stripe checkout works (use test card `4242 4242 4242 4242`)
- [ ] Stripe webhook receives events (check Stripe Dashboard > Webhooks > Recent events)
- [ ] Stripe Customer Portal opens from settings page

---

## 8. Google Ads Demand Validation Plan

### Objective

Validate demand for API changelog monitoring with a $200 Google Ads budget before investing in growth.

### Target keywords

| Keyword | Intent | Est. CPC |
|---|---|---|
| `API changelog monitoring` | High — exact problem | $3-8 |
| `API breaking change alerts` | High — exact solution | $3-8 |
| `API dependency tracking` | Medium — broader | $2-5 |
| `API change detection` | Medium — adjacent | $2-5 |
| `monitor API changes` | High — action intent | $3-7 |
| `API deprecation alerts` | High — specific pain | $2-6 |

### Campaign setup

- **Campaign type**: Search
- **Budget**: $200 total, $15-20/day over 10-14 days
- **Bidding**: Maximize clicks (switch to conversions after data)
- **Location**: United States, United Kingdom, Canada, Australia, Germany
- **Ad copy**:
  - Headline 1: `API Breaking Change Alerts`
  - Headline 2: `AI-Powered Changelog Monitoring`
  - Headline 3: `Start Free — 14 Day Trial`
  - Description: `Stop finding out about API changes from your error logs. DriftWatch monitors changelogs and alerts your team before breaking changes hit production.`

### Success metrics

| Metric | Target | Kill signal |
|---|---|---|
| Click-through rate (CTR) | > 2% | < 1% after 1 week |
| Cost per click (CPC) | < $8 | > $15 average |
| Landing page → Sign up | > 5% | < 1% after 50 clicks |
| Sign up → Add source | > 50% | < 20% |
| Total sign-ups from $200 | > 5 | 0 after full spend |

### What "success" means

- 5+ sign-ups from $200 spend = strong signal, increase budget
- 2-4 sign-ups = moderate signal, optimize landing page and ads, run another $200
- 0-1 sign-ups = weak signal, investigate why (bad keywords? bad landing page? no market?)

### Tracking setup

1. Add Google Ads conversion tracking pixel to sign-up success page
2. Track events: page_view (landing), click_signup_cta, signup_complete, first_source_added
3. Use UTM parameters on ad URLs: `?utm_source=google&utm_medium=cpc&utm_campaign=demand_validation`
