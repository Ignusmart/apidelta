# APIDelta — Known Issues & Follow-ups

Tracking outstanding problems found during testing that weren't fixed in the current work. Each item has enough context to pick up cold. Update as things get fixed or new issues surface.

Last updated: 2026-04-11

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

### Stripe — `stripe.com/docs/changelog`

**Problem**: React SPA. `fetch()` returns server-rendered shell only — actual changelog loads client-side.

**Fix needed**: Playwright integration for JS rendering, or point at Stripe's JSON changelog endpoint.

**Impact**: High-value source. Playwright would also unlock other SPA-based changelogs.

### GitHub Blog — `github.blog/changelog/`

**Problem**: DOM mismatch. Parser captures date/category labels instead of actual entry titles. All entries rejected as noise.

**Fix needed**: Source-specific parser that walks `.post-list__item` or similar. Alternatively, detect `title === description` and drill deeper.

**Impact**: High-value — Copilot/Actions/Security announcements go through here.

### GitLab — `about.gitlab.com/releases/categories/releases/`

**Problem**: DOM mismatch. Generic selectors don't match GitLab's card-based release layout. Only marketing hero text is captured.

**Fix needed**: Inspect DOM and add selector for release cards (likely `.release-post` or similar).

**Impact**: Lower priority — monthly/major releases, not daily.

### AWS — RSS feed

**Problem**: RSS URL returns HTTP 404. Feed URL likely moved to `https://aws.amazon.com/new/feed/`.

**Fix needed**: Find correct URL, update `ApiSource.url`, re-enable.

### SendGrid — HTML changelog

**Problem**: Release notes URL returns HTTP 404. Possibly folded into main docs site.

**Fix needed**: Find replacement URL or remove source.

### OpenAI — HTML changelog

**Problem**: HTTP 403 — OpenAI blocks bots.

**Fix needed**: Playwright with realistic UA, or find an alternative source (community changelog, GitHub).

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
