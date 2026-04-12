import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth, signOut } from '@/auth';
import { Zap, LogOut, LayoutDashboard, Rss, Bell, Settings, GitCompareArrows, Search } from 'lucide-react';
import Link from 'next/link';
import { SidebarToggle } from './sidebar-toggle';
import { CommandPalette } from './command-palette';
import { ShortcutsProvider } from './shortcuts-dialog';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/sources', label: 'API Sources', icon: Rss },
  { href: '/dashboard/changes', label: 'Changes', icon: GitCompareArrows },
  { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Demo mode: middleware sets x-demo-mode header to bypass auth
  const hdrs = await headers();
  const isDemo = hdrs.get('x-demo-mode') === '1';

  const session = await auth();
  if (!session?.user && !isDemo) redirect('/sign-in');

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Mobile topbar */}
      <SidebarToggle />

      {/* Sidebar */}
      <aside
        aria-label="Dashboard sidebar"
        id="dashboard-sidebar"
        className="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-gray-800 bg-gray-950 transition-transform duration-200 ease-in-out lg:translate-x-0"
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-6">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:rounded-lg">
            <Zap aria-hidden="true" className="h-5 w-5 text-violet-400" />
            APIDelta
          </Link>
        </div>

        {/* Nav */}
        <nav aria-label="Dashboard navigation" className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 transition-colors duration-150 hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <item.icon aria-hidden="true" className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          {/* Command palette hint */}
          <div className="mt-4 px-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-800/50 px-3 py-2 text-xs text-gray-600">
              <Search aria-hidden="true" className="h-3 w-3" />
              <span className="flex-1">Search...</span>
              <kbd className="rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500">
                &#8984;K
              </kbd>
            </div>
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-gray-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/20 text-sm font-medium text-violet-300">
              {(session?.user?.name?.[0] ?? session?.user?.email?.[0] ?? 'A').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {session?.user?.name ?? (isDemo ? 'Alex Chen' : 'User')}
              </p>
              <p className="truncate text-xs text-gray-500">
                {session?.user?.email ?? (isDemo ? 'alex@acme.dev' : '')}
              </p>
            </div>
          </div>
          {!isDemo && (
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors duration-150 hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sign out
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main id="main-content" className="min-w-0 flex-1 p-6 pt-20 lg:ml-64 lg:p-8 lg:pt-8">{children}</main>

      {/* Command palette (Cmd+K) + keyboard shortcuts */}
      <CommandPalette />
      <ShortcutsProvider />
    </div>
  );
}
