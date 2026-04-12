'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Rss, GitCompareArrows, Bell, Settings } from 'lucide-react';

const TABS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/sources', label: 'Sources', icon: Rss },
  { href: '/dashboard/changes', label: 'Changes', icon: GitCompareArrows },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm lg:hidden"
    >
      <div className="flex items-center justify-around">
        {TABS.map((tab) => {
          const isActive =
            tab.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] transition-colors ${
                isActive
                  ? 'text-violet-400'
                  : 'text-gray-500 active:text-gray-300'
              }`}
            >
              <tab.icon aria-hidden="true" className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
