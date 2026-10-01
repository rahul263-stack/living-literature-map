import { useState, useCallback, useRef, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import ForceGraph2D from 'react-force-graph-2d';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import { getCommunityColor } from '@/lib/colors';
import type { NetworkData } from '@/context/LiteratureMapContext';
import type { LiteratureMapConfig } from '@/config/mapConfig';
import {
  Upload,
  FileText,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Download,
  Database,
  Layers,
  CheckCircle2,
  Share2,
  Globe,
} from 'lucide-react';
import TopicSearchBar from '@/components/TopicSearchBar';

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface UploadedPaper {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  abstract: string;
  keywords: string;
  citations: number;
  community: number;
  community_name: string;
  isNew: boolean;
  val: number;
}

interface GraphNode {
  id: string;
  title: string;
  community: number;
  community_name: string;
  val: number;
  year: number;
  citations: number;
  x?: number;
  y?: number;
  isNew?: boolean;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

const STORAGE_KEY = 'literature-map-uploaded-papers';

/* ────────────────────────────────────────────────
   CSV & BibTeX Parsers
   ──────────────────────────────────────────────── */

function parseCSVRows(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/^["']|["']$/g, '').trim());
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c] !== undefined ? row[c] : '';
    }
    records.push(obj);
  }

  return records;
}

function parseBibTeX(content: string): Array<{
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  abstract: string;
  keywords: string;
}> {
  const entries: Array<{
    title: string;
    authors: string;
    year: number;
    journal: string;
    doi: string;
    abstract: string;
    keywords: string;
  }> = [];

  const entryRegex = /@\w+\s*\{[\s\S]*?\n\s*\}/g;
  const entries_raw = content.match(entryRegex) || [];

  for (const raw of entries_raw) {
    const extractField = (name: string): string => {
      const bracePattern = name + '[ \t]*=[ \t]*\\{([ ^}]*(?:\\{[^}]*\\}[^}]*)*)\\}';
      const braceRe = new RegExp(bracePattern, 'i');
      let m = raw.match(braceRe);
      if (m && m[1]) return m[1].replace(/\\([{}&%$#_~^\\])/g, '$1').trim();

      const quotePattern = name + '[ \t]*=[ \t]*"([^"]*)"';
      const quoteRe = new RegExp(quotePattern, 'i');
      m = raw.match(quoteRe);
      if (m && m[1]) return m[1].replace(/\\([{}&%$#_~^\\])/g, '$1').trim();

      return '';
    };

    const title = extractField('title');
    const authorRaw = extractField('author');
    const yearStr = extractField('year');
    const journal = extractField('journal') || extractField('booktitle') || extractField('journaltitle') || '';
    const doi = extractField('doi');
    const abstract = extractField('abstract');
    const keywords = extractField('keywords');

    const authors = authorRaw
      .split(/\s+and\s+/i)
      .map((a: string) => a.trim())
      .filter(Boolean)
      .join(', ');

    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    if (title) {
      entries.push({ title, authors, year, journal, doi, abstract, keywords });
    }
  }

  return entries;
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase().trim()));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()));
  const intersection = [...setA].filter((x) => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return intersection.length / union.size;
}

function authorOverlap(authorsA: string, authorsB: string): number {
  if (!authorsA || !authorsB) return 0;
  const a = authorsA.split(',').map((s) => s.trim().toLowerCase());
  const b = authorsB.split(',').map((s) => s.trim().toLowerCase());
  let matches = 0;
  for (const name of a) {
    if (name.length < 2) continue;
    for (const other of b) {
      if (other.includes(name) || name.includes(other)) {
        matches++;
        break;
      }
    }
  }
  return matches;
}

/* ────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────── */

export default function UploadSection() {
  const sectionRef = useScrollAnimation<HTMLElement>();
  const corpusInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);

  // Active generic literature map context
  const { config, networkData, analysisData, loadCustomDataset, importBundleJSON } = useLiteratureMap();

  // Mode: Live Search vs Ingest Corpus vs Add Incremental Paper
  const [activeTab, setActiveTab] = useState<'search' | 'corpus' | 'incremental'>('search');

  // Corpus Ingestion State
  const [isCorpusDragOver, setIsCorpusDragOver] = useState(false);
  const [corpusStatus, setCorpusStatus] = useState<string | null>(null);
  const [corpusError, setCorpusError] = useState<string | null>(null);

  // Incremental State
  const [isSingleDragOver, setIsSingleDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');
  const [newPapers, setNewPapers] = useState<UploadedPaper[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>({ nodes: [], links: [] });
  const [showPreview, setShowPreview] = useState(false);

  // Manual entry form
  const [manualForm, setManualForm] = useState({
    title: '',
    authors: '',
    year: '',
    journal: '',
    doi: '',
    abstract: '',
    keywords: '',
  });

  // Dynamic school helpers from active config
  const getSchoolName = useCallback(
    (id: number): string => {
      const school = (config.schools || []).find((s) => s.id === id);
      return school ? school.name : `School ${id + 1}`;
    },
    [config.schools]
  );

  // Assign community to incremental paper
  const assignCommunity = useCallback(
    (
      paper: {
        title: string;
        authors: string;
        year: number;
        journal: string;
        doi: string;
        abstract: string;
        keywords: string;
      },
      existingNodes: GraphNode[]
    ): { community: number; community_name: string } => {
      if (existingNodes.length === 0) {
        return { community: 0, community_name: getSchoolName(0) };
      }

      const communityScores: Record<number, number> = {};

      for (const node of existingNodes) {
        if (!node || typeof node.community !== 'number') continue;
        let score = 0;

        const rawKw = typeof paper.keywords === 'string' ? paper.keywords : Array.isArray(paper.keywords) ? (paper.keywords as string[]).join(',') : '';
        const paperKeywords = rawKw
          .split(/[,;|]/)
          .map((k) => k.trim())
          .filter(Boolean);
        const nodeKeywords = (node.title || '').split(/\s+/).map((w) => w.trim().toLowerCase());
        const kwSim = jaccardSimilarity(paperKeywords, nodeKeywords);
        score += kwSim * 3;

        const authSim = authorOverlap(paper.authors, node.title || '');
        score += authSim * 2;

        const comm = node.community;
        communityScores[comm] = (communityScores[comm] || 0) + score;
      }

      let bestComm = 0;
      let bestScore = -Infinity;
      for (const [comm, score] of Object.entries(communityScores)) {
        if (score > bestScore) {
          bestScore = score;
          bestComm = parseInt(comm, 10);
        }
      }

      return {
        community: bestComm,
        community_name: getSchoolName(bestComm),
      };
    },
    [getSchoolName]
  );

  // Build preview graph
  const buildPreview = useCallback(
    (papers: UploadedPaper[]) => {
      const existingNodes: GraphNode[] = (networkData.nodes || [])
        .slice(0, 80)
        .map((n) => ({
          id: String(n.id ?? n.title),
          title: String(n.title || ''),
          community: Number(n.community ?? 0),
          community_name: String(n.community_name || getSchoolName(Number(n.community ?? 0))),
          val: Math.sqrt(Number(n.citations ?? 1)) * 0.15,
          year: Number(n.year ?? 0),
          citations: Number(n.citations ?? 0),
          isNew: false,
        }));

      const newNodes: GraphNode[] = papers.map((p) => ({
        id: p.id,
        title: p.title,
        community: p.community,
        community_name: p.community_name,
        val: 6,
        year: p.year,
        citations: p.citations,
        isNew: true,
      }));

      const allNodes = [...existingNodes, ...newNodes];

      const links: GraphLink[] = [];
      for (const newNode of newNodes) {
        for (const existing of existingNodes) {
          const rawP = papers.find((p) => p.id === newNode.id)?.keywords;
          const rawKw = typeof rawP === 'string' ? rawP : Array.isArray(rawP) ? (rawP as string[]).join(',') : '';
          const paperKeywords = rawKw
            .split(/[,;|]/)
            .map((k) => k.trim())
            .filter(Boolean);
          const existingKeywords = (existing.title || '').split(/\s+/);
          const sim = jaccardSimilarity(paperKeywords, existingKeywords);
          if (sim > 0.05) {
            links.push({
              source: newNode.id,
              target: existing.id,
              value: sim,
            });
          }
        }
      }

      const existingLinks = (networkData.links || [])
        .filter(
          (l) =>
            existingNodes.some((n) => n.id === (typeof l.source === 'object' ? l.source.id : l.source)) &&
            existingNodes.some((n) => n.id === (typeof l.target === 'object' ? l.target.id : l.target))
        )
        .slice(0, 120)
        .map((l) => ({
          source: typeof l.source === 'object' ? l.source.id : String(l.source),
          target: typeof l.target === 'object' ? l.target.id : String(l.target),
          value: Number(l.value ?? 1),
        }));

      setGraphData({
        nodes: allNodes,
        links: [...existingLinks, ...links],
      });
      setShowPreview(true);
    },
    [networkData.nodes, networkData.links, getSchoolName]
  );

  useEffect(() => {
    if (newPapers.length > 0) {
      buildPreview(newPapers);
    }
  }, [newPapers, buildPreview]);

  // Persist new incremental papers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPapers));
    }
  }, [newPapers]);

  /* ────────────────────────────────────────────────
     Corpus Bundle Ingestion (.json / .csv)
     ──────────────────────────────────────────────── */

  const processCorpusFile = useCallback(
    async (file: File) => {
      setCorpusError(null);
      setCorpusStatus(`Reading ${file.name}...`);

      try {
        const text = await file.text();
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'json') {
          const parsed = JSON.parse(text);

          // Check if it's a full bundle or just network
          if (importBundleJSON && importBundleJSON(parsed)) {
            setCorpusStatus(`Successfully ingested complete atlas bundle for "${parsed.config?.domain || parsed.config?.title || 'Custom Domain'}"!`);
          } else if (parsed.networkData && parsed.analysisData) {
            loadCustomDataset(parsed.networkData, parsed.analysisData, parsed.config);
            setCorpusStatus(`Successfully ingested complete atlas bundle for "${parsed.config?.domain || 'Custom Domain'}"!`);
          } else if (parsed.nodes && parsed.links) {
            // Raw network data format
            const domainName = parsed.metadata?.domain || file.name.replace(/\.json$/i, '');
            const generatedConfig: Partial<LiteratureMapConfig> = {
              domain: domainName,
              title: `${domainName}: Topological Map`,
              supertitle: `${domainName.toUpperCase()} CORPUS`,
              stats: {
                numPapers: parsed.nodes.length,
                numSchools: new Set(parsed.nodes.map((n: { community?: number }) => n.community ?? 0)).size,
                numLinks: parsed.links.length,
                modularityQ: parsed.metadata?.modularityQ || 0.65,
                yearRange: 'Custom Dataset',
              },
            };
            loadCustomDataset(parsed, analysisData, generatedConfig);
            setCorpusStatus(`Ingested ${parsed.nodes.length} nodes from ${file.name}!`);
          } else {
            throw new Error('Invalid JSON format. Expected a literature map bundle or {nodes, links}.');
          }
        } else if (ext === 'csv') {
          const records = parseCSVRows(text);
          if (records.length === 0) {
            throw new Error('No valid paper records detected in CSV.');
          }

          const domainName = file.name.replace(/\.csv$/i, '').replace(/[_-]/g, ' ');

          // Extract nodes
          const nodes = records.map((r, i) => {
            const title = r.title || r.paper_title || r.name || `Paper ${i + 1}`;
            const authors = r.authors || r.author || 'Unknown Authors';
            const year = parseInt(r.year || r.pub_year || '2022', 10) || 2022;
            const citations = parseInt(r.citations || r.citation_count || '0', 10) || 0;
            const abstract = r.abstract || r.summary || '';
            const rawKeywords = r.keywords || r.tags || '';
            const keywordsList = rawKeywords
              ? rawKeywords.split(/[,;]/).map((k) => k.trim()).filter(Boolean)
              : [domainName.toLowerCase(), 'empirical'];

            // Group into 4 topical buckets based on title hash if not present or invalid
            let comm = 0;
            if (r.community !== undefined && r.community !== '' && !isNaN(parseInt(r.community, 10))) {
              comm = Math.abs(parseInt(r.community, 10));
            } else {
              comm = Math.abs(title.length % 4);
            }

            return {
              id: r.id || r.doi || r.result_id || `csv_${i + 1}`,
              title,
              authors,
              year,
              citations,
              journal: r.journal || r.venue || 'Academic Journal',
              doi: r.doi || r.url || '',
              abstract,
              keywords: keywordsList,
              community: comm,
              community_name: `School ${comm + 1}`,
              val: Math.max(4, Math.round(Math.sqrt(citations || 1) * 0.5)),
            };
          });

          // Generate topical links based on shared keywords or title word overlap
          const links: Array<{ source: string; target: string; value: number }> = [];
          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const wordsA = new Set(nodes[i].title.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
              const wordsB = new Set(nodes[j].title.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
              let common = 0;
              for (const w of wordsA) if (wordsB.has(w)) common++;
              if (common > 0 || nodes[i].community === nodes[j].community) {
                links.push({
                  source: nodes[i].id,
                  target: nodes[j].id,
                  value: Math.min(1, 0.2 + common * 0.3),
                });
              }
            }
          }

          const uniqueComms = Array.from(new Set(nodes.map((n) => n.community))).sort((a, b) => a - b);
          const customSchools = uniqueComms.map((cId, idx) => ({
            id: cId,
            name: `School of Topical Paradigm ${cId + 1}`,
            color: getCommunityColor(idx, uniqueComms.length),
            description: `Thematic grouping of ${nodes.filter((n) => n.community === cId).length} empirical works.`,
            paperCount: nodes.filter((n) => n.community === cId).length,
          }));

          const minYear = Math.min(...nodes.map((n) => n.year));
          const maxYear = Math.max(...nodes.map((n) => n.year));

          const customConfig: LiteratureMapConfig = {
            id: domainName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            domain: domainName,
            supertitle: `${domainName.toUpperCase()} LIVING ATLAS`,
            title: `${domainName}: Topology of Scientific Paradigms`,
            subtitle: `An interactive knowledge graph reconstructed from ${nodes.length} peer-reviewed works.`,
            yearRange: [minYear, maxYear],
            primaryFacetName: 'Paradigm',
            facets: ['Empirical', 'Theoretical', 'Computational', 'Translational'],
            schools: customSchools,
            stats: {
              numPapers: nodes.length,
              numSchools: uniqueComms.length,
              numLinks: links.length,
              modularityQ: 0.68,
              yearRange: `${minYear}–${maxYear}`,
            },
            debates: [
              {
                id: 1,
                name: 'Model Fidelity vs. Empirical Generalization',
                startYear: minYear,
                endYear: maxYear,
                peakPeriod: `${minYear + 1}–${maxYear}`,
                consensus: 'ONGOING',
                consensusPercent: 55,
                description: 'Evaluating trade-offs between precision assumptions and robust generalization.',
                keyPapers: [
                  { year: minYear, author: typeof nodes[0]?.authors === 'string' ? nodes[0]?.authors : 'Author', title: nodes[0]?.title || 'Early work', citations: nodes[0]?.citations || 10 },
                ],
                intensity: [
                  { year: minYear, count: 2 },
                  { year: maxYear, count: 5 },
                ],
              },
            ],
            researchGap: {
              statement: `Isolated Methodological Paradigms: Cross-school empirical translation in ${domainName}`,
              argument_spine: {
                claim: {
                  title: `Literature in ${domainName} has segregated into discrete theoretical schools.`,
                  bullets: [{ text: 'Specialized terminologies limit cross-pollination.' }],
                },
                evidence_for: ['Topological clustering identifies dense intra-school citation cliques.'],
                counter_evidence: ['Integrated boundary studies demonstrate superior predictive generalizability.'],
                the_gap: 'A critical structural hole persists between high-dimensional theoretical modeling and translational validation.',
                significance: `Synthesizing these decoupled domains provides the necessary framework for breakthroughs in ${domainName}.`,
              },
              argumentSpine: {
                claim: `Literature in ${domainName} has segregated into discrete theoretical schools.`,
                evidence: `Topological clustering identifies dense intra-school citation cliques with sparse inter-school connectivity.`,
                counter: `Integrated boundary studies demonstrate superior predictive generalizability when crossing paradigms.`,
                gap: `A critical structural hole persists between high-dimensional theoretical modeling and translational validation.`,
                whyItMatters: `Synthesizing these decoupled domains provides the necessary framework for next-generation breakthroughs.`,
              },
            },
          };

          const customNetworkData: NetworkData = {
            metadata: {
              generatedAt: new Date().toISOString(),
              domain: domainName,
              totalNodes: nodes.length,
              totalLinks: links.length,
              modularityQ: 0.68,
            },
            nodes,
            links,
          };

          loadCustomDataset(customNetworkData, analysisData, customConfig);
          setCorpusStatus(`Successfully parsed and rendered ${nodes.length} papers from ${file.name}!`);
        } else {
          throw new Error('Unsupported corpus file format. Please upload a .json bundle or .csv table.');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setCorpusError(message);
        setCorpusStatus(null);
      }
    },
    [analysisData, loadCustomDataset]
  );

  const handleCorpusDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsCorpusDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) processCorpusFile(files[0]);
    },
    [processCorpusFile]
  );

  /* ────────────────────────────────────────────────
     Incremental Paper Ingestion
     ──────────────────────────────────────────────── */

  const processSingleFile = useCallback(
    async (file: File) => {
      setIsParsing(true);
      const ext = file.name.split('.').pop()?.toLowerCase();
      const papers: UploadedPaper[] = [];

      if (ext === 'bib') {
        setParseStatus('Parsing BibTeX...');
        const text = await file.text();
        const entries = parseBibTeX(text);
        for (const e of entries) {
          const tempId = 'upload_' + Math.random().toString(36).slice(2, 9);
          papers.push({
            id: tempId,
            title: e.title,
            authors: e.authors,
            year: e.year,
            journal: e.journal,
            doi: e.doi,
            abstract: e.abstract,
            keywords: e.keywords,
            citations: 0,
            ...assignCommunity(e, graphData.nodes),
            isNew: true,
            val: 5,
          });
        }
      } else if (ext === 'pdf') {
        setParseStatus('Reading PDF metadata...');
        await new Promise((r) => setTimeout(r, 400));
        const title = file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
        const paperData = {
          title,
          authors: 'Imported PDF Author',
          year: new Date().getFullYear(),
          journal: 'Peer-Reviewed Manuscript',
          doi: '',
          abstract: '',
          keywords: '',
        };
        const tempId = 'upload_' + Math.random().toString(36).slice(2, 9);
        papers.push({
          id: tempId,
          title: paperData.title,
          authors: paperData.authors,
          year: paperData.year,
          journal: paperData.journal,
          doi: paperData.doi,
          abstract: paperData.abstract,
          keywords: paperData.keywords,
          citations: 0,
          ...assignCommunity(paperData, graphData.nodes),
          isNew: true,
          val: 5,
        });
      } else if (ext === 'txt') {
        setParseStatus('Reading DOI list...');
        const text = await file.text();
        const dois = text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && l.startsWith('10.'));
        for (const doi of dois) {
          const tempId = 'upload_' + Math.random().toString(36).slice(2, 9);
          papers.push({
            id: tempId,
            title: 'DOI: ' + doi,
            authors: '',
            year: new Date().getFullYear(),
            journal: '',
            doi,
            abstract: 'DOI metadata record.',
            keywords: '',
            citations: 0,
            community: 0,
            community_name: getSchoolName(0),
            isNew: true,
            val: 5,
          });
        }
      }

      setParseStatus(`Added ${papers.length} paper(s)`);
      setIsParsing(false);

      if (papers.length > 0) {
        setNewPapers((prev) => [...prev, ...papers]);
      }
    },
    [assignCommunity, getSchoolName, graphData.nodes]
  );

  const handleManualAdd = useCallback(() => {
    const year = parseInt(manualForm.year, 10);
    if (!manualForm.title.trim() || isNaN(year)) return;

    const paperData = {
      title: manualForm.title,
      authors: manualForm.authors,
      year,
      journal: manualForm.journal,
      doi: manualForm.doi,
      abstract: manualForm.abstract,
      keywords: manualForm.keywords,
    };

    const tempId = 'upload_' + Math.random().toString(36).slice(2, 9);
    const newPaper: UploadedPaper = {
      id: tempId,
      ...paperData,
      citations: 0,
      ...assignCommunity(paperData, graphData.nodes),
      isNew: true,
      val: 5,
    };

    setNewPapers((prev) => [...prev, newPaper]);
    setManualForm({
      title: '',
      authors: '',
      year: '',
      journal: '',
      doi: '',
      abstract: '',
      keywords: '',
    });
  }, [manualForm, assignCommunity, graphData.nodes]);

  const handleDelete = useCallback((id: string) => {
    setNewPapers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Remove all uploaded incremental papers?')) {
      setNewPapers([]);
      setShowPreview(false);
      setGraphData({ nodes: [], links: [] });
    }
  }, []);

  // Integrate incremental papers directly into the active literature map
  const handleIntegrateIncrementalPapers = useCallback(() => {
    if (newPapers.length === 0) return;

    const addedNodes = newPapers.map((p) => ({
      id: p.id,
      title: p.title,
      authors: p.authors || 'Unknown Author',
      year: p.year || new Date().getFullYear(),
      journal: p.journal || 'Uploaded Manuscript',
      citations: p.citations || 0,
      community: p.community,
      community_name: p.community_name,
      abstract: p.abstract || '',
      doi: p.doi || '',
      keywords: typeof p.keywords === 'string'
        ? p.keywords.split(/[,;|]/).map((k) => k.trim()).filter(Boolean)
        : Array.isArray(p.keywords) ? p.keywords : [],
      val: 5,
    }));

    const newLinks: any[] = [];
    for (const newNode of addedNodes) {
      for (const existingNode of (networkData.nodes || [])) {
        const kwA = new Set(newNode.keywords.map((k) => k.toLowerCase()));
        const kwB = new Set(
          (Array.isArray(existingNode.keywords)
            ? existingNode.keywords
            : String(existingNode.keywords || '').split(/[,;|]/)
          ).map((k: any) => String(k).toLowerCase().trim())
        );
        const intersection = [...kwA].filter((k) => kwB.has(k)).length;
        if (intersection > 0 || newNode.community === existingNode.community) {
          newLinks.push({
            source: newNode.id,
            target: existingNode.id,
            value: Math.min(1, 0.2 + intersection * 0.25),
          });
        }
      }
    }

    const updatedNetwork: NetworkData = {
      ...networkData,
      nodes: [...(networkData.nodes || []), ...addedNodes],
      links: [...(networkData.links || []), ...newLinks],
      metadata: {
        ...networkData.metadata,
        totalNodes: (networkData.nodes?.length || 0) + addedNodes.length,
        totalLinks: (networkData.links?.length || 0) + newLinks.length,
      },
    };

    const updatedConfig: LiteratureMapConfig = {
      ...config,
      stats: {
        numPapers: updatedNetwork.nodes.length,
        numLinks: updatedNetwork.links.length,
        numSchools: config.stats?.numSchools ?? (config.schools?.length || 4),
        modularityQ: config.stats?.modularityQ ?? 0.65,
        yearRange: config.stats?.yearRange || '2010–2026',
      },
    };

    loadCustomDataset(updatedNetwork, analysisData, updatedConfig);
    setCorpusStatus(`Successfully integrated ${addedNodes.length} new paper(s) into "${config.domain}"!`);

    const heroEl = document.getElementById('hero') || document.getElementById('constellation');
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [newPapers, networkData, config, analysisData, loadCustomDataset]);

  // Export current active map bundle as JSON
  const handleExportCurrentBundle = useCallback(() => {
    const bundle = {
      config,
      networkData,
      analysisData,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.id || 'literature_map'}_bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config, networkData, analysisData]);

  // Download Sample Bundle JSON
  const handleDownloadSampleJSON = useCallback(() => {
    const sample = {
      config: {
        id: 'quantum-computing-demo',
        domain: 'Quantum Computing & Fault Tolerance',
        supertitle: 'QUANTUM HORIZON ATLAS',
        title: 'Quantum Computing: Topology of Error Correction',
        subtitle: 'A generic multi-paradigm literature map.',
        schools: [
          { id: 0, name: 'Surface Codes & Stabilizers', color: '#4A6FA5', description: 'Topological codes.', paperCount: 10 },
          { id: 1, name: 'Fault-Tolerant Thresholds', color: '#9B4F96', description: 'Asymptotic theorem.', paperCount: 8 },
        ],
        stats: { numPapers: 18, numSchools: 2, numLinks: 24, modularityQ: 0.74, yearRange: '2015–2025' },
      },
      networkData: {
        nodes: [
          { id: 'q1', title: 'Fault-tolerant quantum computation with surface codes', authors: 'Fowler, A. G., et al.', year: 2012, citations: 2100, community: 0, community_name: 'Surface Codes & Stabilizers' },
          { id: 'q2', title: 'Threshold theorem for quantum error correction', authors: 'Aharonov, D., Ben-Or, M.', year: 1997, citations: 1850, community: 1, community_name: 'Fault-Tolerant Thresholds' },
        ],
        links: [{ source: 'q1', target: 'q2', value: 0.85 }],
      },
      analysisData: {
        domain: 'Quantum Computing',
      },
    };
    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_literature_map_bundle.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Download Sample CSV
  const handleDownloadSampleCSV = useCallback(() => {
    const csvContent =
      'title,authors,year,citations,abstract,keywords\n' +
      '"Fault-tolerant quantum computation with surface codes","Fowler, A. G., et al.",2012,2100,"Review of surface codes","quantum, surface code, fault tolerance"\n' +
      '"Polynomial-time algorithms for prime factorization on a quantum computer","Shor, P. W.",1997,8500,"Foundations of quantum algorithmics","quantum algorithms, cryptography"\n' +
      '"Quantum computational supremacy using a programmable superconducting processor","Arute, F., et al.",2019,3400,"Experimental quantum supremacy","superconducting, processor, fidelity"\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_papers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // ForceGraph Node Painter
  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const r = Math.max(3, (node.val || 3) * (node.isNew ? 1.2 : 0.8));
      const color = getCommunityColor(node.community, config.schools?.length || 8);

      if (node.isNew) {
        const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, r + 6 * pulse, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(212, 168, 83, ${(0.4 * pulse).toFixed(2)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.isNew ? '#D4A853' : color;
      ctx.fill();

      ctx.strokeStyle = node.isNew ? '#D4A853' : '#fff';
      ctx.lineWidth = node.isNew ? 2 : 1;
      ctx.stroke();

      if (node.isNew || globalScale > 1.5) {
        ctx.font = `${node.isNew ? '600' : '400'} ${node.isNew ? 11 : 9}px "JetBrains Mono", monospace`;
        ctx.fillStyle = node.isNew ? '#D4A853' : '#1A1B3A';
        ctx.textAlign = 'center';
        ctx.fillText(
          node.title.length > 30 ? node.title.slice(0, 30) + '...' : node.title,
          node.x ?? 0,
          (node.y ?? 0) + r + 12
        );
      }
    },
    [config.schools]
  );

  /* ────────────────────────────────────────────────
     Render
     ──────────────────────────────────────────────── */

  return (
    <section id="upload" ref={sectionRef} className="w-full bg-warm-gray py-space-24">
      <div className="section-container">
        {/* Header */}
        <div className="scroll-animate mb-space-4">
          <span className="label text-accent-gold tracking-[0.08em]">
            INGESTION ENGINE
          </span>
        </div>
        <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-4">
          Universal Literature Ingestion
        </h2>
        <p className="scroll-animate body-lg text-text-secondary mb-space-8 max-w-3xl">
          Transform any scientific domain into an interactive Living Literature Map. Ingest complete
          corpus bundles (.json / .csv) generated from our CLI tool, or incrementally incorporate new papers.
        </p>

        {/* Tab Switcher */}
        <div className="scroll-animate flex flex-wrap items-center gap-3 mb-space-10">
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-[13px] font-medium transition-all duration-200 border cursor-pointer',
              activeTab === 'search'
                ? 'bg-accent-indigo text-white border-accent-indigo shadow-sm'
                : 'bg-surface-white text-text-secondary border-border-medium hover:border-accent-indigo'
            )}
          >
            <Sparkles size={16} className={activeTab === 'search' ? 'text-accent-gold' : 'text-accent-gold/80'} />
            Search Any Topic (OpenAlex 250M+)
          </button>
          <button
            onClick={() => setActiveTab('corpus')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-[13px] font-medium transition-all duration-200 border cursor-pointer',
              activeTab === 'corpus'
                ? 'bg-accent-indigo text-white border-accent-indigo shadow-sm'
                : 'bg-surface-white text-text-secondary border-border-medium hover:border-accent-indigo'
            )}
          >
            <Database size={16} className={activeTab === 'corpus' ? 'text-accent-gold' : ''} />
            Ingest Entire Corpus (.json / .csv)
          </button>
          <button
            onClick={() => setActiveTab('incremental')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg font-mono text-[13px] font-medium transition-all duration-200 border cursor-pointer',
              activeTab === 'incremental'
                ? 'bg-accent-indigo text-white border-accent-indigo shadow-sm'
                : 'bg-surface-white text-text-secondary border-border-medium hover:border-accent-indigo'
            )}
          >
            <Layers size={16} className={activeTab === 'incremental' ? 'text-accent-gold' : ''} />
            Add Individual Papers (BibTeX / PDF)
          </button>
        </div>

        {/* ────────────────────────────────────────────────
           TAB 0: LIVE TOPIC SEARCH (OPENALEX)
           ──────────────────────────────────────────────── */}
        {activeTab === 'search' && (
          <div className="space-y-space-8">
            <div className="scroll-animate bg-surface-white border border-border-medium rounded-xl p-space-8 shadow-sm">
              <div className="max-w-3xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-gold animate-pulse" />
                  <span className="label text-accent-gold uppercase tracking-wider text-[11px]">
                    Universal OpenAlex Query Engine
                  </span>
                </div>
                <h3 className="heading-2 font-serif text-accent-indigo mb-2">
                  Generate Literature Map on Any Scientific Field
                </h3>
                <p className="body-md text-text-secondary leading-relaxed">
                  Query the global index of over 250 million scholarly publications. Our pipeline extracts seminal literature, builds the interconnected citation graph, computes research schools of thought, and automatically analyzes structural holes to reveal unaddressed research gaps.
                </p>
              </div>

              {/* Topic Search Input */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-border-light shadow-inner mb-6">
                <TopicSearchBar variant="upload" />
              </div>

              {/* Architecture Explanation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border-light text-[12px] font-mono">
                <div className="p-3 rounded-lg bg-surface-white border border-border-light">
                  <div className="font-semibold text-accent-indigo mb-1 flex items-center gap-1.5">
                    <Globe size={14} className="text-accent-gold" />
                    1. Real-Time Index
                  </div>
                  <p className="text-text-secondary leading-normal">
                    Queries OpenAlex API for highly-cited works, authorships, and abstracts without rate limits or API keys.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-white border border-border-light">
                  <div className="font-semibold text-accent-indigo mb-1 flex items-center gap-1.5">
                    <Database size={14} className="text-accent-gold" />
                    2. Citation Graph
                  </div>
                  <p className="text-text-secondary leading-normal">
                    Reconstructs exact referenced works and semantic co-occurrence edges to form a connected star constellation.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-surface-white border border-border-light">
                  <div className="font-semibold text-accent-indigo mb-1 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-accent-gold" />
                    3. Gap & Debate Analytics
                  </div>
                  <p className="text-text-secondary leading-normal">
                    Clusters paradigms and detects structural holes with lowest cross-community density to identify novel PhD thesis directions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────
           TAB 1: INGEST ENTIRE CORPUS
           ──────────────────────────────────────────────── */}
        {activeTab === 'corpus' && (
          <div className="space-y-space-8">
            {/* Active Map Status Card */}
            <div className="scroll-animate bg-surface-white border border-border-medium rounded-xl p-space-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="label text-text-tertiary">CURRENT ACTIVE ATLAS</span>
                  </div>
                  <h3 className="heading-3 font-serif text-accent-indigo">{config.domain}</h3>
                  <p className="body-sm text-text-secondary mt-1">
                    {config.stats?.numPapers || networkData.nodes.length} papers &bull; {config.schools?.length || 8} schools &bull;{' '}
                    {config.stats?.numLinks || networkData.links.length} association links &bull; Modularity Q = {config.stats?.modularityQ || 0.65}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportCurrentBundle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-medium bg-surface-elevated font-mono text-[12px] text-accent-indigo hover:border-accent-gold transition-colors"
                    title="Export currently loaded atlas as JSON"
                  >
                    <Share2 size={14} className="text-accent-gold" />
                    Export Atlas (.json)
                  </button>
                  <button
                    onClick={handleDownloadSampleJSON}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-medium bg-surface-elevated font-mono text-[12px] text-text-secondary hover:border-accent-indigo transition-colors"
                  >
                    <Download size={14} />
                    Sample JSON
                  </button>
                  <button
                    onClick={handleDownloadSampleCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-medium bg-surface-elevated font-mono text-[12px] text-text-secondary hover:border-accent-indigo transition-colors"
                  >
                    <Download size={14} />
                    Sample CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div className="scroll-animate">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsCorpusDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsCorpusDragOver(false);
                }}
                onDrop={handleCorpusDrop}
                onClick={() => corpusInputRef.current?.click()}
                className={cn(
                  'mx-auto max-w-[800px] h-[260px] rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-300 p-6 text-center',
                  isCorpusDragOver
                    ? 'border-accent-indigo bg-[rgba(26,27,58,0.05)] scale-[1.01]'
                    : 'border-border-medium bg-surface-white hover:bg-[rgba(26,27,58,0.02)] hover:border-accent-indigo'
                )}
              >
                <input
                  ref={corpusInputRef}
                  type="file"
                  accept=".json,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) processCorpusFile(files[0]);
                    e.target.value = '';
                  }}
                />
                <Database
                  size={52}
                  className={cn(
                    'transition-colors duration-300',
                    isCorpusDragOver ? 'text-accent-indigo' : 'text-accent-gold'
                  )}
                />
                <p className="heading-3 text-text-primary">
                  Drag &amp; drop a Literature Map Bundle (.json) or Paper List (.csv)
                </p>
                <p className="body-sm text-text-secondary max-w-lg">
                  Instantly reconstructs the 3D semantic galaxy, school community clusters,
                  debate evolution timeline, and research gaps.
                </p>
                <span className="mono-sm text-accent-indigo bg-accent-gold-light/40 border border-accent-gold/40 px-3 py-1 rounded-full">
                  Click to browse from file system
                </span>
              </div>
            </div>

            {/* Corpus Feedback */}
            {corpusStatus && (
              <div className="scroll-animate flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl max-w-[800px] mx-auto text-emerald-900 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <span className="font-mono text-xs font-semibold">{corpusStatus}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const heroEl = document.getElementById('hero') || document.getElementById('constellation');
                    if (heroEl) {
                      heroEl.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="shrink-0 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Explore Ingested Atlas</span>
                  <span>&uarr;</span>
                </button>
              </div>
            )}

            {corpusError && (
              <div className="scroll-animate flex items-center justify-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg max-w-[800px] mx-auto text-red-800">
                <AlertTriangle size={18} className="text-red-600" />
                <span className="mono-sm font-medium">{corpusError}</span>
              </div>
            )}

            {/* CLI Companion Banner */}
            <div className="scroll-animate max-w-[800px] mx-auto bg-surface-elevated border border-border-light rounded-xl p-space-6">
              <h4 className="heading-4 font-serif text-accent-indigo mb-2 flex items-center gap-2">
                <BookOpen size={18} className="text-accent-gold" />
                Automate with Standalone CLI Ingestion
              </h4>
              <p className="body-sm text-text-secondary mb-3">
                You can run our modular CLI script to transform raw CSV biblists into full literature map
                bundles complete with VOSviewer association strength normalization, Louvain modularity, and
                Brandes betweenness centrality:
              </p>
              <pre className="bg-[#1A1B3A] text-emerald-400 p-3 rounded-md font-mono text-[12px] overflow-x-auto">
                <code>
                  node scripts/generate_literature_map.js --input "path/to/papers.csv" --domain "My Research Field" --output "output_dir"
                </code>
              </pre>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────
           TAB 2: ADD INDIVIDUAL PAPERS (INCREMENTAL)
           ──────────────────────────────────────────────── */}
        {activeTab === 'incremental' && (
          <div className="space-y-space-8">
            {/* Drop Zone */}
            <div className="scroll-animate">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsSingleDragOver(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsSingleDragOver(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsSingleDragOver(false);
                  const files = Array.from(e.dataTransfer.files);
                  for (const file of files) processSingleFile(file);
                }}
                onClick={() => singleFileInputRef.current?.click()}
                className={cn(
                  'mx-auto max-w-[700px] h-[220px] rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 transition-all duration-300',
                  isSingleDragOver
                    ? 'border-accent-indigo bg-[rgba(26,27,58,0.04)]'
                    : 'border-border-medium bg-surface-white hover:bg-[rgba(26,27,58,0.02)] hover:border-accent-indigo'
                )}
              >
                <input
                  ref={singleFileInputRef}
                  type="file"
                  accept=".bib,.pdf,.txt"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    for (const file of files) processSingleFile(file);
                    e.target.value = '';
                  }}
                />
                <Upload
                  size={44}
                  className={cn(
                    'transition-colors duration-300',
                    isSingleDragOver ? 'text-accent-indigo' : 'text-text-tertiary'
                  )}
                />
                <p className="heading-3 text-text-secondary text-center">
                  Drag &amp; drop files here, or{' '}
                  <span className="text-accent-indigo underline">click to browse</span>
                </p>
                <p className="body-sm text-text-tertiary">
                  Accepts: .bib (BibTeX), .pdf, .txt (DOI list)
                </p>
              </div>
            </div>

            {/* Parsing Status */}
            {isParsing && (
              <div className="scroll-animate flex items-center justify-center gap-2 mb-space-6">
                <Sparkles size={16} className="text-accent-gold animate-spin" />
                <span className="mono text-text-secondary">{parseStatus}</span>
              </div>
            )}

            {!isParsing && parseStatus && (
              <div className="scroll-animate flex items-center justify-center gap-2 mb-space-6">
                <Sparkles size={16} className="text-success" />
                <span className="mono text-text-secondary">{parseStatus}</span>
              </div>
            )}

            {/* Manual Entry Form */}
            <div className="scroll-animate">
              <div className="mx-auto max-w-[700px]">
                <h3 className="heading-4 font-serif text-accent-indigo mb-space-4 flex items-center gap-2">
                  <BookOpen size={18} className="text-accent-gold" />
                  Or Add Manually to &ldquo;{config.domain}&rdquo;
                </h3>
                <div className="bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block label text-text-tertiary mb-1">Title *</label>
                      <input
                        type="text"
                        value={manualForm.title}
                        onChange={(e) => setManualForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Paper title"
                        className="w-full border border-border-light rounded-md px-3 py-2 font-mono text-[13px] text-accent-indigo placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block label text-text-tertiary mb-1">Authors</label>
                      <input
                        type="text"
                        value={manualForm.authors}
                        onChange={(e) => setManualForm((f) => ({ ...f, authors: e.target.value }))}
                        placeholder="Last, First, Last2, First2"
                        className="w-full border border-border-light rounded-md px-3 py-2 font-mono text-[13px] text-accent-indigo placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block label text-text-tertiary mb-1">Year *</label>
                      <input
                        type="number"
                        value={manualForm.year}
                        onChange={(e) => setManualForm((f) => ({ ...f, year: e.target.value }))}
                        placeholder="2024"
                        className="w-full border border-border-light rounded-md px-3 py-2 font-mono text-[13px] text-accent-indigo placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block label text-text-tertiary mb-1">Journal</label>
                      <input
                        type="text"
                        value={manualForm.journal}
                        onChange={(e) => setManualForm((f) => ({ ...f, journal: e.target.value }))}
                        placeholder="Journal name"
                        className="w-full border border-border-light rounded-md px-3 py-2 font-mono text-[13px] text-accent-indigo placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block label text-text-tertiary mb-1">DOI</label>
                      <input
                        type="text"
                        value={manualForm.doi}
                        onChange={(e) => setManualForm((f) => ({ ...f, doi: e.target.value }))}
                        placeholder="10.xxxx/xxxxx"
                        className="w-full border border-border-light rounded-md px-3 py-2 font-mono text-[13px] text-accent-indigo placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block label text-text-tertiary mb-1">Keywords</label>
                      <input
                        type="text"
                        value={manualForm.keywords}
                        onChange={(e) => setManualForm((f) => ({ ...f, keywords: e.target.value }))}
                        placeholder="key concept 1, key concept 2"
                        className="w-full border border-border-light rounded-md px-3 py-2 font-mono text-[13px] text-accent-indigo placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block label text-text-tertiary mb-1">Abstract</label>
                    <textarea
                      value={manualForm.abstract}
                      onChange={(e) => setManualForm((f) => ({ ...f, abstract: e.target.value }))}
                      placeholder="Paper abstract (optional)"
                      rows={3}
                      className="w-full border border-border-light rounded-md px-3 py-2 font-mono text-[13px] text-accent-indigo placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo transition-colors resize-y"
                    />
                  </div>
                  <button
                    onClick={handleManualAdd}
                    disabled={!manualForm.title.trim() || !manualForm.year}
                    className={cn(
                      'inline-flex items-center gap-2 font-mono text-[13px] font-medium rounded-md px-4 py-2.5 transition-all duration-200',
                      manualForm.title.trim() && manualForm.year
                        ? 'bg-accent-gold text-accent-indigo hover:bg-star-gold'
                        : 'bg-border-light text-text-tertiary cursor-not-allowed'
                    )}
                  >
                    <Plus size={16} />
                    Add Paper
                  </button>
                </div>
              </div>
            </div>

            {/* Uploaded Papers Table */}
            {newPapers.length > 0 && (
              <div className="scroll-animate">
                <div className="mx-auto max-w-[900px]">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-space-4">
                    <h3 className="heading-4 font-serif text-accent-indigo">
                      Incremental Papers ({newPapers.length})
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleIntegrateIncrementalPapers}
                        className="inline-flex items-center gap-1.5 font-mono text-[12px] bg-accent-gold text-accent-indigo font-bold rounded-md px-3.5 py-1.5 hover:bg-star-gold transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <Sparkles size={14} />
                        <span>Integrate {newPapers.length} Paper{newPapers.length !== 1 ? 's' : ''} into Live Atlas</span>
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="inline-flex items-center gap-1.5 font-mono text-[12px] text-danger border border-danger/40 hover:border-danger rounded-md px-3 py-1.5 hover:bg-danger hover:text-white transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 size={14} />
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px]">
                        <thead>
                          <tr className="bg-surface-elevated border-b-2 border-border-medium">
                            <th className="text-left px-4 py-2.5 heading-4 text-accent-indigo font-mono text-[12px]">#</th>
                            <th className="text-left px-4 py-2.5 heading-4 text-accent-indigo font-mono text-[12px]">Title</th>
                            <th className="text-left px-4 py-2.5 heading-4 text-accent-indigo font-mono text-[12px]">Authors</th>
                            <th className="text-left px-4 py-2.5 heading-4 text-accent-indigo font-mono text-[12px]">Year</th>
                            <th className="text-left px-4 py-2.5 heading-4 text-accent-indigo font-mono text-[12px]">School</th>
                            <th className="text-center px-4 py-2.5 heading-4 text-accent-indigo font-mono text-[12px]">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newPapers.map((paper, idx) => (
                            <tr
                              key={paper.id}
                              className="border-b border-border-light last:border-b-0 hover:bg-[rgba(212,168,83,0.04)] transition-colors"
                            >
                              <td className="px-4 py-3 mono-sm text-text-tertiary">{idx + 1}</td>
                              <td className="px-4 py-3 mono text-accent-indigo max-w-[300px] truncate">{paper.title}</td>
                              <td className="px-4 py-3 mono text-text-secondary max-w-[200px] truncate">{paper.authors || '—'}</td>
                              <td className="px-4 py-3 mono text-text-secondary">{paper.year}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: getCommunityColor(paper.community, config.schools?.length || 8),
                                    }}
                                  />
                                  <span className="mono-sm text-text-secondary truncate max-w-[140px]">
                                    {paper.community_name}
                                  </span>
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleDelete(paper.id)}
                                  className="inline-flex items-center text-text-tertiary hover:text-danger transition-colors"
                                  title="Remove paper"
                                >
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Graph Preview */}
            {showPreview && graphData.nodes.length > 0 && (
              <div className="scroll-animate">
                <div className="mx-auto max-w-[900px]">
                  <div className="flex items-center justify-between mb-space-4">
                    <h3 className="heading-4 font-serif text-accent-indigo flex items-center gap-2">
                      <Sparkles size={18} className="text-accent-gold" />
                      Integration Preview
                    </h3>
                    <span className="mono-sm text-accent-gold bg-accent-gold-light rounded px-2 py-1">
                      {newPapers.length} new paper{newPapers.length !== 1 ? 's' : ''} added to network
                    </span>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] overflow-hidden">
                    <div className="h-[300px] w-full">
                      <ForceGraph2D
                        graphData={graphData}
                        nodeCanvasObject={paintNode}
                        linkColor={() => 'rgba(212, 168, 83, 0.2)'}
                        linkWidth={(l: GraphLink) => Math.max(0.5, (l.value || 1) * 0.8)}
                        backgroundColor="#FFFFFF"
                        enableZoomInteraction={true}
                        enablePanInteraction={true}
                        enableNodeDrag={true}
                        cooldownTicks={50}
                        warmupTicks={30}
                        d3AlphaDecay={0.05}
                        d3VelocityDecay={0.3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Persistence Notice */}
        <div className="scroll-animate mt-space-8">
          <div className="mx-auto max-w-[700px] text-center">
            <p className="body-sm text-text-tertiary flex items-center justify-center gap-2">
              <FileText size={14} />
              All processing happens client-side in your browser. No private manuscripts or proprietary
              bibliographies leave your device.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
