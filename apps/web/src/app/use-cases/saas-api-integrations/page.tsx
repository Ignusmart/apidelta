import type { Metadata } from "next";
import { Layers, CreditCard, MessageSquare, Cloud, Bot, Bell } from "lucide-react";
import {
  SeoNav,
  SeoHero,
  SeoCtaBanner,
  SeoFooter,
  SeoHowItWorks,
  SeoFaqSection,
  SeoFeatureGrid,
  SeoInternalLinks,
} from "../../_components/seo-page-shell";

export const metadata: Metadata = {
  title: "API Monitoring for SaaS Companies — Track Third-Party Integrations",
  description:
    "SaaS companies depend on dozens of third-party APIs. APIDelta monitors Stripe, Twilio, OpenAI, and 50+ API changelogs so your integrations never break silently.",
  alternates: {
    canonical: "https://apidelta.dev/use-cases/saas-api-integrations",
  },
  openGraph: {
    title: "API Monitoring for SaaS Companies — Track Third-Party Integrations",
    description:
      "Monitor Stripe, Twilio, OpenAI, and every API your SaaS depends on. AI-powered changelog monitoring catches breaking changes before they hit production.",
    type: "website",
    url: "https://apidelta.dev/use-cases/saas-api-integrations",
  },
  twitter: {
    card: "summary_large_image",
    title: "API Monitoring for SaaS Companies — Track Third-Party Integrations",
    description:
      "Monitor every API your SaaS depends on. AI-powered changelog monitoring for Stripe, Twilio, OpenAI, and 50+ providers.",
  },
};

const FEATURES = [
  {
    icon: Layers,
    title: "Monitor All Your Integrations",
    description:
      "Paste the changelog URL for every third-party API your product uses. Stripe, Twilio, SendGrid, OpenAI, GitHub — APIDelta handles the format differences automatically.",
  },
  {
    icon: CreditCard,
    title: "Payment API Changes",
    description:
      "Payment APIs like Stripe and Braintree update frequently. A missed field deprecation in your checkout flow means lost revenue. APIDelta flags payment API changes as critical by default.",
  },
  {
    icon: MessageSquare,
    title: "Communication API Updates",
    description:
      "Twilio, SendGrid, and Mailgun evolve their APIs across multiple products. Monitor each one independently and route alerts to the engineers who own those integrations.",
  },
  {
    icon: Bot,
    title: "AI Provider Version Changes",
    description:
      "OpenAI, Anthropic, and other AI providers update model versions and deprecate endpoints frequently. Stay ahead of model deprecations and response format changes.",
  },
  {
    icon: Cloud,
    title: "Cloud Infrastructure APIs",
    description:
      "AWS, GCP, and Vercel publish API changes across hundreds of services. Monitor the specific services your SaaS depends on without drowning in noise from services you do not use.",
  },
  {
    icon: Bell,
    title: "Team-Scoped Alert Routing",
    description:
      "Assign API ownership to the engineers who maintain each integration. Payment changes go to the billing team. Email API changes go to the notifications team. No more noisy shared channels.",
  },
];

const FAQS = [
  {
    q: "How many third-party APIs does a typical SaaS product use?",
    a: "The average SaaS product integrates with 15-25 third-party APIs. Enterprise SaaS products often exceed 50. Each API publishes changes independently, in different formats, on different schedules. Without automated monitoring, keeping track of all these dependencies manually is a full-time job.",
  },
  {
    q: "Which SaaS API integrations break most often?",
    a: "Payment APIs (Stripe, Braintree) and AI providers (OpenAI, Anthropic) change most frequently. Payment APIs evolve their compliance and security requirements regularly. AI providers deprecate model versions and change response formats as they ship new capabilities. Communication APIs (Twilio, SendGrid) are also high-frequency, though changes tend to be more incremental.",
  },
  {
    q: "Can APIDelta monitor internal APIs too?",
    a: "APIDelta is designed for monitoring third-party API changelogs — external dependencies that publish updates on their own schedule. For internal API monitoring, you typically use contract testing and CI/CD pipelines. APIDelta complements those tools by covering the external dependencies that your internal tooling cannot observe.",
  },
  {
    q: "How does APIDelta handle APIs that publish changes infrequently?",
    a: "APIDelta checks every configured URL on the same hourly schedule regardless of update frequency. For APIs that publish changes rarely, this means zero noise — you only get alerts when something actually changes. The hourly cadence ensures that even infrequent but critical changes are caught quickly.",
  },
  {
    q: "What if my API dependency does not have a public changelog?",
    a: "Some APIs publish changes via GitHub Releases, blog posts, or documentation version diffs instead of a dedicated changelog page. APIDelta can monitor any URL that contains chronological update information. If a provider truly has no public change communication, that is a risk worth flagging in your dependency review process.",
  },
];

export default function SaasApiIntegrationsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="API Monitoring for"
          gradientText="SaaS Companies"
          description="Your SaaS product depends on Stripe for payments, Twilio for messaging, OpenAI for intelligence, and a dozen more APIs. Each one evolves independently. APIDelta monitors all of them so a breaking change never catches your team off guard."
          ctaText="Monitor your APIs free"
        />

        {/* Pain section */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              The hidden risk in your integration layer
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Every SaaS company has a growing dependency graph. Your payment
                flow calls Stripe. Your notifications call Twilio and SendGrid.
                Your search calls Algolia. Your AI features call OpenAI or
                Anthropic. Each of these APIs is a single point of failure that
                evolves outside your control.
              </p>
              <p>
                When Stripe deprecates a payment intent field, your checkout
                breaks. When OpenAI sunsets a model version, your AI features
                return errors. When Twilio changes their message status webhook
                format, your delivery tracking goes silent. These are not
                hypotheticals — they are the incidents that fill post-mortems
                across the industry.
              </p>
              <p className="text-white">
                The common thread in every one of these incidents: the change was
                announced in a changelog that nobody on the team was monitoring.
                APIDelta makes sure that never happens again.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
                Built for SaaS teams
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Monitor every API your product depends on
              </h2>
            </div>
            <SeoFeatureGrid features={FEATURES} />
          </div>
        </section>

        {/* How it works */}
        <SeoHowItWorks />

        {/* FAQ */}
        <SeoFaqSection faqs={FAQS} />

        {/* Internal links */}
        <SeoInternalLinks current="/use-cases/saas-api-integrations" />

        {/* CTA */}
        <SeoCtaBanner
          headline="Stop finding out about API changes from error logs."
          subtext="APIDelta monitors your third-party API changelogs every hour and alerts the right engineer when something changes. AI-powered classification means you only act on what matters."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
