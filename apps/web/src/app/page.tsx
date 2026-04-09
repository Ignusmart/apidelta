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
  title: "APIDelta — AI-Powered API Change Monitoring",
  description:
    "Monitor third-party API changelogs, classify breaking changes with AI, and alert your team via Slack and email. Smarter alerts at a fraction of the price.",
  openGraph: {
    title: "APIDelta — AI-Powered API Change Monitoring",
    description:
      "Stop finding out about breaking API changes from your error logs. AI-classified alerts before changes break your code.",
    type: "website",
    url: "https://apidelta.dev",
  },
  twitter: {
    card: "summary_large_image",
    title: "APIDelta — API Change Monitoring",
    description:
      "AI-classified alerts for third-party API breaking changes. Slack + email. $49/mo.",
  },
  alternates: { canonical: "https://apidelta.dev" },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    icon: Bot,
    title: "AI-Powered Classification",
    description:
      "AI reads every changelog entry and classifies it as breaking, deprecation, or informational — so you only act on what matters.",
  },
  {
    icon: Bell,
    title: "Slack and Email Alerts",
    description:
      "Route critical changes to Slack for instant visibility, and batch lower-severity updates into email digests. Set severity thresholds per channel so the right signal reaches the right place.",
  },
  {
    icon: Rss,
    title: "50+ Changelog Formats",
    description:
      "HTML pages, RSS feeds, GitHub Releases — we handle the messy reality of how APIs publish changes. Paste a URL and APIDelta figures out the rest.",
  },
  {
    icon: Users,
    title: "Built for Teams",
    description:
      "Assign API ownership to the engineers who maintain each integration. Route alerts to the right people and share a single change feed with clear severity badges.",
  },
  {
    icon: Clock,
    title: "Hourly Monitoring",
    description:
      "APIDelta checks every monitored API on the hour. When a breaking change lands, you know within 60 minutes — not when your CI pipeline fails at 2 AM.",
  },
  {
    icon: Shield,
    title: "Full Audit Trail",
    description:
      "Every change, every classification, every alert — logged and searchable. When a post-mortem asks \"did we know about this?\", the answer is in your dashboard.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Paste your changelog URLs",
    description:
      "Add the changelog URL for any third-party API your product depends on. Stripe, Twilio, GitHub, OpenAI, and 50+ more work out of the box — any URL with a changelog works.",
  },
  {
    step: "2",
    title: "AI reads and classifies every update",
    description:
      "Each changelog entry gets a severity level, affected endpoints, and a plain-English summary. No more skimming release notes — your team sees exactly what matters.",
  },
  {
    step: "3",
    title: "Get alerted before things break",
    description:
      "When a breaking change drops, you get a Slack message or email with exactly what changed, which endpoints are affected, and what to do next.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: 49,
    period: "per month",
    description: "For small teams with a handful of key integrations",
    features: [
      "10 monitored APIs",
      "2 team members",
      "Email + Slack alerts",
      "AI classification",
      "Hourly monitoring",
      "7-day change history",
    ],
    cta: "Start 14-day free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 99,
    period: "per month",
    description: "For teams managing dozens of API dependencies",
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
    cta: "Start 14-day free trial",
    highlighted: true,
  },
];

const FAQS = [
  {
    q: "What APIs can APIDelta monitor?",
    a: "Any API that publishes a changelog, release notes, or status page. We handle HTML pages, RSS feeds, and GitHub Releases out of the box. If it has a URL, APIDelta can crawl it.",
  },
  {
    q: "How does the AI classification work?",
    a: "APIDelta uses AI to read each changelog entry and classify it by type (breaking, deprecation, non-breaking, informational) and severity (critical, high, medium, low). It also extracts affected endpoints and generates a plain-English summary your whole team can act on.",
  },
  {
    q: "How is this different from basic change detection tools?",
    a: "Most monitoring tools charge $149-749/mo for basic text diffing with no intelligence layer. APIDelta uses AI to understand what changed and whether it affects your integration — at a fraction of the cost. You get smarter alerts for less money.",
  },
  {
    q: "Do I need to install anything?",
    a: "Nothing. APIDelta is fully hosted. Sign up, paste your API changelog URLs, configure your alert channels, and you are done. No agents to deploy, no SDKs to integrate, no CI plugins to maintain.",
  },
  {
    q: "What happens during the free trial?",
    a: "You get 14 days of full Pro access with up to 3 monitored APIs. No credit card required. At the end of the trial, pick a plan or your monitoring pauses — we never delete your data.",
  },
  {
    q: "Can I filter which changes trigger alerts?",
    a: "Yes. Alert rules support severity thresholds (e.g., only critical and high), specific API filters, and keyword matching. Route different alert types to different Slack channels or email addresses.",
  },
  {
    q: "Is my data secure?",
    a: "All data is encrypted in transit (TLS) and at rest. APIDelta only stores changelog content and your alert configuration — never your source code or API keys. Each team's data is fully isolated.",
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

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "APIDelta",
  url: "https://apidelta.dev",
  description:
    "AI-powered API changelog monitoring and breaking change alerts for engineering teams.",
};

const SOFTWARE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "APIDelta",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  url: "https://apidelta.dev",
  description:
    "Monitor third-party API changelogs, classify breaking changes with AI, and alert your team via Slack and email.",
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "49",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      url: "https://apidelta.dev/sign-up",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "99",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      url: "https://apidelta.dev/sign-up",
    },
  ],
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Structured data — Organization + SoftwareApplication + FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_SCHEMA) }}
      />

      {/* ----------------------------------------------------------------- */}
      {/* NAV                                                                */}
      {/* ----------------------------------------------------------------- */}
      <nav aria-label="Main navigation" className="fixed top-0 z-50 w-full border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <Zap aria-hidden="true" className="h-5 w-5 text-violet-400" />
            APIDelta
          </div>
          <div className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
            <a href="#features" className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              Features
            </a>
            <a href="#pricing" className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              Pricing
            </a>
            <a href="#faq" className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              FAQ
            </a>
            <a href="/use-cases/api-changelog-monitoring" className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
              Use Cases
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/sign-in"
              className="hidden text-sm text-gray-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:rounded-md sm:inline"
            >
              Sign in
            </a>
            <a
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Start free trial
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ----------------------------------------------------------------- */}
      {/* HERO — PAS: Problem headline, agitate in subhead, solution CTA   */}
      {/* ----------------------------------------------------------------- */}
      <main id="main-content">
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center">
        {/* Background effects */}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative z-10 max-w-4xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            Monitoring 50+ API changelogs in real time
          </div>

          {/* H1 — Outcome-focused */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
            Know about breaking
            <br />
            API changes{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              hours before
            </span>
            <br />
            your code does.
          </h1>

          {/* Subhead — Agitate + Solution */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
            Third-party APIs ship breaking changes without warning. Your team
            finds out when production breaks at 2 AM. APIDelta monitors 50+
            API changelogs every hour, uses AI to classify what matters, and
            alerts your team in Slack or email —{" "}
            <span className="text-white">before anything breaks</span>.
          </p>

          {/* CTA — Solution */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 hover:shadow-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Monitor your first API free
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-8 py-3.5 text-base font-medium text-gray-300 transition hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              See how it works
            </a>
          </div>

          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield aria-hidden="true" className="h-3.5 w-3.5" />
            No credit card required &middot; 14-day free trial &middot; Setup
            in under 2 minutes
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
              Stop reading changelogs manually
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-400">
              APIDelta crawls changelogs, classifies what changed, and sends
              the right alert to the right engineer — end to end.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-700"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <feature.icon aria-hidden="true" className="h-5 w-5 text-violet-400" />
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
      <section
        id="how-it-works"
        className="border-t border-gray-800/60 bg-gray-900/30 py-24"
      >
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
              How it works
            </p>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Set up in under 2 minutes
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

          {/* Mid-page CTA */}
          <div className="mt-14 text-center">
            <a
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              Try it free — monitor 3 APIs for 14 days
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
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
              with affected endpoints and next steps — not a raw diff.
            </p>
          </div>

          {/* Mock Slack message */}
          <div className="mx-auto max-w-xl rounded-xl border border-gray-800 bg-gray-900 p-6" role="img" aria-label="Example APIDelta Slack alert showing a critical breaking change from Stripe API">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-violet-500/20">
                <Zap aria-hidden="true" className="h-4 w-4 text-violet-400" />
              </div>
              <span className="font-semibold">APIDelta</span>
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
              <MessageSquare aria-hidden="true" className="h-4 w-4" /> Slack
            </span>
            <span className="flex items-center gap-1.5">
              <Mail aria-hidden="true" className="h-4 w-4" /> Email
            </span>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Get alerts like this for every API you depend on.{" "}
            <a
              href="/sign-up"
              className="rounded font-medium text-violet-400 underline underline-offset-2 transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Start your free trial
            </a>
          </p>
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
              AI-powered monitoring at a
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                fraction of the price.
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-gray-400">
              Most monitoring platforms charge $149-749/mo for basic text
              diffing with no intelligence layer. APIDelta uses AI to
              understand what changed and why it matters — starting at $49/mo.
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
                  <p className="mt-1 text-xs text-gray-500">
                    {plan.period}, billed monthly
                  </p>
                </div>

                <a
                  href="/sign-up"
                  className={`mb-6 block rounded-lg py-2.5 text-center text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
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
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
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
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left font-medium transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 focus-visible:rounded-xl [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-500 transition group-open:rotate-180" />
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
            Engineering teams lose an average of 4 hours per incident caused by
            surprise API changes. Start monitoring in under 2 minutes — no
            credit card required, nothing to install.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 hover:shadow-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            Monitor your first API free
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield aria-hidden="true" className="h-3.5 w-3.5" />
            14-day free trial &middot; 3 APIs included &middot; Cancel anytime
          </p>
        </div>
      </section>
      </main>

      {/* ----------------------------------------------------------------- */}
      {/* FOOTER                                                             */}
      {/* ----------------------------------------------------------------- */}
      <footer className="border-t border-gray-800/60 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <Zap aria-hidden="true" className="h-4 w-4 text-violet-400" />
                APIDelta
              </div>
              <p className="mt-3 text-xs text-gray-600">
                AI-powered API changelog monitoring for engineering teams.
              </p>
            </div>

            <nav aria-label="Use cases" className="space-y-2 text-sm text-gray-500">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Use Cases</p>
              <a href="/use-cases/api-changelog-monitoring" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">API Changelog Monitoring</a><br />
              <a href="/use-cases/breaking-change-detection" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Breaking Change Detection</a><br />
              <a href="/use-cases/api-dependency-management" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">API Dependency Management</a><br />
              <a href="/use-cases/saas-api-integrations" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">SaaS API Integrations</a><br />
              <a href="/use-cases/devops-api-monitoring" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">DevOps API Monitoring</a>
            </nav>

            <nav aria-label="Resources" className="space-y-2 text-sm text-gray-500">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Resources</p>
              <a href="/guides/api-versioning-best-practices" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">API Versioning Best Practices</a><br />
              <a href="/guides/handling-breaking-api-changes" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Handling Breaking Changes</a><br />
              <a href="/compare/manual-vs-automated" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Manual vs Automated Monitoring</a><br />
              <a href="/compare/generic-vs-api-specific" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Generic vs API-Specific Tools</a>
            </nav>

            <nav aria-label="Product" className="space-y-2 text-sm text-gray-500">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Product</p>
              <a href="#features" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Features</a><br />
              <a href="#pricing" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Pricing</a><br />
              <a href="#faq" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">FAQ</a><br />
              <a href="/terms" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Terms</a><br />
              <a href="/privacy" className="rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">Privacy</a>
            </nav>
          </div>

          <div className="mt-10 border-t border-gray-800/60 pt-6 text-center">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} APIDelta. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
