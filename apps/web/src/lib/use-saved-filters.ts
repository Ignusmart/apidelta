'use client';

import { useState, useEffect } from 'react';

export interface SavedFilter {
  name: string;
  severityFilter: string;
  sourceFilter: string;
  searchQuery: string;
  showInfo: boolean;
}

const STORAGE_KEY = 'apidelta-saved-filters';
const MAX_FILTERS = 5;

export function useSavedFilters() {
  const [filters, setFilters] = useState<SavedFilter[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFilters(JSON.parse(stored));
    } catch {}
  }, []);

  function save(filter: SavedFilter) {
    const updated = [filter, ...filters.filter(f => f.name !== filter.name)].slice(0, MAX_FILTERS);
    setFilters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function remove(name: string) {
    const updated = filters.filter(f => f.name !== name);
    setFilters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return { filters, save, remove };
}
