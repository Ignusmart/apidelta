import type { Metadata } from "next";
import {
  AlertTriangle,
  Bot,
  Bell,
  Clock,
  Shield,
  ArrowRight,
} from "lucide-react";
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
  title: "Breaking Change Detection for Third-Party APIs",
  description:
    "Detect breaking API changes before they hit production. DriftWatch uses AI to classify changelog entries by severity and alert your engineering team via Slack and email.",
  alternates: {
    canonical: "https://driftwatch.dev/use-cases/breaking-change-detection",
  },
  openGraph: {
    title: "Breaking Change Detection for Third-Party APIs",
    description:
      "AI-powered breaking change detection for API dependencies. Get Slack and email alerts before breaking changes cause production incidents.",
    type: "website",
    url: "https://driftwatch.dev/use-cases/breaking-change-detection",
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
      "DriftWatch crawls changelogs every hour. When a breaking change is published, you know within 60 minutes — giving your team time to prepare before the change takes effect.",
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
    a: "A breaking change is any modification to an API that could cause existing integrations to fail. This includes removing endpoints, changing required parameters, modifying response formats, deprecating authentication methods, or altering rate limits. DriftWatch's AI is trained to identify these patterns in changelog text.",
  },
  {
    q: "How quickly does DriftWatch detect breaking changes?",
    a: "DriftWatch crawls monitored changelogs every hour. When a new entry is detected, AI classifies it within seconds. If it's a breaking change that matches your alert rules, you get a Slack message or email within minutes of the changelog being updated.",
  },
  {
    q: "Can I filter alerts to only show breaking changes?",
    a: "Yes. Alert rules support severity thresholds — set your Slack channel to only receive critical and high-severity breaking changes. Lower-severity updates can go to email digests or be viewed in the dashboard without generating notifications.",
  },
  {
    q: "How accurate is the AI at detecting breaking changes?",
    a: "DriftWatch achieves over 85% accuracy on breaking change classification across tested API changelogs. The AI uses structured output to ensure consistent severity scoring. False positives are rare because the classifier is tuned to err on the side of flagging potential breaking changes rather than missing them.",
  },
  {
    q: "Does DriftWatch detect breaking changes in OpenAPI specs?",
    a: "DriftWatch currently monitors changelog pages, release notes, and RSS feeds — the places where API providers announce changes to their users. OpenAPI spec diffing (comparing schema versions) is on the roadmap but is a different use case from changelog monitoring.",
  },
];

export default function BreakingChangeDetectionPage() {
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
              Detect Breaking API Changes{" "}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                Before They Hit Production
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
              The average engineering team loses 4+ hours per incident caused by
              a surprise API breaking change. The changelog update was published
              days ago — buried in a 40-item release note nobody had time to
              read. DriftWatch uses AI to find those breaking changes for you.
            </p>

            <a
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 hover:shadow-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Start detecting breaking changes
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
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
                DriftWatch catches breaking changes at the source — in the
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
                  per incident — 4 hours of engineer time at $100/hr, plus
                  customer impact, on-call disruption, and post-mortem overhead
                </p>
              </div>
              <div className="rounded-xl border border-green-500/30 bg-green-950/10 p-6 text-left">
                <p className="mb-2 text-sm font-medium uppercase text-green-400">
                  Proactive
                </p>
                <p className="mb-1 text-2xl font-bold">$49/mo</p>
                <p className="text-sm text-gray-400">
                  DriftWatch Starter plan — 10 APIs monitored hourly with AI
                  classification and instant Slack/email alerts
                </p>
              </div>
            </div>
            <p className="mt-8 text-gray-500">
              One prevented incident pays for a year of DriftWatch.
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
          subtext="DriftWatch monitors API changelogs every hour and uses AI to classify breaking changes before they hit production. Start your free trial in under 2 minutes."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
