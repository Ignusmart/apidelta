import type { Metadata } from "next";
import { GitBranch, AlertTriangle, BookOpen, Calendar, Shield, ArrowRight } from "lucide-react";
import {
  SeoNav,
  SeoHero,
  SeoCtaBanner,
  SeoFooter,
  SeoFaqSection,
  SeoFeatureGrid,
  SeoInternalLinks,
} from "../../_components/seo-page-shell";

export const metadata: Metadata = {
  title: "API Versioning Best Practices for Engineering Teams",
  description:
    "Learn API versioning best practices: URL path versioning, header versioning, sunset policies, and how to monitor third-party API version changes automatically.",
  alternates: {
    canonical: "https://driftwatch.dev/guides/api-versioning-best-practices",
  },
  openGraph: {
    title: "API Versioning Best Practices for Engineering Teams",
    description:
      "A practical guide to API versioning strategies, deprecation timelines, and monitoring version changes across your API dependencies.",
    type: "article",
    url: "https://driftwatch.dev/guides/api-versioning-best-practices",
  },
  twitter: {
    card: "summary_large_image",
    title: "API Versioning Best Practices for Engineering Teams",
    description:
      "Practical API versioning strategies: URL path, header versioning, sunset policies, and automated version monitoring.",
  },
};

const STRATEGIES = [
  {
    icon: GitBranch,
    title: "URL Path Versioning",
    description:
      "The most common approach: /v1/users, /v2/users. Clear, explicit, easy to route. Stripe, Twilio, and most payment APIs use this pattern because it is impossible to miss a version change.",
  },
  {
    icon: BookOpen,
    title: "Header Versioning",
    description:
      "Version specified via Accept or custom headers (e.g., API-Version: 2024-01-15). GitHub and Stripe use date-based header versions. Less visible but allows gradual migration.",
  },
  {
    icon: Calendar,
    title: "Date-Based Versioning",
    description:
      "Version identified by release date (e.g., 2024-01-15). Stripe popularized this pattern. Each date pins a specific API behavior, and you opt in to newer versions when ready.",
  },
  {
    icon: AlertTriangle,
    title: "Sunset Headers & Deprecation",
    description:
      "Good APIs announce deprecation before removal. The Sunset HTTP header (RFC 8594) and deprecation notices in changelogs give you a migration window — if you are watching for them.",
  },
  {
    icon: Shield,
    title: "Semantic Versioning for APIs",
    description:
      "Major version bumps signal breaking changes, minor versions add features, patches fix bugs. Works well for libraries and SDKs but less common for hosted REST APIs.",
  },
  {
    icon: ArrowRight,
    title: "Rolling Versions with Feature Flags",
    description:
      "Some APIs evolve continuously without explicit versions, using feature flags or beta endpoints instead. Changes can land at any time — making monitoring especially critical.",
  },
];

const FAQS = [
  {
    q: "What is the best API versioning strategy?",
    a: "There is no single best strategy — it depends on your API consumers. URL path versioning (/v1/, /v2/) is the most explicit and widely understood. Date-based versioning (Stripe-style) works well when you want gradual migration. Header versioning is cleaner but less discoverable. For third-party APIs you depend on, what matters is knowing when a version change happens, regardless of the strategy the provider uses.",
  },
  {
    q: "How do I know when a third-party API changes versions?",
    a: "Check the API provider's changelog, release notes, or developer blog. Many providers also send email notifications for major version changes. The challenge is doing this consistently across 10-50 API dependencies. DriftWatch automates this by crawling changelogs hourly and alerting you to version changes, deprecations, and sunset announcements.",
  },
  {
    q: "What happens if I miss an API version deprecation?",
    a: "If you miss a deprecation notice and the old version is sunset, your integration breaks. Depending on the provider, this could mean 4xx errors, missing data, or changed response formats. The impact ranges from degraded functionality to full outage. Most providers give 6-12 months of deprecation runway, but you need to be monitoring to use that time effectively.",
  },
  {
    q: "How long should an API version deprecation period last?",
    a: "Industry best practice is 12 months minimum for major version deprecations. Stripe gives 24+ months. Shorter deprecation periods (3-6 months) are common for minor changes. As a consumer, you cannot control the provider's timeline — but you can ensure your team sees every deprecation notice the day it is published.",
  },
  {
    q: "Should I pin API versions or always use the latest?",
    a: "Pin versions in production. Using 'latest' or unversioned endpoints means any change can break your integration without warning. Pin to a specific version, monitor the changelog for new versions, test compatibility, then upgrade deliberately. This is the pattern Stripe recommends and most mature engineering teams follow.",
  },
];

export default function ApiVersioningBestPracticesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="API Versioning"
          gradientText="Best Practices"
          description="Your product depends on third-party APIs that evolve on their own schedule. Understanding versioning strategies helps you plan migrations, avoid outages, and keep your integrations stable. Here is what engineering teams need to know."
          ctaText="Monitor API version changes"
        />

        {/* Educational content */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Why API versioning matters for your team
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Every API you depend on will change. Payment processors add new
                required fields. Communication APIs deprecate endpoints. AI
                providers update model versions with different response formats.
                The question is not whether changes will happen, but whether your
                team will know about them before they cause production issues.
              </p>
              <p>
                API versioning is the mechanism providers use to manage this
                evolution. Some use URL path versions (/v1/, /v2/). Others use
                date-based versions pinned via headers. Some evolve continuously
                with no explicit versioning at all. Understanding how each of
                your dependencies handles versioning helps you plan migrations
                and set up appropriate monitoring.
              </p>
              <p className="text-white">
                The best practice for consumers is straightforward: pin your API
                versions, monitor changelogs for deprecation notices and new
                versions, test compatibility before upgrading, and migrate on
                your schedule — not in response to a 2 AM outage.
              </p>
            </div>
          </div>
        </section>

        {/* Versioning strategies */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
                Strategies
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Common API versioning approaches
              </h2>
            </div>
            <SeoFeatureGrid features={STRATEGIES} />
          </div>
        </section>

        {/* Monitoring angle */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Versioning strategy only works with monitoring
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Knowing the theory of API versioning is necessary but not
                sufficient. The gap is operational: how does your team actually
                find out when a provider publishes a deprecation notice, bumps a
                version, or sunsets an endpoint?
              </p>
              <p>
                Most teams rely on email newsletters from API providers —
                notifications that get buried in inbox noise. Others assign
                someone to manually check changelogs each week. Neither approach
                scales past a handful of dependencies.
              </p>
              <p className="text-white">
                DriftWatch closes this gap by crawling your API dependencies'
                changelogs every hour and using AI to classify each update.
                Deprecation notices, version bumps, and sunset announcements are
                flagged and routed to the engineers who own each integration — so
                your versioning strategy actually gets executed.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <SeoFaqSection faqs={FAQS} />

        {/* Internal links */}
        <SeoInternalLinks current="/guides/api-versioning-best-practices" />

        {/* CTA */}
        <SeoCtaBanner
          headline="Never miss a version deprecation again."
          subtext="DriftWatch monitors your API dependencies for version changes, deprecation notices, and sunset announcements. AI classifies every update so your team acts on what matters."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
