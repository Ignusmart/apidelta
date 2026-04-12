'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById('hero-section');
    const footer = document.getElementById('pricing');
    if (!hero) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === hero) {
            // Show sticky bar when hero is NOT visible
            setVisible((prev) => {
              if (!entry.isIntersecting) return true;
              return false;
            });
          }
          if (entry.target === footer) {
            // Hide when pricing/footer is visible
            if (entry.isIntersecting) setVisible(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(hero);
    if (footer) observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Zap aria-hidden="true" className="h-4 w-4 text-violet-400" />
          <span className="hidden text-gray-400 sm:inline">
            Monitor your first API free — no credit card required
          </span>
          <span className="text-gray-400 sm:hidden">
            Start free — no credit card
          </span>
        </div>
        <Link
          href="/sign-up"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
        >
          Start free trial
        </Link>
      </div>
    </div>
  );
}
