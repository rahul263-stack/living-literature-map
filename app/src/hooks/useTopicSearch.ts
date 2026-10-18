import { useState, useCallback } from 'react';
import type { TopicHistoryItem, LiteratureMapConfig, NetworkData, AnalysisData } from '@/types';
import { generateLiteratureMapForTopic } from '@/services/openAlexService';

const HISTORY_STORAGE_KEY = 'litmap_topic_history';

export interface GeneratedTopicResult {
  config: LiteratureMapConfig;
  networkData: NetworkData;
  analysisData: AnalysisData;
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

      // Check cache first
      if (topicCache[trimmed.toLowerCase()]) {
        const cached = topicCache[trimmed.toLowerCase()];
        if (onSuccess) onSuccess(cached);
        return cached;
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
