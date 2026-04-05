import type { Metadata } from 'next';
import { Mail, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Check your email',
  robots: { index: false, follow: false },
};

const EMAIL_PROVIDERS = [
  {
    name: 'Gmail',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    color: 'hover:bg-red-500/10 hover:text-red-400',
  },
  {
    name: 'Outlook',
    url: 'https://outlook.live.com/mail/0/inbox',
    color: 'hover:bg-blue-500/10 hover:text-blue-400',
  },
  {
    name: 'Yahoo',
    url: 'https://mail.yahoo.com/',
    color: 'hover:bg-purple-500/10 hover:text-purple-400',
  },
];

export default function VerifyRequestPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
        {/* Animated envelope icon */}
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 ring-4 ring-violet-500/5"
        >
          <Mail className="h-7 w-7 text-violet-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-white">
          Check your inbox
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          We sent you a sign-in link. Click it to access your dashboard.
          <br />
          <span className="text-gray-500">The link expires in 24 hours.</span>
        </p>

        {/* Email provider quick-open buttons */}
        <div className="mb-5 flex gap-2">
          {EMAIL_PROVIDERS.map((provider) => (
            <a
              key={provider.name}
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 transition ${provider.color} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
            >
              {provider.name}
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          ))}
        </div>

        <div className="rounded-lg bg-gray-800/50 px-4 py-3 text-xs text-gray-500">
          <p>
            <strong className="text-gray-400">Not seeing it?</strong> Check your
            spam or promotions folder.
          </p>
          <p className="mt-1.5">
            Wrong email?{' '}
            <a
              href="/sign-in"
              className="rounded text-violet-400 hover:text-violet-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              Try again with a different address
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
