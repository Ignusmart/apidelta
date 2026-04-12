'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Rss,
  GitCompareArrows,
  Bell,
  Settings,
  Plus,
  Search,
  Keyboard,
  Play,
} from 'lucide-react';

const NAVIGATION_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, group: 'Navigate' },
  { label: 'API Sources', href: '/dashboard/sources', icon: Rss, group: 'Navigate' },
  { label: 'Changes', href: '/dashboard/changes', icon: GitCompareArrows, group: 'Navigate' },
  { label: 'Alerts', href: '/dashboard/alerts', icon: Bell, group: 'Navigate' },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, group: 'Navigate' },
];

const ACTION_ITEMS = [
  { label: 'Add API Source', href: '/dashboard/sources', icon: Plus, group: 'Actions' },
  { label: 'Create Alert Rule', href: '/dashboard/alerts', icon: Bell, group: 'Actions' },
  { label: 'View Breaking Changes', href: '/dashboard/changes?severity=BREAKING', icon: GitCompareArrows, group: 'Actions' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <Command
        className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-950 shadow-2xl animate-modal-content overflow-hidden"
        label="Command palette"
      >
        <div className="flex items-center gap-3 border-b border-gray-800 px-4">
          <Search className="h-4 w-4 text-gray-500 shrink-0" />
          <Command.Input
            placeholder="Search commands..."
            autoFocus
            className="w-full bg-transparent py-3.5 text-sm text-white placeholder-gray-500 outline-none"
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          />
          <kbd className="hidden sm:inline-flex shrink-0 items-center rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-gray-500">
            No results found.
          </Command.Empty>

          <Command.Group heading="Navigate" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500">
            {NAVIGATION_ITEMS.map((item) => (
              <Command.Item
                key={item.href}
                value={item.label}
                onSelect={() => navigate(item.href)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors aria-selected:bg-gray-800/80 aria-selected:text-white"
              >
                <item.icon className="h-4 w-4 text-gray-500" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-gray-800/50" />

          <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500">
            {ACTION_ITEMS.map((item) => (
              <Command.Item
                key={item.label}
                value={item.label}
                onSelect={() => navigate(item.href)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors aria-selected:bg-gray-800/80 aria-selected:text-white"
              >
                <item.icon className="h-4 w-4 text-gray-500" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        <div className="border-t border-gray-800 px-4 py-2.5">
          <div className="flex items-center justify-between text-[11px] text-gray-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px]">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px]">↵</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Keyboard className="h-3 w-3" />
              <kbd className="rounded border border-gray-700 bg-gray-800 px-1 py-0.5 text-[10px]">?</kbd>
              shortcuts
            </span>
          </div>
        </div>
      </Command>
    </div>
  );
}
