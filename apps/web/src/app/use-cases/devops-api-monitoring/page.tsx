import type { Metadata } from "next";
import { Monitor, GitMerge, Bell, Terminal, Shield, Clock } from "lucide-react";
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
  title: "API Monitoring for DevOps — Changelog Alerts in Your Pipeline",
  description:
    "Add third-party API changelog monitoring to your DevOps stack. APIDelta detects breaking changes, version deprecations, and sunset notices — delivered to Slack alongside your existing alerts.",
  alternates: {
    canonical: "https://apidelta.dev/use-cases/devops-api-monitoring",
  },
  openGraph: {
    title: "API Monitoring for DevOps — Changelog Alerts in Your Pipeline",
    description:
      "Third-party API changelog monitoring for DevOps teams. Detect breaking changes and deprecations alongside your existing monitoring stack.",
    type: "website",
    url: "https://apidelta.dev/use-cases/devops-api-monitoring",
  },
  twitter: {
    card: "summary_large_image",
    title: "API Monitoring for DevOps — Changelog Alerts in Your Pipeline",
    description:
      "API changelog monitoring for DevOps. Detect breaking changes and deprecations in your existing alert pipeline.",
  },
};

const FEATURES = [
  {
    icon: Monitor,
    title: "Complements Your Monitoring Stack",
    description:
      "You already monitor uptime, latency, and error rates. APIDelta adds the missing layer: monitoring what your API providers announce before changes hit your metrics. Catch the cause, not just the symptoms.",
  },
  {
    icon: Bell,
    title: "Slack-Native Alerts",
    description:
      "Breaking change alerts land in the same Slack channels your team already watches. No new dashboards to check. Severity-based routing puts critical changes in #incidents and informational updates in #api-updates.",
  },
  {
    icon: GitMerge,
    title: "Actionable Change Intelligence",
    description:
      "Each alert includes the severity level, affected endpoints, a plain-English summary, and a link to the full changelog. Your on-call engineer knows exactly what changed and what to do next.",
  },
  {
    icon: Clock,
    title: "Hourly Crawl Cadence",
    description:
      "APIDelta checks every monitored API on the hour. When a provider pushes a breaking change at 3 PM, your team knows by 4 PM — not next Monday when someone manually checks the changelog.",
  },
  {
    icon: Terminal,
    title: "Zero Infrastructure to Manage",
    description:
      "No agents, sidecars, or self-hosted crawlers. Add your API changelog URLs through the dashboard and monitoring starts immediately. APIDelta handles the crawling, parsing, and classification infrastructure.",
  },
  {
    icon: Shield,
    title: "Audit Trail for Post-Mortems",
    description:
      "When a post-mortem asks whether you knew about an API change, the answer is in your APIDelta dashboard. Every crawl, classification, and alert is logged with timestamps for full accountability.",
  },
];

const FAQS = [
  {
    q: "How does APIDelta fit into my existing monitoring stack?",
    a: "APIDelta is not a replacement for uptime monitoring (Datadog, PagerDuty) or APM tools. It is a complementary layer that monitors what your API providers announce — not what your own systems measure. Think of it as monitoring the changelog, not the endpoint. Alerts go to Slack and email, fitting into your existing alert routing.",
  },
  {
    q: "Is this the same as API uptime monitoring?",
    a: "No. Uptime monitoring checks if an API endpoint is responding. APIDelta monitors the API provider's changelog for announced changes — breaking changes, deprecations, version bumps, and sunset notices. You need both: uptime monitoring catches unannounced outages, APIDelta catches announced changes that could break your integration if you do not adapt.",
  },
  {
    q: "Can I filter alerts by severity?",
    a: "Yes. APIDelta classifies every changelog entry as breaking, deprecation, non-breaking, or informational with severity levels (critical, high, medium, low). You can configure alert thresholds per channel — for example, only critical and high severity changes go to #incidents, while everything goes to #api-updates.",
  },
  {
    q: "How does this help with change management?",
    a: "Third-party API changes are a form of externally-imposed change management. APIDelta gives your team advance notice of changes that require action, including the timeline and scope. This lets you plan migrations during sprints instead of responding to incidents. Every change is logged, making it auditable for compliance frameworks like SOC 2.",
  },
  {
    q: "What if I use Terraform or IaC for my cloud APIs?",
    a: "Infrastructure-as-code manages your configuration of cloud services, but it does not monitor when those services change their API behavior. A cloud provider can deprecate an API version that your Terraform modules depend on. APIDelta monitors those provider changelogs so you know about deprecations before your next terraform apply fails.",
  },
];

export default function DevopsApiMonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SeoBreadcrumb items={[{ name: "Home", href: "/" }, { name: "Use Cases", href: "/use-cases/devops-api-monitoring" }, { name: "DevOps API Monitoring", href: "/use-cases/devops-api-monitoring" }]} />
      <SeoNav />

      <main id="main-content">
        <SeoHero
          title="API Monitoring for"
          gradientText="DevOps Teams"
          description="Your stack monitors uptime, latency, and error rates. But when a third-party API publishes a breaking change, you find out from production errors — not from the changelog. APIDelta adds the missing layer to your monitoring stack."
          ctaText="Add changelog monitoring to your stack"
        />

        {/* Pain section */}
        <section className="py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-center text-3xl font-bold tracking-tight sm:text-4xl">
              The gap in your monitoring stack
            </h2>
            <div className="space-y-6 text-lg text-gray-400">
              <p>
                Modern DevOps teams have sophisticated monitoring: Datadog for
                metrics, PagerDuty for incident management, Sentry for error
                tracking, Grafana for dashboards. But all of these tools monitor
                the effects of problems — elevated error rates, increased
                latency, failed health checks.
              </p>
              <p>
                When a third-party API publishes a breaking change, the cause
                is visible in their changelog hours or days before it becomes
                visible in your metrics. A deprecation notice today prevents a
                production incident next month. A version bump announcement
                gives your team weeks to prepare instead of minutes to react.
              </p>
              <p className="text-white">
                APIDelta fills this gap by monitoring the one data source your
                existing tools cannot see: your API providers' changelogs. It is
                not a replacement for your monitoring stack — it is the early
                warning system that makes the rest of your stack less noisy.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-800/60 bg-gray-900/30 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-violet-400">
                Built for DevOps
              </p>
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Changelog monitoring that fits your workflow
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
        <SeoInternalLinks current="/use-cases/devops-api-monitoring" />

        {/* CTA */}
        <SeoCtaBanner
          headline="Add the missing layer to your monitoring stack."
          subtext="APIDelta monitors third-party API changelogs hourly and alerts your team in Slack when breaking changes, deprecations, or version bumps are detected. Zero infrastructure to manage."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
