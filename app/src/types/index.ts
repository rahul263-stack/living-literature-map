/* ------------------------------------------------------------------ */
/*  Living Literature Map - Core Type Definitions                     */
/* ------------------------------------------------------------------ */

export interface DebateItem {
  id: number;
  name: string;
  color?: string;
  startYear: number;
  endYear: number;
  peakPeriod: string;
  consensus: 'SETTLED' | 'ONGOING' | 'EMERGING';
  consensusPercent: number;
  description: string;
  keyPapers: { year: number; author: string; title: string; citations?: number }[];
  intensity: { year: number; count: number }[];
}

export interface SchoolConfig {
  id: number;
  name: string;
  color?: string;
  description?: string;
  paperCount?: number;
  papers_count?: number;
  key_authors?: string[];
  core_concepts?: string[];
}

export interface ArgumentSpineBullet {
  text: string;
  id?: string | number;
}

export interface ArgumentSpineSection {
  title?: string;
  statement?: string;
  bullets?: Array<string | ArgumentSpineBullet>;
}

export interface ArgumentSpineData {
  claim?: string | ArgumentSpineSection;
  evidence?: string | ArgumentSpineSection;
  counter?: string | ArgumentSpineSection;
  gap?: string | ArgumentSpineSection;
  why?: string | ArgumentSpineSection;
  significance?: string;
  evidence_for?: string[];
  counter_evidence?: string[];
  the_gap?: string;
  [key: string]: unknown;
}

export interface CrossCommunityBar {
  pair: string;
  sourceSchool?: string;
  targetSchool?: string;
  value?: number;
  weight?: number;
  highlight?: boolean;
  isReference?: boolean;
  expected?: number;
  actual?: number;
  density?: number;
}

export interface GapMetrics {
  structural_hole_weight?: number;
  mean_weight?: number;
  gap_pct?: string;
  description?: string;
  density_deficit?: string | number;
  expected_density?: string | number;
  actual_density?: string | number;
  cross_citations?: number;
  inter_community_edges?: number;
  inter_cluster_edges?: number;
  inter_modular_density?: number;
}

export interface ResearchGapConfig {
  statement?: string;
  gap_statement?: string;
  gap_title?: string;
  title?: string;
  metric?: string;
  metric_label?: string;
  detected_via?: string;
  source_community?: string;
  target_community?: string;
  why_it_matters?: string;
  proposed_direction?: string;
  gap_metrics?: GapMetrics;
  cross_community_bars?: CrossCommunityBar[];
  argument_spine?: ArgumentSpineData;
  argumentSpine?: {
    claim: string;
    evidence: string;
    counter: string;
    gap: string;
    whyItMatters: string;
  };
  [key: string]: unknown;
}

export interface LiteratureMapConfig {
  id: string;
  title: string;
  subtitle: string;
  supertitle?: string;
  domain: string;
  domainName?: string;
  yearRange: [number, number];
  primaryFacetName: string;
  facets: string[];
  theme?: {
    accentGold: string;
    accentIndigo: string;
    darkBg: string;
  };
  schools?: SchoolConfig[];
  topic?: string;
  stats?: {
    numPapers: number;
    numSchools: number;
    numLinks: number;
    modularityQ: number;
    yearRange?: string;
  };
  debates?: DebateItem[];
  researchGap?: ResearchGapConfig;
}

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
  doi?: string | null;
  keywords: string[];
  val: number;
  link_url?: string;
  link_type?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  selected?: boolean;
  highlighted?: boolean;
  neighbor?: boolean;
}

export interface NetworkLink {
  source: string | NetworkNode | { id: string; community?: number; [key: string]: unknown };
  target: string | NetworkNode | { id: string; community?: number; [key: string]: unknown };
  value?: number;
  weight?: number;
  assoc?: number;
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

export interface BridgePaper {
  id: string;
  title: string;
  authors: string | string[];
  year: number;
  community: string;
  betweenness: number;
  cross_community_edges: number;
  citations: number;
}

export interface TimelineData {
  count: number;
  community_breakdown: Record<string, number>;
}

export interface CoauthorshipData {
  top_authors: Array<{ name: string; paper_count: number; school_affiliation?: number }>;
  collaboration_edges: Array<{ source: string; target: string; shared_papers: number }>;
}

export interface CommunityEvolutionData {
  name: string;
  papers_per_year: Record<string, number>;
}

export interface ResearchGapData {
  gap_title?: string;
  title?: string;
  gap_statement?: string;
  statement?: string;
  why_it_matters?: string;
  detected_via?: string;
  source_community?: string;
  target_community?: string;
  proposed_direction?: string;
  gap_metrics?: GapMetrics;
  cross_community_bars?: CrossCommunityBar[];
  argument_spine?: ArgumentSpineData;
  argumentSpine?: {
    claim: string;
    evidence: string;
    counter: string;
    gap: string;
    whyItMatters: string;
  };
  [key: string]: unknown;
}

export interface AnalysisData {
  modularity_q: number;
  num_communities: number;
  communities: Record<string, CommunityRecord>;
  bridge_papers: BridgePaper[];
  research_gap?: ResearchGapData;
  argument_spine?: ArgumentSpineData;
  timeline?: Record<string, TimelineData>;
  journal_distribution?: Record<string, number>;
  year_distribution?: Record<string, number>;
  decade_distribution?: Record<string, number>;
  coauthorship?: CoauthorshipData;
  community_evolution?: Record<string, CommunityEvolutionData>;
}

export interface TopicHistoryItem {
  id: string;
  query: string;
  title: string;
  paperCount: number;
  timestamp: number;
}

export interface PresetInfo {
  id: string;
  name: string;
  domain: string;
}
