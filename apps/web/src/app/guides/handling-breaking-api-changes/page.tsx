import type { Metadata } from "next";
import {
  SeoNav,
  SeoHero,
  SeoCtaBanner,
  SeoFooter,
  SeoFaqSection,
  SeoInternalLinks,
  SeoBreadcrumb,
  SeoArticleSchema,
} from "../../_components/seo-page-shell";

export const metadata: Metadata = {
  title: "How to Handle Breaking API Changes — A Practical Guide",
  description:
    "Learn how to detect, triage, and respond to breaking API changes before they cause production incidents. Includes a step-by-step response playbook for engineering teams.",
  alternates: {
    canonical: "https://apidelta.dev/guides/handling-breaking-api-changes",
  },
  openGraph: {
    title: "How to Handle Breaking API Changes — A Practical Guide",
    description:
      "A practical response playbook for engineering teams: detect, triage, and fix breaking API changes before they hit production.",
    type: "article",
    url: "https://apidelta.dev/guides/handling-breaking-api-changes",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Handle Breaking API Changes — A Practical Guide",
    description:
      "Detect, triage, and respond to breaking API changes before production incidents. Step-by-step playbook for engineering teams.",
  },
};

const PLAYBOOK_STEPS = [
  {
    step: "1",
    title: "Detect the change early",
    description:
      "The earlier you know about a breaking change, the more options you have. Automated changelog monitoring catches changes within an hour of publication — instead of when your CI pipeline fails or customers report errors. Set up alerts for breaking and deprecation classifications specifically.",
  },
  {
    step: "2",
    title: "Assess the impact on your integration",
    description:
      "Not every breaking change affects your specific usage. Check which endpoints are affected, whether you call those endpoints, and what data you rely on from them. Map the change to your codebase by searching for the affected endpoint URLs and response fields.",
  },
  {
    step: "3",
    title: "Check the migration timeline",
    description:
      "Most responsible API providers give a deprecation window before removing functionality. Check the changelog for sunset dates, migration guides, and any compatibility mode. You typically have weeks to months — but only if you detected the change early enough to use that window.",
  },
  {
    step: "4",
    title: "Test in staging before you migrate",
    description:
      "Create a branch that points to the new API version or adapts to the changed endpoints. Run your integration test suite against it. If the provider offers a sandbox or test environment on the new version, use it. Never migrate production without validating the change first.",
  },
  {
    step: "5",
    title: "Communicate across the team",
    description:
      "The engineer who detects the change may not own the integration. Route the information to the API owner, update your team's tracking system, and include the migration in sprint planning if the change requires code modifications. Breaking changes should be visible, not buried in someone's inbox.",
  },
  {
    step: "6",
    title: "Deploy and monitor the migration",
    description:
      "Once the migration is tested, deploy it before the sunset deadline — ideally with room to spare. Monitor error rates on the affected endpoints for 24-48 hours post-deployment. Document what changed and why in your internal changelog so future engineers understand the context.",
  },
];

const FAQS = [
  {
    q: "What counts as a breaking API change?",
    a: "A breaking change is any modification that can cause existing integrations to fail. Common examples: removing an endpoint, renaming or removing a response field, changing a field's data type, making a previously optional parameter required, changing authentication requirements, or altering error response formats. Non-breaking changes include adding new optional fields, adding new endpoints, or expanding enum values.",
  },
  {
    q: "How quickly do I need to respond to a breaking change?",
    a: "It depends on the provider's deprecation timeline. Stripe typically gives 24+ months. Smaller APIs might give 30-90 days. Some providers (especially in fast-moving spaces like AI) may give as little as 2 weeks. The key is detecting the change announcement immediately so you have the full migration window available to you.",
  },
  {
    q: "What if an API breaks without any changelog notice?",
    a: "This happens more often than it should — especially with smaller API providers. Unannounced breaking changes require immediate incident response: check their status page, contact support, and implement a temporary workaround. APIDelta helps here by monitoring response format changes in addition to changelog entries, catching behavioral changes that were never formally announced.",
  },
  {
    q: "How do I prevent breaking changes from reaching production?",
    a: "Three layers of defense: (1) Monitor changelogs to catch announced changes early, (2) Run integration tests against the latest API version in CI to catch unannounced changes, (3) Use contract testing to validate response schemas automatically. Layer 1 gives you the most lead time. Layers 2 and 3 catch what slips through.",
  },
  {
    q: "What is the average cost of a production incident from a missed API change?",
    a: "Industry data from Gartner and PagerDuty estimates the average cost of downtime at $5,600 per minute. Even a modest 30-minute incident caused by a missed API breaking change costs $168,000 in direct impact — not counting engineering time to diagnose and fix, customer trust erosion, or SLA penalties. Prevention through monitoring costs a fraction of one incident.",
  },
];

export default function HandlingBreakingApiChangesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoBreadcrumb
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides/handling-breaking-api-changes" },
          { name: "Handling Breaking API Changes", href: "/guides/handling-breaking-api-changes" },
        ]}
      />
      <SeoArticleSchema
        title="How to Handle Breaking API Changes — A Practical Guide"
        description="Learn how to detect, triage, and respond to breaking API changes before they cause production incidents."
        url="https://apidelta.dev/guides/handling-breaking-api-changes"
        datePublished="2026-04-06"
        dateModified="2026-04-09"
      />
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="Handling Breaking"
          gradientText="API Changes"
          description="A breaking API change just landed. Your team needs a clear, repeatable process for detection, triage, and response — not a scramble at 2 AM when error rates spike. Here is the playbook."
          ctaText="Detect breaking changes automatically"
        />

        {/* The problem */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Why breaking API changes cause outages
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Every production incident has a timeline. For API-related
                outages, the timeline usually looks like this: a third-party API
                publishes a breaking change announcement. The announcement sits
                in a changelog that nobody on your team is actively watching.
                Days or weeks later, the old behavior is deprecated or removed.
                Your integration breaks. Errors spike. On-call gets paged.
              </p>
              <p>
                The root cause is not that your code was wrong. The root cause is
                a detection gap — the time between when the change was announced
                and when your team became aware of it. For most teams, that gap
                is measured in weeks. For teams with automated monitoring, it is
                measured in minutes.
              </p>
              <p className="text-white">
                The playbook below turns a reactive scramble into a proactive
                process. It works whether you use automated monitoring or manual
                checks — but automated detection is what makes the rest of the
                playbook possible at scale.
              </p>
            </div>
          </div>
        </section>

        {/* Playbook steps */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
                Playbook
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                6-step response to breaking API changes
              </h2>
            </div>

            <div className="space-y-12">
              {PLAYBOOK_STEPS.map((item) => (
                <div key={item.step} className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-sm font-bold text-violet-400">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* APIDelta angle */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              Automate step 1 — detect changes instantly
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                The most important step in the playbook is the first one:
                detection. Everything else — impact assessment, migration
                planning, testing, deployment — depends on knowing about the
                change in time. Manual detection is unreliable beyond a handful
                of API dependencies.
              </p>
              <p className="text-white">
                APIDelta crawls your API dependencies' changelogs every hour.
                AI classifies each entry by type and severity. When a breaking
                change is detected, the engineer who owns that integration gets
                an alert in Slack or email — with a plain-English summary of what
                changed, which endpoints are affected, and a link to the
                provider's full changelog.
              </p>
              <p>
                The rest of the playbook still requires engineering judgment.
                But with APIDelta, your team starts with full information
                instead of discovering changes after the damage is done.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <SeoFaqSection faqs={FAQS} />

        {/* Internal links */}
        <SeoInternalLinks current="/guides/handling-breaking-api-changes" />

        {/* CTA */}
        <SeoCtaBanner
          headline="Catch breaking changes before they catch you."
          subtext="APIDelta monitors your API changelogs hourly, classifies changes by severity with AI, and alerts the right engineer. Start your 14-day free trial with 3 APIs included."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
