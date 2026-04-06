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
  title: "Manual vs Automated API Changelog Monitoring",
  description:
    "Compare manual changelog checking against automated API monitoring. See why engineering teams switch from spreadsheets and RSS readers to AI-powered monitoring tools.",
  alternates: {
    canonical: "https://apidelta.dev/compare/manual-vs-automated",
  },
  openGraph: {
    title: "Manual vs Automated API Changelog Monitoring",
    description:
      "Manual changelog checking vs automated monitoring: the real comparison. Coverage, accuracy, cost, and team impact.",
    type: "website",
    url: "https://apidelta.dev/compare/manual-vs-automated",
  },
  twitter: {
    card: "summary_large_image",
    title: "Manual vs Automated API Changelog Monitoring",
    description:
      "Compare manual changelog checking against automated API monitoring. See why teams switch to AI-powered tools.",
  },
};

const COMPARISON_ROWS = [
  {
    dimension: "Coverage",
    negative: "Depends on whoever remembers to check",
    positive: "Every configured API, every hour, automatically",
  },
  {
    dimension: "Speed of detection",
    negative: "Days to weeks — depends on checking frequency",
    positive: "Within 60 minutes of changelog update",
  },
  {
    dimension: "Classification",
    negative: "Human reads full release notes, hopes to catch breaking changes",
    positive: "AI classifies each entry by type and severity in seconds",
  },
  {
    dimension: "Alert routing",
    negative: "Slack message to the team channel, hope the right person sees it",
    positive: "Routed to the API owner via their preferred channel",
  },
  {
    dimension: "Format support",
    negative: "Works if you can find the changelog page",
    positive: "HTML pages, RSS feeds, GitHub Releases — all handled automatically",
  },
  {
    dimension: "Audit trail",
    negative: "None — no record of what was checked and when",
    positive: "Full log of every crawl, classification, and alert",
  },
  {
    dimension: "Cost",
    negative: "\"Free\" — but 2-4 hours of engineer time per week",
    positive: "$49-99/mo — less than one hour of engineer time",
  },
  {
    dimension: "Scalability",
    negative: "Breaks down at 10+ APIs",
    positive: "Monitor 50+ APIs with zero additional effort",
  },
];

const FAQS = [
  {
    q: "Is manual changelog monitoring really that bad?",
    a: "Manual monitoring works when you have 2-3 API dependencies and one engineer who consistently checks them. It breaks down at scale — 10+ APIs, multiple team members, inconsistent checking cadence. The real cost is not the time spent checking, but the breaking changes that get missed because nobody checked that week.",
  },
  {
    q: "Can I use an RSS reader instead of a dedicated tool?",
    a: "RSS readers show you raw changelog entries with no classification. You still have to read every entry, determine if it is breaking, figure out which endpoints are affected, and decide who to notify. This works for personal use but not for engineering teams that need severity-based routing and actionable summaries.",
  },
  {
    q: "What about writing a custom script to check changelogs?",
    a: "Custom scripts are a common approach — and they work initially. The maintenance burden grows quickly: each API publishes changes in a different format, HTML structures change without notice, and you need to handle edge cases (entries without dates, nested changelogs, JS-rendered pages). APIDelta handles all of this out of the box.",
  },
  {
    q: "How much does automated monitoring actually save?",
    a: "If manual checking takes 2 hours per week (conservative for 10+ APIs), that is 100+ hours per year of engineer time — worth $10,000+ at fully loaded cost. APIDelta costs $588-1,188/year. The ROI is clear before you even factor in prevented incidents.",
  },
  {
    q: "When should I stick with manual monitoring?",
    a: "If you depend on fewer than 3 APIs, all of them have RSS feeds, and one person reliably checks them weekly — manual monitoring can be sufficient. Once you pass 5+ dependencies or have a team of engineers sharing API ownership, automated monitoring pays for itself immediately.",
  },
];

export default function ManualVsAutomatedPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="Manual vs Automated"
          gradientText="API Changelog Monitoring"
          description="Most teams check API changelogs manually — when they remember. A rotating schedule, an RSS reader, a shared spreadsheet. It works until it does not. Here is how automated, AI-powered monitoring compares."
          ctaText="Try automated monitoring free"
        />

        <SeoComparisonTable
          heading="Side-by-side comparison"
          columns={{
            dimension: "Dimension",
            negative: "Manual Checking",
            positive: "Automated Monitoring",
          }}
          rows={COMPARISON_ROWS}
        />

        {/* The real cost */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              The hidden cost of manual monitoring
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Manual changelog checking looks free — nobody is paying for a
                tool. But the real costs are hidden: the 2-4 hours per week of
                engineer time, the missed changes that cause production
                incidents, and the stress of never being sure if your team is
                actually up to date.
              </p>
              <p>
                The most expensive outcome is not the time spent checking. It is
                the breaking change nobody caught because the engineer assigned
                to check changelogs that week was on PTO. One production
                incident from a missed API change costs more than a year of
                automated monitoring.
              </p>
              <p className="text-white">
                Automated monitoring is not about replacing engineers. It is
                about making sure they spend their time on the changes that
                matter, not on the act of finding those changes.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <SeoFaqSection faqs={FAQS} />

        {/* Internal links */}
        <SeoInternalLinks current="/compare/manual-vs-automated" />

        {/* CTA */}
        <SeoCtaBanner
          headline="Replace manual checking with AI-powered monitoring."
          subtext="APIDelta crawls your API changelogs every hour, classifies changes by severity, and alerts the right engineer. No more spreadsheets, no more missed changes."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
