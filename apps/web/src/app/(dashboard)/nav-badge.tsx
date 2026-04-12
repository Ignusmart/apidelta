'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useDemo } from '@/lib/use-demo';

export function AlertsBadge() {
  const isDemo = useDemo();
  const [count, setCount] = useState(isDemo ? 3 : 0);

  useEffect(() => {
    if (isDemo) return;
    apiFetch<{ count: number }>('/alerts/unread-count')
      .then((data) => setCount(data.count))
      .catch(() => {});
  }, [isDemo]);

  if (count === 0) return null;

  return (
    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}
