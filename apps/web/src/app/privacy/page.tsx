import type { Metadata } from 'next';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'APIDelta Privacy Policy — learn how we collect, use, and protect your data when you use our API changelog monitoring platform.',
  alternates: { canonical: 'https://apidelta.dev/privacy' },
  openGraph: {
    title: 'Privacy Policy | APIDelta',
    description:
      'APIDelta Privacy Policy — learn how we collect, use, and protect your data.',
    type: 'website',
    url: 'https://apidelta.dev/privacy',
  },
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-12 text-sm text-gray-500">
          Last updated: April 2026
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-gray-300 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-gray-200 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_p]:mb-3">
          <section>
            <h2>1. Introduction</h2>
            <p>
              APIDelta (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our API changelog
              monitoring platform (&quot;the Service&quot;).
            </p>
            <p>
              We comply with applicable data protection regulations,
              including the General Data Protection Regulation (GDPR) for
              users in the European Economic Area.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3>Account Information</h3>
            <p>
              When you create an account, we collect your name, email
              address, and authentication credentials (or OAuth tokens if you
              sign in with GitHub). This is necessary to provide and secure
              the Service.
            </p>

            <h3>Team and Configuration Data</h3>
            <p>
              We store your team workspace settings, monitored API URLs,
              alert configurations, and notification preferences. This data
              is required for the Service to function.
            </p>

            <h3>Usage Data</h3>
            <p>
              We automatically collect information about how you interact
              with the Service, including pages visited, features used, and
              timestamps. We use this to improve the product and diagnose
              issues.
            </p>

            <h3>Payment Information</h3>
            <p>
              Payment processing is handled by Stripe. We do not store your
              credit card number, CVV, or full payment details on our
              servers. Stripe may collect and process your payment
              information in accordance with their{' '}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                Privacy Policy
              </a>
              .
            </p>

            <h3>Changelog Content</h3>
            <p>
              We crawl and store publicly available changelog content from
              the third-party API URLs you configure. This content is
              publicly available and is not personal data.
            </p>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>
                Process changelog data and deliver AI-classified alerts to
                your configured channels
              </li>
              <li>Process payments and manage your subscription</li>
              <li>
                Send you transactional emails (account verification, billing
                receipts, alert notifications)
              </li>
              <li>
                Communicate product updates and important service changes
              </li>
              <li>
                Monitor and analyze usage trends to improve the user
                experience
              </li>
              <li>Detect, prevent, and address security issues</li>
            </ul>
          </section>

          <section>
            <h2>4. Third-Party Services</h2>
            <p>
              We use the following third-party services that may process your
              data:
            </p>
            <ul>
              <li>
                <strong>Stripe</strong> — payment processing
              </li>
              <li>
                <strong>Vercel</strong> — web application hosting and
                analytics
              </li>
              <li>
                <strong>Anthropic (Claude API)</strong> — AI classification
                of changelog entries (only publicly available changelog text
                is sent; no personal data)
              </li>
              <li>
                <strong>Slack</strong> — alert delivery (only when you
                configure a Slack integration)
              </li>
            </ul>
            <p>
              Each third-party service operates under its own privacy policy.
              We encourage you to review their policies.
            </p>
          </section>

          <section>
            <h2>5. Data Retention</h2>
            <p>
              We retain your account and configuration data for as long as
              your account is active. Changelog data and change history are
              retained according to your plan (7 days for Starter, 90 days
              for Pro).
            </p>
            <p>
              When you delete your account, we remove your personal data
              within 30 days, except where retention is required by law or
              for legitimate business purposes (e.g., billing records).
            </p>
          </section>

          <section>
            <h2>6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures
              to protect your data, including:
            </p>
            <ul>
              <li>Encryption in transit (TLS/HTTPS) and at rest</li>
              <li>
                Team-scoped data isolation (multi-tenant architecture with
                strict access controls)
              </li>
              <li>
                Regular security reviews and dependency monitoring
              </li>
            </ul>
            <p>
              No method of electronic transmission or storage is 100%
              secure. While we strive to protect your data, we cannot
              guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <ul>
              <li>
                <strong>Access</strong> — request a copy of the data we hold
                about you
              </li>
              <li>
                <strong>Rectification</strong> — request correction of
                inaccurate data
              </li>
              <li>
                <strong>Erasure</strong> — request deletion of your personal
                data
              </li>
              <li>
                <strong>Portability</strong> — request your data in a
                machine-readable format
              </li>
              <li>
                <strong>Restriction</strong> — request that we limit
                processing of your data
              </li>
              <li>
                <strong>Objection</strong> — object to processing of your
                data for certain purposes
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{' '}
              <a
                href="mailto:privacy@apidelta.dev"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                privacy@apidelta.dev
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2>8. Cookies and Tracking</h2>
            <p>
              We use essential cookies required for authentication and
              session management. We do not use third-party advertising
              cookies. Analytics data is collected in aggregate form to
              improve the Service.
            </p>
          </section>

          <section>
            <h2>9. International Data Transfers</h2>
            <p>
              Our Service is hosted in the United States. If you access the
              Service from outside the US, your data may be transferred to
              and processed in the US. We ensure appropriate safeguards are
              in place for international transfers in compliance with GDPR
              and other applicable regulations.
            </p>
          </section>

          <section>
            <h2>10. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of
              16. We do not knowingly collect personal data from children. If
              we become aware that we have collected data from a child, we
              will take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes via email or through the
              Service. The &quot;Last updated&quot; date at the top reflects the most
              recent revision.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or
              our data practices, contact us at:
            </p>
            <p>
              <a
                href="mailto:privacy@apidelta.dev"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                privacy@apidelta.dev
              </a>
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
