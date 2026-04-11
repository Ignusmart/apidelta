# APIDelta — Known Issues & Follow-ups

Tracking outstanding problems found during testing that weren't fixed in the current work. Each item has enough context to pick up cold. Update as things get fixed or new issues surface.

Last updated: 2026-04-10

---

## Dead source URLs

These sources return HTTP errors and need their URLs updated (or the sources deleted if upstream has removed the changelog entirely).

| Source | Current URL | Error | Status |
|---|---|---|---|
| SendGrid | `https://docs.sendgrid.com/release-notes` | HTTP 404 | Needs replacement URL. SendGrid may have folded release notes into the main docs site. |
| AWS | `https://docs.aws.amazon.com/general/latest/gr/rss/aws-general.rss` | HTTP 404 | RSS feed URL changed. Real feed probably under `https://aws.amazon.com/new/feed/` or similar. |
| OpenAI | `https://platform.openai.com/docs/changelog` | HTTP 403 | OpenAI blocks bots. Options: rotate UA, use Playwright, or point at a different source (e.g., the OpenAI community changelog or GitHub API reference). |

**Fix**: update `ApiSource.url` in the DB (or the dashboard) once replacement URLs are identified. Each of these is a 1-minute change per source.

---

## Parser fails on specific source DOM shapes

These sources return HTTP 200 and get crawled successfully, but the generic parser in `crawler.service.ts` doesn't match their DOM and extracts noise (date headers, nav chrome, marketing copy). Each needs a source-specific parser or a smarter general strategy.

### GitHub Blog changelog — `github.blog/changelog/`

**Symptom**: 23 raw entries parsed, all with `title === description === "Apr.10\t\t\tImprovement"` (date label + category tag). The noise filter correctly rejects them because title is a repeat of description, so 0 entries land in the feed.

**Root cause**: GitHub's changelog HTML has a date header + category tag + actual entry title as siblings inside a wrapper. Our selectors match the wrapper containing only the date/category, not the node containing the real title.

**Fix direction**: add a source-specific parser (e.g., `parseGitHubBlog`) that walks `.post-list__item` (or whatever the actual class is) and extracts the post title from its own heading. Alternatively, detect the pattern and drill deeper when `title === description`.

**Impact**: GitHub Blog is one of the highest-value sources — every Copilot/Actions/Security announcement goes through it. Should be fixed soon.

### GitLab releases — `about.gitlab.com/releases/categories/releases/`

**Symptom**: Only 2 raw entries parsed, both `"Insights for the future of software development"` — the marketing hero at the top of the page. Rejected by the `/^insights for the future/i` noise pattern, so 0 entries land.

**Root cause**: None of the generic changelog selectors (`article`, `[class*="changelog"]`, `[class*="release"]`, `.changelog-entry`, `.release-note`, `section:has(h2)`) match GitLab's actual release list DOM.

**Fix direction**: inspect the page structure and add a selector (or source-specific parser). GitLab puts releases in a card layout — likely `.release-post` or similar.

**Impact**: Lower priority than GitHub — GitLab release posts are monthly/major, not daily.

### Stripe — `stripe.com/docs/changelog`

**Symptom**: 16 raw entries parsed, all year archive links, version slugs, or page meta (`"Keep track of changes and upgrades"`, `"2024"`, `"2023"`, `"2026-03-25.dahlia"`, `"Dahlia"`). Noise filter rejects 14, classifier drops the remaining 2 as noise. 0 entries land.

**Root cause**: Stripe's changelog page is a **React SPA**. `fetch()` returns the server-rendered shell with nav/archive links only. The actual changelog content loads client-side via JS.

**Fix direction**: requires JS rendering. Two options:
1. **Playwright** — heavier infra but works for any SPA. CLAUDE.md lists it as intended for "JS-rendered pages" but it's not wired up yet.
2. **Stripe-specific alternative source** — Stripe also publishes changelog as JSON at `https://stripe.com/docs/changelog.json` (or similar) or via their GitHub. Could point the source there instead.

**Impact**: Stripe is also high-value. Playwright would unlock Stripe + any other SPA-based changelogs we add later.

---

## Cross-run deduplication missing

**Symptom**: After running the cron a few times, the DB has 280 `ChangeEntry` rows but only ~119 unique changes. Linear has 60 (~20 × 3 runs), Slack has 131 (~42 × 3 runs), etc.

**Root cause**: `CrawlerService.triggerCrawl()` creates a new `ChangeEntry` row for every parsed entry on every run. No check against previous runs for the same `(sourceId, content)` pair.

**Fix direction**: introduce a stable content hash per entry (e.g., `sha256(normalize(title + description))`) and either:
- Add a unique index on `(sourceId, contentHash)` and use Prisma `upsert`, or
- Query existing hashes for the source before creating, skip matches.

Related: the `isNew` flag on `ChangeEntry` was presumably intended to mark new-in-this-run vs seen-before. Currently it defaults to `true` and nothing updates it.

**Impact**: Growing 3× per cron cycle. The Changes page will look cluttered with duplicates. Cleanup script can patch existing state but the crawler needs to stop producing duplicates to begin with.

**Workaround until fixed**: the cleanup-noise.ts script can be extended (or a new `dedupe-entries.ts` written) to collapse same-content rows within a source.

---

## CrawlRun table bloat on repeated failed runs

Less urgent, but noticed during testing: sources that fail repeatedly (SendGrid, AWS with the dead URLs) have accumulated `CrawlRun` rows with `status=FAILED`. AWS has 5 failed runs, SendGrid has 5. Not technically a bug but worth garbage-collecting.

**Fix direction**: either add a TTL on failed `CrawlRun` records (e.g., delete failed runs older than 30 days) or cap total runs per source at N and prune the oldest on each new run.

---

## Build artifact in git

`apps/web/tsconfig.tsbuildinfo` is untracked but not gitignored. Should be added to `.gitignore` along with any other `*.tsbuildinfo` files. Trivial cleanup.

---

## Validated and working (reference — not a todo)

As of 2026-04-10, these sources are clean and producing real signal through the new filter + classifier pipeline:

| Source | Latest entries |
|---|---|
| Cloudflare | 18 |
| Twilio | 10 |
| Linear | 20 |
| Google Cloud | 14 |
| Slack API | 42 |
| Vercel | 7 |
| Prisma | 6 |
| Supabase | 2 |
| **Total** | **119** |

Next.js (0) is correct — the 8 surviving canary releases get dropped as generic version boilerplate by the classifier's `isSignal=false` rule, which is the intended behavior for canary releases with no substantive API changes.
