# APIDelta V2 — Build Tracker

**Status**: PLANNING — V2 phases scheduled, no code work started
**Created**: 2026-04-28
**Predecessor**: docs/plan.md (MVP), docs/audit-log.md (iteration log), docs/launch-strategy.md (launch playbook)
**Sibling tracker**: docs/TRACKER.md (ML classifier feature, gated by V2 launch)

---

## Why V2 exists

The April 2026 site audit (`docs/audit-log.md`-adjacent feedback) was sharp on two things:

1. **The pricing wedge collapses under inspection.** The "$149-749/mo for text diffing" framing was a strawman — real direct competitors ship at $80/yr (PageCrawl). Cleaned up in the 2026-04-28 credibility triage.
2. **The product as described is buildable in a weekend.** "AI classification" alone is not a moat in mid-2026. The page never says why APIDelta is hard to replace.

V2 builds the moat the audit identified — curated catalog, MCP server, workflow integrations, named competitor compare pages, "why not just build this?" objection handling — and then resets the kill checkpoint against post-V2 metrics, not pre-V2 ones.

The original 2026-05-15 / Day 30 kill checkpoint is **deferred** until V2 ships. New checkpoint criteria are in Phase 4 of this tracker. Decision and reasoning logged in `docs/audit-log.md` (the 2026-04-28 entry to be added during execution).

---

## Decisions locked (2026-04-28 session)

| # | Decision | Notes |
|---|----------|-------|
| 1 | **Name competitors on /compare pages** | Update `launch-strategy.md:571-577` to scope no-naming rule to ads/social/PR only; allow named competitors on `/compare/*` SEO pages. |
| 2 | **New tracker file**, not extension | Existing `docs/TRACKER.md` stays scoped to ML classifier. This file owns V2 product roadmap. |
| 3 | **Leave homepage logo strip as-is** | Stripe / OpenAI / GitHub stay on the page; Phase 0 fixes the parsers within 2 weeks. |

---

## Phase 0 — Fix the credibility crater

**Timeline target**: 1-2 weeks (target end ≈ 2026-05-12)
**Why**: The 2026-04-28 credibility triage put Stripe / OpenAI / GitHub on the homepage logo strip + FAQ + How-It-Works. All three sources are currently disabled in the crawler per `docs/known-issues.md:121-166`. Until parsers ship, the page lies.

### Tasks

- [ ] **Stripe parser** — add Playwright support. Shared fix unlocks GitLab + future SPA changelogs. See `docs/known-issues.md` for context.
- [ ] **GitHub Blog parser** — fix DOM mismatch (entries currently rejected as noise).
- [ ] **OpenAI source** — realistic UA / alternate URL (currently HTTP 403).
- [ ] **AWS RSS** — URL fix (low effort).
- [ ] **SendGrid** — replacement URL (current returns 404).
- [ ] **GitLab parser** — DOM fix (shares Playwright path with Stripe; do as part of 0.1).
- [ ] Update `apps/api/prisma/seed.ts` if catalog seed names changed.

### Files

- `apps/api/src/modules/crawler/parsers/*` — parser additions
- `apps/api/src/modules/crawler/crawler.service.ts` — Playwright integration
- `apps/api/prisma/seed.ts` — seed catalog reconciliation

### Reuse

- Existing Cheerio parser pattern (per the inventoried `crawler/` module)
- Existing CrawlRun audit trail
- Existing dedupe-via-content-hash logic

### Exit criteria

- All 6 previously-disabled sources have a successful CrawlRun in the last 24hr
- Existing 9 working sources (Cloudflare, Slack, Linear, GCP, Twilio, Vercel, Supabase, Prisma, Next.js) remain green
- No regression in classifier pipeline

---

## Phase 1 — Ship the team workflow story

**Timeline target**: 2 weeks (target end ≈ 2026-05-26)
**Why**: Marketing already promises "team ownership" and "alert routing" but the schema is wired without UI. The audit's F7 (integration depth) ranks generic webhooks + GitHub Issues as the highest-leverage workflow additions.

### 1.1 Generic outbound webhooks

Foundation for everything else — once webhooks ship, GitHub Issues, Linear, PagerDuty, Jira become payload-config tasks instead of new transports.

- [ ] Prisma model: `WebhookEndpoint` (teamId, url, secret, events[], active, lastDeliveryAt)
- [ ] Extend `AlertChannel` enum to include `WEBHOOK`
- [ ] New transport: `apps/api/src/modules/alerts/transports/webhook.transport.ts` — mirror `slack.transport.ts` pattern, HMAC-signed payloads
- [ ] Settings UI: `apps/web/src/app/(dashboard)/dashboard/settings/integrations/page.tsx` (does not exist yet)

### 1.2 GitHub Issues integration

- [ ] New transport: `github.transport.ts`
- [ ] PAT-based auth for MVP; OAuth deferred to V3
- [ ] Settings: GitHub repo connection + label config + severity gating (default: critical/high only)

### 1.3 Team invite flow

- [ ] API endpoints: invite/accept (reuse NextAuth email magic link)
- [ ] Replace "Coming Soon" stub at `/(dashboard)/dashboard/settings`
- [ ] Per-tier seat enforcement already exists via `PLAN_LIMITS` in `billing.service.ts` — wire UI only

### Reuse

- `slack.transport.ts` pattern for new transports
- NextAuth email provider for invite flow
- `PLAN_LIMITS` guard for seat enforcement

### Exit criteria

- 1 test team can self-serve add a webhook + a GitHub repo connection + invite a 2nd member
- All three integration types fire on a real critical-severity alert end-to-end

---

## Phase 2 — Build the moat

**Timeline target**: 3 weeks (target end ≈ 2026-06-16)
**Why**: Audit findings F14 (AI classification is no longer a moat), F15 (no MCP / IDE integration), F18 (the product is buildable in a weekend), F19 (no curated catalog). Phase 2 builds the three things a weekend script can't replicate.

### 2.1 Curated API catalog (`/catalog`) — F19

The single biggest moat available — the data work nobody else has done.

- [ ] Prisma model: `CatalogEntry` (slug, name, logoUrl, changelogUrl, parser, tags[], status)
- [ ] Seed 30+ entries at Phase 2 start
- [ ] Target 100+ entries before V2 launch
- [ ] Public marketing page: `apps/web/src/app/catalog/page.tsx` — searchable, tag-filterable
- [ ] Onboarding flow change: `/dashboard/sources/new` becomes "search catalog" first, "paste URL" fallback

**Sub-task**: compile catalog seed list. Leverage existing CrawlRun history + manual research. Track the URL list as a separate sub-issue inside this phase.

### 2.2 MCP server — F15 (30-day window before table stakes)

PageCrawl already ships an MCP server. Closing this gap is time-sensitive.

- [ ] New module: `apps/api/src/modules/mcp/`
- [ ] Tools: `list_sources`, `recent_changes`, `search_changelog_entries`, `get_alert_history`
- [ ] Auth: per-team API key
- [ ] Marketing docs page: `apps/web/src/app/docs/mcp-setup/page.tsx`
- [ ] Claude Desktop config example in docs

### 2.3 "Why not just build this?" — F18

Pre-empts the most common dev-tool objection.

- [ ] Decide: section on homepage **or** new `/why-not-build` page (section is faster; page has SEO benefit). Default to section unless SEO opportunity is compelling at execution time.
- [ ] Content angles: format drift maintenance, classifier degradation as LLM models change, audit trail / multi-tenant security work, the curated catalog (F19) as the one thing a weekend script can't replicate

### Exit criteria

- `/catalog` live with 100+ entries indexed and searchable
- MCP server published with at least 1 working Claude Desktop integration
- "Why not build this?" content live and linked from homepage

---

## Phase 3 — Pricing + named-competitor compare

**Timeline target**: 1 week (target end ≈ 2026-06-23)
**Why**: Audit findings F3 (pricing tiers identical), F16 (compare pages dodge real competitors), F20 (pricing confused about who the buyer is). Phase 3 captures mid-market and high-intent evaluation traffic.

### 3.1 New pricing tiers

| Tier | Price | APIs | Members | Channels | Differentiators |
|------|-------|------|---------|----------|-----------------|
| Starter | $49 | 10 | 2 | Email + Slack | (existing) |
| **Team** | **$199** | **50** | **10** | Email + Slack + Webhooks + GitHub Issues | audit log export |
| **Business** | **Contact us** | Unlimited | Unlimited | All + custom | SSO/SAML placeholder, priority support |

- [ ] Update `PLAN_LIMITS` in `apps/api/src/modules/billing/billing.service.ts`
- [ ] Update `PLANS` array in `apps/web/src/app/page.tsx`
- [ ] Create Stripe price IDs for Team and Business tiers, add to env
- [ ] Update FAQ + use-case page pricing teasers if they reference tier counts

**Prerequisite**: user creates Stripe price IDs before this phase ships.

### 3.2 Named competitor compare pages (decision: name them)

- [ ] `/compare/apidelta-vs-pagecrawl/page.tsx`
- [ ] `/compare/apidelta-vs-visualping/page.tsx`
- [ ] `/compare/apidelta-vs-api-drift-alert/page.tsx`
- [ ] Honest tables — where competitor is cheaper/better, say so; where APIDelta wins (curated catalog, MCP, AI tuned for changelogs specifically), prove it
- [ ] Each page closes with a real changelog entry classified by APIDelta and the competitor side-by-side (audit F25)
- [ ] Update `_components/seo-page-shell.tsx` `SeoInternalLinks` to include the new compare pages

**Policy update** (already noted as locked decision):
- [ ] Edit `docs/launch-strategy.md:571-577` to scope no-naming rule to ads/social/PR; explicitly permit named competitors on `/compare/*`
- [ ] Source: `docs/competitive-teardown.md` already names PageCrawl / Visualping / API Drift Alert / oasdiff and has pricing data on lines 25-33, 87-93, 138-140

### Exit criteria

- 3 named compare pages live, indexed in sitemap, linked from footer
- Pricing page shows 3 tiers
- Stripe checkout works end-to-end for Team tier (Business is "Contact us" — no checkout)

---

## Phase 4 — Reset the kill checkpoint (atomic with V2 launch)

**Timeline target**: V2 launch day (estimated ≈ 2026-06-25 if Phases 0-3 hit their targets)
**Why**: The May 15 checkpoint is now obsolete. The new checkpoint must be tied to V2 differentiation, not pre-V2 metrics.

### New post-V2 checkpoint criteria

Day 30 from V2 launch (≈ 2026-07-25 if launch is 2026-06-25):

| Metric | Survival Floor | Healthy Signal |
|--------|----------------|----------------|
| Website visitors / week | > 500 | > 1,500 |
| Free trial signups (cumulative) | > 10 | > 30 |
| Paying customers (any tier) | > 2 | > 5 |
| MRR | > $98 (1 Team or 2 Starter) | > $300 |
| Catalog page visits / week | > 100 | > 500 |
| MCP integrations connected (any team) | > 1 | > 5 |

### Decision framework (Day 30 post-V2 launch)

- **>2 paying customers + healthy MRR**: Continue. Optimize the highest-converting V2 surface.
- **>10 trials + 0-1 customers**: Activation/onboarding problem — survey trial users, prioritize the curated catalog UX.
- **<10 trials from >500 visitors/week**: Landing-page problem — re-run the credibility audit against the V2 surface.
- **<500 visitors/week**: Distribution problem — V2 didn't move the needle on traffic, reassess the channel mix.
- **Hard kill criteria**: $0 MRR after 60 days post-V2 launch with consistent marketing effort → reassess product-market fit and consider Phase 5 (full pivot or sunset).

### Tasks for Phase 4

- [ ] Set Phase 4 kickoff date (V2 launch day)
- [ ] Run launch playbook (use `docs/launch-strategy.md` Phases 1-3, skip the 30-Day Targets block — it has been replaced)
- [ ] Update `docs/launch-strategy.md` Success Metrics block with the new criteria
- [ ] Update `/Users/jobeloquintero/Repos/solo/CLAUDE.md` "Current Revenue Strategy" item 3 with new dates
- [ ] Update this tracker's Status header to BUILDING → POST-LAUNCH

---

## Risks

| Risk | Mitigation |
|------|------------|
| Phase 0 parsers slip past 2 weeks | If Stripe/GitHub/OpenAI not green by 2026-05-12, revert homepage logo strip to working sources only (Cloudflare/Linear/Supabase/GCP) until they ship. Documented as fallback. |
| MCP becomes table stakes before Phase 2.2 ships | Prioritize 2.2 inside Phase 2 (do it first within the phase). |
| Catalog seed compilation drags | Set hard target of 30 entries to start Phase 2.1 publicly; expand to 100 over the phase, not before it begins. |
| Stripe price IDs not created in time for Phase 3.1 | Surface this as a hard prerequisite before Phase 3 starts; user owns. |
| Competitor naming policy update sparks legal concern | Comparison pages must use only public information (pricing pages, public docs). No private/leaked data. Honest tables that acknowledge competitor strengths reduce trademark risk. Standard practice (Notion vs Evernote, Linear vs Jira). |
| ML classifier feature (sibling TRACKER.md) gets staffed before V2 ships | Keep the gating relationship clear: ML classifier waits for V2 launch + post-V2 checkpoint. |
| 7-8 week V2 timeline slips meaningfully | Re-evaluate at end of Phase 1; if Phase 0 + 1 took >5 weeks, scope-cut Phase 2 (drop 2.3, ship 2.1 + 2.2 only) rather than push the launch. |

---

## Open items (not blocking, but actively tracked)

- **Stripe price IDs** for Team $199 / Business — needed before Phase 3.1 ships.
- **Catalog seed compilation** — research sub-task to assemble 100+ changelog URLs.
- **`apps/web/src/app/(dashboard)/dashboard/settings/integrations/`** does not exist yet — Phase 1.1 creates it.
- **`docs/TRACKER.md` (ML classifier)** — its `Gated by` line is being updated in this same session to reference V2 launch instead of May 15.

---

## Iteration log

### 2026-04-28 — V2 plan created

**Done**:
- Site audit reviewed; key findings: F1 (no trust signals), F2 (AI told not shown), F13 (pricing wedge collapses), F15 (no MCP), F16 (compare pages dodge real competitors), F18 (no "why not build it"), F19 (no curated catalog).
- Credibility-only triage shipped earlier same day: dropped $149-749 strawman, softened unsourced 4hr stat, fixed cross-page inconsistencies, added team-member counts to pricing cards, "Flexible Alert Routing" → "Team Ownership" feature card, expanded logo strip with dev-pain names (Stripe / OpenAI / GitHub / Twilio / Cloudflare / Slack / Vercel / Prisma).
- V2 plan approved with 4 phases + new post-V2 checkpoint.
- May 15 kill checkpoint deferred — coordinated edits to launch-strategy.md, plan.md, TRACKER.md, parent solo CLAUDE.md.
- Decisions locked: name competitors on /compare, new tracker file (this one), leave homepage logos pending Phase 0 parser fixes.

**Next session**: Phase 0 — start with Stripe Playwright integration (highest-impact parser fix; shared work unlocks GitLab + other SPA changelogs).
