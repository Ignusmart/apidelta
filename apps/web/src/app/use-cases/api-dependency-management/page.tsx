import type { Metadata } from "next";
import {
  Layers,
  Bot,
  Bell,
  Users,
  Shield,
  BarChart3,
} from "lucide-react";
import {
  SeoNav,
  SeoHero,
  SeoCtaBanner,
  SeoFooter,
  SeoHowItWorks,
  SeoFaqSection,
  SeoFeatureGrid,
  SeoInternalLinks,
  SeoBreadcrumb,
} from "../../_components/seo-page-shell";

export const metadata: Metadata = {
  title: "API Dependency Management for Engineering Teams",
  description:
    "Track and manage your third-party API dependencies in one place. APIDelta gives engineering leads a single dashboard to monitor changes, assign ownership, and prevent surprise breakages.",
  alternates: {
    canonical: "https://apidelta.dev/use-cases/api-dependency-management",
  },
  openGraph: {
    title: "API Dependency Management for Engineering Teams",
    description:
      "One dashboard for all your API dependencies. Track changes, assign ownership, and prevent surprise breakages across your entire integration surface.",
    type: "website",
    url: "https://apidelta.dev/use-cases/api-dependency-management",
  },
  twitter: {
    card: "summary_large_image",
    title: "API Dependency Management for Engineering Teams",
    description:
      "Track third-party API dependencies in one dashboard. AI-classified changes, team ownership, and instant alerts.",
  },
};

const FEATURES = [
  {
    icon: Layers,
    title: "Single Dependency Dashboard",
    description:
      "See every third-party API your product depends on in one place. View recent changes, severity trends, and ownership at a glance.",
  },
  {
    icon: Users,
    title: "Team Ownership Assignment",
    description:
      "Assign each API to the engineer or team that maintains the integration. When a change is detected, the right person gets the alert.",
  },
  {
    icon: Bot,
    title: "AI-Classified Change Feed",
    description:
      "Every changelog update is classified by AI — breaking, deprecation, non-breaking, informational. Filter the feed by severity to focus on what matters.",
  },
  {
    icon: Bell,
    title: "Routed Alerts",
    description:
      "Different APIs route to different alert channels. Payment API changes go to the payments team's Slack channel. Auth changes go to the platform team's email.",
  },
  {
    icon: Shield,
    title: "Audit Trail for Compliance",
    description:
      "Every change detected, every classification made, every alert sent — logged and searchable. Perfect for post-mortems, SOC 2 evidence, and incident timelines.",
  },
  {
    icon: BarChart3,
    title: "Change Velocity Tracking",
    description:
      "Understand how frequently each dependency publishes changes. High-velocity APIs need closer attention. Spot patterns before they become problems.",
  },
];

const FAQS = [
  {
    q: "What is API dependency management?",
    a: "API dependency management is the practice of tracking, monitoring, and maintaining the third-party APIs your product relies on. It includes knowing which APIs you depend on, who owns each integration, what changes are being published, and whether any of those changes require action from your team.",
  },
  {
    q: "How is this different from package dependency management?",
    a: "Package managers (npm, pip, etc.) handle library dependencies in your codebase. API dependency management handles the external services you call at runtime — Stripe for payments, Twilio for SMS, OpenAI for AI, etc. These services change independently of your deploy cycle, and their changelogs are the only source of truth.",
  },
  {
    q: "Can I assign different APIs to different team members?",
    a: "Yes. APIDelta supports team-based API ownership. Assign each monitored API to the engineer or team responsible for that integration. Alerts are routed to the owner, so the payments engineer gets Stripe change alerts and the communications engineer gets Twilio alerts.",
  },
  {
    q: "How many APIs can I monitor?",
    a: "The Starter plan supports 10 monitored APIs — enough for most small teams. The Pro plan supports 50 APIs for teams with larger integration surfaces. Both plans include AI classification, Slack and email alerts, and hourly monitoring.",
  },
  {
    q: "Can engineering leads use this for API risk assessment?",
    a: "Yes. APIDelta provides visibility into change velocity per API, severity distribution, and historical changes. Engineering leads can use this data to assess which dependencies are high-risk (frequent breaking changes) and allocate maintenance time accordingly.",
  },
];

export default function ApiDependencyManagementPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoBreadcrumb items={[{ name: "Home", href: "/" }, { name: "Use Cases", href: "/use-cases/api-dependency-management" }, { name: "API Dependency Management", href: "/use-cases/api-dependency-management" }]} />
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="API Dependency Management"
          gradientText="for Engineering Teams"
          description="Your product calls 20 third-party APIs. Who owns each integration? What changed last week? Is anything about to break? APIDelta gives engineering leads a single dashboard to track API dependencies, monitor changes, and prevent surprise breakages."
          ctaText="Start managing API dependencies"
        />

        {/* Pain section */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              The API dependency blind spot
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Engineering teams have mature tooling for code dependencies —
                package managers, lockfiles, automated vulnerability scanning,
                Dependabot PRs. But for API dependencies — the external services
                your product calls at runtime — the tooling barely exists.
              </p>
              <p>
                Nobody has a clear inventory of which third-party APIs the
                product depends on. Nobody knows who owns each integration. When
                Stripe changes a parameter or Twilio deprecates an auth method,
                the team finds out reactively — usually from a production
                incident.
              </p>
              <p>
                This is especially painful for engineering leads who need
                visibility across the team's integration surface. They are
                accountable for reliability but have no systematic way to track
                external API risk.
              </p>
              <p className="text-white">
                APIDelta closes this gap. Add your API changelog URLs, assign
                ownership, and get a single dashboard with AI-classified changes
                across every dependency.
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
                Manage API dependencies like you manage code
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
        <SeoInternalLinks current="/use-cases/api-dependency-management" />

        {/* CTA */}
        <SeoCtaBanner
          headline="Get visibility into your API dependencies."
          subtext="Track every third-party API your product depends on. AI-classified changes, team ownership, and instant alerts — all in one dashboard."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
