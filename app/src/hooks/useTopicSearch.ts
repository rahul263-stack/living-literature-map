import { useState, useCallback } from 'react';
import type { TopicHistoryItem, LiteratureMapConfig, NetworkData, AnalysisData } from '@/types';
import { generateLiteratureMapForTopic } from '@/services/openAlexService';

const HISTORY_STORAGE_KEY = 'litmap_topic_history';
const RESULT_CACHE_KEY = 'litmap_result_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface GeneratedTopicResult {
  config: LiteratureMapConfig;
  networkData: NetworkData;
  analysisData: AnalysisData;
}

function loadCachedResults(): Record<string, { data: GeneratedTopicResult; ts: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(RESULT_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCachedResult(key: string, data: GeneratedTopicResult) {
  try {
    const cache = loadCachedResults();
    // Keep only the 5 most recent entries to avoid bloating localStorage
    const entries = Object.entries(cache).sort((a, b) => b[1].ts - a[1].ts).slice(0, 4);
    const pruned = Object.fromEntries(entries);
    pruned[key] = { data, ts: Date.now() };
    localStorage.setItem(RESULT_CACHE_KEY, JSON.stringify(pruned));
  } catch (e) {
    console.warn('Failed to cache topic result:', e);
  }
}

function getCachedResult(key: string): GeneratedTopicResult | null {
  const cache = loadCachedResults();
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null; // Expired
  return entry.data;
}

export function useTopicSearch() {
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Session cache for topic results to avoid re-fetching
  const [topicCache, setTopicCache] = useState<Record<string, GeneratedTopicResult>>({});

  const [topicHistory, setTopicHistory] = useState<TopicHistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const generateTopic = useCallback(
    async (
      query: string,
      limit = 70,
      onSuccess?: (result: GeneratedTopicResult) => void
    ): Promise<GeneratedTopicResult | null> => {
      const trimmed = query.trim();
      if (!trimmed) return null;

      // Check in-memory cache first
      const cacheKey = trimmed.toLowerCase();
      if (topicCache[cacheKey]) {
        const cached = topicCache[cacheKey];
        if (onSuccess) onSuccess(cached);
        return cached;
      }

      // Check localStorage cache (survives page reloads, 30min TTL)
      const diskCached = getCachedResult(cacheKey);
      if (diskCached) {
        setTopicCache((prev) => ({ ...prev, [cacheKey]: diskCached }));
        if (onSuccess) onSuccess(diskCached);
        return diskCached;
      }

      setIsGeneratingTopic(true);
      setGenerationProgress(`Initiating global literature search for "${trimmed}"...`);
      setGenerationError(null);

      try {
        const generated = await generateLiteratureMapForTopic(trimmed, limit, (status) => {
          setGenerationProgress(status);
        });

        const presetId = generated.config.id;

        // Save into session cache
        setTopicCache((prev) => ({
          ...prev,
          [presetId]: generated,
          [trimmed.toLowerCase()]: generated,
        }));

        // Persist to localStorage for cross-reload caching
        saveCachedResult(trimmed.toLowerCase(), generated);

        // Update topic history in localStorage
        const newHistoryItem: TopicHistoryItem = {
          id: presetId,
          query: trimmed,
          title: generated.config.title,
          paperCount: generated.networkData.nodes.length,
          timestamp: Date.now(),
        };

        setTopicHistory((prev) => {
          const filtered = prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());
          const updated = [newHistoryItem, ...filtered].slice(0, 10);
          try {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed to save topic history to localStorage', e);
          }
          return updated;
        });

        setGenerationProgress(null);
        if (onSuccess) onSuccess(generated);
        return generated;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to synthesize literature map. Please try again.';
        console.error('Failed to generate live topic literature map:', err);
        setGenerationError(errorMessage);
        return null;
      } finally {
        setIsGeneratingTopic(false);
      }
    },
    [topicCache]
  );

  const clearTopicHistory = useCallback(() => {
    setTopicHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear topic history:', e);
    }
  }, []);

  return {
    isGeneratingTopic,
    generationProgress,
    generationError,
    setGenerationError,
    topicHistory,
    topicCache,
    generateTopic,
    clearTopicHistory,
  };
}
