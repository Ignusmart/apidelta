# APIDelta — Known Issues & Follow-ups

Tracking outstanding problems found during testing that weren't fixed in the current work. Each item has enough context to pick up cold. Update as things get fixed or new issues surface.

Last updated: 2026-04-12

---

## Fixed in data quality audit (2026-04-12)

### Web Prisma schema out of sync — FIXED

Web schema was missing `aiSummary`, `contentHash` fields and `@@unique([alertRuleId, changeEntryId])` constraint. Now synced with API schema.

### contentHash had no unique constraint at DB level — FIXED

Upgraded from `@@index` to `@unique` constraint. Prevents race-condition duplicates between concurrent crawl runs. Migration drops old index, creates unique index.

### isNew stuck as TRUE after alert evaluation — FIXED

`evaluateCrawlRun()` now marks all entries as `isNew: false` after processing, even when no alert rules exist or no rules match. Previously entries stayed `isNew: true` indefinitely if the source wasn't re-crawled.

### Cloudflare category badges contaminating titles — FIXED

Parser appended category tags (e.g. "AI Gateway", "Workers") to titles and descriptions. New `stripTrailingCategoryTag()` detects and removes repeated suffix phrases and trailing short category lines.

### Linear mega-entries not split into individual changes — FIXED

Linear publishes single release notes with 20+ sub-sections. New `splitMegaEntries()` detects entries with 5+ headed sections and expands them into individual entries with "Parent Title — Section" naming.

### GKE version-bump noise passing through — FIXED

Google Cloud GKE release channel entries (walls of version numbers) now filtered as noise when 5+ GKE version strings appear, or when title matches channel patterns.

### No retry on transient fetch failures — FIXED

Crawl fetches now retry once after 5 seconds on network errors or 5xx. 4xx errors (permanent) are not retried.

### Classifier batch failures silently swallowed — FIXED

Now tracks and logs warning with failure count per crawl run, including count of unclassified entries remaining.

### No direct sourceId on ChangeEntry — FIXED

Added optional `sourceId` FK on ChangeEntry with migration that backfills from CrawlRun. Enables direct source→changes queries without joining through CrawlRun.

### LOW-severity entries dominating feed — FIXED

New roll-up logic groups 3+ consecutive LOW entries from same source into digest objects in the API response. MEDIUM+ entries are never grouped.

### affectedEndpoints often empty on API-mentioning entries — FIXED

Expanded classifier prompt to scan entire entry text, include product/service names, CLI commands, and be thorough about extraction. Reduces empty arrays.

### Low-quality parsed entries not flagged — FIXED

Classifier now detects when title/summary word overlap is <20% and prefixes aiSummary with `[LOW_QUALITY_PARSE]` to signal parser captured wrong text.

---

## Fixed in solidification sprint (2026-04-11)

### Cross-run deduplication — FIXED

Previously every cron cycle re-created all entries (280 rows, only 119 unique). Now fixed:
- Added `contentHash` (SHA-256 of `sourceId + title`) to `ChangeEntry` schema
- Crawler checks hash before creating — skips if already exists
- Cleaned 164 duplicate rows from production DB
- Verified: two consecutive Cloudflare crawls produced 0 new duplicates

### isNew flag lifecycle — FIXED

`isNew` was always `true`, never updated. Now after a successful crawl, all previous entries for that source are marked `isNew: false`. Alerts only fire for genuinely new entries.

### Classifier overwrote description — FIXED

Classifier used to overwrite `description` with its 1-2 sentence summary. Now writes to a separate `aiSummary` field. Original parsed description is preserved.

### Classification not idempotent — FIXED

Classifier now only processes entries where `aiSummary IS NULL`. Already-classified entries are skipped on re-runs.

### Duplicate alerts possible — FIXED

Added `@@unique([alertRuleId, changeEntryId])` constraint to `Alert` model. Duplicate alert creation silently skips on constraint violation.

### Section headers passing as real entries — FIXED

Added noise patterns for: `Features`, `Studio`, `Stable channel`, `Rapid channel`, `Fixes`, `Availability and pricing`. Cleaned 7 noise entries from DB.

### Dry-run transports masquerading as success — FIXED

Email and Slack transports now return `false` when in dry-run mode (no API key / no webhook URL), so alerts are correctly marked as FAILED instead of SENT.

### CrawlRun table bloat — FIXED

Daily midnight cron prunes CrawlRun rows older than 30 days where all associated changes have `isNew: false`. Also cleaned 48 accumulated failed runs from dead sources.

### Build artifact in git — FIXED (previous commit)

`*.tsbuildinfo` added to `.gitignore` in commit `c500050`.

### Dead sources auto-accumulating failures — FIXED

Sources that fail 5 consecutive crawls are now auto-disabled with a warning log. Prevents unbounded failed CrawlRun accumulation.

### Auth: API proxy was unauthenticated — FIXED

- Proxy now validates session via `auth()` and injects trusted `x-team-id` header
- All backend controllers read `teamId` from header, not client-supplied query params
- `DELETE /sources/:id` and `POST /sources/:id/crawl` verify source ownership
- Removed exposed `POST /alerts/evaluate/:crawlRunId` endpoint (was unprotected)
- Billing guards updated to read `x-team-id` header

### Landing page false claims — FIXED

Removed: "50+ changelog formats", "weekly digest emails", "team members" limits, "7/90-day history", "priority support", "all alert channels". Replaced with honest copy matching actual functionality.

---

## Disabled sources (need parser/infra work to re-enable)

These sources are set to `isActive = false`. They can be re-enabled once their specific issues are resolved.

### Stripe — `stripe.com/docs/changelog` — FIXED 2026-04-28 (Phase 0.1)

**Original problem**: React SPA. `fetch()` returned a server-rendered shell with no entries — the changelog loaded client-side after JS execution.

**Fix shipped**: added Playwright fetcher (`fetchWithPlaywright()` in `CrawlerService`) and `requiresJs` boolean on `ApiSource`. Crawler routes Stripe through headless Chromium with a realistic Chrome UA; rest of the parsing pipeline is unchanged. Stripe's continuous-polling page made `networkidle` unreliable, so we use `domcontentloaded` + a 3s settle delay.

**Verification**: smoke test parses 38 raw entries → 11 kept after dedupe, including real version IDs (`2026-04-22.dahlia`, `2026-03-25.dahlia`) and a "Breaking changes" marker on the dated versions.

**Caveat**: Stripe's index page only lists version IDs + "Breaking changes" labels — actual change descriptions live on per-version pages. The classifier currently sees title + sparse description; deep per-version crawling is Phase 0.2 work.

### OpenAI — `platform.openai.com/docs/changelog` — FIXED 2026-04-28 (Phase 0.1)

**Original problem**: HTTP 403 — OpenAI blocks generic bot user-agents at the edge.

**Fix shipped**: same Playwright path as Stripe (realistic Chrome UA negotiates past the bot block). Additionally, the universal parser now narrows to the `<main>` element when present, which scopes selectors past the sidebar nav and "Suggested" panels that were previously polluting the feed.

**Verification**: smoke test parses 30 entries grouped by month ("April, 2026", "March, 2026", …) with full descriptions in each (model names, endpoint paths, change descriptions).

**Caveat**: entries are month-aggregated rather than per-change. Splitting them into individual changes is Phase 0.2 work — the existing `splitMegaEntries` heuristic doesn't recognize OpenAI's format.

### GitLab docs — `docs.gitlab.com/releases/` — DEFERRED to Phase 0.2

**Status**: Playwright successfully renders the page, but the universal parser captures the cookie consent banner ("This website uses cookies", "Privacy Preference Center") instead of the release content. The current GitLab source uses the working `about.gitlab.com/atom.xml` feed; switching to the docs page needs either Playwright cookie dismissal or per-source DOM selectors.

### GitHub Blog — `github.blog/changelog/` — FIXED 2026-04-28

**Original problem**: DOM mismatch. Parser captured date/category labels instead of actual entry titles; entries rejected as noise.

**Fix shipped**: added `.ChangelogItem` to the universal selector list; added `.ChangelogItem-title` (and similar `.card-title` / `.post-title`) as a fallback when the matched element's heading has class `*-meta` (date+category placeholder); relaxed the "description == title" noise filter when titles are descriptive (≥25 chars and ≥4 substantive words). GitHub Blog index pages expose only entry titles — the classifier works fine on a rich title alone.

**Verification**: smoke test (`apps/api/scripts/smoke-parsers.ts`) parses 50 real entries with correct titles + dates.

### GitLab — `about.gitlab.com/atom.xml` — FIXED 2026-04-28

**Original problem**: `about.gitlab.com/releases/categories/releases/` (now redirects to `docs.gitlab.com/releases/`) is a JS-rendered SPA — the initial HTML is a 16KB shell with no release cards.

**Fix shipped**: switched the source URL to GitLab's blog Atom feed (`about.gitlab.com/atom.xml`, `SourceType.RSS_FEED`). The Atom feed is server-rendered and includes release announcements alongside engineering blog posts.

**Caveat**: the Atom feed is the GitLab blog (broader than pure release content) — the AI classifier filters non-release noise based on content. Acceptable trade-off until GitLab ships a dedicated release feed or we wire Playwright (Phase 0.1).

**Verification**: smoke test parses 20 entries with full descriptions + dates.

### AWS — `https://aws.amazon.com/about-aws/whats-new/recent/feed/` — FIXED 2026-04-28

**Original problem**: previous RSS URL returned HTTP 404.

**Fix shipped**: corrected URL to AWS's canonical "What's New" RSS feed, plus added RSS/Atom parsing support in the crawler (`CrawlerService.parseRssFeed` — handles RSS 2.0 `<item>` and Atom `<entry>`, strips HTML/CDATA from descriptions). `SourceType.RSS_FEED` was already in the enum but had no dispatch path before this fix.

**Verification**: smoke test parses 50 raw entries → 48 kept after dedupe.

### SendGrid — `github.com/sendgrid/sendgrid-nodejs/releases` — FIXED 2026-04-28

**Original problem**: `docs.sendgrid.com/release-notes` returned HTTP 404 (retired post-Twilio acquisition).

**Fix shipped**: switched the source to the official SendGrid Node SDK GitHub releases page (`SourceType.GITHUB_RELEASES`). The existing GitHub releases parser path handles it without code changes.

---

## Validated and working (reference)

As of 2026-04-11, these 9 sources are active and producing deduplicated, classified signal:

| Source | Entries |
|---|---|
| Cloudflare | 18 |
| Slack API | 45 |
| Linear | 20 |
| Google Cloud | 3 |
| Twilio | 10 |
| Vercel | 7 |
| Supabase | 3 |
| Prisma | 2 |
| Next.js | 0 (canary releases correctly dropped as noise) |
| **Total** | **108** |
