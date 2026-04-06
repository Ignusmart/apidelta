import type { Metadata } from "next";
import { Bot, Bell, Rss, Clock, Users, Shield } from "lucide-react";
import {
  SeoNav,
  SeoCtaBanner,
  SeoFooter,
  SeoHowItWorks,
  SeoFaqSection,
  SeoFeatureGrid,
  SeoInternalLinks,
} from "../../_components/seo-page-shell";

export const metadata: Metadata = {
  title: "API Changelog Monitoring — Automated & AI-Powered",
  description:
    "Automate API changelog monitoring with AI-powered classification. DriftWatch crawls changelogs hourly, classifies breaking changes, and alerts your team via Slack and email.",
  alternates: {
    canonical: "https://driftwatch.dev/use-cases/api-changelog-monitoring",
  },
  openGraph: {
    title: "API Changelog Monitoring — Automated & AI-Powered",
    description:
      "Stop reading API changelogs manually. AI classifies every change by severity and alerts your team before breaking changes hit production.",
    type: "website",
    url: "https://driftwatch.dev/use-cases/api-changelog-monitoring",
  },
};

const FEATURES = [
  {
    icon: Bot,
    title: "AI-Powered Classification",
    description:
      "Every changelog entry is read by AI and classified as breaking, deprecation, or informational. No more guessing which changes matter.",
  },
  {
    icon: Rss,
    title: "50+ Changelog Formats",
    description:
      "HTML pages, RSS feeds, GitHub Releases — DriftWatch handles the messy reality of how APIs publish updates. Paste a URL and it figures out the rest.",
  },
  {
    icon: Bell,
    title: "Slack and Email Alerts",
    description:
      "Route critical changes to Slack for instant visibility. Batch lower-severity updates into email digests. Set thresholds per channel.",
  },
  {
    icon: Clock,
    title: "Hourly Monitoring",
    description:
      "DriftWatch checks every monitored API on the hour. When a breaking change lands, you know within 60 minutes — not when CI fails at 2 AM.",
  },
  {
    icon: Users,
    title: "Team Ownership",
    description:
      "Assign API ownership to engineers who maintain each integration. Route alerts to the right people automatically.",
  },
  {
    icon: Shield,
    title: "Full Audit Trail",
    description:
      "Every change, classification, and alert is logged and searchable. When a post-mortem asks if you knew about a change, the answer is in your dashboard.",
  },
];

const FAQS = [
  {
    q: "What is API changelog monitoring?",
    a: "API changelog monitoring is the practice of tracking updates published by third-party APIs your product depends on. Instead of manually checking changelog pages, you use a tool that crawls those pages automatically and notifies you when something changes — especially breaking changes that could affect your integration.",
  },
  {
    q: "How does DriftWatch monitor API changelogs?",
    a: "DriftWatch crawls your configured changelog URLs every hour. It supports HTML pages, RSS feeds, and GitHub Releases. When new entries are detected, AI reads and classifies each one by type (breaking, deprecation, non-breaking, informational) and severity (critical, high, medium, low). Alerts are sent to Slack or email based on your rules.",
  },
  {
    q: "Which APIs can DriftWatch monitor?",
    a: "Any API that publishes a changelog, release notes, or status page. Stripe, Twilio, GitHub, OpenAI, Slack, SendGrid, Vercel, and Prisma work out of the box. If it has a URL with changelog content, DriftWatch can crawl it.",
  },
  {
    q: "How is this different from using an RSS reader?",
    a: "RSS readers show you raw text with no classification. You still have to read every entry and decide if it matters. DriftWatch uses AI to classify each change by severity, extract affected endpoints, and generate a summary — so you only act on what matters. It also handles HTML changelogs that have no RSS feed.",
  },
  {
    q: "How much does API changelog monitoring cost?",
    a: "DriftWatch starts at $49/month for 10 monitored APIs with AI classification, Slack and email alerts, and hourly monitoring. The Pro plan at $99/month supports 50 APIs and 10 team members. Both include a 14-day free trial with no credit card required.",
  },
];

export default function ApiChangelogMonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoNav />

      <main id="main-content">
        {/* Hero */}
        <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl"
          />

          <div className="relative z-10 max-w-4xl">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              API Changelog Monitoring{" "}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Automated & AI-Powered
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
              Your team monitors 15 third-party APIs. Each publishes changes
              differently — HTML pages, RSS feeds, GitHub release notes. Manually
              checking each one every week is tedious, error-prone, and
              impossible to scale. DriftWatch automates the entire process with
              AI-powered classification.
            </p>

            <a
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 hover:shadow-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Start monitoring for free
            </a>
            <p className="mt-4 text-sm text-gray-500">
              14-day free trial &middot; No credit card required
            </p>
          </div>
        </section>

        {/* Pain section */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              The problem with manual changelog checking
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Every SaaS product depends on third-party APIs — payment
                processors, communication platforms, cloud providers, AI
                services. Each of these APIs evolves independently, publishing
                updates on their own schedule, in their own format, with their
                own terminology.
              </p>
              <p>
                Some publish changelog pages. Others use RSS feeds. Some push
                updates to GitHub Releases. A few bury breaking changes inside
                multi-paragraph release notes that require careful reading to
                catch the one endpoint deprecation that affects your
                integration.
              </p>
              <p>
                Engineering teams handle this one of two ways: either someone is
                assigned to manually check changelogs every week (tedious and
                unreliable), or nobody checks at all and the team finds out
                about breaking changes when production errors spike at 2 AM.
              </p>
              <p className="text-white">
                DriftWatch replaces both approaches with automated, AI-powered
                changelog monitoring that classifies every change by severity
                and routes alerts to the right people.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
                Features
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need for API changelog monitoring
              </h2>
            </div>
            <SeoFeatureGrid features={FEATURES} />
          </div>
        </section>

        {/* How it works */}
        <SeoHowItWorks />

        {/* Pricing teaser */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
              Pricing
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              AI-powered monitoring from $49/mo
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
              Most monitoring platforms charge $149-749/mo for basic text
              diffing with no intelligence layer. DriftWatch uses AI to
              understand what changed and why it matters — at a fraction of the
              cost.
            </p>
            <a
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-8 py-3 text-base font-medium text-gray-300 transition hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              See full pricing
            </a>
          </div>
        </section>

        {/* FAQ */}
        <SeoFaqSection faqs={FAQS} />

        {/* Internal links */}
        <SeoInternalLinks current="/use-cases/api-changelog-monitoring" />

        {/* CTA */}
        <SeoCtaBanner />
      </main>

      <SeoFooter />
    </div>
  );
}
