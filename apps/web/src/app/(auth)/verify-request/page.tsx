import type { Metadata } from 'next';
import { Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Check your email',
  robots: { index: false, follow: false },
};

export default function VerifyRequestPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
          <Mail className="h-6 w-6 text-violet-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">
          Check your email
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          We sent a sign-in link to your email. Click it to access your
          dashboard. The link expires in 24 hours.
        </p>
        <div className="rounded-lg bg-gray-800/50 px-4 py-3 text-xs text-gray-500">
          Didn&apos;t get the email? Check your spam folder or{' '}
          <a
            href="/sign-in"
            className="text-violet-400 hover:text-violet-300"
          >
            try again
          </a>
          .
        </div>
      </div>
    </div>
  );
}
