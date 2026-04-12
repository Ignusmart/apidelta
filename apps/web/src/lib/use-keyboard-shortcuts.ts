'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type ShortcutHandler = () => void;

interface ShortcutConfig {
  onShowHelp?: () => void;
}

/**
 * Vim-style keyboard shortcuts for dashboard navigation.
 * Supports single-key and two-key sequences (e.g. "g o" for go to overview).
 * Disabled when focus is inside an input, textarea, or contenteditable.
 */
export function useKeyboardShortcuts({ onShowHelp }: ShortcutConfig = {}) {
  const router = useRouter();
  const pendingPrefix = useRef<string | null>(null);
  const prefixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPrefix = useCallback(() => {
    pendingPrefix.current = null;
    if (prefixTimer.current) {
      clearTimeout(prefixTimer.current);
      prefixTimer.current = null;
    }
  }, []);

  useEffect(() => {
    function isInputFocused() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if ((el as HTMLElement).isContentEditable) return true;
      return false;
    }

    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in inputs or when modifier keys are held
      if (isInputFocused()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // Two-key sequences: "g" prefix
      if (pendingPrefix.current === 'g') {
        clearPrefix();
        const routes: Record<string, string> = {
          o: '/dashboard',
          s: '/dashboard/sources',
          c: '/dashboard/changes',
          a: '/dashboard/alerts',
          t: '/dashboard/settings',
        };
        if (routes[key]) {
          e.preventDefault();
          router.push(routes[key]);
          return;
        }
      }

      // Start "g" prefix sequence
      if (key === 'g' && !pendingPrefix.current) {
        pendingPrefix.current = 'g';
        prefixTimer.current = setTimeout(clearPrefix, 800);
        return;
      }

      // Single-key shortcuts
      if (key === '/' && !e.shiftKey) {
        e.preventDefault();
        // Focus the first search input on the page
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]',
        );
        searchInput?.focus();
        return;
      }

      if (key === '?' || (key === '/' && e.shiftKey)) {
        e.preventDefault();
        onShowHelp?.();
        return;
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearPrefix();
    };
  }, [router, onShowHelp, clearPrefix]);
}

/** All available shortcuts for the help dialog */
export const SHORTCUTS = [
  { keys: ['g', 'o'], label: 'Go to Overview' },
  { keys: ['g', 's'], label: 'Go to Sources' },
  { keys: ['g', 'c'], label: 'Go to Changes' },
  { keys: ['g', 'a'], label: 'Go to Alerts' },
  { keys: ['g', 't'], label: 'Go to Settings' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['⌘', 'K'], label: 'Command palette' },
  { keys: ['?'], label: 'Show shortcuts' },
];
