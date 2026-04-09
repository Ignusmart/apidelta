import {
  Zap,
  ArrowRight,
  Shield,
  Check,
  X,
  ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Shared shell for SEO landing pages (nav + footer + CTA banner + hero)
// ---------------------------------------------------------------------------

/** Renders BreadcrumbList JSON-LD schema for nested pages */
export function SeoBreadcrumb({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `https://apidelta.dev${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/** Renders Article JSON-LD schema for guide pages */
export function SeoArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      "@type": "Organization",
      name: "APIDelta",
      url: "https://apidelta.dev",
    },
    publisher: {
      "@type": "Organization",
      name: "APIDelta",
      url: "https://apidelta.dev",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function SeoNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed top-0 z-50 w-full border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight"
        >
          <Zap aria-hidden="true" className="h-5 w-5 text-violet-400" />
          APIDelta
        </a>
        <div className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
          <a
            href="/use-cases/api-changelog-monitoring"
            className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Use Cases
          </a>
          <a
            href="/guides/api-versioning-best-practices"
            className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Guides
          </a>
          <a
            href="/#pricing"
            className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Pricing
          </a>
          <a
            href="/#faq"
            className="rounded-md px-1 py-0.5 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            FAQ
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
  );
}

export function SeoCtaBanner({
  headline = "Your next API outage is preventable.",
  subtext = "Engineering teams lose an average of 4 hours per incident caused by surprise API changes. Start monitoring in under 2 minutes — no credit card required, nothing to install.",
}: {
  headline?: string;
  subtext?: string;
}) {
  return (
    <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {headline}
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-lg text-gray-400">
          {subtext}
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
  );
}

export function SeoFooter() {
  const linkClass =
    "rounded transition hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

  return (
    <footer className="border-t border-gray-800/60 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <a href="/" className="flex items-center gap-2 text-sm font-bold">
              <Zap aria-hidden="true" className="h-4 w-4 text-violet-400" />
              APIDelta
            </a>
            <p className="mt-3 text-xs text-gray-600">
              AI-powered API changelog monitoring for engineering teams.
            </p>
          </div>

          {/* Use Cases */}
          <nav aria-label="Use cases" className="space-y-2 text-sm text-gray-500">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Use Cases</p>
            <a href="/use-cases/api-changelog-monitoring" className={linkClass}>API Changelog Monitoring</a><br />
            <a href="/use-cases/breaking-change-detection" className={linkClass}>Breaking Change Detection</a><br />
            <a href="/use-cases/api-dependency-management" className={linkClass}>API Dependency Management</a><br />
            <a href="/use-cases/saas-api-integrations" className={linkClass}>SaaS API Integrations</a><br />
            <a href="/use-cases/devops-api-monitoring" className={linkClass}>DevOps API Monitoring</a>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources" className="space-y-2 text-sm text-gray-500">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Resources</p>
            <a href="/guides/api-versioning-best-practices" className={linkClass}>API Versioning Best Practices</a><br />
            <a href="/guides/handling-breaking-api-changes" className={linkClass}>Handling Breaking Changes</a><br />
            <a href="/compare/manual-vs-automated" className={linkClass}>Manual vs Automated Monitoring</a><br />
            <a href="/compare/generic-vs-api-specific" className={linkClass}>Generic vs API-Specific Tools</a>
          </nav>

          {/* Product */}
          <nav aria-label="Product" className="space-y-2 text-sm text-gray-500">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Product</p>
            <a href="/#features" className={linkClass}>Features</a><br />
            <a href="/#pricing" className={linkClass}>Pricing</a><br />
            <a href="/#faq" className={linkClass}>FAQ</a><br />
            <a href="/terms" className={linkClass}>Terms</a><br />
            <a href="/privacy" className={linkClass}>Privacy</a>
          </nav>
        </div>

        <div className="mt-10 border-t border-gray-800/60 pt-6 text-center">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} APIDelta. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function SeoHowItWorks() {
  const steps = [
    {
      step: "1",
      title: "Paste your changelog URLs",
      description:
        "Add the changelog URL for any third-party API your product depends on. Stripe, Twilio, GitHub, OpenAI, and 50+ more work out of the box.",
    },
    {
      step: "2",
      title: "AI reads and classifies every update",
      description:
        "Each changelog entry gets a severity level, affected endpoints, and a plain-English summary. No more skimming release notes.",
    },
    {
      step: "3",
      title: "Get alerted before things break",
      description:
        "When a breaking change drops, you get a Slack message or email with exactly what changed, which endpoints are affected, and what to do next.",
    },
  ];

  return (
    <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
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
          {steps.map((item) => (
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
  );
}

export function SeoFaqSection({
  faqs,
}: {
  faqs: { q: string; a: string }[];
}) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <section className="py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-gray-800 bg-gray-900"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left font-medium transition hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 focus-visible:rounded-xl [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-gray-500 transition group-open:rotate-180"
                />
              </summary>
              <div className="px-6 pb-4 text-sm leading-relaxed text-gray-400">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SeoFeatureGrid({
  features,
}: {
  features: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }[];
}) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <div
          key={feature.title}
          className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-700"
        >
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <feature.icon
              aria-hidden="true"
              className="h-5 w-5 text-violet-400"
            />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
          <p className="text-sm leading-relaxed text-gray-400">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SeoInternalLinks({
  current,
}: {
  current: string;
}) {
  const pages = [
    {
      href: "/",
      label: "APIDelta Home",
    },
    {
      href: "/use-cases/api-changelog-monitoring",
      label: "API Changelog Monitoring",
    },
    {
      href: "/use-cases/breaking-change-detection",
      label: "Breaking Change Detection",
    },
    {
      href: "/use-cases/api-dependency-management",
      label: "API Dependency Management",
    },
    {
      href: "/use-cases/saas-api-integrations",
      label: "SaaS API Integrations",
    },
    {
      href: "/use-cases/devops-api-monitoring",
      label: "DevOps API Monitoring",
    },
    {
      href: "/compare/manual-vs-automated",
      label: "Manual vs Automated Monitoring",
    },
    {
      href: "/compare/generic-vs-api-specific",
      label: "Generic vs API-Specific Tools",
    },
    {
      href: "/guides/api-versioning-best-practices",
      label: "API Versioning Best Practices",
    },
    {
      href: "/guides/handling-breaking-api-changes",
      label: "Handling Breaking API Changes",
    },
  ];

  const links = pages.filter((p) => p.href !== current);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-6 text-center text-xl font-semibold">
          Explore more
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm text-gray-300 transition hover:border-violet-500/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shared SEO hero section (used by all use-case, compare, and guide pages)
// ---------------------------------------------------------------------------

export function SeoHero({
  title,
  gradientText,
  description,
  ctaText,
  ctaHref = "/sign-up",
  showArrow = true,
}: {
  title: string;
  gradientText: string;
  description: string;
  ctaText: string;
  ctaHref?: string;
  showArrow?: boolean;
}) {
  return (
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
          {title}{" "}
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            {gradientText}
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl">
          {description}
        </p>

        <a
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-500 hover:shadow-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          {ctaText}
          {showArrow && (
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          )}
        </a>
        <p className="mt-4 text-sm text-gray-500">
          14-day free trial &middot; No credit card required
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Shared comparison table (used by /compare/* pages)
// ---------------------------------------------------------------------------

export function SeoComparisonTable({
  heading,
  columns,
  rows,
}: {
  heading: string;
  columns: { dimension: string; negative: string; positive: string };
  rows: { dimension: string; negative: string; positive: string }[];
}) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          {heading}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="pb-4 pr-6 text-sm font-medium text-gray-500">
                  {columns.dimension}
                </th>
                <th className="pb-4 pr-6 text-sm font-medium text-red-400">
                  {columns.negative}
                </th>
                <th className="pb-4 text-sm font-medium text-green-400">
                  {columns.positive}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
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
                      {row.negative}
                    </span>
                  </td>
                  <td className="py-4 text-gray-300">
                    <span className="flex items-start gap-2">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-green-400"
                      />
                      {row.positive}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
