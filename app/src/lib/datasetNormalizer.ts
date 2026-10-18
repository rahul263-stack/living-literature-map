import type {
  LiteratureMapConfig,
  NetworkData,
  AnalysisData,
  NetworkNode,
  CommunityRecord,
  BridgePaper,
} from '@/types';

// Normalize helper to guarantee keywords consistency (handles array, string, or undefined)
export function normalizeKeywords(kw: unknown): string[] {
  if (!kw) return [];
  if (Array.isArray(kw)) {
    return kw
      .map((item) =>
        typeof item === 'string'
          ? item
          : (item as { name?: string; keyword?: string; display_name?: string })?.name ||
            (item as { name?: string; keyword?: string; display_name?: string })?.keyword ||
            (item as { name?: string; keyword?: string; display_name?: string })?.display_name ||
            String(item)
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
export function normalizeNodes(nodes: Partial<NetworkNode>[]): NetworkNode[] {
  return (nodes || []).map((n) => ({
    id: n.id || String(Math.random()),
    title: n.title || 'Untitled Paper',
    authors: Array.isArray(n.authors)
      ? n.authors.join(', ')
      : typeof n.authors === 'string'
      ? n.authors
      : 'Unknown',
    year: typeof n.year === 'number' ? n.year : 2024,
    journal: n.journal || 'Preprint',
    citations: typeof n.citations === 'number' ? n.citations : 0,
    community: typeof n.community === 'number' ? n.community : 0,
    community_name: n.community_name || 'General',
    abstract: n.abstract || '',
    doi: n.doi || '',
    keywords: normalizeKeywords(n.keywords),
    val: typeof n.val === 'number' ? n.val : Math.max(2, Math.log10((n.citations || 0) + 1) * 3),
    link_url: n.link_url,
    link_type: n.link_type,
    x: n.x,
    y: n.y,
    z: n.z,
  }));
}

// Normalizes any arbitrary JSON bundle into standard LiteratureMap types
export function normalizeBundle(bundle: Record<string, any>): {
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
  } else if (rawAnalysis.communities && Object.keys(rawAnalysis.communities).length > 0) {
    Object.assign(communitiesMap, rawAnalysis.communities);
  } else if (Array.isArray(schools) && schools.length > 0) {
    schools.forEach((s: any, idx: number) => {
      const memberCount = s.paperCount || s.papers_count || 0;
      communitiesMap[String(s.id ?? idx)] = {
        id: s.id ?? idx,
        name: s.name,
        size: memberCount,
        total_citations: 0,
        mean_citations: 0,
        top_keywords: (s.core_concepts || s.keywords || []).map((k: string) => [k, 10]),
        top_authors: (s.key_authors || []).map((a: string) => [a, 1]),
        year_range: [2015, 2026],
      };
    });
  }

  const bridgePapers: BridgePaper[] = (rawAnalysis.bridgePapers || rawAnalysis.bridge_papers || []).map((b: any) => ({
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
    research_gap: config.researchGap as any,
    argument_spine: (config.researchGap?.argument_spine || config.researchGap?.argumentSpine) as any,
    community_evolution: rawAnalysis.community_evolution,
    timeline: rawAnalysis.timeline,
  };

  return { config, networkData: { nodes, links, metadata: rawNet.metadata }, analysisData };
}
