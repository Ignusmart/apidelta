# DriftWatch — Launch & Distribution Strategy

**Created**: 2026-04-05 (Iteration 23)
**Constraint**: Async-only distribution. No calls, no conferences, no high-touch sales. Customers come via SEO, ads, PLG, and community content.
**Budget**: $200 Google Ads (already planned in deploy.md) + $0 organic channels

---

## Table of Contents

1. [30-Day Launch Timeline](#30-day-launch-timeline)
2. [Product Hunt Launch Plan](#1-product-hunt-launch-plan)
3. [Hacker News Strategy](#2-hacker-news-strategy)
4. [Developer Community Outreach](#3-developer-community-outreach)
5. [SEO Content Strategy](#4-seo-content-strategy)
6. [Google Ads Enhancements](#5-google-ads-enhancements)
7. [Integration Directory Listings](#6-integration-directory-listings)
8. [Newsletter & Podcast Outreach](#7-newsletter--podcast-outreach)
9. [Social Media Strategy](#8-social-media-strategy)
10. [ORB Channel Map](#orb-channel-map)
11. [Launch Day Checklist](#launch-day-checklist)
12. [Success Metrics](#success-metrics)

---

## 30-Day Launch Timeline

### Pre-Launch (Days -7 to 0)
- [ ] Register domain, provision DB, deploy to production
- [ ] Create Product Hunt "Coming Soon" page
- [ ] Write and schedule 3 LinkedIn posts + 3 Twitter/X threads
- [ ] Draft Show HN post
- [ ] Draft 2 Dev.to articles
- [ ] Prepare Product Hunt assets (logo, screenshots, GIF demo, gallery images)
- [ ] Set up Google Ads campaign (paused, ready to activate)
- [ ] Submit Slack App Directory listing
- [ ] Identify and bookmark 10 newsletter submission forms
- [ ] Record 60-second product walkthrough GIF

### Week 1: Launch Week (Days 1-7)
| Day | Channel | Action |
|-----|---------|--------|
| Mon (Day 1) | Product Hunt | Launch listing at 12:01 AM PT. Engage all day. |
| Mon (Day 1) | Twitter/X | Thread: "I built an AI-powered API change monitor. Here's why." |
| Mon (Day 1) | LinkedIn | Post: launch announcement with product screenshot |
| Mon (Day 1) | Google Ads | Activate campaign ($15/day) |
| Tue (Day 2) | Hacker News | Post Show HN (9-10 AM ET) |
| Tue (Day 2) | Product Hunt | Continue engaging with comments |
| Wed (Day 3) | Dev.to | Publish article #1: "How we use AI to classify API breaking changes" |
| Thu (Day 4) | Reddit | Post in r/webdev (value-first, not promotional) |
| Fri (Day 5) | Twitter/X | Thread: technical deep-dive on AI classification approach |
| Fri (Day 5) | LinkedIn | Post: "The $4,000/hour cost of API breaking changes" |
| Sat-Sun | — | Monitor, respond to comments, collect feedback |

### Week 2: Content Push (Days 8-14)
| Day | Channel | Action |
|-----|---------|--------|
| Mon | Dev.to | Publish article #2: "5 API changelog monitoring strategies for SaaS teams" |
| Tue | Newsletter outreach | Submit to TLDR, Changelog, Bytes.dev, DevOps Weekly |
| Wed | Reddit | Post in r/devops (operational angle) |
| Thu | SEO | Publish first long-tail page: "/use-cases/api-changelog-monitoring" |
| Fri | LinkedIn | Post: customer pain story / use case |
| Fri | Twitter/X | Thread: "APIs that broke production this month" (recurring series idea) |

### Week 3: SEO & Ads Optimization (Days 15-21)
| Day | Channel | Action |
|-----|---------|--------|
| Mon | SEO | Publish "/use-cases/breaking-api-change-alerts" |
| Tue | Google Ads | Review first 2 weeks of data. Kill bad keywords, double down on winners. |
| Wed | SEO | Publish "/use-cases/api-deprecation-monitoring" |
| Thu | Reddit | Post in r/programming (technical angle) |
| Fri | LinkedIn | Post: lessons learned from building DriftWatch |
| Fri | Twitter/X | Thread: "How Stripe, Twilio, and GitHub publish changelog updates" |

### Week 4: Momentum & Review (Days 22-30)
| Day | Channel | Action |
|-----|---------|--------|
| Mon | SEO | Publish comparison page: "/compare/api-change-monitoring-tools" |
| Tue | Newsletter follow-up | Follow up on week 2 submissions that didn't respond |
| Wed | Dev.to | Publish article #3: technical post on changelog parsing |
| Thu | Google Ads | Final $200 budget review. Decision: scale, optimize, or kill. |
| Fri | All | 30-day retrospective: what worked, what to double down on |

---

## 1. Product Hunt Launch Plan

### Listing Copy

**Tagline** (60 chars max):
> AI-powered API change monitoring for engineering teams

**Description** (260 chars max):
> DriftWatch monitors third-party API changelogs and uses AI to classify breaking vs. non-breaking changes. Get Slack and email alerts before breaking changes hit production. Set up in under 2 minutes. Start free with 3 APIs.

**Topics**: Developer Tools, SaaS, Artificial Intelligence, APIs, DevOps

### Maker Comment (post immediately after launch)
> Hey Product Hunt! I'm Jobelo, a principal engineer who's spent years integrating third-party APIs.
>
> The pain is real: you find out about a breaking API change when your error logs explode at 2 AM. The changelog update was buried in a 40-item release note three days ago.
>
> DriftWatch fixes this. Paste your API changelog URLs, and our AI reads every update, classifies it by severity, and alerts your team on Slack or email — before the change breaks your code.
>
> **What makes it different:**
> - AI classification (not basic text diffs) — breaking, deprecation, and informational changes
> - Works with any changelog format: HTML pages, RSS feeds, GitHub Releases
> - $49/mo for 10 APIs — a fraction of what enterprise monitoring tools charge
> - Setup takes under 2 minutes. No agents, no SDKs, nothing to install.
>
> Free trial: 3 APIs for 14 days, no credit card required.
>
> I'd love your feedback — especially which APIs you'd monitor first. Happy to answer any questions!

### Visual Assets Needed
- [ ] **Logo**: 240x240 PNG (already have brand assets)
- [ ] **Gallery images** (5 max, 1270x760):
  1. Dashboard overview showing monitored APIs with change counts
  2. Change feed with AI severity badges (BREAKING in red, DEPRECATION in yellow)
  3. Slack alert notification screenshot (mock with real-looking data)
  4. "Add source" flow — paste URL, auto-detect, done in 3 clicks
  5. Pricing comparison visual (our price vs "enterprise monitoring tools")
- [ ] **Thumbnail GIF** (optional, 635x380): 10-second loop showing add source → crawl → alert flow

### Timing
- **Day**: Tuesday (historically highest traffic) or Thursday (less competition)
- **Time**: Launch at 12:01 AM Pacific Time (Product Hunt resets at midnight PT)
- **Avoid**: Major tech events, Apple keynotes, big PH launches you know about

### Engagement Plan
- Be online and responsive from 12:01 AM to 11:59 PM PT on launch day
- Respond to every comment within 30 minutes
- Upvote and engage with other launches (don't just promote yourself)
- Share the PH link on Twitter/X and LinkedIn the morning of launch day
- DM 10-15 people who expressed interest pre-launch to let them know it's live

---

## 2. Hacker News Strategy

### Show HN Post

**Title**:
> Show HN: DriftWatch — AI-powered monitoring for third-party API breaking changes

**Body** (keep short, HN rewards brevity and technical depth):
> I built DriftWatch because I was tired of finding out about API breaking changes from production error logs.
>
> It monitors third-party API changelogs (Stripe, Twilio, GitHub, OpenAI, etc.), uses AI to classify each change as breaking, deprecation, or informational, and sends alerts to Slack/email.
>
> How it works:
> - Paste changelog URLs (HTML pages, RSS feeds, GitHub Releases)
> - AI reads and classifies every entry with severity levels
> - Set alert rules by severity threshold, specific API, or keyword
> - Get Slack or email notifications before changes break your code
>
> Tech: Next.js 15 + NestJS + Prisma + Claude API for classification.
>
> Free tier: 3 APIs for 14 days. Paid starts at $49/mo.
>
> https://driftwatch.dev
>
> Curious what APIs you'd monitor first and if the pricing feels right.

### HN Best Practices
- **Timing**: Post Tuesday-Thursday, 9-10 AM ET (peak HN traffic)
- **DO**: Be technical, be honest about limitations, respond to every comment thoughtfully
- **DO**: Share technical decisions (why Claude for classification, why Cheerio over Playwright, accuracy numbers)
- **DO NOT**: Sound promotional. No marketing speak. No "we're 10x better than competitors."
- **DO NOT**: Ask for upvotes (this gets you flagged)
- **Respond to criticism gracefully**: HN users will challenge you. Acknowledge limitations honestly. "Good point — we don't handle OpenAPI spec diffing yet, only changelog monitoring. That's on the roadmap."
- **Engage for 4-6 hours after posting** — HN rewards active discussion

### Topics HN Cares About
- Technical architecture decisions
- AI classification accuracy and approach (what prompt, what model, what structured output)
- How you handle edge cases (changelogs with no dates, mixed formats, etc.)
- Solo founder / bootstrapping story
- Pricing transparency

---

## 3. Developer Community Outreach

### Reddit Strategy

**Key rule**: Provide value first, mention product second. Reddit aggressively downvotes self-promotion.

#### r/webdev (~2.5M members)
- **Angle**: "How do you keep track of breaking changes in your API dependencies?"
- **Format**: Discussion post asking about pain points, share your approach, mention DriftWatch as what you built to solve it
- **Timing**: Tuesday or Wednesday, 10 AM - 12 PM ET

#### r/devops (~350K members)
- **Angle**: "Monitoring third-party API changes as part of your incident prevention strategy"
- **Format**: Operational angle — how API changes cause incidents, what monitoring looks like
- **Timing**: Wednesday or Thursday

#### r/programming (~6M members)
- **Angle**: Technical deep-dive — "Using AI to classify API changelog entries by severity"
- **Format**: Link to a blog post / Dev.to article, not directly to the product
- **Timing**: Tuesday, 9-11 AM ET

#### r/SaaS (~100K members)
- **Angle**: Building in public — "Launching a $49/mo API monitoring tool as a solo founder"
- **Format**: Transparent post about the build process, decisions, pricing rationale
- **Timing**: Any weekday

### Dev.to Articles

#### Article 1: "How We Use AI to Classify API Breaking Changes" (Week 1)
- Technical deep-dive on the AI classification pipeline
- Show real examples: a Stripe changelog entry classified as BREAKING vs INFO
- Discuss prompt engineering, structured output, accuracy
- CTA: "Try it free at driftwatch.dev"

#### Article 2: "5 API Changelog Monitoring Strategies for SaaS Teams" (Week 2)
- Listicle format (high engagement on Dev.to)
- Cover: manual checking, RSS readers, custom scripts, generic website monitors, purpose-built tools
- Position DriftWatch as the purpose-built option
- Include code snippets showing how painful manual monitoring is

#### Article 3: "Parsing 50+ API Changelog Formats with Cheerio" (Week 3-4)
- Pure technical content — high value, earns credibility
- Share the actual challenges: no standard format, date parsing, entry extraction
- Open-source a small utility or share the parsing logic
- Builds backlinks and SEO value

### Other Communities
- **Indie Hackers**: Build-in-public post about the launch, revenue, and learnings
- **Lobste.rs**: Technical post only (similar to HN, very anti-promotional)
- **Hashnode**: Cross-post Dev.to articles for additional reach
- **Discord communities**: Relevant dev tool Discords (Vercel, Next.js, NestJS) — contribute first, then share when relevant

---

## 4. SEO Content Strategy

### Target Keywords & Pages

Build dedicated pages for each high-intent keyword cluster. These are NOT blog posts — they are permanent, optimized landing pages under `/use-cases/` or `/solutions/`.

#### Tier 1: High Intent (build first)
| Keyword Cluster | Target Page | Search Intent |
|---|---|---|
| API changelog monitoring | `/use-cases/api-changelog-monitoring` | Exact problem DriftWatch solves |
| API breaking change alerts | `/use-cases/breaking-api-change-alerts` | Exact solution |
| API deprecation alerts / monitoring | `/use-cases/api-deprecation-monitoring` | Specific pain point |
| API change detection tool | `/use-cases/api-change-detection` | Tool comparison intent |

#### Tier 2: Medium Intent (build weeks 3-4)
| Keyword Cluster | Target Page | Search Intent |
|---|---|---|
| API dependency tracking | `/use-cases/api-dependency-tracking` | Broader category |
| Monitor API changes | `/solutions/monitor-api-changes` | Action-oriented |
| API version monitoring | `/use-cases/api-version-monitoring` | Adjacent use case |
| Third-party API monitoring | `/solutions/third-party-api-monitoring` | Broader category |

#### Tier 3: Comparison & Alternative Pages (build month 2)
| Keyword Cluster | Target Page | Search Intent |
|---|---|---|
| API change monitoring tools | `/compare/api-change-monitoring-tools` | Comparison shopping |
| API changelog tools comparison | `/compare/changelog-monitoring-tools` | Evaluation phase |
| Best API monitoring tools 2026 | `/compare/best-api-monitoring-2026` | Listicle/roundup |

### Page Template for SEO Pages

Each `/use-cases/` page should follow this structure:
1. **H1**: Keyword-optimized headline (e.g., "API Changelog Monitoring — Automated & AI-Powered")
2. **Pain section**: 2-3 paragraphs about the problem (e.g., "Your team monitors 15 third-party APIs. Each publishes changes differently...")
3. **Solution section**: How DriftWatch solves it specifically for this use case
4. **How it works**: 3-step visual (reuse from landing page)
5. **Feature highlights**: 3-4 features most relevant to this keyword
6. **Pricing CTA**: Starter/Pro with free trial mention
7. **FAQ**: 3-5 questions specific to this keyword (generates featured snippets)
8. **JSON-LD**: FAQPage schema for rich results

### Technical SEO Priorities
- Each page gets unique `<title>`, `<meta description>`, and `<h1>`
- Internal linking: every SEO page links to landing page and to 2-3 other SEO pages
- Landing page links to SEO pages in a "Use Cases" section or footer
- Target 1,000-1,500 words per page (enough for search engines, not bloated)
- Add pages to `sitemap.ts` with priority 0.8

### Blog Strategy (Month 2+)
Once SEO pages are indexed, start a blog at `/blog/` with:
- "APIs That Broke Production This Month" — monthly recurring post (link bait, shareable)
- "How [Popular API] Publishes Changelog Updates" — individual deep-dives (e.g., Stripe, Twilio)
- "The True Cost of API Breaking Changes" — quantify the pain ($4K/hour estimate)
- "API Changelog Formats: The Good, The Bad, and The Ugly" — developer-friendly content

---

## 5. Google Ads Enhancements

The core campaign setup is in `docs/deploy.md` (Section 8). This section adds ad copy variations and optimization tips.

### Ad Copy Variations (test 3 at a time)

**Variation A (Pain-led)**:
- H1: `API Breaking Changes Caught You Off Guard?`
- H2: `AI Alerts Before They Hit Production`
- H3: `14-Day Free Trial — No Card Required`
- Desc: `DriftWatch monitors API changelogs and uses AI to classify breaking changes. Slack and email alerts. Setup in under 2 minutes.`

**Variation B (Solution-led)**:
- H1: `AI-Powered API Changelog Monitoring`
- H2: `Know About Breaking Changes First`
- H3: `Start Free — Monitor 3 APIs`
- Desc: `Stop reading changelogs manually. DriftWatch crawls 50+ changelog formats, classifies changes by severity, and alerts your team.`

**Variation C (Price-led)**:
- H1: `API Change Monitoring from $49/mo`
- H2: `AI Classification — Breaking vs Non-Breaking`
- H3: `Free Trial — No Credit Card`
- Desc: `Enterprise-grade API changelog monitoring at a fraction of the price. AI-powered severity classification. Slack + email alerts.`

### Negative Keywords (add from day 1)
- `free API monitoring` (freebie seekers)
- `API uptime monitoring` (different product — Pingdom/UptimeRobot territory)
- `API performance monitoring` (different product — Datadog territory)
- `API security monitoring` (different product)
- `API testing` (different product — Postman territory)
- `REST API monitor` (ambiguous — could mean uptime)
- `GraphQL monitoring` (we don't support this yet)

### Landing Page Optimization Tips
- Add UTM-specific messaging: if `?utm_campaign=demand_validation`, consider showing a "Welcome from Google" banner or adjusted headline
- Ensure the landing page loads in <2s on mobile (Google Ads Quality Score depends on this)
- Add phone number or chat widget — even async-only, a "Contact us" form increases Quality Score
- Test: move pricing higher on the page for paid traffic (they're further in the funnel)

---

## 6. Integration Directory Listings

### Slack App Directory
- **Priority**: HIGH — Slack alerts are a core feature
- **Action**: Submit to [Slack App Directory](https://api.slack.com/start/distributing)
- **Requirements**: OAuth flow for Slack workspace installation (currently using webhook URLs — may need to add OAuth for directory listing)
- **Listing copy**: "Get AI-classified alerts when your API dependencies publish breaking changes. DriftWatch monitors changelogs and sends alerts to your Slack channels."
- **Timeline**: Submit in week 1, approval takes 1-4 weeks
- **Note**: Being in the Slack directory provides ongoing organic discovery from teams searching for monitoring tools

### GitHub Marketplace
- **Priority**: MEDIUM — future integration opportunity
- **Action**: Build a GitHub App that opens issues or posts to Discussions when breaking changes are detected
- **Timeline**: Month 2+ (requires building the GitHub App integration)

### Other Directories
- **BetaList**: Submit pre-launch for early adopter traffic (betalist.com/submit)
- **SaaSHub**: Free listing, good for backlinks (saashub.com)
- **AlternativeTo**: List as alternative to generic website change monitors
- **G2**: Create a listing once you have 2-3 reviews
- **StackShare**: Add as a tool in the monitoring category

---

## 7. Newsletter & Podcast Outreach

### Target Newsletters

| Newsletter | Audience | Submission | Notes |
|---|---|---|---|
| **TLDR** | 1M+ devs | tldr.tech/startup/sponsor (paid) or submit free | Paid sponsorship ~$2K, but "TLDR Web Dev" has a free submissions section |
| **Changelog** | 500K+ devs | changelog.com/submit | Strong fit — they cover developer tools. Submit the HN/PH link. |
| **Bytes.dev** | 200K+ JS devs | Tweet at @uidotdev or email | JS-focused, good for "Next.js + NestJS" angle |
| **DevOps Weekly** | 40K+ devops | devopsweekly.com | Perfect fit for the operational monitoring angle |
| **Console.dev** | 30K+ devs | console.dev/submit | Curated developer tools — high quality, selective |
| **Hacker Newsletter** | 60K+ | hackernewsletter.com | Curated from HN — get featured on HN first |
| **Serverless Status** | 10K+ | cooperpress.com/submit | Relevant for teams with serverless API integrations |
| **Node Weekly** | 60K+ | cooperpress.com/submit | NestJS + Node.js backend angle |
| **React Status** | 50K+ | cooperpress.com/submit | Next.js frontend angle |

### Outreach Email Template

Subject: `DriftWatch — AI changelog monitoring for API dependencies (just launched)`

> Hi [Name],
>
> I just launched DriftWatch — a tool that monitors third-party API changelogs and uses AI to classify breaking vs. non-breaking changes, then alerts teams via Slack/email.
>
> It's solving the problem of engineering teams finding out about API breaking changes from production errors instead of proactive monitoring. AI classification means you only get alerted on what actually matters.
>
> Just launched on [Product Hunt / Hacker News] — [link].
>
> Would love to be considered for [Newsletter Name]. Happy to share more details or a demo account.
>
> — Jobelo

### Podcast Targets (Long-term, Month 2+)
- **Changelog Podcast** — developer tools focus, perfect fit
- **devtools.fm** — literally about developer tools
- **Ship It!** — deployment and operations
- **Software Engineering Daily** — pitch the AI classification technical angle
- **Indie Hackers Podcast** — solo founder / bootstrapping angle

**Podcast pitch angle**: "How AI is changing the way teams monitor API dependencies — from reactive incident response to proactive change detection."

---

## 8. Social Media Strategy

### LinkedIn (primary social channel for B2B SaaS)

**Profile optimization**: Make sure Jobelo's LinkedIn headline mentions DriftWatch. E.g., "Principal Engineer | Building DriftWatch — AI-powered API change monitoring"

#### Post 1: Launch Announcement (Day 1)
> Every engineering team has a horror story about a third-party API breaking change they found out about from their error logs.
>
> I built DriftWatch to fix that.
>
> It monitors API changelogs (Stripe, Twilio, GitHub, OpenAI, etc.), uses AI to classify every change by severity, and alerts your team on Slack or email — before it breaks your code.
>
> Today it's live. 14-day free trial, no credit card required.
>
> [link]
>
> #devtools #api #saas #engineering

#### Post 2: Pain Quantification (Day 5)
> How much does an API breaking change cost your team?
>
> Conservative estimate:
> - 2 hours to identify the root cause
> - 1 hour to implement the fix
> - 1 hour for testing and deployment
> - Plus customer impact, on-call disruption, and trust erosion
>
> At a fully loaded engineer cost of $100/hour, that's $400+ per incident. And the changelog update was published 3 days ago.
>
> Proactive monitoring costs $49/month. Reactive firefighting costs $400+ per incident.
>
> The math works itself out pretty quickly.

#### Post 3: Lessons Learned (Day 12)
> Building a micro-SaaS as a solo engineer: what I learned shipping DriftWatch in 4 weeks.
>
> [3-5 bullet points about technical or business decisions]
>
> Format: numbered list, honest, specific numbers

#### Posting cadence: 2-3x per week for the first month, then 1-2x per week

### Twitter/X (secondary channel, reach developer audience)

#### Thread 1: Launch Thread (Day 1)
> 1/ I built an AI-powered API change monitor because I was tired of finding out about breaking changes from production errors.
>
> It's called DriftWatch. Here's what it does and why I built it. [thread emoji]
>
> 2/ The problem: you integrate with 10+ third-party APIs. Each publishes changes differently — HTML pages, RSS feeds, GitHub Releases. No standard format. No standard notification.
>
> 3/ When Stripe deprecates an endpoint or Twilio changes an auth flow, you find out when your code breaks. Not from the changelog.
>
> 4/ DriftWatch crawls those changelogs automatically. AI reads every entry and classifies it: BREAKING, DEPRECATION, or INFO. You get a Slack message or email with exactly what changed and how severe it is.
>
> 5/ Setup takes under 2 minutes. Paste your changelog URLs. Set alert rules. Done. No agents, no SDKs, nothing to install.
>
> 6/ It's live today. Free trial: 3 APIs for 14 days. Plans start at $49/mo.
>
> driftwatch.dev
>
> What APIs would you monitor first?

#### Thread 2: Technical Deep-Dive (Day 5)
- How the AI classification works (prompt engineering, structured output, accuracy)
- Real examples of classified changes
- Edge cases and how they're handled

#### Posting cadence: 3-5x per week (mix of threads, standalone tweets, replies to relevant conversations)

### Engagement Strategy
- Search Twitter/X for "API breaking change", "API deprecated", "API changelog" — reply to people experiencing the pain
- Follow and engage with engineering leads at SaaS companies (your ICP)
- Share relevant content from others (not just self-promotion)

---

## ORB Channel Map

| Type | Channel | Tactic | Priority |
|------|---------|--------|----------|
| **Owned** | Website / Landing page | SEO pages, blog (month 2+) | HIGH |
| **Owned** | Email list | Capture from signups, onboarding sequence | HIGH |
| **Rented** | Product Hunt | Launch listing, all-day engagement | HIGH |
| **Rented** | Hacker News | Show HN post | HIGH |
| **Rented** | LinkedIn | 2-3 posts/week, pain-driven content | HIGH |
| **Rented** | Twitter/X | Threads, engagement, technical content | MEDIUM |
| **Rented** | Reddit | Value-first posts in r/webdev, r/devops, r/programming | MEDIUM |
| **Rented** | Dev.to | 3 articles in first month | MEDIUM |
| **Rented** | Google Ads | $200 demand validation campaign | HIGH |
| **Rented** | Slack App Directory | Listing for organic discovery | MEDIUM |
| **Borrowed** | Dev newsletters | TLDR, Changelog, Bytes, DevOps Weekly | HIGH |
| **Borrowed** | Indie Hackers | Build-in-public post | LOW |
| **Borrowed** | Podcasts | Changelog, devtools.fm (month 2+) | LOW |

---

## Launch Day Checklist

### Morning (12:01 AM - 9 AM PT)
- [ ] Product Hunt listing goes live at 12:01 AM PT
- [ ] Post first comment (maker comment) immediately
- [ ] Tweet the PH link with a short intro
- [ ] LinkedIn post with PH link
- [ ] Activate Google Ads campaign
- [ ] Email any pre-launch contacts about the launch

### Midday (9 AM - 3 PM PT)
- [ ] Post Show HN (if launching same day, otherwise save for Day 2)
- [ ] Respond to every PH comment within 30 minutes
- [ ] Monitor HN for comments and respond thoughtfully
- [ ] Share PH link in relevant Slack/Discord communities (where appropriate)
- [ ] Retweet/reshare anyone who mentions DriftWatch

### Evening (3 PM - 11:59 PM PT)
- [ ] Final round of PH comment responses
- [ ] Thank everyone who engaged
- [ ] Screenshot PH ranking for social proof
- [ ] Draft next day's social posts based on launch day feedback
- [ ] Review Google Ads first impressions/clicks

### Post-Launch Day
- [ ] Follow up with everyone who commented on PH
- [ ] Write a "launch results" tweet/post (transparency builds trust)
- [ ] Begin Dev.to article publishing schedule
- [ ] Submit to newsletters
- [ ] Review first 24 hours of analytics (traffic, signups, activation)

---

## Success Metrics

### 30-Day Targets

| Metric | Target | Kill Signal |
|--------|--------|-------------|
| Website visitors (total) | > 2,000 | < 200 |
| Free trial signups | > 30 | < 5 |
| Trial → Paid conversion | > 10% | < 3% |
| Paying customers (month 1) | > 3 | 0 |
| MRR (month 1) | > $150 | $0 |
| Product Hunt upvotes | > 100 | < 20 |
| HN points | > 30 | < 5 |
| Google Ads signups | > 5 from $200 | 0 from full spend |
| Dev.to article views | > 1,000 total | < 100 |

### Channel Attribution
- Tag all links with UTM parameters:
  - `?utm_source=producthunt&utm_medium=referral&utm_campaign=launch`
  - `?utm_source=hackernews&utm_medium=referral&utm_campaign=show_hn`
  - `?utm_source=linkedin&utm_medium=social&utm_campaign=launch`
  - `?utm_source=twitter&utm_medium=social&utm_campaign=launch`
  - `?utm_source=devto&utm_medium=referral&utm_campaign=article1`
  - `?utm_source=google&utm_medium=cpc&utm_campaign=demand_validation` (already in deploy.md)
  - `?utm_source=reddit&utm_medium=referral&utm_campaign=webdev`

### Decision Framework (Day 30)
- **3+ paying customers**: Continue. Double down on best-performing channel. Increase ads budget.
- **1-2 paying customers + 20+ trials**: Optimize. Improve onboarding, trial-to-paid conversion. Keep marketing.
- **0 paying customers + 10+ trials**: Investigate. Activation problem or pricing problem? Survey trial users.
- **0 paying customers + <5 trials from 2K+ visitors**: Landing page problem. Run page-cro again.
- **<200 visitors total**: Distribution problem. Increase ad spend, post more content, try new channels.
- **Kill criteria**: $0 MRR after 60 days with consistent marketing effort → reassess product-market fit.

---

## Internal Notes (not for user-facing content)

### Competitive Positioning
- Primary competitor: API Drift Alert ($149-749/mo, basic diff comparison, no AI)
- We undercut on price by 3-7x and differentiate on AI classification
- Secondary competitors: generic website change monitors (PageCrawl, Visualping) — no API-specific intelligence
- oasdiff: open-source, only handles OpenAPI spec diffing in CI/CD, not third-party changelog monitoring
- NEVER mention competitor names in any user-facing content, ads, or social posts
- Use phrases like "enterprise monitoring tools", "basic change detection tools", "most monitoring platforms" instead
