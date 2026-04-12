'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useDemo } from '@/lib/use-demo';

function NavBadge({ count, color = 'bg-gray-700 text-gray-400' }: { count: number; color?: string }) {
  if (count === 0) return null;
  return (
    <span className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${color}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function AlertsBadge() {
  const isDemo = useDemo();
  const [count, setCount] = useState(isDemo ? 3 : 0);

  useEffect(() => {
    if (isDemo) return;
    apiFetch<{ count: number }>('/alerts/unread-count')
      .then((data) => setCount(data.count))
      .catch(() => {});
  }, [isDemo]);

  return <NavBadge count={count} color="bg-red-500 text-white" />;
}

export function ChangesBadge() {
  const isDemo = useDemo();
  const [count, setCount] = useState(isDemo ? 7 : 0);

  useEffect(() => {
    if (isDemo) return;
    apiFetch<{ count: number }>('/changes/open-count')
      .then((data) => setCount(data.count))
      .catch(() => {});
  }, [isDemo]);

  return <NavBadge count={count} color="bg-amber-500/20 text-amber-400" />;
}

export function SourcesBadge() {
  const isDemo = useDemo();
  const [count, setCount] = useState(isDemo ? 5 : 0);

  useEffect(() => {
    if (isDemo) return;
    apiFetch<{ count: number }>('/sources/count')
      .then((data) => setCount(data.count))
      .catch(() => {});
  }, [isDemo]);

  return <NavBadge count={count} />;
}
