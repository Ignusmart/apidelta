import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';
import { Mail, Shield, Users, Zap } from 'lucide-react';
import { SubmitButton } from '../submit-button';

export const metadata: Metadata = {
  title: 'Sign up',
  description:
    'Start your 14-day free trial of APIDelta. Monitor API changelogs and get AI-classified breaking change alerts. No credit card required.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Start your free trial | APIDelta',
    description:
      'Monitor API changelogs and get AI-classified breaking change alerts. 14-day free trial, no credit card required.',
    url: 'https://apidelta.dev/sign-up',
  },
  alternates: { canonical: 'https://apidelta.dev/sign-up' },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? '/dashboard';
  const error = params.error;

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-white">
          Start monitoring in 2 minutes
        </h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          14-day free trial. No credit card required.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error === 'OAuthAccountNotLinked'
              ? 'This email is already linked to a different sign-in method. Try the other option below.'
              : error === 'EmailSignin'
                ? 'Could not send the sign-up link. Please check your email address and try again.'
                : error === 'Callback'
                  ? 'The sign-up link has expired or was already used. Please request a new one.'
                  : 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* GitHub OAuth — primary CTA for dev audience */}
        <form
          action={async () => {
            'use server';
            await signIn('github', { redirectTo: callbackUrl });
          }}
        >
          <SubmitButton
            pendingText="Connecting to GitHub..."
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#24292f] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#32383f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </SubmitButton>
          <p className="mt-2 text-center text-xs text-gray-500">
            Fastest option — one click, no password
          </p>
        </form>

        <div className="my-5 flex items-center gap-3" role="separator">
          <div className="h-px flex-1 bg-gray-800" />
          <span className="text-xs text-gray-500">or use email</span>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        {/* Email magic link */}
        <form
          action={async (formData: FormData) => {
            'use server';
            const email = formData.get('email') as string;
            await signIn('nodemailer', {
              email,
              redirectTo: callbackUrl,
            });
          }}
        >
          <label
            htmlFor="signup-email"
            className="mb-1.5 block text-sm font-medium text-gray-300"
          >
            Work email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          <SubmitButton
            pendingText="Sending link..."
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-medium text-white transition hover:border-gray-600 hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <Mail aria-hidden="true" className="h-4 w-4" />
            Send sign-up link
          </SubmitButton>
        </form>
      </div>

      {/* Trust signals */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Shield aria-hidden="true" className="h-3 w-3" />
            No credit card
          </span>
          <span className="flex items-center gap-1">
            <Zap aria-hidden="true" className="h-3 w-3" />
            Setup in 2 min
          </span>
          <span className="flex items-center gap-1">
            <Users aria-hidden="true" className="h-3 w-3" />
            Team-ready
          </span>
        </div>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a
            href="/sign-in"
            className="rounded text-violet-400 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
