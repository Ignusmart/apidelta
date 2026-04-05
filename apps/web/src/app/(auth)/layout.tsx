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
        DriftWatch
      </Link>
      <main id="main-content">
        {children}
      </main>
    </div>
  );
}
