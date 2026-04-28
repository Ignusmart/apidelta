import type { Metadata } from "next";
import { Bot, Bell, Rss, Clock, Users, Shield } from "lucide-react";
import {
  SeoNav,
  SeoHero,
  SeoCtaBanner,
  SeoFooter,
  SeoHowItWorks,
  SeoFaqSection,
  SeoFeatureGrid,
  SeoInternalLinks,
  SeoBreadcrumb,
} from "../../_components/seo-page-shell";

export const metadata: Metadata = {
  title: "API Changelog Monitoring — Automated & AI-Powered",
  description:
    "Automate API changelog monitoring with AI-powered classification. APIDelta crawls changelogs hourly, classifies breaking changes, and alerts your team via Slack and email.",
  alternates: {
    canonical: "https://apidelta.dev/use-cases/api-changelog-monitoring",
  },
  openGraph: {
    title: "API Changelog Monitoring — Automated & AI-Powered",
    description:
      "Stop reading API changelogs manually. AI classifies every change by severity and alerts your team before breaking changes hit production.",
    type: "website",
    url: "https://apidelta.dev/use-cases/api-changelog-monitoring",
  },
  twitter: {
    card: "summary_large_image",
    title: "API Changelog Monitoring — Automated & AI-Powered",
    description:
      "Automate API changelog monitoring with AI classification. Hourly crawls, severity scoring, Slack + email alerts.",
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
    title: "HTML, RSS & GitHub Releases",
    description:
      "APIDelta handles the messy reality of how APIs publish updates — HTML changelog pages, RSS/Atom feeds, and GitHub Releases. Paste a URL and it figures out the rest.",
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
      "APIDelta checks every monitored API on the hour. When a breaking change lands, you know within 60 minutes — not when CI fails at 2 AM.",
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
    q: "How does APIDelta monitor API changelogs?",
    a: "APIDelta crawls your configured changelog URLs every hour. It supports HTML pages, RSS feeds, and GitHub Releases. When new entries are detected, AI reads and classifies each one by type (breaking, deprecation, non-breaking, informational) and severity (critical, high, medium, low). Alerts are sent to Slack or email based on your rules.",
  },
  {
    q: "Which APIs can APIDelta monitor?",
    a: "Any API that publishes a changelog, release notes, or status page. Stripe, Twilio, GitHub, OpenAI, Slack, SendGrid, Vercel, and Prisma work out of the box. If it has a URL with changelog content, APIDelta can crawl it.",
  },
  {
    q: "How is this different from using an RSS reader?",
    a: "RSS readers show you raw text with no classification. You still have to read every entry and decide if it matters. APIDelta uses AI to classify each change by severity, extract affected endpoints, and generate a summary — so you only act on what matters. It also handles HTML changelogs that have no RSS feed.",
  },
  {
    q: "How much does API changelog monitoring cost?",
    a: "APIDelta starts at $49/month for 10 monitored APIs with AI classification, Slack and email alerts, and hourly monitoring. The Pro plan at $99/month supports 50 APIs and 10 team members. Both include a 14-day free trial with no credit card required.",
  },
];

export default function ApiChangelogMonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoBreadcrumb items={[{ name: "Home", href: "/" }, { name: "Use Cases", href: "/use-cases/api-changelog-monitoring" }, { name: "API Changelog Monitoring", href: "/use-cases/api-changelog-monitoring" }]} />
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="API Changelog Monitoring"
          gradientText="Automated & AI-Powered"
          description="Your team monitors 15 third-party APIs. Each publishes changes differently — HTML pages, RSS feeds, GitHub release notes. Manually checking each one every week is tedious, error-prone, and impossible to scale. APIDelta automates the entire process with AI-powered classification."
          ctaText="Start monitoring for free"
          showArrow={false}
        />

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
                APIDelta replaces both approaches with automated, AI-powered
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
              Generic page monitors leave you to read raw diffs and figure out
              what actually broke. APIDelta is purpose-built for API
              changelogs — AI classifies each entry by severity, extracts the
              affected endpoints, and writes a plain-English summary your team
              can act on.
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
