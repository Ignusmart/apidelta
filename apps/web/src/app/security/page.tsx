import type { Metadata } from 'next';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security',
  description:
    "How APIDelta handles your data — hosting, encryption, sub-processors, access controls, and what we don't have yet. Honest answers for procurement reviewers.",
  alternates: { canonical: 'https://apidelta.dev/security' },
  openGraph: {
    title: 'Security | APIDelta',
    description:
      'How APIDelta handles your data — encryption, sub-processors, access controls, and what we don&apos;t have yet.',
    type: 'website',
    url: 'https://apidelta.dev/security',
  },
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <Zap aria-hidden="true" className="h-5 w-5 text-violet-400" />
            APIDelta
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Start free trial
          </Link>
        </div>
      </nav>

      <main id="main-content" className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Security
        </h1>
        <p className="mb-12 text-sm text-gray-500">Last updated: April 2026</p>

        <p className="mb-10 rounded-xl border border-violet-500/30 bg-violet-500/5 p-5 text-sm leading-relaxed text-gray-300">
          This page is meant to be useful to a procurement reviewer or a
          security-conscious engineer doing due diligence — not a marketing
          claim sheet. We list what we do, what we don&apos;t do yet, and how to
          reach us. Email{' '}
          <a
            href="mailto:security@apidelta.dev"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
          >
            security@apidelta.dev
          </a>{' '}
          for vendor-assessment questions or to disclose a vulnerability.
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-gray-300 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-gray-200 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_p]:mb-3">
          <section>
            <h2>What we don&apos;t have yet</h2>
            <p>
              Up front, so you can stop reading early if it&apos;s a deal-breaker:
            </p>
            <ul>
              <li>
                <strong>SOC 2 Type II:</strong> not yet. On the roadmap once
                seat count and revenue justify the audit.
              </li>
              <li>
                <strong>SSO / SAML:</strong> not yet. Listed as roadmap on the
                Business plan.
              </li>
              <li>
                <strong>HIPAA / FedRAMP:</strong> not in scope. APIDelta
                processes public changelog content and your alert routing
                config — not regulated PHI or controlled federal data.
              </li>
              <li>
                <strong>Penetration test reports:</strong> none we publish
                today. We can share the scope of the most recent dependency
                audit on request under NDA once a Team-tier conversation is
                live.
              </li>
            </ul>
            <p>
              If any of these are blocking, tell us at{' '}
              <a
                href="mailto:security@apidelta.dev"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                security@apidelta.dev
              </a>{' '}
              and we&apos;ll be straight about timing.
            </p>
          </section>

          <section>
            <h2>Hosting and infrastructure</h2>
            <ul>
              <li>
                <strong>Web app:</strong> Vercel (US regions). Static prerender
                + serverless functions.
              </li>
              <li>
                <strong>API and crawler:</strong> Railway (US). Long-running
                Node.js workers behind a managed Postgres instance.
              </li>
              <li>
                <strong>Queue + cache:</strong> Upstash Redis (US).
              </li>
              <li>
                <strong>Customer data is never stored on developer laptops</strong>
                {' '}— production access is via tooling that audits each session.
              </li>
            </ul>
          </section>

          <section>
            <h2>Encryption</h2>
            <ul>
              <li>
                <strong>In transit:</strong> TLS 1.2+ on every endpoint
                (apidelta.dev, api.apidelta.dev). HSTS enabled. Internal
                service-to-service traffic also over TLS.
              </li>
              <li>
                <strong>At rest:</strong> Postgres data is encrypted at rest by
                Railway&apos;s underlying provider (AES-256). Redis data is
                ephemeral (queue jobs and short-lived caches) and encrypted at
                rest by Upstash.
              </li>
              <li>
                <strong>Secrets:</strong> API keys and OAuth tokens are stored
                hashed where the protocol allows it (e.g., bearer tokens for
                MCP), and encrypted at rest where it doesn&apos;t (e.g., GitHub
                PATs the user provides for the GitHub Issues alert channel).
                Application-layer secrets live in Vercel and Railway secret
                stores — never in the repo.
              </li>
            </ul>
          </section>

          <section>
            <h2>What we store</h2>
            <ul>
              <li>Account info: email, name, OAuth subject ID.</li>
              <li>
                Team configuration: monitored API URLs, alert routes, severity
                thresholds, channel configs (Slack webhook URLs, GitHub PATs,
                generic webhook URLs + HMAC secrets).
              </li>
              <li>
                Crawled changelog content (publicly available text from the
                URLs you configure). This is not personal data.
              </li>
              <li>
                AI classifications: severity, change type, affected endpoints,
                summary text generated by the Anthropic API for each entry.
              </li>
              <li>Alert dispatch history (timestamps, channel, status).</li>
              <li>Stripe customer ID + subscription state.</li>
            </ul>
          </section>

          <section>
            <h2>What we don&apos;t store</h2>
            <ul>
              <li>
                <strong>Your source code.</strong> APIDelta is a server-side
                changelog crawler. There is no SDK, no agent, no CI plugin.
              </li>
              <li>
                <strong>API keys to the third-party services you monitor.</strong>{' '}
                We crawl public changelog URLs — we don&apos;t need credentials
                to Stripe, OpenAI, etc.
              </li>
              <li>
                <strong>Credit card numbers.</strong> Stripe handles payment
                surfaces directly; we never see PAN data.
              </li>
              <li>
                <strong>Your end-users&apos; data.</strong> APIDelta only knows
                about you, your team, and the URLs you configure.
              </li>
            </ul>
          </section>

          <section>
            <h2>Sub-processors</h2>
            <p>
              Third parties that may process customer data on APIDelta&apos;s
              behalf:
            </p>
            <ul>
              <li>
                <strong>Vercel</strong> — web hosting and edge delivery (US).
              </li>
              <li>
                <strong>Railway</strong> — API + worker hosting and managed
                Postgres (US).
              </li>
              <li>
                <strong>Upstash</strong> — Redis for queue and cache (US).
              </li>
              <li>
                <strong>Anthropic (Claude API)</strong> — AI classification of
                changelog entries. We send only the publicly available
                changelog text we crawled; we don&apos;t send your team or
                account metadata. Anthropic&apos;s API is configured with zero
                data retention where the option is available.
              </li>
              <li>
                <strong>Stripe</strong> — payment processing. PCI-DSS Level 1.
              </li>
              <li>
                <strong>Resend</strong> — transactional email (alerts, magic
                links, billing receipts).
              </li>
              <li>
                <strong>GitHub</strong> — only when you connect the GitHub
                Issues alert channel; we use the PAT you provide to file issues
                in repos you authorize.
              </li>
              <li>
                <strong>Slack</strong> — only when you connect a Slack
                Incoming Webhook for alert delivery.
              </li>
            </ul>
            <p>
              We will give 30 days&apos; notice via email before adding a new
              sub-processor that processes customer data.
            </p>
          </section>

          <section>
            <h2>Authentication and access control</h2>
            <ul>
              <li>
                <strong>End users</strong> sign in with email magic link or
                GitHub OAuth via NextAuth.js v5. We never store plaintext
                passwords; magic-link tokens are single-use and short-lived.
              </li>
              <li>
                <strong>Multi-tenant isolation:</strong> every record is scoped
                to a <code className="rounded bg-gray-800 px-1 text-violet-300">teamId</code>{' '}
                and queries that read or write team data are guarded at the
                application layer. There is no shared-tenant data.
              </li>
              <li>
                <strong>API keys (MCP server):</strong> per-team bearer tokens,
                read-only, rotatable and revocable from the dashboard.
              </li>
              <li>
                <strong>Internal access:</strong> production database access
                requires SSO + MFA. Employees access customer data only when
                debugging a specific support request, and the access is logged.
              </li>
            </ul>
          </section>

          <section>
            <h2>Data retention and deletion</h2>
            <ul>
              <li>
                Change history is retained for the lifetime of your team
                account (Starter and Team) or per the agreement on Business.
              </li>
              <li>
                Alert dispatch history (delivery attempts) is retained for 90
                days.
              </li>
              <li>
                On account deletion, we remove personal data within 30 days,
                except where retention is required by law (e.g., billing
                records held for 7 years per US tax requirements).
              </li>
              <li>
                A team admin can request a full data export at{' '}
                <a
                  href="mailto:security@apidelta.dev"
                  className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
                >
                  security@apidelta.dev
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2>Vulnerability management</h2>
            <ul>
              <li>
                Dependencies are monitored for known CVEs via GitHub Dependabot
                + npm audit, with patches applied on a rolling basis.
              </li>
              <li>
                We use Prisma as the only data-access layer to constrain the
                surface for SQL injection, and use parameterized queries
                everywhere.
              </li>
              <li>
                Web inputs are typed and validated at the API boundary
                (NestJS DTOs + class-validator).
              </li>
              <li>
                We don&apos;t yet run scheduled third-party penetration tests.
                When we do, the report scope will be available under NDA on
                request.
              </li>
            </ul>
          </section>

          <section>
            <h2>Vulnerability disclosure</h2>
            <p>
              If you believe you&apos;ve found a security vulnerability,
              please email{' '}
              <a
                href="mailto:security@apidelta.dev"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                security@apidelta.dev
              </a>
              . We&apos;ll acknowledge within 2 business days and aim to
              triage within 5 business days. We don&apos;t currently run a
              paid bounty, but we will credit reporters publicly when the
              fix ships, with permission.
            </p>
            <p>
              Please don&apos;t test against accounts you don&apos;t own,
              don&apos;t pull or modify other teams&apos; data, and give us
              reasonable time to fix before public disclosure. We&apos;ll do
              the same for you.
            </p>
          </section>

          <section>
            <h2>Incident response</h2>
            <p>
              If a security incident affects customer data, we will notify
              affected teams via the email on file within 72 hours of
              confirmation, with what we know, what we&apos;re doing, and what
              actions you should take. We&apos;ll publish a public post-mortem
              for incidents that affect more than one customer.
            </p>
          </section>

          <section>
            <h2>Compliance</h2>
            <p>
              We process personal data in accordance with the GDPR for users in
              the EEA and UK, and the CCPA for California residents. See our{' '}
              <Link
                href="/privacy"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                Privacy Policy
              </Link>{' '}
              for the full data-rights detail.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Vendor-assessment questions, vulnerability reports, or
              data-export requests:{' '}
              <a
                href="mailto:security@apidelta.dev"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                security@apidelta.dev
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/60 py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold"
          >
            <Zap aria-hidden="true" className="h-4 w-4 text-violet-400" />
            APIDelta
          </Link>
          <nav aria-label="Footer navigation" className="flex gap-6 text-sm text-gray-500">
            <Link href="/security" className="transition hover:text-gray-300">
              Security
            </Link>
            <Link href="/privacy" className="transition hover:text-gray-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-gray-300">
              Terms of Service
            </Link>
          </nav>
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} APIDelta. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
