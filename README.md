# DriftWatch

> Stop finding out about breaking API changes from your error logs.

DriftWatch monitors third-party API changelogs and uses AI to classify changes as breaking, deprecation, or informational. When something matters, it alerts your team via Slack, email, or webhook — before it hits production.

## The Problem

Engineering teams depend on dozens of third-party APIs (Stripe, Twilio, SendGrid, etc.). When these APIs ship breaking changes, teams find out the hard way: production errors, failed integrations, and 2 AM pages. Manually checking changelogs doesn't scale.

## How It Works

1. **Add your API dependencies** — paste changelog URLs or pick from our catalog
2. **We crawl and classify** — scheduled crawls + AI-powered breaking change detection
3. **Get alerted** — Slack, email, PagerDuty, or webhook. Only when it matters.

## Tech Stack

- Next.js + NestJS + TypeScript (monorepo with pnpm workspaces)
- Prisma + PostgreSQL
- Anthropic Claude for AI classification
- Bull + Redis for job scheduling
- Stripe for billing

## Status

Planning phase. See `docs/plan.md` for the build roadmap.
