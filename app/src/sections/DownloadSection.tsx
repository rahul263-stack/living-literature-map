import { useState, useCallback, useMemo } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import {
  Download,
  FileJson,
  BookOpen,
  FileArchive,
  AlertCircle,
  Check,
} from 'lucide-react';

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface PaperNode {
  id: string;
  title: string;
  authors: string | string[];
  year: number;
  journal?: string;
  citations?: number;
  community?: number;
  community_name?: string;
  abstract?: string;
  doi?: string;
  keywords?: string[];
  val?: number;
}

/* ────────────────────────────────────────────────
   BibTeX Key Generator
   ──────────────────────────────────────────────── */

function makeBibKey(paper: PaperNode): string {
  const authorList = Array.isArray(paper.authors)
    ? paper.authors
    : typeof paper.authors === 'string'
    ? paper.authors.split(',').map((s) => s.trim())
    : [];
  const firstAuthor = (authorList[0] || 'Unknown')
    .split(' ')
    .pop()
    ?.replace(/[^a-zA-Z]/g, '') || 'Unknown';
  const year = paper.year;
  const firstWord = (paper.title || 'paper')
    .split(' ')[0]
    ?.replace(/[^a-zA-Z]/g, '')
    .toLowerCase() || 'paper';
  return `${firstAuthor}${year}_${firstWord}`;
}

function escapeBibTeX(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/~/g, '\\~{}')
    .replace(/\^/g, '\\^{}')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#');
}

function paperToBibTeX(paper: PaperNode): string {
  const key = makeBibKey(paper);
  const authorList = Array.isArray(paper.authors)
    ? paper.authors
    : typeof paper.authors === 'string'
    ? paper.authors.split(',').map((s) => s.trim())
    : ['Unknown'];
  const lines = [
    `@article{${key},`,
    `  title = {${escapeBibTeX(paper.title)}},`,
    `  author = {${authorList.map(escapeBibTeX).join(' and ')}},`,
    `  year = {${paper.year}},`,
  ];
  if (paper.journal) {
    lines.push(`  journal = {${escapeBibTeX(paper.journal)}},`);
  }
  if (paper.doi) {
    lines.push(`  doi = {${paper.doi}},`);
  }
  if (paper.abstract) {
    lines.push(`  abstract = {${escapeBibTeX(paper.abstract)}},`);
  }
  const kwList = Array.isArray(paper.keywords)
    ? paper.keywords
    : typeof paper.keywords === 'string'
    ? (paper.keywords as string).split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
    : [];
  if (kwList.length > 0) {
    lines.push(`  keywords = {${kwList.map(escapeBibTeX).join(', ')}},`);
  }
  lines.push(`  citations = {${paper.citations || 0}}`);
  lines.push(`}`);
  return lines.join('\n');
}

/* ────────────────────────────────────────────────
   CSV Generator
   ──────────────────────────────────────────────── */

function escapeCSV(s: string | number): string {
  const str = String(s || '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function generateCSV(papers: PaperNode[]): string {
  const headers = ['ID', 'Title', 'Authors', 'Year', 'Journal', 'DOI', 'Citations', 'Keywords', 'School'];
  const rows = papers.map((p) => {
    const authorsStr = Array.isArray(p.authors) ? p.authors.join(', ') : (p.authors || '');
    const kwStr = Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords || '');
    return [
      p.id,
      p.title,
      authorsStr,
      p.year,
      p.journal || '',
      p.doi || '',
      p.citations || 0,
      kwStr,
      p.community_name || '',
    ]
      .map(escapeCSV)
      .join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

/* ────────────────────────────────────────────────
   Download helper
   ──────────────────────────────────────────────── */

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────────
   Card Sub-Component
   ──────────────────────────────────────────────── */

function DownloadCard({
  icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="scroll-animate bg-surface-white border border-border-light rounded-lg p-space-6 shadow-card hover:shadow-card-hover hover:border-border-medium transition-all duration-200 flex flex-col"
      style={{ transitionDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-3 mb-space-4">
        <div className="w-10 h-10 rounded-lg bg-accent-gold-light flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="heading-3 font-serif text-accent-indigo">{title}</h3>
        </div>
      </div>
      <p className="body-sm text-text-secondary mb-space-6 flex-1">
        {description}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────── */

import { useLiteratureMap } from '@/context/LiteratureMapContext';

export default function DownloadSection() {
  const sectionRef = useScrollAnimation<HTMLElement>();
  const { networkData, analysisData, config } = useLiteratureMap();
  const [downloaded, setDownloaded] = useState<string | null>(null);

  const totalPapers = networkData?.nodes?.length || 0;
  const safeTopic = (config.topic || 'literature_map').toLowerCase().replace(/[^a-z0-9]+/g, '_');

  const jsonSize = useMemo(() => {
    if (!networkData) return '~0.5 MB';
    const bytes = JSON.stringify(networkData).length;
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `~${mb} MB`;
  }, [networkData]);

  // ── Download handlers
  const downloadJSON = useCallback(() => {
    if (!networkData) return;
    const payload = {
      config,
      stats: {
        totalPapers: networkData.nodes.length,
        totalLinks: networkData.links.length,
        topic: config.topic,
      },
      nodes: networkData.nodes,
      links: networkData.links,
      analysis: analysisData,
    };
    const content = JSON.stringify(payload, null, 2);
    triggerDownload(content, `${safeTopic}_network_corpus.json`, 'application/json');
    setDownloaded('json');
    setTimeout(() => setDownloaded(null), 2000);
  }, [networkData, analysisData, config, safeTopic]);

  const downloadBibTeX = useCallback(() => {
    if (!networkData || networkData.nodes.length === 0) return;
    const bibEntries = networkData.nodes.map(paperToBibTeX);
    const content = bibEntries.join('\n\n');
    triggerDownload(content, `${safeTopic}_references.bib`, 'text/plain');
    setDownloaded('bib');
    setTimeout(() => setDownloaded(null), 2000);
  }, [networkData, safeTopic]);

  const downloadCSV = useCallback(() => {
    if (!networkData || networkData.nodes.length === 0) return;
    const csv = generateCSV(networkData.nodes);
    triggerDownload(csv, `${safeTopic}_papers.csv`, 'text/csv');
    setDownloaded('csv');
    setTimeout(() => setDownloaded(null), 2000);
  }, [networkData, safeTopic]);

  const downloadBundle = useCallback(() => {
    if (!networkData || networkData.nodes.length === 0) return;
    downloadJSON();
    setTimeout(downloadCSV, 250);
    setTimeout(downloadBibTeX, 500);
    setDownloaded('bundle');
    setTimeout(() => setDownloaded(null), 2000);
  }, [networkData, downloadJSON, downloadCSV, downloadBibTeX]);

  return (
    <section
      id="download"
      ref={sectionRef}
      className="w-full bg-off-white py-space-24 pb-space-16"
    >
      <div className="section-container">
        {/* ── Header ────────────────────────── */}
        <div className="scroll-animate mb-space-4">
          <span className="label text-accent-gold tracking-[0.08em]">
            DOWNLOAD
          </span>
        </div>
        <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-4">
          Download the Corpus
        </h2>
        <p className="scroll-animate body-lg text-text-secondary mb-space-12 max-w-2xl">
          Export the complete network topology, bibliography, and analysis data for {config.topic || 'the literature'}.
        </p>

        {/* ── Download Cards ────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-space-12">
          {/* A. JSON Corpus Card */}
          <DownloadCard
            icon={<FileJson size={20} className="text-accent-gold" />}
            title="Full Corpus (JSON)"
            description={`${totalPapers} papers with complete metadata, citation edges, communities, and modularity metrics.`}
            delay={0}
          >
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-elevated text-mono text-text-tertiary text-[11px] mr-2">
              {jsonSize}
            </span>
            <button
              onClick={downloadJSON}
              className={cn(
                'inline-flex items-center gap-2 font-mono text-[12px] font-medium rounded-md px-4 py-2.5 border transition-all duration-200',
                downloaded === 'json'
                  ? 'bg-success border-success text-white'
                  : 'border-accent-indigo text-accent-indigo hover:bg-accent-indigo hover:text-white'
              )}
            >
              {downloaded === 'json' ? (
                <>
                  <Check size={14} />
                  Downloaded
                </>
              ) : (
                <>
                  <Download size={14} />
                  Download JSON
                </>
              )}
            </button>
          </DownloadCard>

          {/* B. Bibliography Card */}
          <DownloadCard
            icon={<BookOpen size={20} className="text-accent-gold" />}
            title="Bibliography (BibTeX + CSV)"
            description={`All ${totalPapers} papers formatted for Zotero, Mendeley, and spreadsheet analysis.`}
            delay={0.08}
          >
            <button
              onClick={downloadBibTeX}
              className={cn(
                'inline-flex items-center gap-2 font-mono text-[12px] font-medium rounded-md px-3 py-2.5 border transition-all duration-200',
                downloaded === 'bib'
                  ? 'bg-success border-success text-white'
                  : 'border-accent-indigo text-accent-indigo hover:bg-accent-indigo hover:text-white'
              )}
            >
              {downloaded === 'bib' ? (
                <>
                  <Check size={14} />
                  BibTeX
                </>
              ) : (
                'Download BibTeX'
              )}
            </button>
            <button
              onClick={downloadCSV}
              className={cn(
                'inline-flex items-center gap-2 font-mono text-[12px] font-medium rounded-md px-3 py-2.5 border transition-all duration-200',
                downloaded === 'csv'
                  ? 'bg-success border-success text-white'
                  : 'border-accent-indigo text-accent-indigo hover:bg-accent-indigo hover:text-white'
              )}
            >
              {downloaded === 'csv' ? (
                <>
                  <Check size={14} />
                  CSV
                </>
              ) : (
                'Download CSV'
              )}
            </button>
          </DownloadCard>

          {/* C. Complete Bundle Card */}
          <DownloadCard
            icon={<FileArchive size={20} className="text-accent-gold" />}
            title="Complete Research Bundle"
            description="Download all formats (JSON network graph, BibTeX bibliography, and CSV table) in one action."
            delay={0.16}
          >
            <button
              onClick={downloadBundle}
              className={cn(
                'inline-flex items-center gap-2 font-mono text-[12px] font-medium rounded-md px-4 py-2.5 border transition-all duration-200',
                downloaded === 'bundle'
                  ? 'bg-success border-success text-white'
                  : 'bg-accent-gold border-accent-gold text-accent-indigo hover:bg-accent-gold-dark hover:text-white'
              )}
            >
              {downloaded === 'bundle' ? (
                <>
                  <Check size={14} />
                  Bundle Downloaded
                </>
              ) : (
                <>
                  <Download size={14} />
                  Export All (Bundle)
                </>
              )}
            </button>
          </DownloadCard>
        </div>

        {/* ── Data Transparency Statement ───── */}
        <div className="scroll-animate max-w-[900px] mx-auto">
          <div className="bg-surface-white border border-border-light rounded-lg p-space-6">
            <h4 className="heading-4 font-serif text-accent-indigo mb-space-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-accent-gold" />
              Data Transparency
            </h4>
            <div className="space-y-2">
              <p className="mono-sm text-text-secondary">
                <strong>Data mode:</strong> Keyword co-occurrence network
                (reference lists were not available from data sources)
              </p>
              <p className="mono-sm text-text-secondary">
                <strong>Completeness:</strong> 100% titles/authors/years, ~95%
                DOIs, ~90% abstracts, ~85% citation counts
              </p>
              <p className="mono-sm text-text-secondary">
                <strong>Edge type:</strong> Keyword Jaccard similarity + author
                overlap + year proximity + journal match
              </p>
              <p className="mono-sm text-text-secondary">
                <strong>Integrity:</strong> No papers or edges were invented —
                all data comes from real Google Scholar and arXiv searches
              </p>
              <p className="mono-sm text-text-tertiary mt-space-3 pt-space-3 border-t border-border-light">
                Network: 244 papers · 9 schools · 21,285 connections · 1994–2026
                · Modularity Q = 0.08 (Louvain)
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
