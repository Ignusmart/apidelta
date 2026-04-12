'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useDemo } from '@/lib/use-demo';
import { DEMO_SOURCES, DEMO_CHANGES } from '@/lib/demo-data';
import type { ApiSource, ChangeEntry } from '@/lib/types';
import { SEVERITY_STYLES } from '@/lib/shared';

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
  const [query, setQuery] = useState('');
  const [dynamicSources, setDynamicSources] = useState<ApiSource[]>([]);
  const [dynamicChanges, setDynamicChanges] = useState<ChangeEntry[]>([]);
  const router = useRouter();
  const isDemo = useDemo();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Reset state when palette closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setDynamicSources([]);
      setDynamicChanges([]);
    }
  }, [open]);

  // Debounced dynamic search
  const searchDynamic = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 2) {
      setDynamicSources([]);
      setDynamicChanges([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (isDemo) {
        const lower = q.toLowerCase();
        setDynamicSources(DEMO_SOURCES.filter((s) => s.name.toLowerCase().includes(lower)));
        setDynamicChanges(DEMO_CHANGES.filter((c) =>
          c.title.toLowerCase().includes(lower) ||
          c.description.toLowerCase().includes(lower)
        ).slice(0, 5));
        return;
      }
      try {
        const [srcData, chgData] = await Promise.all([
          apiFetch<ApiSource[]>(`/sources/search?q=${encodeURIComponent(q)}`).catch(() => []),
          apiFetch<{ changes: ChangeEntry[] }>(`/changes/search?q=${encodeURIComponent(q)}&limit=5`).catch(() => ({ changes: [] })),
        ]);
        setDynamicSources(Array.isArray(srcData) ? srcData : []);
        setDynamicChanges(chgData.changes ?? []);
      } catch {
        // Silently ignore search errors
      }
    }, 250);
  }, [isDemo]);

  function handleQueryChange(value: string) {
    setQuery(value);
    searchDynamic(value);
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  const hasDynamic = dynamicSources.length > 0 || dynamicChanges.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <Command
        className="w-full max-w-lg rounded-xl border border-gray-800 bg-gray-950 shadow-2xl animate-modal-content overflow-hidden"
        label="Command palette"
        shouldFilter={!hasDynamic}
      >
        <div className="flex items-center gap-3 border-b border-gray-800 px-4">
          <Search className="h-4 w-4 text-gray-500 shrink-0" />
          <Command.Input
            placeholder="Search commands, sources, changes..."
            autoFocus
            value={query}
            onValueChange={handleQueryChange}
            className="w-full bg-transparent py-3.5 text-sm text-white placeholder-gray-500 outline-none"
            onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          />
          <kbd className="hidden sm:inline-flex shrink-0 items-center rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400">
            ESC
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-gray-500">
            No results found.
          </Command.Empty>

          {/* Dynamic: Sources */}
          {dynamicSources.length > 0 && (
            <>
              <Command.Group heading="Sources" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500">
                {dynamicSources.map((src) => (
                  <Command.Item
                    key={`src-${src.id}`}
                    value={`source ${src.name} ${src.url}`}
                    onSelect={() => navigate('/dashboard/sources')}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors aria-selected:bg-gray-800/80 aria-selected:text-white"
                  >
                    <Rss className="h-4 w-4 text-gray-500" />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{src.name}</span>
                      <span className="block truncate text-xs text-gray-600">{src.url}</span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Separator className="my-1 h-px bg-gray-800/50" />
            </>
          )}

          {/* Dynamic: Changes */}
          {dynamicChanges.length > 0 && (
            <>
              <Command.Group heading="Changes" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-500">
                {dynamicChanges.map((change) => {
                  const sev = SEVERITY_STYLES[change.severity] ?? SEVERITY_STYLES.INFO;
                  return (
                    <Command.Item
                      key={`chg-${change.id}`}
                      value={`change ${change.title} ${change.severity}`}
                      onSelect={() => navigate(`/dashboard/changes?highlight=${change.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors aria-selected:bg-gray-800/80 aria-selected:text-white"
                    >
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sev.bg} ${sev.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                        {change.severity}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{change.title}</span>
                    </Command.Item>
                  );
                })}
              </Command.Group>
              <Command.Separator className="my-1 h-px bg-gray-800/50" />
            </>
          )}

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
