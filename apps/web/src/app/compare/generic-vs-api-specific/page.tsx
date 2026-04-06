import type { Metadata } from "next";
import {
  SeoNav,
  SeoHero,
  SeoComparisonTable,
  SeoCtaBanner,
  SeoFooter,
  SeoFaqSection,
  SeoInternalLinks,
} from "../../_components/seo-page-shell";

export const metadata: Metadata = {
  title: "Generic Website Monitors vs API-Specific Change Detection",
  description:
    "Why generic website change monitors miss critical API changes. Compare pixel-diff tools with AI-powered API changelog monitoring built for engineering teams.",
  alternates: {
    canonical: "https://driftwatch.dev/compare/generic-vs-api-specific",
  },
  openGraph: {
    title: "Generic Website Monitors vs API-Specific Change Detection",
    description:
      "Generic monitors detect that something changed. API-specific tools tell you what changed, how severe it is, and who needs to know.",
    type: "website",
    url: "https://driftwatch.dev/compare/generic-vs-api-specific",
  },
  twitter: {
    card: "summary_large_image",
    title: "Generic Website Monitors vs API-Specific Change Detection",
    description:
      "Why generic website monitors miss critical API changes. Compare pixel-diff tools with AI-powered changelog monitoring.",
  },
};

const COMPARISON_ROWS = [
  {
    dimension: "Change detection",
    negative: "Pixel diffs or text diffs — flags every cosmetic change",
    positive: "Changelog-aware — extracts individual entries with dates and context",
  },
  {
    dimension: "Classification",
    negative: "None — every change looks the same",
    positive: "AI classifies each entry as breaking, deprecation, or informational",
  },
  {
    dimension: "Severity scoring",
    negative: "No severity — you get a binary alert: changed or not",
    positive: "Four severity levels (critical, high, medium, low) based on impact",
  },
  {
    dimension: "Affected endpoints",
    negative: "Not extracted — you read the raw diff yourself",
    positive: "AI identifies affected endpoints and includes them in alerts",
  },
  {
    dimension: "Alert routing",
    negative: "One alert for all changes to everyone",
    positive: "Route alerts by severity and API to the right team member",
  },
  {
    dimension: "False positives",
    negative: "High — CSS changes, footer updates, and ads trigger alerts",
    positive: "Low — only changelog content changes trigger alerts",
  },
  {
    dimension: "Format support",
    negative: "HTML pages only (some support visual comparison)",
    positive: "HTML pages, RSS feeds, GitHub Releases — all changelog formats",
  },
  {
    dimension: "Target user",
    negative: "Marketers, SEO teams, price watchers",
    positive: "Engineering teams monitoring API dependencies",
  },
];

const FAQS = [
  {
    q: "Can I use a generic website monitor for API changelogs?",
    a: "You can, but the experience is poor. Generic monitors detect that a page changed — they do not understand what changed. You will get alerts for CSS updates, banner changes, and navigation tweaks alongside actual breaking API changes. The signal-to-noise ratio makes them impractical for engineering teams.",
  },
  {
    q: "What is the difference between pixel diffing and changelog monitoring?",
    a: "Pixel diffing compares screenshots of a web page to detect visual changes. Changelog monitoring parses the actual content of changelog pages to extract individual entries, dates, affected endpoints, and severity. Pixel diffs tell you the page looks different. Changelog monitoring tells you Stripe deprecated an endpoint with a 90-day migration window.",
  },
  {
    q: "Why do generic monitors have so many false positives?",
    a: "Changelog pages are embedded in marketing websites. Navigation menus change, cookie banners update, promotional sections rotate, and footer links evolve. Generic monitors flag all of these as changes. API-specific tools parse the changelog structure and only alert on new changelog entries.",
  },
  {
    q: "Are generic website monitors cheaper?",
    a: "Some are cheaper per-URL, starting at $5-15/month. However, the hidden cost is the time spent triaging false positives and manually classifying each change. When you factor in engineer time, a $49/month tool with AI classification and severity routing is significantly cheaper than a $10/month tool that requires 30 minutes of manual triage per alert.",
  },
  {
    q: "When should I use a generic monitor instead?",
    a: "Generic website monitors are the right choice for tracking competitor pricing pages, marketing copy changes, or regulatory content updates. They are not the right choice for engineering teams monitoring API dependencies — that requires changelog-aware parsing, severity classification, and developer-focused alerting.",
  },
];

export default function GenericVsApiSpecificPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="Generic Website Monitors"
          gradientText="vs API-Specific Tools"
          description="Generic change detection tools were built for marketers watching competitor pages — not for engineers monitoring API dependencies. They detect that something changed. API-specific tools tell you what changed, how severe it is, and who needs to know."
          ctaText="Try API-specific monitoring free"
        />

        <SeoComparisonTable
          heading="What you get with each approach"
          columns={{
            dimension: "Dimension",
            negative: "Generic Website Monitor",
            positive: "API-Specific Tool",
          }}
          rows={COMPARISON_ROWS}
        />

        {/* The false positive problem */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              The false positive problem
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Generic website monitors track visual or textual changes to any
                web page. When applied to API changelog pages, they flag every
                change equally — a new navigation menu link, a footer copyright
                year update, a promotional banner swap, and an actual endpoint
                deprecation all look the same.
              </p>
              <p>
                After a few weeks of false positive alerts, teams start ignoring
                them. The one alert that matters — a critical breaking change —
                gets lost in the noise. This is worse than no monitoring at all,
                because it creates a false sense of security.
              </p>
              <p className="text-white">
                API-specific tools like DriftWatch parse the changelog structure
                itself. They identify individual entries, extract dates and
                affected endpoints, and use AI to classify severity. Only
                meaningful changes trigger alerts — and those alerts include
                actionable context.
              </p>
            </div>
          </div>
        </section>

        {/* When generic tools make sense */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              When generic tools are the right choice
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Generic website monitors are excellent for their intended use
                cases: tracking competitor pricing pages, monitoring regulatory
                content for legal teams, watching marketing copy for brand
                consistency, and detecting defacement or unauthorized changes.
              </p>
              <p>
                They are not the right tool for engineering teams monitoring API
                dependencies. That use case requires understanding of changelog
                formats, severity-based classification, endpoint extraction, and
                developer-focused alerting — capabilities that generic tools do
                not provide.
              </p>
              <p className="text-white">
                Use the right tool for the job. Generic monitors for marketing
                pages. API-specific tools for API changelogs.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <SeoFaqSection faqs={FAQS} />

        {/* Internal links */}
        <SeoInternalLinks current="/compare/generic-vs-api-specific" />

        {/* CTA */}
        <SeoCtaBanner
          headline="Get alerts that actually matter."
          subtext="DriftWatch monitors API changelogs with AI-powered classification. No false positives from CSS changes. No noise from marketing banner updates. Just actionable alerts about API changes that affect your code."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
