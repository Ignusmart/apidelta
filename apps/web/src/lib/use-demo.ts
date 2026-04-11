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
