'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Returns true when ?demo=true is in the URL.
 * Dashboard pages check this to render static demo data instead of fetching.
 */
export function useDemo(): boolean {
  const params = useSearchParams();
  return params.get('demo') === 'true';
}

/**
 * Append ?demo=true to an internal href when the current page is in demo
 * mode, so navigation inside the dashboard preserves the demo bypass.
 * Returns the href unchanged when not in demo mode or when the href already
 * carries the param.
 */
export function useDemoHref(href: string): string {
  const isDemo = useDemo();
  if (!isDemo) return href;
  if (/[?&]demo=true(?:&|$)/.test(href)) return href;
  const sep = href.includes('?') ? '&' : '?';
  return `${href}${sep}demo=true`;
}
