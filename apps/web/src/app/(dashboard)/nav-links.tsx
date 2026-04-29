'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Rss, GitCompareArrows, Settings } from 'lucide-react';
import { ChangesBadge, SourcesBadge } from './nav-badge';

const NAV_ITEMS = [
  { href: '/dashboard/changes', label: 'Changes', icon: GitCompareArrows },
  { href: '/dashboard/sources', label: 'API Sources', icon: Rss },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function NavLinks() {
  const items = NAV_ITEMS;
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
              isActive
                ? 'bg-gray-800/80 text-white border-l-2 border-violet-500 -ml-[2px] pl-[14px]'
                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <item.icon aria-hidden="true" className={`h-4 w-4 ${isActive ? 'text-violet-400' : ''}`} />
            <span className="flex-1">{item.label}</span>
            {item.label === 'API Sources' && <SourcesBadge />}
            {item.label === 'Changes' && <ChangesBadge />}
          </Link>
        );
      })}
    </>
  );
}
