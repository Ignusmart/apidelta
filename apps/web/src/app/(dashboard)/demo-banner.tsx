'use client';

import Link from 'next/link';
import { Info, ArrowRight } from 'lucide-react';
import { useDemo } from '@/lib/use-demo';

export function DemoBanner() {
  const isDemo = useDemo();
  if (!isDemo) return null;

  return (
    <div className="-mx-6 -mt-6 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/5 px-6 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-amber-300">
        <Info aria-hidden="true" className="h-4 w-4 shrink-0" />
        You&apos;re viewing a demo with sample data — nothing here is connected to real APIs.
      </span>
      <Link
        href="/sign-up"
        className="inline-flex shrink-0 items-center gap-1 rounded text-xs font-medium text-amber-200 underline underline-offset-2 transition hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      >
        Sign up to monitor your own APIs
        <ArrowRight aria-hidden="true" className="h-3 w-3" />
      </Link>
    </div>
  );
}
