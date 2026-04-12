'use client';

import { useKeyboardShortcuts, SHORTCUTS } from '@/lib/use-keyboard-shortcuts';
import { useState } from 'react';
import { X, Keyboard } from 'lucide-react';

export function ShortcutsProvider() {
  const [open, setOpen] = useState(false);

  useKeyboardShortcuts({
    onShowHelp: () => setOpen(true),
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-gray-800 bg-gray-950 shadow-2xl animate-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
      >
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-violet-400" />
            <h2 id="shortcuts-title" className="text-sm font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-500 transition hover:bg-gray-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-gray-800/50 px-5 py-2">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.label} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-400">{shortcut.label}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="min-w-[24px] rounded border border-gray-700 bg-gray-800 px-1.5 py-0.5 text-center text-xs text-gray-300"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 px-5 py-3">
          <p className="text-[11px] text-gray-600">
            Two-key shortcuts: press the first key, then the second within 800ms.
          </p>
        </div>
      </div>
    </div>
  );
}
