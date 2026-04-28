import type { Metadata } from "next";
import {
  AlertTriangle,
  Bot,
  Bell,
  Clock,
  Shield,
} from "lucide-react";
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
  title: "Breaking Change Detection for Third-Party APIs",
  description:
    "Detect breaking API changes before they hit production. APIDelta uses AI to classify changelog entries by severity and alert your engineering team via Slack and email.",
  alternates: {
    canonical: "https://apidelta.dev/use-cases/breaking-change-detection",
  },
  openGraph: {
    title: "Breaking Change Detection for Third-Party APIs",
    description:
      "AI-powered breaking change detection for API dependencies. Get Slack and email alerts before breaking changes cause production incidents.",
    type: "website",
    url: "https://apidelta.dev/use-cases/breaking-change-detection",
  },
  twitter: {
    card: "summary_large_image",
    title: "Breaking Change Detection for Third-Party APIs",
    description:
      "Detect breaking API changes before they hit production. AI classifies severity, extracts affected endpoints, and alerts your team.",
  },
};

const FEATURES = [
  {
    icon: AlertTriangle,
    title: "Breaking vs Non-Breaking Classification",
    description:
      "AI reads every changelog entry and classifies it as breaking, deprecation, non-breaking, or informational. You only get alerted on what actually requires action.",
  },
  {
    icon: Bot,
    title: "Severity Scoring",
    description:
      "Each breaking change gets a severity level — critical, high, medium, or low — based on impact scope. Critical changes that affect core endpoints get escalated immediately.",
  },
  {
    icon: Bell,
    title: "Configurable Alert Rules",
    description:
      "Set severity thresholds per alert channel. Send critical changes to Slack instantly. Batch medium-severity updates into daily email digests. Filter by specific API or keyword.",
  },
  {
    icon: Clock,
    title: "Hourly Detection",
    description:
      "APIDelta crawls changelogs every hour. When a breaking change is published, you know within 60 minutes — giving your team time to prepare before the change takes effect.",
  },
  {
    icon: Shield,
    title: "Affected Endpoint Extraction",
    description:
      "AI identifies which API endpoints are affected by each breaking change and includes them in the alert. No more digging through release notes to find what matters.",
  },
  {
    icon: Bot,
    title: "Plain-English Summaries",
    description:
      "Every change gets a clear, actionable summary your whole team can understand — not a raw diff. Know what changed, why it matters, and what to do next.",
  },
];

const FAQS = [
  {
    q: "What counts as a breaking API change?",
    a: "A breaking change is any modification to an API that could cause existing integrations to fail. This includes removing endpoints, changing required parameters, modifying response formats, deprecating authentication methods, or altering rate limits. APIDelta's AI is trained to identify these patterns in changelog text.",
  },
  {
    q: "How quickly does APIDelta detect breaking changes?",
    a: "APIDelta crawls monitored changelogs every hour. When a new entry is detected, AI classifies it within seconds. If it's a breaking change that matches your alert rules, you get a Slack message or email within minutes of the changelog being updated.",
  },
  {
    q: "Can I filter alerts to only show breaking changes?",
    a: "Yes. Alert rules support severity thresholds — set your Slack channel to only receive critical and high-severity breaking changes. Lower-severity updates can go to email digests or be viewed in the dashboard without generating notifications.",
  },
  {
    q: "How accurate is the AI at detecting breaking changes?",
    a: "APIDelta achieves over 85% accuracy on breaking change classification across tested API changelogs. The AI uses structured output to ensure consistent severity scoring. False positives are rare because the classifier is tuned to err on the side of flagging potential breaking changes rather than missing them.",
  },
  {
    q: "Does APIDelta detect breaking changes in OpenAPI specs?",
    a: "APIDelta currently monitors changelog pages, release notes, and RSS feeds — the places where API providers announce changes to their users. OpenAPI spec diffing (comparing schema versions) is on the roadmap but is a different use case from changelog monitoring.",
  },
];

export default function BreakingChangeDetectionPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoBreadcrumb items={[{ name: "Home", href: "/" }, { name: "Use Cases", href: "/use-cases/breaking-change-detection" }, { name: "Breaking Change Detection", href: "/use-cases/breaking-change-detection" }]} />
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="Detect Breaking API Changes"
          gradientText="Before They Hit Production"
          description="The average engineering team loses 4+ hours per incident caused by a surprise API breaking change. The changelog update was published days ago — buried in a 40-item release note nobody had time to read. APIDelta uses AI to find those breaking changes for you."
          ctaText="Start detecting breaking changes"
        />

        {/* Pain section */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Why breaking changes catch teams off guard
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                API providers ship breaking changes more often than you think.
                Endpoints get deprecated, authentication flows change, response
                schemas evolve, rate limits tighten. Most providers announce
                these changes in changelogs weeks before they take effect — but
                nobody on your team is reading those changelogs consistently.
              </p>
              <p>
                The first sign of trouble is usually a spike in 4xx or 5xx
                errors. An on-call engineer gets paged at 2 AM. They spend an
                hour identifying the root cause — a parameter that was removed
                or an endpoint that now requires a new authentication header.
                Then they check the changelog and find the announcement from two
                weeks ago.
              </p>
              <p className="text-white">
                APIDelta catches breaking changes at the source — in the
                changelog — hours after they are published. AI classifies each
                change by severity and affected endpoints, so your team can
                prepare instead of scramble.
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
                Built specifically for breaking change detection
              </h2>
            </div>
            <SeoFeatureGrid features={FEATURES} />
          </div>
        </section>

        {/* How it works */}
        <SeoHowItWorks />

        {/* Cost comparison */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="mb-8 text-3xl font-bold tracking-tight sm:text-4xl">
              The cost of reactive vs proactive
            </h2>
            <div className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-red-500/30 bg-red-950/10 p-6 text-left">
                <p className="mb-2 text-sm font-medium uppercase text-red-400">
                  Reactive
                </p>
                <p className="mb-1 text-2xl font-bold">$400+</p>
                <p className="text-sm text-gray-400">
                  per incident — even a single 4-hour debug session at typical
                  senior engineer rates ($100/hr), before customer impact,
                  on-call disruption, and post-mortem overhead
                </p>
              </div>
              <div className="rounded-xl border border-green-500/30 bg-green-950/10 p-6 text-left">
                <p className="mb-2 text-sm font-medium uppercase text-green-400">
                  Proactive
                </p>
                <p className="mb-1 text-2xl font-bold">$49/mo</p>
                <p className="text-sm text-gray-400">
                  APIDelta Starter plan — 10 APIs monitored hourly with AI
                  classification and instant Slack/email alerts
                </p>
              </div>
            </div>
            <p className="mt-8 text-gray-500">
              One prevented incident pays for a year of APIDelta.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <SeoFaqSection faqs={FAQS} />

        {/* Internal links */}
        <SeoInternalLinks current="/use-cases/breaking-change-detection" />

        {/* CTA */}
        <SeoCtaBanner
          headline="Stop finding out about breaking changes from error logs."
          subtext="APIDelta monitors API changelogs every hour and uses AI to classify breaking changes before they hit production. Start your free trial in under 2 minutes."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
