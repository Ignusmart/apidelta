import type { Metadata } from "next";
import {
  Zap,
  Bell,
  Shield,
  Users,
  Check,
  ChevronDown,
  ArrowRight,
  Bot,
  Rss,
  Clock,
  MessageSquare,
  Mail,
} from "lucide-react";

// ---------------------------------------------------------------------------
// SEO metadata (50-60 char title, 150-160 char description)
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: "DriftWatch — AI-Powered API Change Monitoring",
  description:
    "Monitor third-party API changelogs, classify breaking changes with AI, and alert your team via Slack and email. Smarter alerts at a fraction of the price.",
  openGraph: {
    title: "DriftWatch — AI-Powered API Change Monitoring",
    description:
      "Stop finding out about breaking API changes from your error logs. AI-classified alerts before changes break your code.",
    type: "website",
    url: "https://driftwatch.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "DriftWatch — API Change Monitoring",
    description:
      "AI-classified alerts for third-party API breaking changes. Slack + email. $49/mo.",
  },
  alternates: { canonical: "https://driftwatch.dev" },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    icon: Bot,
    title: "AI-Powered Classification",
    description:
      "Claude AI reads every changelog entry and classifies it as breaking, deprecation, or informational — so you only get woken up for what matters.",
  },
  {
    icon: Bell,
    title: "Multi-Channel Alerts",
    description:
      "Get notified in Slack, email, or both. Set severity thresholds per channel so critical changes hit Slack instantly while info-level changes go to a digest.",
  },
  {
    icon: Rss,
    title: "50+ Changelog Formats",
    description:
      "HTML pages, RSS feeds, GitHub Releases — DriftWatch handles the messy reality of how APIs publish changes. Add a URL and we figure out the rest.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite your team, assign API ownership, and route alerts to the right people. Everyone sees the same change feed with severity badges.",
  },
  {
    icon: Clock,
    title: "Hourly Monitoring",
    description:
      "We check your monitored APIs every hour. When a breaking change drops, you know within 60 minutes — not when your CI pipeline fails at 2 AM.",
  },
  {
    icon: Shield,
    title: "Audit Trail",
    description:
      "Every change, every classification, every alert — logged and searchable. Perfect for compliance reviews and post-mortems.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Add your API dependencies",
    description:
      "Paste the changelog URL for any third-party API you depend on. We support Stripe, Twilio, GitHub, OpenAI, and 50+ more out of the box.",
  },
  {
    step: "2",
    title: "AI classifies every change",
    description:
      "Our AI reads each changelog entry and tags it with a severity level, affected endpoints, and a plain-English summary your whole team can understand.",
  },
  {
    step: "3",
    title: "Get alerted before things break",
    description:
      "Breaking change detected? You get a Slack message or email with exactly what changed, what endpoints are affected, and what you need to do.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: 49,
    description: "For small teams monitoring critical APIs",
    features: [
      "10 monitored APIs",
      "2 team members",
      "Email + Slack alerts",
      "AI classification",
      "Hourly monitoring",
      "7-day change history",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 99,
    description: "For growing teams with many dependencies",
    features: [
      "50 monitored APIs",
      "10 team members",
      "All alert channels",
      "AI classification",
      "Hourly monitoring",
      "90-day change history",
      "Weekly digest emails",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
];

const FAQS = [
  {
    q: "What APIs can DriftWatch monitor?",
    a: "Any API that publishes a changelog, release notes, or status page. We support HTML pages, RSS feeds, and GitHub Releases out of the box. If it has a URL, we can probably crawl it.",
  },
  {
    q: "How does the AI classification work?",
    a: "We use Anthropic's Claude AI to read each changelog entry and classify it by type (breaking, deprecation, non-breaking, informational) and severity (critical, high, medium, low). It also extracts affected endpoints and generates a plain-English summary.",
  },
  {
    q: "How is this different from other changelog monitors?",
    a: "Most changelog monitoring tools charge $149-749/mo and do basic text diffing with no AI intelligence. DriftWatch uses AI to actually understand what changed and whether it will break your integration — at $49-99/mo. Smarter alerts, fraction of the price.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. DriftWatch is a hosted service. Sign up, paste your API changelog URLs, configure your alert channels, and you are done. No agents, no SDKs, no CI plugins.",
  },
  {
    q: "What happens during the free trial?",
    a: "You get 14 days of full Pro access with up to 3 monitored APIs. No credit card required. At the end of the trial, pick a plan or your monitoring pauses — we never delete your data.",
  },
  {
    q: "Can I filter which changes trigger alerts?",
    a: "Yes. Alert rules support severity thresholds (e.g., only critical and high), specific API filters, and keyword matching. Route different alert types to different Slack channels or email addresses.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ----------------------------------------------------------------- */}
      {/* NAV                                                                */}
      {/* ----------------------------------------------------------------- */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Zap className="h-5 w-5 text-violet-400" />
            DriftWatch
          </div>
          <div className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/sign-in"
              className="hidden text-sm text-gray-400 transition hover:text-white sm:inline"
            >
              Sign in
            </a>
            <a
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
            >
              Start free trial
            </a>
          </div>
        </div>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* HERO — PAS: Problem headline, agitate in subhead, solution CTA   */}
      {/* ----------------------------------------------------------------- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent" />
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Now in early access
          </div>

          {/* H1 — Problem */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
            Stop finding out about
            <br />
            breaking API changes
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              from your error logs.
            </span>
          </h1>

          {/* Subhead — Agitate */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Third-party APIs ship breaking changes without warning. Your team
            finds out when prod breaks at 2 AM. DriftWatch monitors changelogs,
            classifies changes with AI, and alerts you{" "}
            <span className="text-white">before</span> anything breaks.
          </p>

          {/* CTA — Solution */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-base font-medium text-white transition hover:bg-violet-500"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-8 py-3 text-base font-medium text-gray-300 transition hover:border-gray-600 hover:text-white"
            >
              See how it works
            </a>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            No credit card required &middot; 14-day free trial &middot; 3 APIs
            free
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* SOCIAL PROOF STRIP                                                 */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-y border-gray-800/60 bg-gray-900/30 py-10">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="mb-6 text-sm font-medium uppercase tracking-wider text-gray-500">
            Monitors changelogs from APIs you already depend on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-lg font-semibold text-gray-500">
            <span>Stripe</span>
            <span>Twilio</span>
            <span>GitHub</span>
            <span>OpenAI</span>
            <span>Slack</span>
            <span>SendGrid</span>
            <span>Vercel</span>
            <span>Prisma</span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FEATURES GRID                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
              Features
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to stay ahead of API changes
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              From crawling changelogs to sending the right alert to the right
              person — DriftWatch handles the entire pipeline.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-700"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <feature.icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* HOW IT WORKS — alternating                                         */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
              How it works
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to never be surprised again
            </h2>
          </div>

          <div className="space-y-12">
            {HOW_IT_WORKS.map((item) => (
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

      {/* ----------------------------------------------------------------- */}
      {/* ALERT PREVIEW                                                      */}
      {/* ----------------------------------------------------------------- */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
              See it in action
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              An alert you actually want to read
            </h2>
            <p className="mx-auto max-w-xl text-gray-400">
              When a breaking change lands, you get a clear, actionable summary
              — not a raw diff.
            </p>
          </div>

          {/* Mock Slack message */}
          <div className="mx-auto max-w-xl rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-violet-500/20">
                <Zap className="h-4 w-4 text-violet-400" />
              </div>
              <span className="font-semibold">DriftWatch</span>
              <span className="text-xs text-gray-500">2:34 PM</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                  BREAKING
                </span>
                <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                  CRITICAL
                </span>
              </div>
              <p className="font-medium text-white">
                Stripe API — Payment Intents endpoint change
              </p>
              <p className="text-gray-400">
                The <code className="rounded bg-gray-800 px-1 text-violet-300">/v1/payment_intents</code>{" "}
                endpoint will remove the{" "}
                <code className="rounded bg-gray-800 px-1 text-violet-300">source</code>{" "}
                parameter on June 1, 2026. Migrate to{" "}
                <code className="rounded bg-gray-800 px-1 text-violet-300">payment_method</code>{" "}
                before the deadline.
              </p>
              <div className="border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-500">
                  <span className="text-gray-400">Affected endpoints:</span>{" "}
                  /v1/payment_intents, /v1/payment_intents/confirm
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Slack
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> Email
            </span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* PRICING                                                            */}
      {/* ----------------------------------------------------------------- */}
      <section
        id="pricing"
        className="border-t border-gray-800/60 bg-gray-900/30 py-24"
      >
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
              Pricing
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              3x cheaper than the competition.
              <br />
              10x smarter.
            </h2>
            <p className="mx-auto max-w-xl text-gray-400">
              Other tools charge $149-749/mo for basic text diffing. We
              use AI to actually understand changes — at a fraction of the cost.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-8 lg:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "border-2 border-violet-500 bg-violet-950/30 ring-4 ring-violet-500/20"
                    : "border border-gray-800 bg-gray-900"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-0.5 text-xs font-medium text-white">
                    Most popular
                  </div>
                )}

                <h3 className="mb-1 text-xl font-bold">{plan.name}</h3>
                <p className="mb-4 text-sm text-gray-400">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">/mo</span>
                </div>

                <a
                  href="/sign-up"
                  className={`mb-6 block rounded-lg py-2.5 text-center text-sm font-medium transition ${
                    plan.highlighted
                      ? "bg-violet-600 text-white hover:bg-violet-500"
                      : "border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white"
                  }`}
                >
                  {plan.cta}
                </a>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            14-day free trial on all plans &middot; No credit card required
            &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FAQ                                                                */}
      {/* ----------------------------------------------------------------- */}
      <section id="faq" className="py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
        />
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
              FAQ
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-gray-800 bg-gray-900"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left font-medium transition hover:text-violet-300 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 transition group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed text-gray-400">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CTA BANNER                                                         */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Your next API outage is preventable.
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-gray-400">
            Start monitoring your API dependencies today. Set up takes less than
            2 minutes. No credit card, no agents to install.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-base font-medium text-white transition hover:bg-violet-500"
          >
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-4 text-sm text-gray-500">
            14-day free trial &middot; 3 APIs free &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* FOOTER                                                             */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-gray-800/60 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Zap className="h-4 w-4 text-violet-400" />
            DriftWatch
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#features" className="transition hover:text-gray-300">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-gray-300">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-gray-300">
              FAQ
            </a>
          </div>
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} DriftWatch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
