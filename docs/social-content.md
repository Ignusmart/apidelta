# APIDelta — Social Launch Content

**Created**: 2026-04-05 (Iteration 24)
**Status**: Ready to publish. All links set to https://apidelta.dev. False Postman "52%" stat removed. Kill criteria updated to 14-day/30-day checkpoints.
**Constraint**: No competitor names in any user-facing content. Use "existing tools", "basic change detection", "enterprise monitoring platforms" instead.

---

## Table of Contents

1. [LinkedIn Posts](#linkedin-posts)
2. [Twitter/X Threads](#twitterx-threads)
3. [Reddit Posts](#reddit-posts)
4. [Indie Hackers Post](#indie-hackers-post)
5. [Dev.to Article](#devto-article)

---

## LinkedIn Posts

### LinkedIn Post 1: Launch Announcement

> Every engineering team has that story.
>
> The one where production went down at 2 AM because a third-party API changed its auth flow. The changelog update? Buried in a 40-item release note published three days earlier. Nobody saw it.
>
> I lived this enough times to build a solution.
>
> Today I'm launching APIDelta — an AI-powered API changelog monitor for engineering teams.
>
> Here's what it does:
>
> 1. You paste your API changelog URLs (Stripe, Twilio, GitHub, OpenAI — any provider)
> 2. AI reads every update and classifies it by severity: breaking, deprecation, or informational
> 3. Your team gets a Slack message or email with exactly what changed and whether it needs action
>
> No agents to install. No SDKs. No code changes. Setup takes under 2 minutes.
>
> Why AI classification matters: most monitoring tools do basic text diffs. They alert you on every change — formatting fixes, typo corrections, new features you don't use. The noise makes you ignore the alerts entirely. APIDelta only escalates what actually matters.
>
> Pricing starts at $49/mo for 10 monitored APIs. There's a 14-day free trial with 3 APIs, no credit card required.
>
> If your team integrates with third-party APIs (and whose doesn't?), I'd love your feedback.
>
> https://apidelta.dev
>
> #devtools #api #saas #engineering #monitoring

**Posting notes**: Include a screenshot of the dashboard showing the change feed with severity badges (BREAKING in red, DEPRECATION in yellow, INFO in gray). Post on launch day (Day 1), morning.

---

### LinkedIn Post 2: Pain-Point Story ("We Tested Monitoring 50 API Changelogs")

> I spent a week manually checking the changelogs of 50 popular APIs.
>
> Here's what I found:
>
> - 23 use plain HTML pages with no consistent structure
> - 11 publish RSS feeds (but half are broken or outdated)
> - 9 use GitHub Releases
> - 7 have some hybrid or completely custom format
>
> No two changelogs look the same. Some use dates. Some don't. Some group changes by version. Some dump everything in reverse chronological order. Some mix product announcements with actual API changes.
>
> And this is what engineering teams are expected to monitor manually.
>
> Breaking changes are one of the most common causes of API integration failures. And yet the monitoring infrastructure for third-party changelogs basically doesn't exist.
>
> Most teams do one of four things:
>
> 1. Assign someone to "check the changelogs" (they stop after week 2)
> 2. Set up RSS readers (which miss HTML-only changelogs)
> 3. Use generic website change monitors (which alert on every CSS tweak)
> 4. Find out from production errors
>
> None of these work well. That's why I built APIDelta — AI reads every changelog format, classifies changes by severity, and only alerts on what matters.
>
> The problem isn't that teams don't care about API changes. It's that monitoring them manually doesn't scale past 3-4 APIs.
>
> What's your team's current approach?

**Posting notes**: This is a discussion-starter. No hard CTA — the product mention is organic. Post on Day 4-5. Engage with every comment.

---

### LinkedIn Post 3: Technical Deep-Dive on AI Classification

> "Can't you just diff the HTML?"
>
> That's the first question everyone asks when I explain APIDelta.
>
> The answer: you can, but it's almost useless for API changelogs.
>
> Here's why. A typical changelog entry looks like this:
>
> "Starting March 15, the /v2/payments endpoint will require the `idempotency_key` header on all POST requests. Requests without this header will return 400."
>
> A text diff would tell you: "new text was added." That's it. Same alert you'd get for a typo fix.
>
> AI classification tells you:
> - Type: BREAKING
> - Severity: Critical
> - Affected endpoint: POST /v2/payments
> - Summary: New required header (idempotency_key) on payment creation
> - Action needed: Update all POST calls to include the header before March 15
>
> That's the difference between noise and signal.
>
> How it works technically:
>
> 1. The crawler extracts text from any changelog format (HTML, RSS, GitHub Releases) using pattern-matched parsing
> 2. Each entry goes to Claude with a classification prompt that outputs structured JSON
> 3. The model uses tool_use for guaranteed schema compliance — every response includes type, severity, affected endpoints, and a plain-English summary
> 4. Alert rules evaluate the structured output: "alert me on BREAKING + DEPRECATION for Stripe and Twilio only, severity high or above"
>
> The key insight: changelog monitoring is fundamentally a natural language understanding problem, not a text comparison problem. The same API change can be described in dozens of ways. AI handles that variance. Regex and diffs don't.
>
> Current classification accuracy on our test set: above 85% on breaking vs non-breaking distinction.
>
> Curious what other engineering problems you think are better solved with NLU than pattern matching.

**Posting notes**: Post on Day 8-10. This is thought-leadership content that demonstrates technical depth. Good for shares among engineering audiences.

---

## Twitter/X Threads

### Thread 1: Launch Thread

> **1/** I built an API changelog monitor because I was tired of finding out about breaking changes from production errors.
>
> It's called APIDelta. Here's what it does and why it exists.

> **2/** The problem: your team integrates with 10+ third-party APIs. Each publishes changes differently.
>
> HTML pages. RSS feeds. GitHub Releases. Blog posts. Some combination of all four.
>
> No standard format. No standard notification system.

> **3/** When a provider deprecates an endpoint or changes an auth flow, you find out one of two ways:
>
> a) You happened to read the changelog that day
> b) Your code breaks in production
>
> For most teams, it's (b). Every time.

> **4/** Breaking changes consistently rank among the top concerns in API developer surveys.
>
> Yet the tooling barely exists. Most teams either check manually (unsustainable) or use generic website monitors (too noisy).

> **5/** APIDelta works differently:
>
> - Paste your API changelog URLs
> - AI reads every entry and classifies it: BREAKING, DEPRECATION, or INFO
> - Set alert rules by severity, API, or keyword
> - Get Slack or email alerts with exactly what changed
>
> Setup: under 2 minutes. No agents, no SDKs.

> **6/** The AI classification is the key differentiator.
>
> Basic change detection tells you "something changed."
>
> APIDelta tells you "the /v2/payments endpoint now requires an idempotency header — this is a breaking change, severity critical, action needed before March 15."

> **7/** It's live today.
>
> Free trial: 3 APIs, 14 days, no credit card.
> Starter: $49/mo (10 APIs)
> Pro: $99/mo (50 APIs)
>
> apidelta.dev
>
> What APIs would you monitor first?

**Posting notes**: Launch day (Day 1). Pin tweet 1 to profile. Quote-tweet tweet 7 with a screenshot of the dashboard.

---

### Thread 2: "What We Learned Building This"

> **1/** I shipped a SaaS MVP in 4 weeks as a solo engineer.
>
> Here's every non-obvious thing I learned building APIDelta (an AI-powered API changelog monitor).
>
> Some of these cost me days. Saving you the trouble.

> **2/** Lesson 1: Changelog formats are chaos.
>
> I thought I'd write 3-4 parsers and cover 80% of APIs. Reality: I cataloged 50+ changelogs and found zero standardization.
>
> Some use semantic versioning. Some use dates. Some use neither. One major API provider publishes changes inside accordion elements that don't exist in the raw HTML.

> **3/** Lesson 2: AI classification > regex classification, and it's not close.
>
> I started with keyword matching: "deprecated", "removed", "breaking". Worked for obvious cases.
>
> Failed completely on: "We've updated the authentication flow to use OAuth 2.1" (breaking, but no trigger words).
>
> Switched to Claude with structured output. Accuracy jumped from ~60% to 85%+.

> **4/** Lesson 3: Structured output with tool_use is non-negotiable for classification.
>
> Free-text AI responses are unreliable for downstream logic. You need guaranteed JSON schema.
>
> Claude's tool_use feature forces the model to return exactly the fields you need: type, severity, endpoints, summary. No parsing. No "oops, the model forgot a field."

> **5/** Lesson 4: Don't build what you don't need for validation.
>
> Things I skipped for MVP:
> - Redis/Bull queues (cron + in-process is fine for <100 sources)
> - Playwright for JS-rendered pages (Cheerio handles 90%+ of changelogs)
> - Custom notification service (Nodemailer + Slack webhooks)
>
> Ship the 90% case. Handle edge cases after validation.

> **6/** Lesson 5: Stripe integration is easier than you think, harder than the docs suggest.
>
> The Checkout + webhook + Customer Portal combo handles 95% of billing needs.
>
> The tricky part: webhook event ordering is not guaranteed. Your code needs to be idempotent and handle events arriving out of sequence.

> **7/** Lesson 6: Your landing page is not your product.
>
> I spent too long on the landing page. Should have deployed the core product earlier and iterated on the page with real traffic data.
>
> Lesson learned: ugly + live > polished + localhost.

> **8/** Tech stack for the curious:
>
> - Frontend: Next.js 15 + Tailwind + shadcn/ui
> - Backend: NestJS + Prisma + PostgreSQL
> - AI: Claude API (Haiku for classification — fast + cheap)
> - Crawler: Cheerio
> - Auth: NextAuth.js v5
> - Deploy: Vercel + Railway
>
> Total monthly infra cost at launch: ~$25

> **9/** Biggest takeaway: the hardest part of building a solo SaaS isn't the code.
>
> It's deciding what NOT to build. Every feature you add before launch is a feature that delays learning whether anyone actually wants this.
>
> Ship the smallest thing that delivers the core value. Then listen.

**Posting notes**: Post Day 3-5. This is the "building in public" thread that performs well with indie hacker and developer audiences. Good engagement driver.

---

### Thread 3: Developer Pain-Point Thread

> **1/** Hot take: the way most teams handle third-party API changes is embarrassingly broken.
>
> And it's costing engineering orgs thousands of dollars per incident.
>
> Let me explain.

> **2/** Scenario that happens every week at SaaS companies:
>
> A third-party API you depend on ships a breaking change. An endpoint now requires a new header. Or a field got renamed. Or an auth flow changed.
>
> The changelog was updated 4 days ago. Nobody on your team saw it.

> **3/** Your monitoring catches the symptoms: 500 errors spike, a webhook stops firing, user-facing features break.
>
> An engineer gets paged. Spends 2 hours debugging. Eventually traces it to the API change. Implements a fix. Tests. Deploys.
>
> Total cost: 4+ engineer-hours. Plus customer impact. Plus on-call burnout.

> **4/** Conservative math:
>
> - 4 hours at $100/hr fully loaded = $400 per incident
> - Most teams integrate with 10-30 APIs
> - Each API ships 2-4 notable changes per quarter
>
> If even 10% of those cause incidents, you're looking at $2,000-5,000/year in pure reactive firefighting.

> **5/** The fix isn't complicated. It's just... missing from most toolchains.
>
> You monitor uptime (Pingdom, etc). You monitor performance (APM tools). You monitor errors (Sentry, etc).
>
> But who monitors the changelog of the APIs you depend on?
>
> Almost nobody. And that's the gap.

> **6/** I built APIDelta specifically for this:
>
> AI reads your API changelogs → classifies each change by severity → alerts you before it breaks your code.
>
> $49/mo vs $400+ per incident. The math is straightforward.
>
> apidelta.dev — free trial, 3 APIs, no card required.

> **7/** Genuine question for engineering leads:
>
> How does your team currently handle third-party API changes?
>
> a) Manual changelog checking
> b) RSS reader
> c) We don't (pray nothing breaks)
> d) Something else
>
> Reply — I'm genuinely curious about the workarounds people have built.

**Posting notes**: Post Day 7-8. The poll-style ending drives replies. Engage with every response — this is a conversation thread, not a broadcast.

---

## Reddit Posts

### r/webdev — "How do you keep track of breaking changes in your API dependencies?"

**Title**: How do you keep track of breaking changes in your API dependencies?

**Body**:

> Genuine question for teams that integrate with a bunch of third-party APIs.
>
> I've been thinking about this problem a lot lately. My team integrates with ~15 external APIs (payment processing, email, auth providers, etc.), and keeping up with their changelogs is basically impossible.
>
> The approaches I've tried:
>
> 1. **Manual checking** — I set a weekly reminder to scan changelogs. Lasted about 3 weeks before I started ignoring it. There's no standard format, some APIs publish changes in blog posts, some in dedicated changelog pages, some in GitHub releases.
>
> 2. **RSS feeds** — Works for the ~30% of APIs that have RSS. Misses everything else. Also, RSS readers show you everything — I don't care about new features, I care about breaking changes.
>
> 3. **Generic website change monitors** — Too noisy. They flag every CSS change, every footer update, every new blog post. The signal-to-noise ratio makes it unusable.
>
> 4. **"We'll find out when it breaks"** — The current de facto approach. Not great.
>
> The core problem seems to be that changelogs are unstructured text. You need something that actually *understands* what "we're deprecating the /v1/users endpoint" means vs "we've added a new dashboard feature."
>
> I ended up building a tool that uses AI to read changelogs and classify changes by severity (breaking, deprecation, informational). It sends Slack/email alerts only for changes that actually need attention. Called it APIDelta — https://apidelta.dev if anyone's curious.
>
> But I'm more interested in hearing: **what's your current approach?** Have you built internal tooling for this? Do you just accept the risk? Is there a workflow I'm missing?

**Posting notes**: r/webdev rewards genuine discussion. The product mention is buried in context, not the headline. Post Tuesday or Wednesday, 10 AM - 12 PM ET. Engage with EVERY reply for at least 4-6 hours.

---

### r/devops — "API changelog monitoring as part of incident prevention"

**Title**: Monitoring third-party API changelogs — the gap in most incident prevention strategies

**Body**:

> Most incident prevention stacks look something like:
>
> - Uptime monitoring (synthetic checks, ping)
> - APM / distributed tracing
> - Error tracking (Sentry, etc.)
> - Log aggregation
> - Alerting on metrics thresholds
>
> All of these are *reactive*. They tell you something is broken. They don't tell you something is *about to* break.
>
> There's one category of incident that's almost entirely preventable: third-party API breaking changes. These are announced in changelogs days or weeks before they take effect. The information is public. You just have to read it.
>
> But nobody reads changelogs for 15+ API dependencies consistently. The formats are all different (HTML pages, RSS, GitHub releases, blog posts), there's no standard notification system, and the signal-to-noise ratio is terrible — 90% of changelog entries are new features and bug fixes that don't affect your integration.
>
> I've been working on this problem and built an AI-based changelog monitor (APIDelta — https://apidelta.dev) that crawls changelog pages and classifies each entry as breaking, deprecation, or informational. The idea is that you get an alert *before* the change hits, not after your error rate spikes.
>
> For the devops/SRE crowd: **where does third-party API change monitoring fit in your incident prevention strategy?** Is this a problem you've formalized, or is it still in the "hope for the best" category?
>
> Curious how different teams handle this, especially at scale (30+ API integrations).

**Posting notes**: r/devops values operational perspective. Frame this as an infrastructure gap, not a product pitch. Post Wednesday or Thursday. The question at the end drives discussion.

---

### r/programming — Technical deep-dive angle (link post)

**Title**: Using AI to classify API changelog entries by severity — lessons from parsing 50+ changelog formats

**Body** (if self-post; otherwise use as comment on a Dev.to link post):

> I spent the last month building a system that monitors third-party API changelogs and classifies each entry as breaking, deprecation, or informational using AI.
>
> Some technical observations from the project:
>
> **The parsing problem is harder than expected.** There is no standard format for API changelogs. I cataloged 50+ popular APIs and found: plain HTML with `<h2>` per version, HTML with accordion/collapsible sections, RSS feeds (some valid, some broken), GitHub Releases (markdown), and hybrid formats that mix blog content with changelog entries. Any system that claims to "monitor changelogs" needs to handle all of these.
>
> **Regex-based classification fails on non-obvious breaking changes.** Keyword matching ("deprecated", "removed", "breaking") catches ~60% of breaking changes. It misses things like "authentication now requires OAuth 2.1" or "the response format for /users has been updated to include pagination by default." These are breaking changes described in natural language without trigger words.
>
> **Structured output from LLMs solves the downstream problem.** Free-text classification ("this looks like a breaking change") is hard to build alerting logic on. Using Claude's tool_use feature to force structured JSON output — `{type: "BREAKING", severity: "critical", endpoints: ["POST /v2/payments"], summary: "..."}` — means every classification result has a guaranteed schema. Alert rules can evaluate structured fields directly.
>
> **The accuracy sweet spot.** Using Claude Haiku with a focused prompt and structured output, classification accuracy on a hand-labeled test set is ~85% for breaking vs non-breaking. The remaining errors are mostly edge cases where the changelog entry is genuinely ambiguous (e.g., "improved error messages" — is that breaking if you parse error strings?).
>
> **Cost is negligible.** Haiku processes a typical changelog entry (~200-500 tokens) for fractions of a cent. Even monitoring 50 APIs with daily crawls, the AI cost is under $5/month.
>
> The project is APIDelta (https://apidelta.dev) — open to feedback on the approach. The broader question I'm interested in: **what other developer tooling problems are fundamentally NLU problems being solved with regex?**

**Posting notes**: r/programming wants technical depth. Lead with the technical insights, not the product. The product mention is a single sentence near the end. Post Tuesday, 9-11 AM ET. The closing question drives technical discussion.

---

## Indie Hackers Post

**Title**: Launching APIDelta — AI-powered API changelog monitoring ($49/mo, solo founder)

**Body**:

> Hey IH!
>
> I'm Jobelo, a principal engineer launching my first solo SaaS: **APIDelta** — an AI-powered API changelog monitor for engineering teams.
>
> ### The problem
>
> Engineering teams integrate with dozens of third-party APIs (Stripe, Twilio, GitHub, OpenAI, etc.). Each API publishes changes on their own changelog page — different formats, different schedules, no standard notification.
>
> When a breaking change ships, most teams find out from their error logs, not from the changelog. Breaking changes are one of the top reasons API integrations fail silently.
>
> ### What APIDelta does
>
> 1. You add your API changelog URLs
> 2. A crawler checks them on a schedule (every 6 hours)
> 3. AI (Claude) reads each changelog entry and classifies it: BREAKING, DEPRECATION, or INFO
> 4. Your team gets Slack or email alerts only for changes that need attention
>
> The key differentiator from generic website monitoring tools is AI classification. Instead of "something changed on this page," you get "the /v2/payments endpoint now requires an idempotency header — breaking, severity critical."
>
> ### The numbers
>
> - **Build time**: 4 weeks (solo, evenings + weekends)
> - **Tech stack**: Next.js 15, NestJS, Prisma, PostgreSQL, Claude API, Cheerio
> - **Monthly infra cost**: ~$25 (Vercel free tier + Railway + Neon + Claude API)
> - **Pricing**: Starter $49/mo (10 APIs), Pro $99/mo (50 APIs)
> - **Free trial**: 14 days, 3 APIs, no card required
> - **Revenue goal**: $500 MRR within 90 days (10 Starter customers)
>
> ### Key decisions
>
> **Why not open source?** The crawler and parser logic are commodity. The value is in the AI classification + alert pipeline + hosted service. Open source would give away the moat for a product that's already underpriced relative to the market.
>
> **Why $49/mo and not $19/mo?** The buyer is an engineering lead at a SaaS company with 10-100 people. $49/mo is a no-brainer compared to the cost of one breaking change incident ($400+ in engineer time). Underpricing signals "toy tool" to this buyer.
>
> **Why changelogs and not OpenAPI spec diffing?** Most API providers don't publish machine-readable specs consistently. Changelogs are the universal communication channel. If an API provider announces a change, it's in the changelog.
>
> **Why AI and not regex?** Tested both. Regex catches ~60% of breaking changes (keyword matching on "deprecated", "removed", etc.). AI catches ~85%+ because it understands context — "authentication now requires OAuth 2.1" is a breaking change with zero trigger keywords.
>
> ### Distribution plan
>
> All async — no sales calls, no conferences.
>
> - Product Hunt launch (prepared)
> - Show HN post
> - Google Ads ($200 demand validation budget)
> - Dev.to technical articles (3 planned)
> - Reddit (r/webdev, r/devops, r/programming — value-first posts)
> - SEO pages targeting "API changelog monitoring", "API breaking change alerts"
> - Newsletter submissions (TLDR, Changelog, DevOps Weekly, Console.dev)
>
> Kill criteria: < 5 trial signups by day 14, or < 2 paying customers by day 30.
>
> ### What I'd do differently
>
> 1. **Deploy earlier.** I spent too long polishing before getting in front of users. Should have deployed a rough version at week 2 and iterated with real feedback.
> 2. **Validate with ads first.** I should have run the Google Ads campaign before building, not after. $50 on ads could have validated demand in 3 days.
> 3. **Simpler auth for MVP.** NextAuth.js v5 is powerful but complex. Magic links + GitHub OAuth is overkill for an MVP — could have started with just email/password.
>
> Would love feedback on pricing, positioning, or the distribution plan. Happy to answer questions about the build process.
>
> [link to APIDelta]

**Posting notes**: Indie Hackers values transparency, real numbers, and honest reflection. The "what I'd do differently" section builds credibility. Post any weekday.

---

## Dev.to Article

**Title**: How We Built an AI-Powered API Changelog Monitor

**Tags**: `webdev`, `ai`, `api`, `typescript`

**Cover image**: Dashboard screenshot showing the change feed with severity badges

---

Every engineering team has a blind spot: third-party API changes.

You monitor uptime. You monitor errors. You monitor performance. But who monitors the changelogs of the 15+ APIs your product depends on?

For most teams, the answer is: nobody. Or at best, someone who checks manually for a few weeks before giving up.

I built APIDelta to close this gap. It's an AI-powered changelog monitor that crawls third-party API changelogs, classifies each change by severity, and alerts your team before breaking changes hit production.

Here's how we built it, what we learned, and the technical decisions behind the architecture.

## The Problem: Changelog Chaos

Before writing any code, I cataloged 50+ popular API changelogs to understand the landscape. The results were sobering:

| Format | % of APIs | Example |
|--------|-----------|---------|
| Plain HTML pages | ~45% | Stripe, SendGrid |
| GitHub Releases | ~20% | Prisma, many open-source APIs |
| RSS/Atom feeds | ~20% | Some overlap with HTML |
| Blog posts mixed with changelog | ~10% | Various |
| Custom/hybrid formats | ~5% | Accordion UIs, JavaScript-rendered |

There is no standard. No universal RSS feed. No machine-readable format that works across providers. The only reliable constant is that changelogs exist as human-readable text somewhere on the provider's website.

This means any monitoring system needs to:
1. Handle multiple input formats (HTML, RSS, GitHub Releases)
2. Extract individual changelog entries from unstructured pages
3. Understand the *content* of each entry (not just detect that it changed)

## Architecture Overview

```
                     ┌─────────────┐
                     │   Scheduler  │
                     │  (cron, 6h)  │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │   Crawler    │
                     │  (Cheerio)   │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │  Classifier  │
                     │ (Claude API) │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │  Alert Engine│
                     │ (rules eval) │
                     └──────┬───────┘
                            │
                   ┌────────┴────────┐
                   │                 │
            ┌──────▼──────┐  ┌──────▼──────┐
            │    Email     │  │    Slack     │
            │  (SMTP)      │  │  (webhook)   │
            └─────────────┘  └─────────────┘
```

**Tech stack:**
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind CSS + shadcn/ui
- **Backend**: NestJS 11 + TypeScript + Prisma + PostgreSQL
- **AI**: Anthropic Claude API (Haiku model for classification)
- **Crawler**: Cheerio for HTML parsing
- **Auth**: NextAuth.js v5 (magic links + GitHub OAuth)
- **Payments**: Stripe (Checkout + Customer Portal)
- **Deploy**: Vercel (frontend) + Railway (API) + Neon (PostgreSQL)

## Step 1: The Crawler

The crawler's job is simple in theory: fetch a URL, extract individual changelog entries. In practice, it's the messiest part of the system.

### Multi-Pattern Extraction

Since every changelog has a different HTML structure, the crawler uses a priority-ordered list of extraction patterns:

```typescript
// Simplified extraction logic
const patterns = [
  // Pattern 1: Entries wrapped in <article> or <section> tags
  { selector: 'article, section[class*="changelog"]', type: 'semantic' },

  // Pattern 2: Entries separated by <h2> or <h3> headers (most common)
  { selector: 'h2, h3', type: 'header-delimited' },

  // Pattern 3: Date-based grouping
  { selector: '[class*="date"], time', type: 'date-grouped' },

  // Pattern 4: List items in a changelog container
  { selector: '.changelog li, .release-notes li', type: 'list' },
];
```

The crawler tries each pattern and scores the results by heuristic quality (number of entries extracted, average entry length, presence of dates). The highest-scoring extraction wins.

For RSS feeds, we use a standard XML parser. For GitHub Releases, we hit the GitHub API directly (`GET /repos/:owner/:repo/releases`).

### Storing Raw Data

Every crawl stores both the raw HTML and the extracted text. This lets us re-process historical data when we improve the extraction logic — no need to re-crawl.

```prisma
model CrawlRun {
  id          String   @id @default(cuid())
  sourceId    String
  source      ApiSource @relation(fields: [sourceId], references: [id])
  rawHtml     String   @db.Text
  extractedText String @db.Text
  entriesFound  Int
  status      CrawlStatus
  createdAt   DateTime @default(now())
}
```

## Step 2: AI Classification

This is where APIDelta differentiates from basic change detection tools.

### Why Not Regex?

I started with keyword matching. Here's a simplified version:

```typescript
function classifyWithRegex(text: string): ChangeType {
  const breakingKeywords = /\b(breaking|removed|deprecated|sunset|discontinued)\b/i;
  const deprecationKeywords = /\b(deprecated|deprecating|end.of.life|legacy)\b/i;

  if (breakingKeywords.test(text)) return 'BREAKING';
  if (deprecationKeywords.test(text)) return 'DEPRECATION';
  return 'INFO';
}
```

This works for obvious cases like "Deprecated: /v1/users endpoint." It fails completely on:

- "Authentication now requires OAuth 2.1" (breaking, no trigger words)
- "The response format for /users includes pagination by default" (breaking — pagination changes response shape)
- "We've streamlined the onboarding flow" (sounds like UI, could be API)

Regex accuracy on a hand-labeled test set: **~60%**.

### The AI Approach

We send each changelog entry to Claude (Haiku model) with a classification prompt. The critical design decision: **use tool_use for structured output**, not free-text responses.

```typescript
const classificationResult = await anthropic.messages.create({
  model: 'claude-haiku-4-5',
  max_tokens: 1024,
  tools: [{
    name: 'classify_change',
    description: 'Classify an API changelog entry',
    input_schema: {
      type: 'object',
      properties: {
        changeType: {
          type: 'string',
          enum: ['BREAKING', 'DEPRECATION', 'NON_BREAKING', 'INFO'],
        },
        severity: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
        },
        affectedEndpoints: {
          type: 'array',
          items: { type: 'string' },
        },
        summary: {
          type: 'string',
          description: 'One-sentence plain English summary of the change',
        },
        actionRequired: {
          type: 'boolean',
        },
      },
      required: ['changeType', 'severity', 'summary', 'actionRequired'],
    },
  }],
  tool_choice: { type: 'tool', name: 'classify_change' },
  messages: [{
    role: 'user',
    content: `Classify this API changelog entry:\n\n${entryText}`,
  }],
});
```

Key benefits of this approach:

1. **Guaranteed schema.** Every response has exactly the fields we need. No parsing, no "the model forgot to include severity."
2. **Downstream simplicity.** Alert rules evaluate structured fields directly: `if (result.severity === 'critical' && result.changeType === 'BREAKING')`.
3. **Auditability.** Every classification is stored as structured JSON. You can review and override.

AI accuracy on the same test set: **~85%** for breaking vs non-breaking.

### Cost Analysis

Using Claude Haiku, a typical changelog entry (200-500 tokens input, ~100 tokens output) costs approximately $0.0003 per classification.

Monitoring 50 APIs with daily crawls, averaging 3 new entries per crawl:

```
50 APIs × 3 entries × 365 days × $0.0003 = ~$16/year
```

AI classification cost is negligible in the overall infrastructure budget.

## Step 3: The Alert Engine

The alert engine evaluates rules against classified changes and dispatches notifications.

### Alert Rule Schema

```prisma
model AlertRule {
  id             String   @id @default(cuid())
  teamId         String
  name           String
  severityThreshold String  // 'critical', 'high', 'medium', 'low'
  changeTypes    String[] // ['BREAKING', 'DEPRECATION']
  sourceFilter   String[] // specific source IDs, or empty for all
  keywords       String[] // optional keyword match
  channels       String[] // ['email', 'slack']
  isActive       Boolean  @default(true)
}
```

Rules are evaluated after every classification run. If a classified change matches a rule's criteria, an alert is created and dispatched.

### Multi-Channel Dispatch

Alerts go to email (via SMTP/Nodemailer) and Slack (via incoming webhooks). The Slack message includes severity color-coding, affected endpoints, and a direct link to the change in the dashboard.

Both transports support a "dry run" mode for development — logs the alert without sending.

## Step 4: The Dashboard

The frontend is a Next.js 15 App Router application with:

- **Change feed**: Filterable by severity, source, and date. Each entry shows the AI classification badge, affected endpoints, and source API.
- **Source management**: Add/remove monitored APIs. Quick-add popular sources (Stripe, Twilio, GitHub, OpenAI).
- **Alert rules**: CRUD interface with real-time preview of what would match.
- **Onboarding**: Activation checklist for new users (add source → create alert → see results).

We use shadcn/ui for components and Tailwind CSS for styling. The dashboard is server-rendered with client-side interactivity where needed.

## Lessons Learned

**1. Start with the simplest infrastructure.** We initially planned Bull + Redis for job queues. Replaced with NestJS `@nestjs/schedule` cron jobs. For <100 monitored sources, cron + in-process is fine. Redis can come later if needed.

**2. Store raw data.** Every crawl stores the raw HTML. When we improve extraction patterns, we can re-process without re-crawling. This has already saved time during development.

**3. AI costs are not the bottleneck.** Before building, I worried about AI classification costs at scale. In practice, even aggressive monitoring costs pennies per day. The real costs are infrastructure (hosting, database) not AI.

**4. Structured output is mandatory for production AI.** Free-text AI responses are fine for demos. For production systems where downstream logic depends on classification results, you need guaranteed schemas. Tool_use solves this elegantly.

**5. Deploy earlier.** I spent 4 weeks building before deploying. Should have deployed at week 2 with a rough version and iterated with real feedback. The longest risk in a solo SaaS isn't technical — it's whether anyone wants what you're building.

## What's Next

- **More changelog formats**: Playwright-based crawling for JavaScript-rendered changelogs
- **Weekly digest emails**: Summary of all changes across monitored APIs
- **GitHub App integration**: Open issues or post to Discussions when breaking changes are detected
- **Classification feedback loop**: Let users correct classifications to improve accuracy over time

## Try It

APIDelta is live with a 14-day free trial (3 APIs, no credit card required).

If your team integrates with third-party APIs — and whose doesn't? — give it a look.

[apidelta.dev](https://apidelta.dev)

I'd love feedback on the approach, the classification accuracy, or the developer experience. Drop a comment or find me on Twitter/X.

---

*Built with Next.js 15, NestJS, Prisma, Claude API, and Cheerio. Deployed on Vercel + Railway + Neon.*

---

## Show HN Post

**BLOCKED**: HN account `Ignusmart` has 1 karma, 0 comments. Need 50+ karma and 15-20 comments before posting. Target date: ~April 28-May 2.

**Title**: Show HN: APIDelta — AI-powered API changelog monitoring for engineering teams

**URL**: https://apidelta.dev

**Body** (text field on Show HN):

> APIDelta monitors third-party API changelogs (Stripe, Twilio, Cloudflare, etc.) and uses AI to classify each entry as breaking, deprecation, or informational. When something needs attention, it alerts your team via Slack or email.
>
> The problem: most teams integrate with 10-30 APIs. Each publishes changes on their own changelog page in different formats (HTML, RSS, GitHub Releases). Nobody monitors these consistently. Teams find out about breaking changes from production errors.
>
> How it works: paste a changelog URL → AI reads and classifies every entry → alert rules dispatch Slack/email notifications for the changes that matter.
>
> The AI classification is the key differentiator over generic website change monitors. Instead of "this page changed," you get "the /v2/payments endpoint now requires an idempotency header — breaking, severity critical."
>
> Built solo with Next.js 15, NestJS, Prisma, Claude API (Haiku for classification), and Cheerio for HTML parsing. Monthly infra cost: ~$25.
>
> Free trial: 3 APIs, 14 days, no credit card. Pricing: $49/mo (10 APIs) or $99/mo (50 APIs).
>
> Would love feedback on the approach — especially whether the AI classification accuracy matches what you'd expect from real changelogs you follow.

**Posting notes**: Post Tuesday or Wednesday, 9-11 AM ET. Keep the text factual and understated — HN penalizes hype. Engage with every comment for at least 6 hours. Do NOT ask friends to upvote.
