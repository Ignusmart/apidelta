import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Bot,
  Database,
  GitBranch,
  Users,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Should I just build my own API changelog monitor? — APIDelta',
  description:
    'Yes, you can build this in a weekend. Here\'s what your weekend turns into in six months — format drift, classifier rot, multi-tenancy, retries, and the curated catalog you\'d have to compile yourself.',
  alternates: { canonical: 'https://apidelta.dev/why-not-build' },
  openGraph: {
    title: 'Should I just build my own API changelog monitor?',
    description:
      'A direct answer for engineers weighing buy-vs-build. With specific, painful, real stories.',
    url: 'https://apidelta.dev/why-not-build',
  },
};

export default function WhyNotBuildPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 text-white">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>

      <header className="mt-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Should I just build my own changelog monitor?
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          Yes, you can. It&apos;s a `cron` + a `fetch` + an LLM call. You&apos;d have a
          working v0 by Sunday afternoon.
        </p>
        <p className="mt-3 text-base text-gray-500">
          Here&apos;s what your weekend turns into in six months — and why the
          $49 we charge isn&apos;t for the script. It&apos;s for the cleanup.
        </p>
      </header>

      <article className="mt-12 space-y-12 text-base leading-7 text-gray-300">
        <Section
          icon={GitBranch}
          tint="amber"
          title="1. Format drift"
          subtitle="Changelogs aren&apos;t APIs. They aren&apos;t versioned. They don&apos;t care about your parser."
        >
          <p>
            Pick five popular APIs you depend on. Open their changelogs. Now write a
            parser for each. Easy.
          </p>
          <p>
            Six weeks later one of them ships a redesign. Below are the things that
            actually happened to APIDelta&apos;s crawler in the last 90 days, in case
            you think this is hypothetical:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li>
              <strong className="text-gray-200">Stripe</strong> shipped a React SPA
              changelog. The initial HTML response is empty until JS renders. Your
              <code className="mx-1 rounded bg-gray-900 px-1 py-0.5 text-xs text-gray-300">fetch()</code>
              parser sees zero entries and goes silent. Fix:
              add headless Chromium, run it on every crawl, ship a Docker image with
              ~600 MB of browser binaries, and pay for the cold-start cost forever.
            </li>
            <li>
              <strong className="text-gray-200">OpenAI</strong> blocks plain bot
              user-agents at the edge. Returns HTTP 403. Fix: a realistic Chrome
              user-agent string and a render delay. The same delay that breaks every
              future timeout you set.
            </li>
            <li>
              <strong className="text-gray-200">GitHub Blog</strong> changed its
              changelog DOM. The selector that grabbed the title now grabs the
              date+category meta. Every entry came through as
              &quot;Apr 28 · Library&quot; with no body, all flagged as noise and dropped.
              Fix: detect the meta-class and fall back to a different child node.
              Find this when a user complains nothing&apos;s coming through.
            </li>
            <li>
              <strong className="text-gray-200">SendGrid</strong> retired
              <code className="mx-1 rounded bg-gray-900 px-1 py-0.5 text-xs text-gray-300">docs.sendgrid.com/release-notes</code>
              after the Twilio acquisition. The URL just 404s now. Fix: switch to
              the
              <code className="mx-1 rounded bg-gray-900 px-1 py-0.5 text-xs text-gray-300">sendgrid-nodejs</code>
              GitHub releases page and rewrite the parser for that format.
            </li>
            <li>
              <strong className="text-gray-200">AWS</strong>&apos;s
              <code className="mx-1 rounded bg-gray-900 px-1 py-0.5 text-xs text-gray-300">general/latest/gr/rss</code>
              feed went stale around the same time. The canonical URL moved. You
              find it by reading the page source of an AWS announcement and
              spelunking through old Reddit threads.
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">
            Five vendors. Five different fixes. One weekend, gone. And that&apos;s
            five out of the dozens of changelogs your team actually depends on.
          </p>
        </Section>

        <Section
          icon={Bot}
          tint="blue"
          title="2. Classifier rot"
          subtitle="The LLM call you wrote in 2024 doesn&apos;t classify the same way in 2026."
        >
          <p>
            The &quot;is this a breaking change?&quot; classifier is the easy part to write
            and the hardest part to maintain.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li>
              Model versions get deprecated. Today&apos;s prompt that returned clean
              JSON on
              <code className="mx-1 rounded bg-gray-900 px-1 py-0.5 text-xs text-gray-300">claude-3-5-sonnet</code>
              starts hallucinating fields on
              <code className="mx-1 rounded bg-gray-900 px-1 py-0.5 text-xs text-gray-300">claude-4-opus</code>.
              Your pipeline doesn&apos;t crash — it silently mislabels CRITICAL as
              MEDIUM and your team stops trusting the alerts.
            </li>
            <li>
              Vendor changelog conventions shift. Vercel started writing
              &quot;migrate by&quot; instead of &quot;deprecated&quot; for some changes; your
              keyword-based fallback misses them. Stripe will say &quot;sunset&quot; one
              quarter and &quot;decommission&quot; the next.
            </li>
            <li>
              Cost tuning. The naive approach sends every changelog entry to the
              biggest model. At 50 sources × dozens of entries per crawl × 24
              crawls a day, that&apos;s a real bill. You&apos;ll spend a week building a
              cheap-model-first cascade with a confidence-threshold escalation.
              Then you&apos;ll spend another week tuning the threshold.
            </li>
            <li>
              Hallucinations on edge cases. Some changelogs say &quot;this is not a
              breaking change but...&quot; followed by something that absolutely is.
              The LLM picks up the disclaimer and labels it NON_BREAKING. You
              find this when production breaks.
            </li>
          </ul>
        </Section>

        <Section
          icon={Users}
          tint="emerald"
          title="3. Multi-tenancy is real work"
          subtitle="One person watching one feed is a script. A team watching dozens is a product."
        >
          <p>
            The moment you have two people on the same project, the requirements
            quietly multiply:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li>
              <strong className="text-gray-200">Alert dedup</strong>: rule × change
              pair, exactly once. If two rules both match a critical Stripe change,
              you don&apos;t want two pings — but if one fails you do want a retry.
              Get the unique constraint wrong and either people get spammed or
              they miss the one alert that mattered.
            </li>
            <li>
              <strong className="text-gray-200">Severity thresholds per rule</strong>:
              your platform team wants CRITICAL+ to PagerDuty; your dev team wants
              MEDIUM+ to a Slack channel. Now you need filters, channel routing, and
              a UI that doesn&apos;t look hostile.
            </li>
            <li>
              <strong className="text-gray-200">Audit trail</strong>: when someone
              acks a CRITICAL change, you need a log. When the alert failed and
              you retried it three times, you need a log. When a teammate revokes
              an integration, you need a log. None of this is hard. All of it is
              tedious.
            </li>
            <li>
              <strong className="text-gray-200">Retry + DLQ</strong>: Slack&apos;s
              webhook will return 429. SendGrid will time out. GitHub will
              transiently 5xx. You will write retry-with-backoff. You will write
              a dead-letter store. You will write a UI to retry from the dead
              letter. Each of these is half a day of work you didn&apos;t budget for.
            </li>
            <li>
              <strong className="text-gray-200">Team invites + seat enforcement</strong>:
              if more than one human will use this, you need invite tokens, expiry,
              email match, plan-limit checks. Add a few days.
            </li>
          </ul>
        </Section>

        <Section
          icon={Database}
          tint="violet"
          title="4. The catalog you&apos;d have to build"
          subtitle="The slow data work that nobody wants to redo from scratch."
        >
          <p>
            APIDelta&apos;s catalog has{' '}
            <Link href="/catalog" className="text-violet-400 hover:underline">
              39 vetted entries today
            </Link>{' '}
            and is growing. For each entry, the work was:
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-400">
            <li>Find the actual changelog URL — not the marketing page.</li>
            <li>
              Figure out the format (HTML, RSS, Atom, GitHub Releases, JSON feed).
            </li>
            <li>
              Verify the parser works. Catch the SPA cases. Catch the bot blocks.
              Update the URL when the vendor moves it.
            </li>
            <li>
              Write a one-line description that&apos;s accurate, useful, and not just
              the marketing copy.
            </li>
            <li>
              Tag it for search. Categorize it. Surface a logo.
            </li>
          </ol>
          <p className="mt-3 text-sm text-gray-500">
            If you skip this, your &quot;monitor&quot; is just a textbox that asks
            users to do all of the above themselves. Most won&apos;t. The ones who
            do will get bad data and blame you.
          </p>
        </Section>

        <Section
          icon={Zap}
          tint="rose"
          title="5. The plumbing nobody respects"
          subtitle="Channels, integrations, secret handling, and the dozen things that aren&apos;t the interesting part."
        >
          <p>
            Slack alerts are a webhook POST. Email alerts are an SMTP send. GitHub
            Issues are a REST POST with a PAT. Sounds trivial. The real work:
          </p>
          <ul className="mt-3 space-y-2 text-sm text-gray-400">
            <li>
              HMAC-signed outbound webhooks so receivers can verify it&apos;s really
              you. A dedicated rotation flow when secrets leak.
            </li>
            <li>
              Per-team API keys for programmatic access. Hashed at rest, prefix
              shown for identification, one-time reveal on creation, audit logs on
              use.
            </li>
            <li>
              GitHub Issues integration with PAT scoping, label config, severity
              gating, label-not-found error handling.
            </li>
            <li>
              MCP server endpoint so Claude (Desktop, Code, anything else) can
              query your team&apos;s monitored changes directly. Hand-rolled
              JSON-RPC, Bearer auth, five tools, one settings UI.
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">
            Each of these is a couple of days. None of them are hard. All of them
            are work.
          </p>
        </Section>

        <Section
          icon={AlertTriangle}
          tint="gray"
          title="The honest summary"
          subtitle="When you should build, and when you shouldn&apos;t."
        >
          <p className="text-gray-300"><strong>Build it yourself if:</strong></p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
            <li>You only need to monitor 1–2 sources, both with stable RSS feeds.</li>
            <li>You don&apos;t need a team workflow — you alone read the alerts.</li>
            <li>You have time to keep parsers patched, classifier prompts tuned, and integrations healthy.</li>
            <li>The above sounds fun, not exhausting.</li>
          </ul>
          <p className="mt-5 text-gray-300"><strong>Use APIDelta if:</strong></p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-400">
            <li>You want to set up monitoring, route alerts, and never think about parser maintenance again.</li>
            <li>You&apos;d rather spend that time on your actual product.</li>
            <li>You want a team workflow with audit trails, integrations, and a curated catalog out of the box.</li>
            <li>$49/month is cheaper than half a day of your time.</li>
          </ul>
        </Section>
      </article>

      {/* CTA */}
      <section className="mt-16 rounded-2xl border border-violet-500/30 bg-violet-500/5 p-8 text-center">
        <h2 className="text-xl font-bold tracking-tight">Skip the maintenance.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
          14-day free trial. No credit card. Browse the{' '}
          <Link href="/catalog" className="text-violet-400 hover:underline">
            catalog
          </Link>{' '}
          first if you&apos;re curious.
        </p>
        <Link
          href="/sign-up"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          Start free trial
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}

function Section({
  icon: Icon,
  tint,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  tint: 'amber' | 'blue' | 'emerald' | 'violet' | 'rose' | 'gray';
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const tintClass = {
    amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    violet: 'bg-violet-500/10 text-violet-400',
    rose: 'bg-rose-500/10 text-rose-400',
    gray: 'bg-gray-500/10 text-gray-400',
  }[tint];

  return (
    <section>
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tintClass}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3 pl-14">{children}</div>
    </section>
  );
}
