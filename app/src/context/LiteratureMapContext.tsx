import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  LiteratureMapConfig,
  NetworkData,
  AnalysisData,
  TopicHistoryItem,
  PresetInfo,
  NetworkNode,
} from '@/types';
import {
  NETWORK_NEUROSCIENCE_CONFIG,
  QUANTUM_COMPUTING_CONFIG,
  FEATURED_PRESETS,
} from '@/config/mapConfig';
import { normalizeNodes, normalizeBundle } from '@/lib/datasetNormalizer';
import { generateSyntheticQuantumData } from '@/data/syntheticQuantumData';
import { useTopicSearch } from '@/hooks/useTopicSearch';
import { useSavedPapers } from '@/hooks/useSavedPapers';

export type { NetworkNode, NetworkLink, NetworkData, CommunityRecord, AnalysisData, TopicHistoryItem } from '@/types';

interface LiteratureMapContextType {
  config: LiteratureMapConfig;
  networkData: NetworkData;
  analysisData: AnalysisData;
  activePresetId: string;
  availablePresets: PresetInfo[];
  featuredPresets: typeof FEATURED_PRESETS;
  switchPreset: (presetId: string) => Promise<void>;
  importBundleJSON: (bundleInput: string | Record<string, unknown>) => boolean;
  loadCustomDataset: (
    network: NetworkData,
    analysis: AnalysisData,
    customConfig?: Partial<LiteratureMapConfig>
  ) => void;
  resetToDefault: () => void;
  // Live Universal Topic Search
  isGeneratingTopic: boolean;
  generationProgress: string | null;
  generationError: string | null;
  generateLiveTopicMap: (query: string, limit?: number) => Promise<void>;
  isLoadingBundle: boolean;
  topicHistory: TopicHistoryItem[];
  focusedSchool: number | null;
  setFocusedSchool: (id: number | null) => void;
  evidenceSchoolFilter: number | null;
  setEvidenceSchoolFilter: (id: number | null) => void;
  // Saved Papers
  savedPapers: NetworkNode[];
  toggleSavePaper: (paper: NetworkNode) => void;
  isSaved: (paperId: string) => boolean;
  clearSavedPapers: () => void;
}

const LiteratureMapContext = createContext<LiteratureMapContextType | undefined>(undefined);

// Helper to sync state to browser URL without reload
function syncUrlParam(paramKey: 'preset' | 'q', paramVal: string) {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('preset');
    url.searchParams.delete('q');
    url.searchParams.delete('topic');
    url.searchParams.set(paramKey, paramVal);
    window.history.replaceState({}, '', url.toString());
  } catch (e) {
    console.warn('Failed to update URL search params:', e);
  }
}

export function LiteratureMapProvider({ children }: { children: ReactNode }) {
  const [activePresetId, setActivePresetId] = useState('connectomics');
  const [config, setConfig] = useState<LiteratureMapConfig>(NETWORK_NEUROSCIENCE_CONFIG);
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], links: [] });
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoadingBundle, setIsLoadingBundle] = useState(true);
  const [focusedSchool, setFocusedSchool] = useState<number | null>(null);
  const [evidenceSchoolFilter, setEvidenceSchoolFilter] = useState<number | null>(null);

  // Modular Hooks
  const {
    isGeneratingTopic,
    generationProgress,
    generationError,
    setGenerationError,
    topicHistory,
    topicCache,
    generateTopic,
  } = useTopicSearch();

  const {
    savedPapers,
    toggleSavePaper,
    isSaved,
    clearSavedPapers,
  } = useSavedPapers();

  // Base Available Presets - 4 Curated Atlas Presets
  const basePresets: PresetInfo[] = FEATURED_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
  }));

  // Dynamic available presets merged with history
  const availablePresets: PresetInfo[] = [
    ...basePresets,
    ...topicHistory.map((item) => ({
      id: item.id,
      name: `🔍 ${item.title}`,
      domain: `OpenAlex search: "${item.query}"`,
    })),
  ];

  const switchPreset = useCallback(
    async (presetId: string, skipUrlSync = false) => {
      setActivePresetId(presetId);
      setGenerationError(null);
      setFocusedSchool(null);
      setEvidenceSchoolFilter(null);
      if (!skipUrlSync) {
        syncUrlParam('preset', presetId);
      }

      if (presetId === 'connectomics') {
        setConfig(NETWORK_NEUROSCIENCE_CONFIG);
        setIsLoadingBundle(true);
        try {
          const [netRes, anRes] = await Promise.all([
            import('@/data/network_data.json'),
            import('@/data/analysis_data.json'),
          ]);
          setNetworkData({
            nodes: normalizeNodes(netRes.default.nodes as any),
            links: (netRes.default.links as any) || [],
          });
          setAnalysisData(anRes.default as unknown as AnalysisData);
        } catch (e) {
          console.error('Failed to load connectomics preset', e);
        } finally {
          setIsLoadingBundle(false);
        }
        return;
      }

      if (presetId === 'nuclear-risk-reduction') {
        setIsLoadingBundle(true);
        try {
          const nuclearBundle = await import('@/data/presets/nuclear_risk_reduction_bundle.json');
          const normalized = normalizeBundle(nuclearBundle.default as Record<string, unknown>);
          setConfig(normalized.config);
          setNetworkData(normalized.networkData);
          setAnalysisData(normalized.analysisData);
        } finally {
          setIsLoadingBundle(false);
        }
        return;
      }

      if (presetId === 'quantum-computing') {
        setConfig(QUANTUM_COMPUTING_CONFIG);
        const qNodes = generateSyntheticQuantumData();
        setNetworkData(qNodes.network);
        setAnalysisData(qNodes.analysis);
        return;
      }

      if (presetId === 'topological-dl') {
        setIsLoadingBundle(true);
        try {
          const topoBundle = await import('@/data/presets/topological_dl_bundle.json');
          const normalized = normalizeBundle(topoBundle.default as Record<string, unknown>);
          setConfig(normalized.config);
          setNetworkData(normalized.networkData);
          setAnalysisData(normalized.analysisData);
        } finally {
          setIsLoadingBundle(false);
        }
        return;
      }

      if (presetId === 'core-periphery') {
        setIsLoadingBundle(true);
        try {
          const cpBundle = await import('@/data/presets/core_periphery_bundle.json');
          const normalized = normalizeBundle(cpBundle.default as Record<string, unknown>);
          setConfig(normalized.config);
          setNetworkData(normalized.networkData);
          setAnalysisData(normalized.analysisData);
        } finally {
          setIsLoadingBundle(false);
        }
        return;
      }

      // Check if in topicCache
      if (topicCache[presetId]) {
        const cached = topicCache[presetId];
        setConfig(cached.config);
        setNetworkData(cached.networkData);
        setAnalysisData(cached.analysisData);
        return;
      }

      // Check if in history item, re-fetch if not cached
      const historyItem = topicHistory.find((h) => h.id === presetId);
      if (historyItem) {
        await generateLiveTopicMap(historyItem.query);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topicCache, topicHistory, setGenerationError]
  );

  const generateLiveTopicMap = useCallback(
    async (query: string, limit = 70) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      const result = await generateTopic(trimmed, limit, (gen) => {
        setActivePresetId(gen.config.id);
        syncUrlParam('q', trimmed);
        setConfig(gen.config);
        setNetworkData(gen.networkData);
        setAnalysisData(gen.analysisData);
      });

      if (!result) {
        console.warn('generateTopic completed without returning data');
      }
    },
    [generateTopic]
  );

  // Deep-link auto-loader on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const presetParam = params.get('preset');
      const queryParam = params.get('q') || params.get('topic');

      if (
        presetParam &&
        ['connectomics', 'quantum-computing', 'topological-dl', 'core-periphery'].includes(
          presetParam
        )
      ) {
        switchPreset(presetParam, true);
      } else if (queryParam) {
        generateLiveTopicMap(queryParam);
      } else {
        switchPreset('connectomics', true);
      }
    } catch (e) {
      console.warn('Initial URL deep-link parse failed:', e);
      switchPreset('connectomics', true);
    }
  }, [switchPreset, generateLiveTopicMap]);

  const importBundleJSON = useCallback((bundleInput: string | Record<string, unknown>): boolean => {
    try {
      const bundle =
        typeof bundleInput === 'string'
          ? (JSON.parse(bundleInput) as Record<string, unknown>)
          : bundleInput;
      const normalized = normalizeBundle(bundle);
      setActivePresetId(normalized.config.id || 'custom');
      setConfig(normalized.config);
      setNetworkData(normalized.networkData);
      setAnalysisData(normalized.analysisData);
      setGenerationError(null);
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON bundle format';
      console.error('Failed to import bundle JSON:', e);
      setGenerationError(msg);
      return false;
    }
  }, [setGenerationError]);

  const loadCustomDataset = useCallback(
    (
      customNetwork: NetworkData,
      customAnalysis: AnalysisData,
      customConfig?: Partial<LiteratureMapConfig>
    ) => {
      setActivePresetId('custom');
      setNetworkData({
        nodes: normalizeNodes(customNetwork.nodes),
        links: customNetwork.links,
      });
      setAnalysisData(customAnalysis);
      if (customConfig) {
        setConfig((prev) => ({
          ...prev,
          ...customConfig,
          id: 'custom',
        }));
      }
    },
    []
  );

  const resetToDefault = useCallback(() => {
    switchPreset('connectomics');
  }, [switchPreset]);

  // Safe fallback if analysisData is loading
  const safeAnalysisData: AnalysisData = analysisData || {
    modularity_q: 0.48,
    num_communities: config.schools?.length || 4,
    communities: {},
    bridge_papers: [],
    research_gap: config.researchGap as any,
    argument_spine: (config.researchGap?.argument_spine || config.researchGap?.argumentSpine) as any,
  };

  return (
    <LiteratureMapContext.Provider
      value={{
        config,
        networkData,
        analysisData: safeAnalysisData,
        activePresetId,
        availablePresets,
        featuredPresets: FEATURED_PRESETS,
        switchPreset,
        importBundleJSON,
        loadCustomDataset,
        resetToDefault,
        isLoadingBundle,
        focusedSchool,
        setFocusedSchool,
        evidenceSchoolFilter,
        setEvidenceSchoolFilter,
        isGeneratingTopic,
        generationProgress,
        generationError,
        generateLiveTopicMap,
        topicHistory,
        savedPapers,
        toggleSavePaper,
        isSaved,
        clearSavedPapers,
      }}
    >
      {children}
    </LiteratureMapContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLiteratureMap() {
  const ctx = useContext(LiteratureMapContext);
  if (!ctx) {
    throw new Error('useLiteratureMap must be used within a LiteratureMapProvider');
  }
  return ctx;
}
