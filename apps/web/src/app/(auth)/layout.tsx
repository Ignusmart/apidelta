import { Zap } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-xl font-bold tracking-tight text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:rounded-lg"
      >
        <Zap aria-hidden="true" className="h-6 w-6 text-violet-400" />
        APIDelta
      </Link>
      <main id="main-content">{children}</main>
      <p className="mt-10 max-w-xs text-center text-xs leading-relaxed text-gray-600">
        By signing up you agree to our{' '}
        <a
          href="/terms"
          className="rounded text-gray-500 underline underline-offset-2 hover:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href="/privacy"
          className="rounded text-gray-500 underline underline-offset-2 hover:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
