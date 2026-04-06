'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function SidebarToggle() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Toggle sidebar visibility via CSS class manipulation
  useEffect(() => {
    const sidebar = document.getElementById('dashboard-sidebar');
    if (!sidebar) return;
    if (open) {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
    } else {
      // Only re-add on mobile (lg:translate-x-0 handles desktop)
      sidebar.classList.add('-translate-x-full');
      sidebar.classList.remove('translate-x-0');
    }
  }, [open]);

  return (
    <>
      {/* Mobile topbar */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b border-gray-800 bg-gray-950/95 px-4 backdrop-blur-sm lg:hidden">
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={open}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          {open ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
        <span className="text-sm font-bold tracking-tight">APIDelta</span>
      </div>

      {/* Backdrop overlay on mobile when sidebar is open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
