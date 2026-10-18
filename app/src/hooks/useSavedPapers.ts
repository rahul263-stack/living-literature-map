import { useState, useEffect, useCallback } from 'react';
import type { NetworkNode } from '@/types';

const SAVED_PAPERS_STORAGE_KEY = 'litmap_saved_papers';

export function useSavedPapers() {
  const [savedPapers, setSavedPapers] = useState<NetworkNode[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SAVED_PAPERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SAVED_PAPERS_STORAGE_KEY, JSON.stringify(savedPapers));
    } catch (e) {
      console.warn('Failed to sync saved papers to localStorage:', e);
    }
  }, [savedPapers]);

  const toggleSavePaper = useCallback((paper: NetworkNode) => {
    setSavedPapers((prev) => {
      const exists = prev.some((p) => p.id === paper.id);
      if (exists) {
        return prev.filter((p) => p.id !== paper.id);
      } else {
        return [paper, ...prev];
      }
    });
  }, []);

  const isSaved = useCallback(
    (paperId: string) => savedPapers.some((p) => p.id === paperId),
    [savedPapers]
  );

  const clearSavedPapers = useCallback(() => {
    setSavedPapers([]);
  }, []);

  return {
    savedPapers,
    toggleSavePaper,
    isSaved,
    clearSavedPapers,
    count: savedPapers.length,
  };
}
