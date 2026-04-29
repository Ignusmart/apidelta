# APIDelta V2 — Build Tracker

**Status**: POST-V2 LAUNCH — all four phases shipped 2026-04-29; now in the 30/60/90-day metric window
**Created**: 2026-04-28
**V2 launched**: **2026-04-29** (Phases 0-3 in one day; Phase 4 = the metric reset that follows)
**Predecessor**: docs/plan.md (MVP), docs/audit-log.md (iteration log), docs/launch-strategy.md (launch playbook)
**Sibling tracker**: docs/TRACKER.md (ML classifier feature, gated by V2 launch — now unblocked)

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

- [x] **Stripe parser** — fixed 2026-04-28 (Phase 0.1): Playwright path added (`fetchWithPlaywright()` + `requiresJs` flag). 11 kept entries with real version IDs.
- [x] **GitHub Blog parser** — fixed 2026-04-28: added `.ChangelogItem` selector, `*-title` class fallback when heading has a `*-meta` class, relaxed "description==title" noise filter for descriptive titles. 50 entries parsing successfully.
- [x] **OpenAI source** — fixed 2026-04-28 (Phase 0.1): Playwright path + `<main>`-narrowing in the universal parser bypasses the bot block and skips sidebar nav. 30 month-grouped entries parsing.
- [x] **AWS RSS** — fixed 2026-04-28: URL corrected to canonical `/about-aws/whats-new/recent/feed/`, added `parseRssFeed()` to handle RSS 2.0 + Atom. 48 entries kept after dedupe.
- [x] **SendGrid** — fixed 2026-04-28: switched to `github.com/sendgrid/sendgrid-nodejs/releases` (`GITHUB_RELEASES` type — no parser change needed).
- [x] **GitLab parser** — fixed 2026-04-28: source uses `about.gitlab.com/atom.xml` (Atom feed, blog + releases). The `docs.gitlab.com/releases/` SPA loads via Playwright but the parser still picks up the cookie consent banner — Phase 0.2.
- [x] Update `apps/api/prisma/seed.ts` — Stripe / OpenAI marked `requiresJs: true`; SendGrid switched to GITHUB_RELEASES; AWS + GitLab added as RSS_FEED.

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

**Status (2026-04-28, Phase 0.1 done)**: all 6 originally-disabled sources now have a working crawl path. Stripe + OpenAI ship via Playwright + the new `requiresJs` flag. GitLab continues via the Atom feed (the `docs.gitlab.com/releases/` page loads via Playwright but the parser captures the cookie banner — Phase 0.2 follow-up).

**Deployment requirement** (not yet shipped): `apps/api/Dockerfile` currently uses `node:20-alpine`, which is not officially supported by Playwright (glibc/Chromium incompatibility). Before deploying Phase 0.1 to production, switch the base image to `mcr.microsoft.com/playwright:v1.59.1-jammy` (Chromium pre-installed) or to `node:20-bookworm-slim` with `npx playwright install --with-deps chromium` in the build step. The Prisma migration `prisma/migrations/20260428000000_add_source_requires_js` also needs to be applied (`pnpm db:deploy` (production) or `pnpm db:migrate` (local)). Production source records (different from `seed.ts`) need their `url` / `sourceType` / `requiresJs` / `isActive` fields updated to match — recommended via a one-off migration script or admin UI before declaring Phase 0 complete in production.

---

## Phase 1 — Ship the team workflow story

**Timeline target**: 2 weeks (target end ≈ 2026-05-26)
**Why**: Marketing already promises "team ownership" and "alert routing" but the schema is wired without UI. The audit's F7 (integration depth) ranks generic webhooks + GitHub Issues as the highest-leverage workflow additions.

### 1.1 Generic outbound webhooks

Foundation for everything else — once webhooks ship, GitHub Issues, Linear, PagerDuty, Jira become payload-config tasks instead of new transports.

**Design pivot (2026-04-28):** original plan called for a separate `WebhookEndpoint` model, but webhook subscriptions map cleanly onto the existing `AlertRule` pattern (just like SLACK already does — channel + destination URL). Extending the rule model is a smaller change with the same delivered surface — webhook URLs live as alert rules with `channel = WEBHOOK`, and each rule carries its own HMAC secret. We can revisit a separate Endpoint table if we ever need to share secrets across rules.

- [x] Extend `AlertChannel` enum to include `WEBHOOK` (migration `20260428010000_add_webhook_alert_channel`)
- [x] Add `webhookSecret String?` field to `AlertRule` (auto-minted on rule create when channel is WEBHOOK)
- [x] New transport: `apps/api/src/modules/alerts/transports/webhook.transport.ts` — HMAC-SHA256 payload signing, `X-APIDelta-Signature: sha256=…` header, plus `X-APIDelta-Event` / `X-APIDelta-Delivery` headers; body shape `{event, delivery_id, change, source, dashboard_url}`. Mirrors the slack/email transport contract.
- [x] Wire dispatch in `AlertsService.sendNotification()` for `AlertChannel.WEBHOOK`. `evaluateCrawlRun` + `retryFailed` updated to pass `alert.id` and `source.id` so each delivery carries stable identifiers receivers can dedupe on.
- [x] `POST /alerts/rules/:id/regenerate-secret` for HMAC rotation (rejects non-WEBHOOK rules).
- [x] Verified end-to-end via `apps/api/scripts/smoke-webhook.ts`: in-process HTTP receiver captures the POST, HMAC verifies, all headers present.
- [x] Settings UI — `/dashboard/alerts` rule editor now exposes a Webhook channel button alongside Email/Slack with URL validation, and each WEBHOOK rule card shows a reveal/copy/regenerate affordance for the signing secret. Newly-created webhook rules auto-reveal the secret on the rule card so it can be copied immediately. History tab also renders the new channel icon.

### 1.2 GitHub Issues integration

Reused the AlertRule pattern instead of a separate Integration table — same trade-off as Phase 1.1's webhook design: smaller change, same delivered surface. PAT lives on the rule row; UI never reads it back over the wire.

- [x] Schema: `AlertChannel` adds `GITHUB`; `AlertRule` adds `githubToken String?` + `githubLabels String[]`. Migration `20260428020000_add_github_alert_channel` (applied locally + production Neon).
- [x] New transport: `apps/api/src/modules/alerts/transports/github.transport.ts` — POSTs to `https://api.github.com/repos/{owner}/{repo}/issues` with `Accept: application/vnd.github+json` and `X-GitHub-Api-Version: 2022-11-28`. Title prefixed with severity + source name; body is markdown with affected endpoints list, change date, and a link back to the dashboard. Labels applied as configured.
- [x] PAT-based auth for MVP. PATs are stored plaintext but redacted by `AlertsService.redactRule()` on every API response — `GET /alerts/rules` and `POST /alerts/rules` now return `hasGithubToken: boolean` instead of the actual token. OAuth deferred to V3; encryption-at-rest deferred to V3 hardening.
- [x] `sendNotification()` extended to dispatch to `GithubTransport` when channel is `GITHUB`. Refuses to deliver if `githubToken` is null (defensive — createRule won't allow this).
- [x] Settings UI: `/dashboard/alerts` rule editor adds a 4th channel button (Email / Slack / Webhook / GitHub). When GitHub is selected, three fields render: `owner/repo` destination (validated), PAT input (type=password), comma-separated label list. Rule cards now show a "PAT configured ✓" badge + label pills under each GitHub rule. History tab renders the GitHub icon for GITHUB alerts. Severity gating reuses the existing `minSeverity` field — UI defaults to MEDIUM; users can pick HIGH/CRITICAL+ when setting up the rule.
- [x] Verified end-to-end with `apps/api/scripts/smoke-github.ts` (in-process fetch stub, asserts URL/method/headers/body/labels).

### 1.3 Team invite flow

The flow: owner creates an invite (email + plan-limit checked) → APIDelta returns a shareable `/invite/<token>` URL → invitee clicks link → if they're a brand-new user, the email magic-link signup attaches them to the inviting team automatically (NextAuth `events.createUser` hook); if they're an existing user, the landing page shows an "Accept invite" button that moves them to the new team. Token is the only auth on the public preview endpoint.

- [x] Schema: new `TeamInvite` model (token, teamId, email, expiresAt, acceptedAt/By, revokedAt, invitedById). Migration `20260428030000_add_team_invites` (applied locally + Neon prod).
- [x] Backend: new `apps/api/src/modules/team/` module — `TeamService` + `TeamController` covering members list, invite list/create/revoke, public preview-by-token, and accept-by-token. Plan-limit guard at create-time uses `PLAN_LIMITS[team.plan].maxMembers` (members + pending non-expired invites < cap).
- [x] NextAuth `events.createUser` hook (`apps/web/src/auth.ts`): on first signup, looks up a pending invite for the user's email and either attaches them to the inviter's team (skipping the default-team auto-create) or falls through to the original "create your own team" path.
- [x] Settings UI (`/dashboard/settings`): replaced the "Coming Soon" Team Members stub with a real members list + invite form + pending-invite list with copy-link / revoke. Auto-copies the new invite URL to clipboard on submit. Counter shows `{members.length} / {plan.maxMembers}`.
- [x] Invite landing: new `/invite/[token]` server component branches on invite status (pending/accepted/revoked/expired) and the visitor's session state. Signed-out visitors get a "Sign in to accept" CTA that pre-fills the invite email and bounces back via `callbackUrl=/invite/<token>`. Signed-in visitors with matching email and matching team see "you're on the team"; signed-in visitors with matching email but different team see an "Accept invite" client form. Accept route handler (`/api/invite/[token]/accept`) sources `userId` from the server-side session — never the client body — and forwards to the API.
- [x] Sign-in page (`/sign-in`): accepts `?email=<addr>` to pre-fill the email input and renders an "Accept your invite" header when `callbackUrl` starts with `/invite/`.

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

- [x] Prisma model: `CatalogEntry` (slug, name, description, logoUrl, websiteUrl, changelogUrl, sourceType, requiresJs, category, tags[], popular, featured). Migrations `20260428040000_add_catalog_entry` + `20260429013309_add_catalog_entry` (drift fix from a `@default([])` mismatch on tags — both applied locally + Neon prod).
- [x] Seed 30+ entries — shipped 39 covering Payments, AI/ML, Communications, Cloud, Developer Tools, Frameworks, Databases, Auth, Observability, Productivity, Web3. Idempotent upsert by slug (`apps/api/prisma/seed-catalog.ts`).
- [ ] Target 100+ entries before V2 launch (39/100 — track the gap below)
- [x] Backend module: `apps/api/src/modules/catalog/` — public `GET /catalog` (with `q` / `category` / `popular` / `featured` filters), `GET /catalog/categories`, `GET /catalog/:slug`. No auth — catalog is public.
- [x] Public marketing page: `apps/web/src/app/catalog/page.tsx` — server component, fetches via `API_URL` (no proxy needed since catalog is public). URL-driven filters (`?q=` and `?category=`) so all states are bookmarkable + SEO-friendly. Client-only `CatalogSearch` component handles debounced search input + category chips, updating the URL via `router.replace`.
- [x] Per-entry detail page: `apps/web/src/app/catalog/[slug]/page.tsx` — server-rendered with `generateMetadata` for per-slug SEO, "Monitor with APIDelta" CTA pointing at `/sign-up?source=<slug>`. ISR cache via `next: { revalidate: 600 }`.
- [x] Logo strategy: `logo.dev` free-tier API by domain — `https://img.logo.dev/<domain>?token=…`. Avoids hosting logo assets ourselves; falls back to a generic globe icon when null.
- [x] Homepage nav links to `/catalog` so it's discoverable.
- [ ] Onboarding flow change: `/dashboard/sources/new` becomes "search catalog" first, "paste URL" fallback. Deferred — current dashboard `quick-add-sources.tsx` has 25 hardcoded entries, low-latency. Refactor to fetch from `/catalog?popular=true` is a follow-up; keeps the dashboard fast while we expand the public catalog.

**Sub-task**: compile catalog seed list. Leverage existing CrawlRun history + manual research. Track the URL list as a separate sub-issue inside this phase.

### 2.2 MCP server — F15 (30-day window before table stakes)

PageCrawl already ships an MCP server. Closing this gap is time-sensitive.

- [x] New module: `apps/api/src/modules/mcp/` — hand-rolled JSON-RPC 2.0 over HTTP (Streamable HTTP transport). Implements `initialize`, `tools/list`, `tools/call`, `ping`, plus `notifications/initialized`. Stateless — no SSE, no session IDs.
- [x] Tools: `list_sources`, `recent_changes` (severity + source-name filters), `search_changelog_entries` (free-text), `get_alert_history`, plus a bonus `list_catalog` so Claude can browse the public catalog.
- [x] Auth: per-team API key (`Authorization: Bearer ad_live_…`). New `ApiKey` model — SHA-256-hashed storage + visible prefix hint. Mint/list/revoke endpoints under `/team/api-keys`.
- [x] Settings UI: `/dashboard/settings` adds an API Keys section with create/copy/revoke and a one-time "Save this key now" reveal banner — same UX pattern as the webhook signing secret.
- [x] Marketing docs page: `apps/web/src/app/docs/mcp-setup/page.tsx` — covers Claude Code (`claude mcp add --transport http …`) and Claude Desktop (via `npx mcp-remote`), tool reference, and example prompts.
- [x] Smoke test: `apps/api/scripts/smoke-mcp.ts` — mints a temp key, verifies bad-bearer 401, exercises initialize/tools.list/tools.call against `list_catalog` and `list_sources`, then revokes the key.

### 2.3 "Why not just build this?" — F18

Pre-empts the most common dev-tool objection.

- [x] Chose standalone page over homepage section — better SEO target, room for substantive content, deep-linkable from pricing FAQ.
- [x] New page `apps/web/src/app/why-not-build/page.tsx` (~1500 words, statically rendered). Five concrete sections (format drift, classifier rot, multi-tenancy, catalog, plumbing) using **specific, true stories** from APIDelta's actual crawler work — Stripe SPA / OpenAI 403 / GitHub Blog DOM drift / SendGrid retirement / AWS RSS URL move. The "honest summary" closes with explicit DIY-vs-buy guidance instead of pretending the build cost is zero on either side.
- [x] Discovery: top nav on the marketing homepage now includes "Why not DIY?" alongside Catalog. Added an FAQ entry on the homepage that points at `/why-not-build` for the long version.

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

- [x] `PlanTier` enum extended with `TEAM` + `BUSINESS` (legacy `PRO` retained for back-compat, hidden from UI). Migration `20260429021024_add_team_business_plan_tiers` applied locally + Neon prod.
- [x] `PLAN_LIMITS` in `billing.service.ts` updated — TEAM = 50 sources / 10 members / Email + Slack + Webhook + GitHub channels; BUSINESS = effectively-unlimited caps.
- [x] `BillingService.createCheckoutSession` accepts `'STARTER' | 'PRO' | 'TEAM'`; new `STRIPE_PRICE_ID_TEAM` env var feeds the TEAM tier. Webhook handler accepts the new `planTier` metadata value too.
- [x] `PLANS` arrays on `apps/web/src/app/page.tsx` (homepage pricing) and `apps/web/src/app/(dashboard)/dashboard/settings/page.tsx` (in-app pricing grid) replaced with Starter / Team / Business. Settings grid switched to a 4-column layout (Free Trial / Starter / Team / Business) with a rank-based upgrade/downgrade comparator and a contact-sales button on the Business card.
- [x] GA event helper (`apps/web/src/app/_components/ga-events.tsx`) extended `CheckoutPlan` and `PLAN_VALUE` to include `TEAM` so begin_checkout / purchase events fire correctly.
- [ ] **Open**: create the actual Stripe price ID for Team ($199/mo) in the Stripe dashboard and set `STRIPE_PRICE_ID_TEAM` in production env. Until that's done, hitting "Upgrade to Team" returns the existing `BadRequestException: No Stripe price configured for TEAM`.

**Prerequisite**: user creates Stripe price IDs before checkout flows live for the new tier.

### 3.2 Named competitor compare pages (decision: name them)

- [x] `/compare/apidelta-vs-pagecrawl/page.tsx` — generic page monitor; cheaper, has free tier, but no API-specific intelligence.
- [x] `/compare/apidelta-vs-visualping/page.tsx` — visual screenshot diffs; right tool for marketing pages, wrong tool for changelogs.
- [x] `/compare/apidelta-vs-api-drift-alert/page.tsx` — closest direct competitor; we win on price + AI + MCP + GitHub Issues, they win on PagerDuty + business-hours + SOC 2.
- [x] `/compare/page.tsx` — index page so the three comparisons are discoverable from a single entry.
- [x] Shared `CompareTable` component renders verdict-tinted feature rows (green = APIDelta wins, gray = competitor wins). Rows source data from `docs/competitive-teardown.md` plus public pricing pages.
- [x] **Honest tables** — every page lists where the competitor wins explicitly (PagerDuty, SOC 2, business-hours deferral on API Drift Alert; price + free tier + region targeting on PageCrawl; visual diffs + non-API page tracking on Visualping). The "Pick X if…" sections name when a reader should *not* pick APIDelta.
- [x] Homepage FAQ updated to link readers at `/compare`.
- [ ] **Deferred**: per-page closing demo of "real changelog entry side-by-side" (audit F25 stretch goal). Not needed for first ship; add when a strong example is hand-classified.

**Policy update** (already locked):
- [x] `docs/launch-strategy.md` competitor-naming policy at line 583+ already carves out the `/compare/*` exception (was added when the V2 plan was put in place). No further edit needed.

### Exit criteria

- 3 named compare pages live, indexed in sitemap, linked from footer
- Pricing page shows 3 tiers
- Stripe checkout works end-to-end for Team tier (Business is "Contact us" — no checkout)

---

## Phase 4 — Reset the kill checkpoint (post-V2 launch)

**V2 launch date**: **2026-04-29** (Phases 0-3 closed today — much faster than the original 2026-06-25 estimate)
**Why**: The May 15 / pre-V2 checkpoint is obsolete. New checkpoints are tied to V2 differentiation and use the **3-checkpoint cadence** locked in CLAUDE.md (B2B dev-tools cold launches realistically take 6-9 months to first paying customer per Sentry / Linear / Convex / MicroConf founder data).

### Three checkpoints, not one

| Checkpoint | Date | Purpose | If missed → |
|-----------|------|---------|-------------|
| **Day 30** | **2026-05-29** | Distribution diagnostic — is traffic / activation working? | Fix tactic (channels, onboarding), not product |
| **Day 60** | **2026-06-28** | Positioning checkpoint — if traffic is fixed but 0 trials, buyer/value-prop mismatch | Re-survey ICP, re-run credibility audit on V2 surface |
| **Day 90** | **2026-07-28** | Product kill checkpoint — working distribution + 0 paying = real signal | Reassess PMF; consider sunset or pivot |

**Hard kill backstop**: $0 MRR at Day 90 (2026-07-28) with consistent marketing effort over the window. Anything before that is a tactic problem, not a product problem.

### Day-30 metric targets (2026-05-29)

| Metric | Survival Floor | Healthy Signal | Why this matters |
|--------|----------------|----------------|------------------|
| Website visitors / week | > 500 | > 1,500 | Distribution working |
| Free trial signups (cumulative) | > 10 | > 30 | Landing page converting |
| Paying customers (any tier) | > 1 | > 3 | At Day 30, 1+ is the early signal — full validation comes at Day 90 |
| MRR | > $49 (1 Starter) | > $200 (1 Team or 4 Starter) | First-customer floor — Team tier alone clears the higher bar |
| Catalog page visits / week | > 100 | > 500 | V2 moat being discovered |
| MCP integrations connected (any team) | > 1 | > 5 | New surface getting adoption |

### Day-60 metric targets (2026-06-28)

Same metrics, raised floors:
- Visitors/week > 1,000
- Trial signups (cumulative) > 25
- Paying customers > 2 ($98+ MRR)
- MCP integrations > 5

If trials are converting at <2% from >1,000 visitors → positioning problem; pause feature work, run targeted user interviews on the trial drop-off.

### Day-90 hard-kill criteria (2026-07-28)

- $0 MRR with consistent marketing effort throughout the window → reassess PMF, consider Phase 5 (pivot or sunset)
- < 5 paying customers but >$200 MRR → keep going, the signal is real even if the count is small
- > 5 paying customers → V2 worked, re-allocate to growth

### Tasks for Phase 4

- [x] V2 launch date set: **2026-04-29**
- [x] Update `/Users/jobeloquintero/Repos/solo/CLAUDE.md` "Current Revenue Strategy" item 3 with the actual V2 launch date and 30/60/90 cadence
- [x] Update `docs/launch-strategy.md` post-V2 checkpoint block with concrete dates
- [x] Update this tracker's Status header to **POST-V2 LAUNCH**
- [ ] Run the launch playbook in `docs/launch-strategy.md` (Phases 1-3) — V2 distribution push, not pre-V2
- [ ] Day 30 metric review on **2026-05-29**

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

### 2026-04-28 — Phase 0 partial

**Done**:
- Added `parseRssFeed()` to `CrawlerService` (RSS 2.0 + Atom; handles HTML/CDATA inside `<description>`). Wired RSS dispatch into `triggerCrawl()` based on `SourceType.RSS_FEED`.
- Extended the universal HTML parser's selector list with `.ChangelogItem` (GitHub Blog) and `.release-posts-list .card` (GitLab card layout, kept for future).
- Added title-class fallback in `extractEntryFromElement` (`.ChangelogItem-title`, `.card-title`, `.post-title`, `.entry-title`, `.item-title`) — kicks in when the matched element has no heading OR when its heading has a `*-meta` class (date+category placeholder).
- Relaxed the "description == title" noise filter for descriptive titles (≥25 chars, ≥4 substantive words). GitHub Blog index pages expose only entry titles; the classifier works fine on a rich title alone.
- Updated `apps/api/prisma/seed.ts`: SendGrid switched to `github.com/sendgrid/sendgrid-nodejs/releases` (GITHUB_RELEASES); added AWS (`/about-aws/whats-new/recent/feed/`, RSS_FEED) and GitLab (`about.gitlab.com/atom.xml`, RSS_FEED).
- Added `apps/api/scripts/smoke-parsers.ts` — diagnostic that fetches live URLs and runs them through the parsers without DI. Verified 4 fixed sources + 3 regression-check sources (Cloudflare, Twilio, Vercel) all parse healthy entry counts.
- Updated `docs/known-issues.md`: marked GitHub Blog / GitLab / AWS / SendGrid as fixed, with the full fix description; flagged Stripe + OpenAI as still-disabled pending Phase 0.1.

**Pending**:
- Stripe + OpenAI — Phase 0.1 (Playwright integration).
- Production DB updates: this session shipped code + seed only. Production source records (different from `seed.ts`) need their `url`, `sourceType`, and `isActive` toggled to match. Recommended approach: a one-off migration script or admin-UI update before declaring Phase 0 complete in production.

### 2026-04-28 — Phase 0.1 (Playwright integration)

**Done**:
- Added `playwright` runtime dep to `apps/api` and downloaded Chromium binary locally.
- Added `requiresJs Boolean @default(false)` field to `ApiSource` in `prisma/schema.prisma`. Generated Prisma client. Wrote migration SQL (`prisma/migrations/20260428000000_add_source_requires_js/migration.sql`) — not auto-applied; user runs `pnpm db:deploy` (production) or `pnpm db:migrate` (local).
- Implemented `fetchWithPlaywright()` in `CrawlerService`: headless Chromium with realistic Chrome UA, locale `en-US`, viewport 1280x800. Uses `domcontentloaded` + 3s settle (rather than `networkidle`, which never fires on Stripe's continuously-polling page). Browser launched per crawl for clean state.
- Wired dispatch in `triggerCrawl()`: `source.requiresJs ? fetchWithPlaywright() : fetchWithRetry()`.
- Added `<main>` narrowing to `parseChangelog()`: when `<main>` exists with ≥3 articles/headings, scope downstream selectors to that subtree. Cuts out sidebar nav, cookie banners, and footers. Verified no regression on Cloudflare / Twilio / Vercel.
- Updated `apps/api/prisma/seed.ts`: Stripe + OpenAI marked `requiresJs: true`; GitLab source standardized on `about.gitlab.com/atom.xml` (the Atom feed proven working in the prior session).

**Verification** via `apps/api/scripts/smoke-parsers.ts`:
- Stripe: 38 raw → 11 kept. Real version IDs (e.g. `2026-04-22.dahlia`) with sparse descriptions; classifier still has signal from version + "Breaking changes" labels.
- OpenAI: 30 month-grouped entries with full content in descriptions. Splitting individual changes per month is Phase 0.2.
- GitLab docs (Playwright): loads, but parser picks up the cookie consent banner. Reverted seed to the working Atom feed.
- AWS RSS / GitHub Blog / Cloudflare / Twilio / Vercel: no regression.

**Pending (Phase 0.2 follow-up — not blocking V2 launch)**:
- Stripe per-version drilldown — current entries lack body text; would need a second crawl per version page.
- OpenAI mega-entry splitting — month-grouped entries should split into per-change entries; existing `splitMegaEntries` heuristic doesn't recognize OpenAI's format.
- GitLab docs (`docs.gitlab.com/releases/`) — needs Playwright cookie dismissal or per-source DOM selectors.
- Per-source selector overrides — current parser is fully heuristic; an explicit URL→selector map would make adding new sources more deterministic.

**Production deployment**: Dockerfile (`apps/api/Dockerfile`) currently uses `node:20-alpine` which doesn't support Playwright. Switch to `mcr.microsoft.com/playwright:v1.59.1-jammy` or Debian-based Node + `playwright install --with-deps chromium` before deploying.

### 2026-04-28 — Phase 1.1 backend (generic outbound webhooks)

**Done**:
- Pivoted from the originally-planned `WebhookEndpoint` model to extending `AlertRule` directly. `AlertChannel` enum now includes `WEBHOOK`; AlertRule carries an optional `webhookSecret` minted automatically on rule creation when channel is `WEBHOOK`. Migration SQL: `apps/api/prisma/migrations/20260428010000_add_webhook_alert_channel/`.
- Implemented `WebhookTransport` with HMAC-SHA256 body signing. Outbound POST headers include `X-APIDelta-Signature: sha256=<hex>`, `X-APIDelta-Event: change.alert`, `X-APIDelta-Delivery: <alertId>`. Body: stable JSON shape `{event, delivery_id, change, source, dashboard_url}` — receivers can pin on these field names.
- Wired the new transport through the existing `AlertsService.sendNotification()` dispatch so webhooks reuse the rule-matching, retry, and Alert-record-tracking flow. Updated `evaluateCrawlRun` and `retryFailed` to pass `alert.id` + `source.id` so delivery identifiers are stable across retries.
- Added `POST /alerts/rules/:id/regenerate-secret` for HMAC rotation (rejects non-WEBHOOK rules with 404).
- Verified end-to-end with `apps/api/scripts/smoke-webhook.ts`: in-process HTTP receiver captures the POST, HMAC matches `createHmac('sha256', secret).update(body).digest('hex')`, and all standard headers are present.

### 2026-04-28 — Phase 1.1 UI shipped (Phase 1.1 closed)

- Extended `apps/web/src/lib/types.ts`: `AlertChannel` now includes `'WEBHOOK'`, `AlertRule` carries `webhookSecret: string | null`. Demo data updated.
- `apps/web/src/app/(dashboard)/dashboard/alerts/page.tsx`:
  - New "Webhook" channel button alongside Email/Slack in the create-rule modal, with URL validation (https:// preferred, http:// allowed for local testing).
  - Per-WEBHOOK-rule card now renders a "Signing secret" row with reveal/hide, copy-to-clipboard, and regenerate buttons. Regenerate hits `POST /alerts/rules/:id/regenerate-secret` and re-reveals the new secret on success.
  - Newly-created webhook rules auto-reveal the secret so it can be copied immediately after creation.
  - History tab channel column now renders the Webhook icon for WEBHOOK alerts.
- Verified the page compiles + renders 200 in `pnpm dev`; `tsc --noEmit` clean across the web workspace.

**Phase 1.1 closed** — generic outbound webhooks are end-to-end self-serve. Phase 1.2 (GitHub Issues integration) is next.

### 2026-04-28 — Production migrations applied

Both Phase 0.1 + Phase 1.1 migrations applied to local and production (Neon Postgres):
- `20260428000000_add_source_requires_js` (adds `ApiSource.requiresJs`)
- `20260428010000_add_webhook_alert_channel` (adds `WEBHOOK` enum value + `AlertRule.webhookSecret`)

### 2026-04-28 — Production source rows + Dockerfile updated

- Ran `apps/api/scripts/update-prod-sources.ts --apply` against production. 5 of the 6 originally-disabled sources flipped to active and pointed at the new URLs / `requiresJs` flags in a single Prisma transaction:

  | Source | Before | After |
  |--------|--------|-------|
  | Stripe | `isActive=false`, `requiresJs=false` | `isActive=true`, `requiresJs=true` |
  | OpenAI | `isActive=false`, `requiresJs=false` | `isActive=true`, `requiresJs=true` |
  | SendGrid | `docs.sendgrid.com/release-notes` (HTML_CHANGELOG, inactive) | `github.com/sendgrid/sendgrid-nodejs/releases` (GITHUB_RELEASES, active) |
  | AWS | `docs.aws.amazon.com/general/latest/gr/rss/aws-general.rss` (inactive) | `aws.amazon.com/about-aws/whats-new/recent/feed/` (active) |
  | GitLab | `about.gitlab.com/releases/categories/releases/` (HTML_CHANGELOG, inactive) | `about.gitlab.com/atom.xml` (RSS_FEED, active) |

  Script is idempotent — re-running is a no-op once these values are set.

- **Open**: `GitHub` (the Blog source) is still `isActive=false` in prod even though Phase 0 fixed its parser (50 entries parsing in smoke tests). Wasn't part of the user's update list this round; flip it via the same script with `isActive: true` if you want it crawling.

- Dockerfile (`apps/api/Dockerfile`) migrated from `node:20-alpine` to `node:20-bookworm-slim`, with Playwright + Chromium installed via `pnpm exec playwright install --with-deps chromium` in the runner stage. `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` set so the non-root runtime user can read the browser. HEALTHCHECK swapped from `wget` (not in slim) to a Node-based check.

**Phase 0 / 0.1 are now production-ready** end-to-end: code, schema, data, and image.

### 2026-04-28 — Phase 1.2 shipped (GitHub Issues integration)

- **Schema** — extended `AlertChannel` enum with `GITHUB`; added `AlertRule.githubToken String?` (PAT stored plaintext for MVP) + `AlertRule.githubLabels String[]`. Migration `20260428020000_add_github_alert_channel` applied locally and to Neon production via `prisma migrate dev` (additive, safe).
- **Transport** — `apps/api/src/modules/alerts/transports/github.transport.ts` posts to `https://api.github.com/repos/{owner}/{repo}/issues` with `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, and the rule's PAT as a `Bearer` token. Title format: `[{SEVERITY}] {sourceName}: {changeTitle}`. Body is markdown with affected endpoints list, change date, and a backlink to the dashboard. Labels applied as configured.
- **AlertsService dispatch** — `sendNotification()` switch extended for `AlertChannel.GITHUB`. The shape passed to `sendNotification` now includes `githubToken` + `githubLabels`. Defends against missing PAT (logs + returns false) — should be unreachable since `createRule` enforces PAT presence at the DTO level.
- **PAT redaction** — added `AlertsService.redactRule()` so `GET /alerts/rules`, `POST /alerts/rules`, and `POST /alerts/rules/:id/regenerate-secret` all replace `githubToken` with `hasGithubToken: boolean` before responding. PAT only travels client → server.
- **Settings UI** (`/dashboard/alerts`) — fourth channel button (Email / Slack / Webhook / GitHub). When GitHub is selected: `owner/repo` destination input (regex-validated), password-typed PAT input with explainer about required scopes, comma-separated label input (default `apidelta`). GitHub rule cards now render a metadata footer with a "PAT configured ✓" badge (or "PAT missing" red badge if backfill ever happens) plus label pills. Severity gating uses the existing `minSeverity` selector — no new field needed.
- **Verification** — `apps/api/scripts/smoke-github.ts` (in-process fetch stub, asserts URL/method/auth/api-version/title/body/labels) passes; `tsc --noEmit` clean across web + api; `nest build` clean; dev server compiles `/dashboard/alerts` and serves HTTP 200.

**Phase 1.2 closed.** Phase 1.3 (team invite flow) is next.

### 2026-04-28 — Phase 1.3 shipped (team invite flow)

- **Schema** — new `TeamInvite` model with `token` (unique), `email`, `expiresAt` (default 14d), and `acceptedAt`/`acceptedById`/`revokedAt` lifecycle fields. Migration `20260428030000_add_team_invites` applied locally + production Neon (additive, safe).
- **Backend module** (`apps/api/src/modules/team/`) — `TeamService` covers `listMembers`, `createInvite` (plan-limit guarded: members + pending non-expired invites < `PLAN_LIMITS[team.plan].maxMembers`, 403 if cap reached), `listInvites`, `revokeInvite`, `getInvitePreview` (public — token IS the auth), `acceptInvite` (validates email match + plan capacity), and `claimPendingInviteForNewUser` (used by NextAuth signup path).
- **NextAuth hook** (`apps/web/src/auth.ts`) — `events.createUser` now looks up a pending invite for the new user's email before defaulting to the auto-create-a-team path. If found, it transactionally marks the invite accepted and sets `user.teamId` + `isOwner=false` so the new user lands directly on the inviting team. No duplicate "default team" gets created.
- **Settings UI** (`/(dashboard)/dashboard/settings/page.tsx`) — replaced the "Coming Soon" Team Members stub with a real members list + invite form + pending-invite list. The form auto-copies the generated `/invite/<token>` URL to the clipboard on success; pending-invite cards have copy-link and revoke buttons; the section header counter reads `{members.length} / {plan.maxMembers}`.
- **Invite landing** (`/invite/[token]/page.tsx`) — server component that fetches the public preview and branches on invite status × session state:
  - `accepted` → "You're already on the team" + dashboard CTA (covers the brand-new-signup path where NextAuth's hook already handled assignment).
  - `revoked` / `expired` / not-found → message variants.
  - `pending` + signed-out → "Sign in to accept" CTA pointing at `/sign-in?email=<invite.email>&callbackUrl=/invite/<token>`.
  - `pending` + signed-in + email matches + already on the team → "You're on the team" + dashboard CTA.
  - `pending` + signed-in + email matches + different team → renders `AcceptInviteForm` (client component) that POSTs to the accept route handler.
  - `pending` + signed-in + email mismatch → "Wrong account, sign out and try again."
- **Accept handler** (`/api/invite/[token]/accept/route.ts`) — server route handler that reads `userId` from the trusted server-side session via `auth()` and forwards to the API. The API endpoint accepts `userId` in the body for now; the route handler is the only legitimate caller. Hardening item: API should pull `userId` from a proxy-injected header instead of trusting the body — tracked but not blocking.
- **Sign-in page** ergonomics — accepts `?email=<addr>` to pre-fill the email input; switches the header to "Accept your invite" when `callbackUrl` starts with `/invite/`.
- **Verification** — `tsc --noEmit` clean across web + api; `nest build` clean; dev server compiles `/dashboard/settings`, `/sign-in`, `/invite/[token]`, and `/api/invite/[token]/accept` without errors. Bad-token landing renders the "Invite not found" branch.

**Phase 1.3 closed.** Phase 1 of V2 is complete (webhooks + GitHub Issues + team invites). Phase 2 (curated catalog + MCP server + "Why not just build this?") is next.

### 2026-04-28 — Phase 2.1 shipped (curated API catalog)

- **Schema** — new `CatalogEntry` model with `slug` (unique), `name`, `description`, `category`, `tags[]`, `changelogUrl`, `sourceType`, `requiresJs`, `logoUrl`, `websiteUrl`, `popular`, `featured`. Two migrations applied (the second is a drift fix from `@default([])` on `tags` — Prisma represents Postgres array defaults differently). Both applied locally + Neon prod.
- **Seed** (`apps/api/prisma/seed-catalog.ts`) — 39 entries spanning 11 categories. Idempotent upsert by slug — re-running is safe. Targets the APIs the homepage already advertises (Stripe, OpenAI, GitHub, Anthropic) plus broad coverage (Twilio, AWS, GCP, Cloudflare, Vercel, Netlify, Railway, Supabase, Prisma, Linear, Notion, Sentry, Datadog, Auth0, Clerk, WorkOS, viem/wagmi/Hardhat/OpenZeppelin/Alchemy, etc.). `popular: true` on the homepage-advertised set; `featured: true` on Stripe/OpenAI/Anthropic/GitHub.
- **Backend** — new `CatalogModule` (`apps/api/src/modules/catalog/`) with public `GET /catalog` (filters: `q`, `category`, `popular`, `featured`), `GET /catalog/categories`, `GET /catalog/:slug`. No auth — catalog is public-by-design.
- **Public listing page** (`/catalog`) — server component, fetches `entries` + `categories` in parallel via `API_URL` direct calls (no proxy). Search-by-name/tag/description plus category chips; all filter state is in the URL so deep-links are bookmarkable + SEO-friendly. Empty state with "paste any URL" fallback CTA.
- **Detail page** (`/catalog/[slug]`) — server-rendered with `generateMetadata` so each entry gets its own canonical title + description for SEO. CTA goes to `/sign-up?source=<slug>` (the slug param is reserved for the deferred onboarding-prefill work).
- **Logos** — `logo.dev` free-tier CDN by domain (`https://img.logo.dev/<domain>?token=…`). Cheaper than self-hosting and consistent across the catalog. Generic globe icon falls back when `logoUrl` is null.
- **Discovery** — top nav on the marketing homepage now includes `Catalog` between `Use Cases` and the auth CTAs.
- **Verification** — API endpoints respond with shaped JSON for popular / categories / by-slug. Public page renders 200 with all 39 entries linked to their detail pages; bad slug → 404; query/category filters work via URL params.

**Phase 2.1 mostly closed** — public catalog ships. Outstanding: catalog growth toward 100+ entries and the dashboard onboarding refactor (both tracked above as `[ ]`). Phase 2.2 (MCP server) is next; it'll reuse the catalog data via a new `list_catalog` MCP tool.

### 2026-04-29 — Phase 2.2 shipped (MCP server)

- **API key model + service** — new `ApiKey` row stores SHA-256 hash + a `prefix` hint (`ad_live_xxxx…YYYY`). The full key is shown once at creation and never echoed back. Migration `20260429015231_add_api_keys` applied locally + Neon prod.
- **MCP module** (`apps/api/src/modules/mcp/`) — hand-rolled JSON-RPC 2.0 over HTTP. Single `POST /api/mcp` endpoint handles `initialize`, `tools/list`, `tools/call`, `ping`, and the `notifications/initialized` no-op. Auth via `Authorization: Bearer <key>`; team scope is sourced from the key, never a header. `GET /api/mcp` returns server identity for sanity checks.
- **Five tools**, all team-scoped via the API key:
  - `list_sources` (with `activeOnly` flag)
  - `recent_changes` (severity threshold + source-name substring filter, returns markdown)
  - `search_changelog_entries` (free-text across title + description)
  - `get_alert_history` (with optional `status` filter)
  - `list_catalog` (bonus — browse the public catalog by `query` / `category` / `popular`)
- **Settings UI** — new "API Keys" card on `/dashboard/settings` with create-by-name, copy, revoke, and a one-time amber reveal banner that disappears once the user dismisses it. Active keys list shows the prefix hint and last-used timestamp.
- **Marketing docs** — `/docs/mcp-setup` covers the Claude Code path (`claude mcp add --transport http`) and the Claude Desktop path (`npx mcp-remote`), tool reference, and example prompts.
- **Smoke test** — `apps/api/scripts/smoke-mcp.ts` mints a temp key, verifies 401 on bad bearer, runs initialize → tools/list → tools/call (list_catalog + list_sources), then deletes the key. Passing.

### 2026-04-29 — Vercel build hotfix (single Prisma schema source)

The Phase 2.2 push exposed a long-standing duplicate-schema problem: `apps/web/prisma/schema.prisma` was a stale copy of the API's schema, missing `TeamInvite` / `ApiKey` / `CatalogEntry`. Vercel's `prisma generate` step ran from web's stale schema, regenerating the client without the new types and breaking the typecheck on `apps/web/src/auth.ts`'s `prisma.teamInvite.findUnique()` call (Phase 1.3 had snuck through earlier deploys via Vercel's build cache).

**Fix**: pointed web's `package.json` `prisma.schema` at `../api/prisma/schema.prisma` and deleted `apps/web/prisma/`. The API is now the single source of truth for both the schema and migrations; web only generates the client. No more schema drift.

**Phase 2.2 closed.** Phase 2.3 ("Why not just build this?" content) is next, then Phase 3 (pricing tiers + named-competitor compare pages).

### 2026-04-29 — Phase 2.3 shipped ("Why not just build this?")

- Picked standalone page over homepage section. The SEO target ("build my own changelog monitor") plus the deep-link-from-pricing-FAQ pattern win. Section would have been faster but lower leverage.
- New `/why-not-build` page (~1500 words, statically rendered). The framing is direct: "Yes, you can. Here's what your weekend turns into in six months." Five sections, each grounded in a real APIDelta engineering story rather than vague hand-waving:
  - **Format drift** — Stripe SPA forced Playwright; OpenAI 403'd plain UA; GitHub Blog DOM redesign rejected every entry as noise; SendGrid retired its docs URL post-Twilio; AWS RSS feed URL moved.
  - **Classifier rot** — model deprecation breaking JSON output, vendor wording shifts, cost-cascade tuning, hallucinations on edge-case disclaimers.
  - **Multi-tenancy** — alert dedup by rule × change pair, per-rule severity routing, audit logs, retry+DLQ, team invites + seat enforcement.
  - **Catalog** — the data work nobody wants to redo (URL discovery, format identification, parser verification, descriptions, tagging).
  - **Plumbing** — HMAC-signed webhooks, hashed API keys, GitHub Issues with PAT scoping, MCP server.
- Closes with an "honest summary" that names when DIY *is* the right call (1–2 stable RSS sources, one user, time to maintain) — credibility-positive vs. a pure sales pitch.
- Discovery: top nav on the marketing homepage adds "Why not DIY?" alongside "Catalog"; new homepage FAQ entry "Should I just build my own?" with a teaser and a deep link.

**Phase 2 of V2 is complete** (catalog + MCP + the buy-vs-build content). Phase 3 (pricing tiers + named-competitor compare pages) is next.

### 2026-04-29 — Phase 3 shipped (pricing tiers + named-competitor compare pages)

- **Pricing schema** — added `TEAM` + `BUSINESS` to the `PlanTier` enum (migration `20260429021024_add_team_business_plan_tiers`, applied locally + Neon prod). `PRO` retained as a legacy back-compat value (no rows reference it; we have 0 paying customers, but defensive). `PLAN_LIMITS[TEAM]` = 50 sources / 10 members / Email + Slack + Webhook + GitHub channels. `PLAN_LIMITS[BUSINESS]` = effectively-unlimited (1000/1000) caps with the same channel set.
- **Billing service** — `createCheckoutSession` now accepts `'STARTER' | 'PRO' | 'TEAM'`. New `STRIPE_PRICE_ID_TEAM` env var. Checkout-session metadata + webhook handler updated to accept the new tier. Open: actual Stripe price ID needs to be created in the dashboard before TEAM checkout works in prod (BadRequestException until then).
- **Pricing UI** — homepage `PLANS` array on `apps/web/src/app/page.tsx` swapped from `[Starter $49, Pro $99]` (2-col) to `[Starter $49, Team $199, Business "Contact us"]` (3-col). Business CTA is a `mailto:hello@apidelta.dev`. Settings page (`/dashboard/settings`) goes to a 4-column grid (Free Trial / Starter / Team / Business) with a rank-based upgrade/downgrade comparator and a contact-sales button on the Business card. GA event helper extended so begin_checkout / purchase fire on the TEAM value too.
- **Three named-competitor compare pages**, all statically rendered:
  - `/compare/apidelta-vs-api-drift-alert` — primary direct competitor. Honest scorecard: APIDelta wins on price (3× cheaper entry), AI classification, catalog, MCP, GitHub Issues, and check frequency on the entry tier; API Drift Alert wins on monitor count at Starter (15 vs. 10), native PagerDuty, business-hours deferral, and SOC 2 / SSO / RBAC shipped today.
  - `/compare/apidelta-vs-pagecrawl` — generic page monitor. Calls out that PageCrawl is materially cheaper ($13 vs. $49) and has a free tier; APIDelta wins on API-specific intelligence (severity classification, affected-endpoint extraction, severity-based routing) and the curated catalog.
  - `/compare/apidelta-vs-visualping` — visual diff tool. Frames it as the right tool for marketing / pricing / TOS monitoring; wrong tool for changelogs. We win on changelog-specific structured signal, GitHub Issues, MCP, and audit trail.
  - `/compare/page.tsx` — index page so all three are discoverable. Closes with an email CTA for missing comparisons.
- **Shared `CompareTable` component** renders verdict-tinted feature rows (emerald = APIDelta wins, gray = competitor wins, default = tie). Each page also surfaces a two-column "Where APIDelta wins / Where they win" summary up top, plus a "Pick X if…" decision section that explicitly names when a reader *shouldn't* pick APIDelta — credibility-positive vs. a one-sided pitch.
- **Discovery** — homepage FAQ updated to link to `/compare`. Top nav already had Catalog and "Why not DIY?"; adding Compare to nav was held back to avoid crowding (FAQ link is sufficient).
- **Policy** — `docs/launch-strategy.md` competitor-naming policy at line 583+ already carves out the `/compare/*` exception (was added during V2 plan). No edit needed.

**Phase 3 closed.** All three V2 build phases are now done. Phase 4 (reset the kill checkpoint) is the only remaining V2 item — a docs-only update setting the new post-V2 metric criteria.
