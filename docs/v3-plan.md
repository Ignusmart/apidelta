# APIDelta V3 — Code-Aware Breaking Change Detector

**Status**: BUILDING — V3.0 + V3.1 scaffolding shipped 2026-05-02 (option (a) timing chosen — building in parallel with V2 distribution). V3.2 (surface registry + Urgent classifier) is the next chunk.
**Predecessor**: `docs/v2-tracker.md` (V2 launched 2026-04-29; in 30/60/90 metric window)
**User-side gate to test V3.0/V3.1 against real GitHub**: register the App per the "GitHub App registration" section below, fill the four env vars, run `pnpm --filter @apidelta/api prisma:migrate` + re-seed the catalog so the 16 mapped entries get their `npmPackages` / `urlHostnames`.

---

## Core insight

> "Devs only pay attention to Dependabot when it's a breaking update or a security fix. A changelog notifier without code context is just another inbox to ignore."

Pre-V3 APIDelta classifies changes as breaking / non-breaking using AI on the changelog text alone. That's "is this change breaking *in general*?" — not "is this change going to break **your code**?" The distance between those two questions is the entire reason Dependabot works and changelog newsletters don't.

V3 closes that distance. The product shifts from **"AI-classified changelog newsletter"** to **"code-aware breaking change detector for tracked third-party APIs."** The pricing, catalog, MCP, and integrations from V2 all stay — they sit underneath the new product center.

---

## Product shape

Two severity buckets that map to two delivery paths:

### Urgent (your code uses this)

A tracked API ships a change that affects a surface (endpoint, SDK method, request/response field) APIDelta has detected the user's repo using.

- Opens a **PR** when the fix is mechanical (renamed method, removed field, version bump in pinned SDK).
- Opens an **issue** when the fix needs human judgment (deprecated endpoint with no 1:1 replacement, response shape change).
- Title: `[Urgent] Stripe deprecates customers.list_subscriptions — used in src/billing/stripe.ts:42`
- Body: change summary, affected file/line list, suggested fix, link back to APIDelta dashboard.
- Routed to whatever channels the team configured (GitHub Issues by default, plus Slack/webhook).

### Important (everything else for tracked APIs)

Non-breaking adoptions, new features, deprecations on surfaces the repo doesn't currently use, security patches not affecting your version.

- Goes to a **weekly digest** by default (Email / Slack), not a per-event alert.
- User can opt specific APIs into per-event delivery if they want.
- This is where most current pre-V3 alerts end up — quieter on purpose.

The asymmetry is the whole point: Urgent must be loud and high-precision; Important must be quiet and tolerable to ignore.

---

## What V3 needs that pre-V3 doesn't

### 1. GitHub App (not PAT)

Pre-V3 Phase 1.2 used PATs for outbound issue creation. V3 needs **inbound** code-read access too, which means a real GitHub App with installation flow:

- Scopes: `Contents: Read` (file scan), `Pull requests: Write` (open PRs), `Issues: Write` (open issues), `Metadata: Read`.
- Per-team installation. Webhooks for `installation`, `installation_repositories`, `push` (rescan on default branch update).
- `apps/api/src/modules/github/` — new module. Auth via app JWT → installation access tokens (cached per-installation, ~1hr TTL).
- Settings UI: "Install on GitHub" button replaces the per-rule PAT field. Existing PAT-based GitHub alert rules stay supported as a fallback.
- Migrate the V2 `AlertRule.githubToken` path: keep it for users who don't want to install the App; new flow defaults to App auth.

### 2. Repo code scanner

For each connected repo, find the API surfaces it uses. TypeScript/JavaScript first (the biggest user segment for tracked APIs like Stripe / OpenAI / Twilio / Vercel / Supabase); Python second (post-V3 launch).

- Static analysis via `ts-morph` (or `@typescript-eslint/parser` AST). Tree-sitter as the cross-language fallback for languages without a deep TS analyzer.
- **Three signal types per file:**
  1. **SDK calls** — `import Stripe from 'stripe'` + `stripe.subscriptions.create({...})` → captures `stripe.subscriptions.create`.
  2. **API URLs** — string literals matching tracked-API hostnames (`api.stripe.com/v1/customers`) → captures path.
  3. **OpenAPI imports** — `openapi-fetch` / `openapi-typescript` generated clients with imported `paths` → captures `paths['/v1/customers']`.
- **Hard limits we're honest about**: dynamic URLs (env var concat, runtime config), reflection-based clients, eval'd code. These get caught by an opt-in `apidelta.config.ts` where users can declare additional surfaces by hand.
- Output: `RepoUsage` records keyed by `(installationId, repoFullName, sourceSlug, surface)` with file/line refs.

### 3. Surface registry per catalog entry

Pre-V3's catalog (`CatalogEntry`) is a list of changelog sources. V3 needs to know **what surfaces each source covers** so the classifier can match changes against repo usage.

- New table `CatalogSurface(catalogSlug, kind, identifier, deprecatedAt?, removedAt?)` — `kind` ∈ `SDK_METHOD | HTTP_PATH | REQUEST_FIELD | RESPONSE_FIELD | EVENT_TYPE`.
- Seed by parsing each tracked API's OpenAPI spec / SDK type definitions where available (Stripe has both; OpenAI has OpenAPI; Twilio/SendGrid have OpenAPI; Slack has Web API spec).
- For sources without machine-readable specs (changelog blogs), surfaces accumulate as the classifier sees them mentioned in change entries — bootstrapped manually for the top-20 catalog entries before V3 launch.
- The classifier's existing Anthropic call gets a new output field: `affectedSurfaces: CatalogSurface[]` extracted from the change entry text. This is the **join key** to repo usage.

### 4. Urgent classifier

A second-pass step after the existing severity classifier:

- Input: classified `ChangeEntry` + `affectedSurfaces[]` from step 3 + all `RepoUsage` records for the team.
- Logic:
  ```
  if change.severity ∈ {HIGH, CRITICAL} and affectedSurfaces ∩ repoUsage ≠ ∅:
      urgency = URGENT
  elif affectedSurfaces ∩ repoUsage ≠ ∅:
      urgency = INTERESTING  // used surface, low-severity change
  else:
      urgency = IMPORTANT
  ```
- Stored on `Alert` as a new `urgency` enum. Routing rules read `urgency` instead of `severity` for the new `URGENT_PR` / `URGENT_ISSUE` channels.

### 5. PR / issue body generator

Mechanical PRs are the highest-trust surface — they need to be right or users will turn the App off in a week.

- Start **issue-only** for V3 launch. PRs come after.
- Body template per change kind: deprecation, removal, signature change, version bump.
- Includes: change summary (link to source changelog entry), exact files/lines from the repo scan, the matched surface, suggested manual fix.
- All cross-links back to `https://apidelta.dev/dashboard/changes/<changeId>`.

---

## Phase plan

| Phase | Scope | Target | Status |
|-------|-------|--------|--------|
| **V3.0** | GitHub App scaffolding, install flow, repo connect UI, per-installation token cache | 1 week | ✅ shipped 2026-05-02 (pending real-App verification) |
| **V3.1** | TS/JS code scanner — `ts-morph` based, three signal types, `RepoUsage` table, scan-on-push | 2-3 weeks | ✅ scanner + manual trigger shipped 2026-05-02; auto-rescan-on-push deferred to V3.5 |
| **V3.2** | Surface registry — schema, seed for top-20 catalog entries, classifier extension to extract `affectedSurfaces` | 2 weeks (data work + prompt eng) | ⬜ next |
| **V3.3** | Urgent classifier + new alert routing (`URGENT_ISSUE` channel) + issue body generator | 1-2 weeks | ⬜ |
| **V3.4** | Dashboard surface — Urgent feed, Important digest, repo connection list, missed-detection feedback loop | 1 week | ⬜ |
| **V3.5** (post-launch) | Mechanical PRs (start with version-pinned SDK bumps), Python scanner, OAuth-installed App flow on marketplace, push-webhook auto-rescan, queue-backed scans | TBD | ⬜ |

**Total**: ~7-9 weeks for V3.0-V3.4. Comparable to V2 in scope.

---

## Honest unknowns

1. **Static analysis miss rate.** Real codebases use dynamic URLs, generated clients, env-var concat, reflection. The opt-in config file handles power users; for everyone else there will be false negatives. We need a **"did we miss anything?"** feedback mechanism — likely a "Mark this surface as used" button on every change entry that records to `RepoUsage` manually.
2. **False positives are worse than misses.** Telling a user "Stripe is breaking your billing flow" when it isn't will burn the App permission and the relationship. Confidence threshold must be high; ambiguous matches go to Important, not Urgent.
3. **Surface registry maintenance cost.** Stripe's TypeScript types are 300k+ lines. We can't hand-maintain surface lists for 100 catalog entries. Realistic plan: automate from OpenAPI for sources that have them (~60% of catalog), bootstrap from classifier output for the rest, accept gaps.
4. **GitHub App approval.** Marketplace listing requires verified org + screenshots + privacy review. Plan 1-2 weeks of buffer for approval — start the application during V3.0.
5. **Repo size at scale.** A 50k-file monorepo will tank the scanner. Need scoping (default-branch only, exclude `node_modules` / `dist` / `build`, file-size cap, optional `.apideltaignore`). Set scan budget to 60s per repo per push.
6. **Pricing implications.** Code-aware detection is a clear value-jump from changelog notifications. Team tier ($199) probably needs a repo cap (5? 10?). Business stays unlimited. Don't change Starter's price — keep the entry point cheap.

---

## What stays from V2

All of it. The catalog, MCP server, webhook/Slack/GitHub-Issues integrations, named compare pages, "Why not just build this?" page, three-tier pricing — none of that gets thrown out. V3 is additive: it puts a new product center on top of the V2 surface area, and the V2 surface area becomes more valuable because it's now feeding a code-aware detector instead of a blind newsletter.

The competitive moat compounds: catalog (V2) × code-scan (V3) is much harder to weekend-replicate than either alone. PageCrawl can't do this; API Drift Alert can't do this.

---

## Timing decision

Two options:

**(a) Start V3 now, in parallel with V2 distribution push.** Bet that the user's product instinct is right and pre-V3 won't clear the Day 90 bar regardless. V3 ships in late June / early July, in time for the Day 90 review (2026-07-28) — meaning the Day 90 decision becomes "did V3 traction beat pre-V3 traction?" instead of "do we kill APIDelta?"

**(b) Gate V3 on Day 90 outcome.** If pre-V3 hits >$200 MRR by 2026-07-28, focus on growth and treat V3 as an opportunistic upsell. If it doesn't, V3 becomes the explicit pivot.

**Recommendation: (a).** The argument for (a):
- V3 is a stronger product hypothesis than pre-V3, and the user already knows it.
- V2 distribution can run in parallel — Reddit posts, content, the launch playbook in `docs/launch-strategy.md` don't need a developer.
- Building V3 doesn't burn the V2 distribution effort; both feed each other.
- The risk of (b) is sunk cost — six weeks waiting for a verdict that's already directionally clear, then six weeks building, missing the Day 90 deadline anyway.

The argument for (b) is mainly about not building before validating. But pre-V3 has been validated as **insufficient** by the same instinct that produced V3. Validating it harder doesn't change the answer.

**Pre-build gate**: before writing any V3 code, the user signs off on (a) vs (b) and on the phase plan above.

---

## Open items

- Sign off on (a) vs (b).
- Confirm TypeScript-first scope (vs going broader on day one).
- GitHub App marketplace listing: name, branding, screenshots — needs to start during V3.0.
- Repo cap for Team tier — pick a number before pricing page updates.
- Decide whether to deprecate the V2 PAT-based GitHub Issues channel or keep both indefinitely.
- Update `docs/competitive-teardown.md` once V3 ships — the differentiation column changes meaningfully.

---

## GitHub App registration — what the user does

The App is a one-time setup at github.com/settings/apps/new (or the org-level equivalent). Fields APIDelta needs:

| Field | Value |
|-------|-------|
| **App name** | `APIDelta` (or `apidelta-staging` for the dev App) |
| **Homepage URL** | `https://apidelta.dev` |
| **Webhook URL** | `https://api.apidelta.dev/api/github/webhook` (or your tunnel URL for local dev — `ngrok http 3001` works) |
| **Webhook secret** | Generate with `openssl rand -hex 32` — save to `GITHUB_APP_WEBHOOK_SECRET` |
| **Setup URL** | `https://apidelta.dev/dashboard/integrations/github` (sends users back here after install with `?installation_id=…`) |
| **Redirect on update** | ✅ on |
| **Repository permissions** | Contents: Read · Pull requests: Write · Issues: Write · Metadata: Read |
| **Subscribe to events** | `installation`, `installation_repositories`, `push` (push needed in V3.1 for re-scan triggers) |
| **Where can this app be installed** | Any account |

After creation, on the App page:
- Note the **App ID** → `GITHUB_APP_ID`
- Note the **public slug** (URL path) → `NEXT_PUBLIC_GITHUB_APP_SLUG`
- Click **Generate a private key** → download the `.pem` → paste contents into `GITHUB_APP_PRIVATE_KEY` with `\n` escapes

A separate dev/staging App is recommended (different webhook URL, different App ID) so local dev doesn't share state with production installs.

---

## Iteration log

### 2026-05-02 — V3 plan drafted

User flagged that pre-V3 alerting lacks code context — same trap as ignoring non-actionable Dependabot updates. Plan above sketches the Dependabot-style direction: GitHub App, repo scan, Urgent vs Important classification, issue/PR dispatch. No code yet — this doc precedes the build.

### 2026-05-02 — V3.0 scaffolding shipped

Backend + frontend skeleton for the GitHub App install flow:

- Prisma: `GithubInstallation` + `GithubRepo` models. Migration `20260502000000_add_github_app_installations`.
- `apps/api/src/modules/github/` — module, controller, service, types. Octokit App auth with installation-token caching (60s pre-expiry refresh). Webhook receiver with `X-Hub-Signature-256` verification using timing-safe compare. Handles `installation` (created / deleted / suspend / unsuspend) and `installation_repositories` (added / removed) events; ignores everything else with a debug log.
- `POST /api/github/installations/claim` — called from the web app's setup callback. Resolves the team via the existing `x-team-id` header (already wired through `/api/proxy/[...path]`), fetches the install's repos via the App API, and upserts.
- `GET /api/github/installations` — returns the team's installations + non-removed repos for the dashboard list.
- Web UI: `/dashboard/integrations/github` — empty-state + install button + per-install card listing connected repos. Auto-claims when GitHub redirects back with `?installation_id=…`, then strips the query params so refresh doesn't re-claim.
- `.env.example` — added `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_WEBHOOK_SECRET`, `NEXT_PUBLIC_GITHUB_APP_SLUG` with comments documenting the required App permissions and webhook events.

**Pending in this session**: smoke test (signed webhook → service → row insert), `pnpm tsc --noEmit` clean, `pnpm db:migrate` against local Neon. The user owns: registering the App at github.com/settings/apps/new and filling in the four env vars.

### 2026-05-02 — V3.1 code scanner shipped

Static-analysis scanner ties tracked-API catalog entries back to repo source code. Pre-trigger / pre-classification — V3.2 wires the scanner output into the alert urgency decision.

- Prisma: `RepoUsage(githubRepoId, catalogSlug, kind, surface, filePath, line)` model with new `RepoUsageKind` enum (`SDK_CALL` / `HTTP_HOSTNAME` / `HTTP_PATH` / `OPENAPI_PATH`). Added `npmPackages: String[]` and `urlHostnames: String[]` to `CatalogEntry`. Migration `20260502010000_add_repo_usage_and_catalog_mappings`.
- `apps/api/prisma/seed-catalog.ts` — added `SCANNER_MAPPINGS` overlay seeding 16 top-tier entries (stripe, openai, anthropic, twilio, sendgrid, slack-api, cloudflare, vercel, supabase, prisma, next-js, sentry, resend, clerk, auth0, linear) with their canonical npm packages + API hostnames. Empty arrays for everything else (still discoverable, just not yet matchable by the scanner).
- `apps/api/src/modules/scanner/repo-content.service.ts` — fetches a repo's TS/JS via `git/getTree` (recursive) + `git/getBlob`, filters out `node_modules` / `dist` / `build` / `.next` / `coverage` / `.turbo` / etc., skips `.d.ts` / `.min.js`, caps individual files at 1 MB and total files at 500. Resolves the branch to a commit SHA up front so the tree is stable across the scan.
- `apps/api/src/modules/scanner/ts-scanner.service.ts` — three passes via ts-morph against an in-memory project:
  - **SDK_CALL**: collects imports matching `CatalogEntry.npmPackages`, walks variable declarations to follow aliases (`const stripe = new Stripe(...)`), then captures call sites. Surface is rendered with a canonical name (`stripe.subscriptions.create`) so different developers' aliases produce the same string.
  - **HTTP_HOSTNAME / HTTP_PATH**: scans string literals + the head of template expressions for tracked hostnames; extracts the path component when present. Stops at `?` `#` `${` so query strings and interpolations don't pollute the surface.
  - **OPENAPI_PATH**: detects `openapi-fetch` imports and any `*.get('/…')` / `*.post('/…')` / etc. calls in the same file. No catalog attribution yet — emits with the sentinel slug `__openapi__` so the orchestrator drops them, but the data is captured for V3.2 to backfill once the surface registry can map paths back to entries.
  - File-level robustness: each file is scanned in its own try/catch; a single broken file logs and continues.
- `apps/api/src/modules/scanner/scanner.service.ts` — orchestrator. Authorizes via `(teamId, githubRepoId)`, refuses suspended/removed repos, mints an installation token through `GithubService.octokitForInstallation`, runs the fetch + scan, dedupes results, then replaces all `RepoUsage` rows for the repo inside a transaction. Updates `GithubRepo.lastScannedAt` / `lastScannedSha` / `lastScanError`.
- `POST /api/github/repos/:id/scan` and `GET /api/github/repos/:id/usage` (controller) — synchronous trigger + read API. The scan is in-process for V3.1; queue/Bull is V3.5 polish.
- `/dashboard/integrations/github` — per-repo "Scan now" button + collapsible row that loads usage from the read API. Shows up to 5 sample sites per catalog entry as `[KIND] surface → file:line`. Surfaces `lastScanError` inline.
- `apps/api/scripts/smoke-scanner.ts` — 5 synthetic TS files exercising all three passes plus a should-be-ignored utils file. 7/7 expectations green.
- `tsc --noEmit` clean on both `apps/api` and `apps/web`.

**V3.1 honest unknowns surfaced**:
1. `git/getTree` truncates above 100k entries. Not handled in V3.1 — logs a warning. Real monorepos will need scoping (top-level `src/` only, or per-package walk).
2. The alias tracker is one-pass — `const a = stripe; const b = a;` won't follow through. Good enough for the common `new Stripe(key)` pattern; multi-hop aliasing will miss surface attribution.
3. Dynamic URLs (env-var concat, `${BASE}${path}` with no static head) are invisible. The opt-in `apidelta.config.ts` declared in v3-plan.md is V3.5+.
4. OpenAPI paths land with `__openapi__` slug today and get filtered out before persistence. They become useful in V3.2 once the surface registry can resolve `paths['/v1/users/{id}']` → `<catalog-slug>`.

**Pending before V3.1 ships to production**: pnpm db:migrate locally, then `db:deploy` + re-seed catalog on production (Neon) — the new `npmPackages` / `urlHostnames` columns ship empty until the seed runs. The scanner is also untested against a real GitHub installation; first smoke run requires the user to register the App from the V3.0 instructions.
