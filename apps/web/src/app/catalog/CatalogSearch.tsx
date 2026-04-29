'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

const ALL = '__ALL__';

export function CatalogSearch({
  initialQuery,
  currentCategory,
  categories,
}: {
  initialQuery: string;
  currentCategory: string;
  categories: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [, startTransition] = useTransition();

  // Debounce query → URL update.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (query.trim()) next.set('q', query.trim());
      else next.delete('q');
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on query
  }, [query]);

  function setCategory(cat: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (cat === ALL) next.delete('category');
    else next.set('category', cat);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, tag, or category — e.g. stripe, llm, payments"
          aria-label="Search catalog"
          className="w-full rounded-xl border border-gray-800 bg-gray-900/50 py-3 pl-10 pr-10 text-sm text-white placeholder-gray-600 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip
          label="All"
          active={!currentCategory}
          onClick={() => setCategory(ALL)}
        />
        {categories.map((cat) => (
          <CategoryChip
            key={cat}
            label={cat}
            active={currentCategory === cat}
            onClick={() => setCategory(cat)}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        active
          ? 'bg-violet-600 text-white'
          : 'border border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}
