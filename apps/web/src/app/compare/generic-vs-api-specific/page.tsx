import type { Metadata } from "next";
import { Check, X, ArrowRight } from "lucide-react";
import {
  SeoNav,
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
    generic: "Pixel diffs or text diffs — flags every cosmetic change",
    specific: "Changelog-aware — extracts individual entries with dates and context",
  },
  {
    dimension: "Classification",
    generic: "None — every change looks the same",
    specific: "AI classifies each entry as breaking, deprecation, or informational",
  },
  {
    dimension: "Severity scoring",
    generic: "No severity — you get a binary alert: changed or not",
    specific: "Four severity levels (critical, high, medium, low) based on impact",
  },
  {
    dimension: "Affected endpoints",
    generic: "Not extracted — you read the raw diff yourself",
    specific: "AI identifies affected endpoints and includes them in alerts",
  },
  {
    dimension: "Alert routing",
    generic: "One alert for all changes to everyone",
    specific: "Route alerts by severity and API to the right team member",
  },
  {
    dimension: "False positives",
    generic: "High — CSS changes, footer updates, and ads trigger alerts",
    specific: "Low — only changelog content changes trigger alerts",
  },
  {
    dimension: "Format support",
    generic: "HTML pages only (some support visual comparison)",
    specific: "HTML pages, RSS feeds, GitHub Releases — all changelog formats",
  },
  {
    dimension: "Target user",
    generic: "Marketers, SEO teams, price watchers",
    specific: "Engineering teams monitoring API dependencies",
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
              Generic Website Monitors{" "}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                vs API-Specific Tools
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
              Generic change detection tools were built for marketers watching
              competitor pages — not for engineers monitoring API dependencies.
              They detect that something changed. API-specific tools tell you
              what changed, how severe it is, and who needs to know.
            </p>

            <a
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 hover:shadow-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Try API-specific monitoring free
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
            <p className="mt-4 text-sm text-gray-500">
              14-day free trial &middot; No credit card required
            </p>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              What you get with each approach
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="pb-4 pr-6 text-sm font-medium text-gray-500">
                      Dimension
                    </th>
                    <th className="pb-4 pr-6 text-sm font-medium text-red-400">
                      Generic Website Monitor
                    </th>
                    <th className="pb-4 text-sm font-medium text-green-400">
                      API-Specific Tool
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.dimension}
                      className="border-b border-gray-800/60"
                    >
                      <td className="py-4 pr-6 font-medium text-white">
                        {row.dimension}
                      </td>
                      <td className="py-4 pr-6 text-gray-400">
                        <span className="flex items-start gap-2">
                          <X
                            aria-hidden="true"
                            className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                          />
                          {row.generic}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300">
                        <span className="flex items-start gap-2">
                          <Check
                            aria-hidden="true"
                            className="mt-0.5 h-4 w-4 shrink-0 text-green-400"
                          />
                          {row.specific}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

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
