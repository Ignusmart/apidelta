import type { Metadata } from 'next';
import { Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'DriftWatch Terms of Service — read the terms that govern your use of DriftWatch, our API changelog monitoring platform.',
  alternates: { canonical: 'https://driftwatch.dev/terms' },
  openGraph: {
    title: 'Terms of Service | DriftWatch',
    description:
      'DriftWatch Terms of Service — read the terms that govern your use of DriftWatch.',
    type: 'website',
    url: 'https://driftwatch.dev/terms',
  },
};

export default function TermsPage() {
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
            DriftWatch
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
          Terms of Service
        </h1>
        <p className="mb-12 text-sm text-gray-500">
          Last updated: April 2026
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-gray-300 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_p]:mb-3">
          <section>
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using DriftWatch (&quot;the Service&quot;), operated by
              DriftWatch (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by
              these Terms of Service. If you do not agree, do not use the
              Service.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              DriftWatch is a software-as-a-service platform that monitors
              third-party API changelogs, uses AI to classify changes by
              severity, and delivers alerts to your team via Slack, email, and
              other integrations. The Service includes the web dashboard, API,
              and all related tools and documentation.
            </p>
          </section>

          <section>
            <h2>3. Accounts and Registration</h2>
            <p>
              You must provide accurate and complete information when creating
              an account. You are responsible for maintaining the security of
              your account credentials. You must notify us immediately of any
              unauthorized access.
            </p>
            <p>
              Each account is associated with a team workspace. You are
              responsible for all activity that occurs under your team.
            </p>
          </section>

          <section>
            <h2>4. Free Trial and Paid Plans</h2>
            <p>
              We offer a 14-day free trial with access to up to 3 monitored
              APIs. No credit card is required to start a trial.
            </p>
            <p>
              Paid plans are billed monthly via Stripe. By subscribing, you
              authorize us to charge your payment method on a recurring basis.
              You may cancel at any time; your access continues through the
              end of the current billing period.
            </p>
            <p>
              We reserve the right to change pricing with 30 days&apos; written
              notice. Price changes do not apply to the current billing
              period.
            </p>
          </section>

          <section>
            <h2>5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>
                Use the Service for any unlawful purpose or in violation of
                any applicable laws
              </li>
              <li>
                Attempt to gain unauthorized access to the Service or its
                related systems
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service
              </li>
              <li>
                Reverse engineer, decompile, or disassemble any part of the
                Service
              </li>
              <li>
                Use the Service to scrape or harvest data in violation of
                third-party terms of service
              </li>
              <li>
                Resell or redistribute the Service without our written
                consent
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Intellectual Property</h2>
            <p>
              The Service, including its original content, features, and
              functionality, is owned by DriftWatch and is protected by
              copyright, trademark, and other intellectual property laws. Your
              data remains yours; we claim no ownership over the content you
              provide.
            </p>
          </section>

          <section>
            <h2>7. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our{' '}
              <Link
                href="/privacy"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                Privacy Policy
              </Link>
              , which describes how we collect, use, and protect your
              information.
            </p>
          </section>

          <section>
            <h2>8. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee
              uninterrupted access to the Service. We may perform scheduled
              maintenance with reasonable advance notice. We are not liable
              for any downtime or service interruptions.
            </p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, DriftWatch shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including but not limited to loss of profits,
              data, or business opportunities, arising from your use of the
              Service.
            </p>
            <p>
              Our total liability for any claim arising from the Service
              shall not exceed the amount you paid us in the 12 months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, either express or implied, including but
              not limited to implied warranties of merchantability, fitness
              for a particular purpose, and non-infringement. We do not
              warrant that AI classifications will be error-free or that
              monitoring will detect every API change.
            </p>
          </section>

          <section>
            <h2>11. Termination</h2>
            <p>
              We may suspend or terminate your account if you violate these
              Terms or engage in activity that harms the Service or other
              users. You may terminate your account at any time by
              contacting us or using the account settings.
            </p>
            <p>
              Upon termination, your right to access the Service ceases
              immediately. We may retain your data for a reasonable period to
              comply with legal obligations.
            </p>
          </section>

          <section>
            <h2>12. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you
              of material changes via email or through the Service. Continued
              use of the Service after changes take effect constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with
              applicable law, without regard to conflict of law principles.
              Any disputes arising from these Terms or the Service shall be
              resolved through binding arbitration.
            </p>
          </section>

          <section>
            <h2>14. Contact</h2>
            <p>
              If you have questions about these Terms, contact us at{' '}
              <a
                href="mailto:support@driftwatch.dev"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                support@driftwatch.dev
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
            DriftWatch
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
            &copy; {new Date().getFullYear()} DriftWatch. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
