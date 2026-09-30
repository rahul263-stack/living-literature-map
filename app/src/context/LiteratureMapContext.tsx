import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  type LiteratureMapConfig,
  NETWORK_NEUROSCIENCE_CONFIG,
  QUANTUM_COMPUTING_CONFIG,
  FEATURED_PRESETS,
} from '@/config/mapConfig';
import { generateLiteratureMapForTopic } from '@/services/openAlexService';

export interface NetworkNode {
  id: string;
  title: string;
  authors: string | string[];
  year: number;
  journal: string;
  citations: number;
  community: number;
  community_name: string;
  abstract: string;
  doi: string;
  keywords: string[];
  val: number;
  link_url?: string;
  link_type?: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface NetworkLink {
  source: string | any;
  target: string | any;
  value: number;
  weight?: number;
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  metadata?: Record<string, unknown>;
}

export interface CommunityRecord {
  id: number;
  name: string;
  size: number;
  total_citations: number;
  mean_citations: number;
  top_keywords: [string, number][];
  top_authors: [string, number][];
  year_range: [number, number];
  mean_year?: number;
  paper_ids?: string[];
  description?: string;
}

export interface AnalysisData {
  modularity_q: number;
  num_communities: number;
  communities: Record<string, CommunityRecord>;
  bridge_papers: Array<{
    id: string;
    title: string;
    authors: string | string[];
    year: number;
    community: string;
    betweenness: number;
    cross_community_edges: number;
    citations: number;
  }>;
  research_gap?: any;
  argument_spine?: any;
  timeline?: Record<string, { count: number; community_breakdown: Record<string, number> }>;
  journal_distribution?: Record<string, number>;
  year_distribution?: Record<string, number>;
  decade_distribution?: Record<string, number>;
  coauthorship?: {
    top_authors: Array<{ name: string; paper_count: number; school_affiliation?: number }>;
    collaboration_edges: Array<{ source: string; target: string; shared_papers: number }>;
  };
  community_evolution?: Record<string, { name: string; papers_per_year: Record<string, number> }>;
}

export interface TopicHistoryItem {
  id: string;
  query: string;
  title: string;
  paperCount: number;
  timestamp: number;
}

interface LiteratureMapContextType {
  config: LiteratureMapConfig;
  networkData: NetworkData;
  analysisData: AnalysisData;
  activePresetId: string;
  availablePresets: Array<{ id: string; name: string; domain: string }>;
  featuredPresets: typeof FEATURED_PRESETS;
  switchPreset: (presetId: string) => void;
  importBundleJSON: (bundleInput: string | Record<string, any>) => boolean;
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
}

const LiteratureMapContext = createContext<LiteratureMapContextType | undefined>(undefined);

// Normalize helper to guarantee keywords consistency (handles array, string, or undefined)
function normalizeKeywords(kw: any): string[] {
  if (!kw) return [];
  if (Array.isArray(kw)) {
    return kw
      .map((item) =>
        typeof item === 'string'
          ? item
          : item?.name || item?.keyword || item?.display_name || String(item)
      )
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof kw === 'string') {
    return kw
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// Normalize helper to guarantee author and keyword consistency
function normalizeNodes(nodes: any[]): NetworkNode[] {
  return (nodes || []).map((n) => ({
    ...n,
    authors: Array.isArray(n.authors)
      ? n.authors.join(', ')
      : typeof n.authors === 'string'
      ? n.authors
      : 'Unknown',
    keywords: normalizeKeywords(n.keywords),
  }));
}

// Normalizes any arbitrary JSON bundle into standard LiteratureMap types
function normalizeBundle(bundle: any): {
  config: LiteratureMapConfig;
  networkData: NetworkData;
  analysisData: AnalysisData;
} {
  const rawConfig = bundle.config || {};
  const rawNet = bundle.networkData || bundle.network || { nodes: [], links: [] };
  const rawAnalysis = bundle.analysisData || bundle.analysis || {};

  const nodes = normalizeNodes(rawNet.nodes || []);
  const links = rawNet.links || [];

  const schools = rawConfig.schools || (Array.isArray(rawAnalysis.schools) ? rawAnalysis.schools : []);
  const numPapers = nodes.length || rawConfig.stats?.numPapers || 0;
  const numSchools = schools.length || Object.keys(rawAnalysis.communities || {}).length || 3;
  const numLinks = links.length || rawConfig.stats?.numLinks || 0;
  const modularityQ = rawConfig.stats?.modularityQ ?? rawAnalysis.stats?.modularityQ ?? rawAnalysis.modularity_q ?? 0.5;

  const config: LiteratureMapConfig = {
    id: rawConfig.id || 'custom-dataset',
    title: rawConfig.title || 'Custom Literature Map',
    subtitle: rawConfig.subtitle || `${numPapers} papers · ${numSchools} clusters · ${numLinks} links`,
    supertitle: rawConfig.supertitle || 'Living Literature Map · Custom Ingestion',
    domain: rawConfig.domain || 'Domain-Agnostic Scientific Knowledge',
    yearRange: rawConfig.yearRange || [2010, 2026],
    primaryFacetName: rawConfig.primaryFacetName || 'Category',
    facets: rawConfig.facets || ['Empirical', 'Theoretical', 'Computational', 'Review'],
    theme: rawConfig.theme || {
      accentGold: '#D4A853',
      accentIndigo: '#1E1B4B',
      darkBg: '#05060B',
    },
    schools,
    stats: {
      numPapers,
      numSchools,
      numLinks,
      modularityQ,
      yearRange: rawConfig.stats?.yearRange || '2010–2026',
    },
    debates: (rawConfig.debates && rawConfig.debates.length > 0)
      ? rawConfig.debates
      : (rawConfig.debateTimeline?.tracks || []).map((t: any, idx: number) => ({
          id: idx + 1,
          name: t.title || t.name || `Debate ${idx + 1}`,
          color: ['#3B6FC4', '#5B8C7B', '#B89A4A', '#B07A4A'][idx % 4],
          startYear: t.milestones?.[0]?.year || 2020,
          endYear: 2026,
          peakPeriod: '2022–2025',
          consensus: t.status === 'Emerging Consensus' ? 'EMERGING' : t.status === 'Settled' ? 'SETTLED' : 'ONGOING',
          consensusPercent: 50,
          description: t.description || '',
          keyPapers: (t.milestones || []).map((m: any) => ({
            year: m.year,
            author: m.paperTitle?.split(' ')?.[0] || 'Key Author',
            title: m.paperTitle || m.event,
            citations: 150,
          })),
          intensity: [
            { year: 2022, count: 3 },
            { year: 2024, count: 8 },
            { year: 2026, count: 6 },
          ],
        })),
    researchGap: rawConfig.researchGap || {
      statement: 'Active research frontier detected via structural hole clustering.',
      gap_title: 'Unbridged Inter-Cluster Space',
    },
  };

  const communitiesMap: Record<string, CommunityRecord> = {};
  if (Array.isArray(rawAnalysis.schools)) {
    rawAnalysis.schools.forEach((s: any, idx: number) => {
      const memberCount = s.paperCount || s.members?.length || 0;
      communitiesMap[String(s.id ?? idx)] = {
        id: s.id ?? idx,
        name: s.name,
        size: memberCount,
        total_citations: 0,
        mean_citations: 0,
        top_keywords: (s.keywords || []).map((k: string) => [k, 10]),
        top_authors: [],
        year_range: [2020, 2026],
      };
    });
  } else if (rawAnalysis.communities) {
    Object.assign(communitiesMap, rawAnalysis.communities);
  }

  const bridgePapers = (rawAnalysis.bridgePapers || rawAnalysis.bridge_papers || []).map((b: any) => ({
    id: b.id,
    title: b.title,
    authors: b.authors || 'Unknown',
    year: b.year || 2024,
    community: b.school || b.community || 'Interdisciplinary',
    betweenness: b.betweenness || 0,
    cross_community_edges: b.cross_community_edges || 12,
    citations: b.citations || 0,
  }));

  const analysisData: AnalysisData = {
    modularity_q: modularityQ,
    num_communities: Object.keys(communitiesMap).length || numSchools,
    communities: communitiesMap,
    bridge_papers: bridgePapers,
    research_gap: config.researchGap,
    argument_spine: config.researchGap?.argument_spine || config.researchGap?.argumentSpine,
    community_evolution: rawAnalysis.community_evolution,
    timeline: rawAnalysis.timeline,
  };

  return { config, networkData: { nodes, links, metadata: rawNet.metadata }, analysisData };
}

const HISTORY_STORAGE_KEY = 'litmap_topic_history';

export function LiteratureMapProvider({ children }: { children: ReactNode }) {
  const [activePresetId, setActivePresetId] = useState('connectomics');
  const [config, setConfig] = useState<LiteratureMapConfig>(NETWORK_NEUROSCIENCE_CONFIG);
  const [networkData, setNetworkData] = useState<NetworkData>({ nodes: [], links: [] });
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoadingBundle, setIsLoadingBundle] = useState(true);

  // Live Topic Generation State
  const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Cache for generated topics in session
  const [topicCache, setTopicCache] = useState<
    Record<
      string,
      {
        config: LiteratureMapConfig;
        networkData: NetworkData;
        analysisData: AnalysisData;
      }
    >
  >({});

  const [topicHistory, setTopicHistory] = useState<TopicHistoryItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Base Available Presets - 4 Curated Atlas Presets
  const basePresets = FEATURED_PRESETS.map((p) => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
  }));

  // Dynamic available presets merged with history
  const availablePresets = [
    ...basePresets,
    ...topicHistory.map((item) => ({
      id: item.id,
      name: `🔍 ${item.title}`,
      domain: `OpenAlex search: "${item.query}"`,
    })),
  ];

  // Helper to sync state to browser URL without reload
  const syncUrlParam = (paramKey: 'preset' | 'q', paramVal: string) => {
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
  };

  const switchPreset = async (presetId: string, skipUrlSync = false) => {
    setActivePresetId(presetId);
    setGenerationError(null);
    if (!skipUrlSync) {
      syncUrlParam('preset', presetId);
    }

    if (presetId === 'connectomics') {
      setConfig(NETWORK_NEUROSCIENCE_CONFIG);
      setIsLoadingBundle(true);
      try {
        const [netRes, anRes] = await Promise.all([
          import('@/data/network_data.json'),
          import('@/data/analysis_data.json')
        ]);
        setNetworkData({
          nodes: normalizeNodes(netRes.default.nodes),
          links: netRes.default.links,
        });
        setAnalysisData(anRes.default as any);
      } catch (e) {
        console.error("Failed to load connectomics preset", e);
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
        const normalized = normalizeBundle(topoBundle.default);
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
        const normalized = normalizeBundle(cpBundle.default);
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
      generateLiveTopicMap(historyItem.query);
    }
  };

  // Deep-link auto-loader on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const presetParam = params.get('preset');
      const queryParam = params.get('q') || params.get('topic');

      if (presetParam && ['connectomics', 'quantum-computing', 'topological-dl', 'core-periphery'].includes(presetParam)) {
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
  }, []);

  const importBundleJSON = (bundleInput: string | Record<string, any>): boolean => {
    try {
      const bundle = typeof bundleInput === 'string' ? JSON.parse(bundleInput) : bundleInput;
      const normalized = normalizeBundle(bundle);
      setActivePresetId(normalized.config.id || 'custom');
      setConfig(normalized.config);
      setNetworkData(normalized.networkData);
      setAnalysisData(normalized.analysisData);
      setGenerationError(null);
      return true;
    } catch (e: any) {
      console.error('Failed to import bundle JSON:', e);
      setGenerationError(e?.message || 'Invalid JSON bundle format');
      return false;
    }
  };

  const loadCustomDataset = (
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
  };

  const generateLiveTopicMap = async (query: string, limit = 70) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsGeneratingTopic(true);
    setGenerationProgress(`Initiating global literature search for "${trimmed}"...`);
    setGenerationError(null);

    try {
      const generated = await generateLiteratureMapForTopic(trimmed, limit, (status) => {
        setGenerationProgress(status);
      });

      const presetId = generated.config.id;

      // Update Active State
      setActivePresetId(presetId);
      syncUrlParam('q', trimmed);
      setConfig(generated.config);
      setNetworkData(generated.networkData);
      setAnalysisData(generated.analysisData);

      // Save into session cache
      setTopicCache((prev) => ({
        ...prev,
        [presetId]: generated,
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
    } catch (err: any) {
      console.error('Failed to generate live topic literature map:', err);
      setGenerationError(err?.message || 'Failed to synthesize literature map. Please try again.');
    } finally {
      setIsGeneratingTopic(false);
    }
  };

  const resetToDefault = () => {
    switchPreset('connectomics');
  };

  return (
    <LiteratureMapContext.Provider
      value={{
        config,
        networkData,
        analysisData,
        activePresetId,
        availablePresets,
        featuredPresets: FEATURED_PRESETS,
        switchPreset,
        importBundleJSON,
        loadCustomDataset,
        resetToDefault,
        isLoadingBundle,
        isGeneratingTopic,
        generationProgress,
        generationError,
        generateLiveTopicMap,
        topicHistory,
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

/* ------------------------------------------------------------------ */
/*  Procedural Quantum Benchmark Dataset Generator                     */
/* ------------------------------------------------------------------ */
function generateSyntheticQuantumData(): { network: NetworkData; analysis: AnalysisData } {
  const communitiesList = [
    'Surface & Color Codes',
    'qLDPC & High-Rate Codes',
    'Real-Time Decoding & MWPM',
    'Superconducting Qubits',
    'Trapped-Ion & Neutral-Atom',
    'Fault-Tolerant Thresholds',
    'Magic State Distillation',
  ];

  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const clusterFirstNodes: string[] = [];

  const authorsPool = [
    'AG Fowler', 'SB Bravyi', 'AY Kitaev', 'ET Campbell', 'BM Terhal',
    'C Horsman', 'H Bombin', 'P Panteleev', 'G Kalachev', 'D Gottesman',
    'RJ Schoelkopf', 'MD Lukin', 'C Monroe', 'J Preskill', 'A Wallraff'
  ];

  let idCounter = 0;
  communitiesList.forEach((commName, commIdx) => {
    const clusterSize = 25 + Math.floor(Math.random() * 10);
    const clusterNodes: string[] = [];

    for (let i = 0; i < clusterSize; i++) {
      const id = `q_${idCounter++}`;
      clusterNodes.push(id);
      const year = 2005 + Math.floor(Math.random() * 22);
      const citations = Math.floor(Math.pow(Math.random(), 2) * 2200) + 15;
      const author = `${authorsPool[(commIdx + i) % authorsPool.length]}, ${authorsPool[(commIdx + i + 3) % authorsPool.length]}`;
      nodes.push({
        id,
        title: `${commName}: Landmark study on ${['fault-tolerant scaling', 'threshold benchmarking', 'correlated syndrome extraction', 'lattice surgery gates', 'decoder parallelization'][i % 5]} (${year})`,
        authors: author,
        year,
        journal: ['Physical Review X', 'Nature Quantum Information', 'Physical Review Letters', 'Quantum', 'IEEE Micro'][i % 5],
        citations,
        community: commIdx,
        community_name: commName,
        abstract: `This paper introduces scalable fault-tolerant methods for ${commName.toLowerCase()}, demonstrating threshold bounds and architectural trade-offs under realistic physical error models.`,
        doi: `10.1103/PhysRevX.${year}.${1000 + idCounter}`,
        keywords: [commName.split(' ')[0], 'Fault-tolerance', 'Threshold', 'Decoding'],
        val: Math.max(2, Math.log10(citations) * 3),
      });
    }

    // Track first node of each cluster for cross-cluster links
    clusterFirstNodes.push(clusterNodes[0]);

    // Intra-cluster links
    for (let i = 0; i < clusterNodes.length; i++) {
      for (let j = i + 1; j < Math.min(i + 4, clusterNodes.length); j++) {
        links.push({
          source: clusterNodes[i],
          target: clusterNodes[j],
          value: Math.floor(Math.random() * 8) + 2,
        });
      }
    }
  });

  // Cross-cluster links — use tracked first-node IDs (not hardcoded offsets)
  for (let c = 0; c < clusterFirstNodes.length - 1; c++) {
    links.push({ source: clusterFirstNodes[c], target: clusterFirstNodes[c + 1], value: 4 });
  }

  const communitiesMap: Record<string, CommunityRecord> = {};
  communitiesList.forEach((name, idx) => {
    const cNodes = nodes.filter((n) => n.community === idx);
    const cits = cNodes.reduce((s, n) => s + n.citations, 0);
    communitiesMap[String(idx)] = {
      id: idx,
      name,
      size: cNodes.length,
      total_citations: cits,
      mean_citations: Math.round(cits / cNodes.length),
      top_keywords: [[name.split(' ')[0], 18], ['Quantum', 15], ['Threshold', 12]],
      top_authors: [[authorsPool[idx % authorsPool.length], 4], [authorsPool[(idx + 1) % authorsPool.length], 3]],
      year_range: [2005, 2026],
    };
  });

  const bridgePapers = nodes
    .slice(0, 15)
    .sort((a, b) => b.citations - a.citations)
    .map((n, i) => ({
      id: n.id,
      title: n.title,
      authors: n.authors,
      year: n.year,
      community: n.community_name,
      betweenness: 0.018 - i * 0.001,
      cross_community_edges: 80 - i * 3,
      citations: n.citations,
    }));

  const analysis: AnalysisData = {
    modularity_q: 0.142,
    num_communities: communitiesList.length,
    communities: communitiesMap,
    bridge_papers: bridgePapers,
    research_gap: QUANTUM_COMPUTING_CONFIG.researchGap,
    argument_spine: QUANTUM_COMPUTING_CONFIG.researchGap.argument_spine,
  };

  return { network: { nodes, links }, analysis };
}
