import { useState, useMemo, useCallback, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import { getCommunityColor } from '@/lib/colors';
import {
  type EnrichedPaper,
  type SortKey,
  type SortDir,
  MODALITIES,
  SCHOOL_NAMES,
  SCHOOL_ABBR,
} from '@/components/evidence/types';
import { enrichPapers, safeKeywords } from '@/components/evidence/evidenceEnrichment';
import {
  QualityFlagPill,
  ModalityPill,
  SampleSizeBadge,
  SortIndicator,
} from '@/components/evidence/EvidencePills';
import { PaperSideDrawer } from '@/components/evidence/PaperSideDrawer';

const ITEMS_PER_PAGE = 25;


/* ===================================================================== */
/*  Main Component                                                     */
/* ===================================================================== */
export default function EvidenceSection() {
  const { config, networkData, analysisData, evidenceSchoolFilter } = useLiteratureMap();
  const sectionRef = useScrollAnimation<HTMLElement>();

  const allPapers: EnrichedPaper[] = useMemo(() => {
    const rawNodes = networkData?.nodes || [];
    const normalized = rawNodes.map((node: any) => ({
      ...node,
      authors: Array.isArray(node.authors)
        ? node.authors
        : typeof node.authors === 'string'
        ? node.authors.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      keywords: safeKeywords(node),
    }));
    return enrichPapers(normalized);
  }, [networkData]);

  const facetsList = useMemo(() => {
    return config.facets && config.facets.length > 0 ? config.facets : MODALITIES;
  }, [config]);
  const facetLabel = config.primaryFacetName || 'Modality';

  const schoolsList = useMemo(() => {
    if (analysisData?.communities && Object.keys(analysisData.communities).length > 0) {
      return Object.entries(analysisData.communities).map(([id, comm]) => ({
        id: Number(id),
        name: comm.name,
        short: comm.name.length > 16 ? comm.name.slice(0, 15) + '...' : comm.name,
      }));
    }
    if (config?.schools && config.schools.length > 0) {
      return config.schools.map((s, idx) => ({
        id: s.id ?? idx,
        name: s.name,
        short: s.name.length > 16 ? s.name.slice(0, 15) + '...' : s.name,
      }));
    }
    return Object.entries(SCHOOL_NAMES).map(([id, name]) => ({
      id: Number(id),
      name,
      short: SCHOOL_ABBR[Number(id)] || name,
    }));
  }, [analysisData, config.schools]);

  const schoolNameMap = useMemo(() => {
    const m: Record<number, string> = {};
    schoolsList.forEach((s) => {
      m[s.id] = s.short;
    });
    return m;
  }, [schoolsList]);

  const corpusYears = useMemo(() => {
    const list = allPapers.map((p) => p.year).filter((y) => y > 1800);
    return {
      min: list.length > 0 ? Math.min(...list) : 1990,
      max: list.length > 0 ? Math.max(...list) : 2026,
    };
  }, [allPapers]);

  /* ---- filter state ---- */
  const [search, setSearch] = useState('');
  const [selectedSchools, setSelectedSchools] = useState<Set<number>>(new Set());
  const [selectedModalities, setSelectedModalities] = useState<Set<string>>(new Set());
  const [yearMin, setYearMin] = useState(1990);
  const [yearMax, setYearMax] = useState(2026);

  useEffect(() => {
    setYearMin(corpusYears.min);
    setYearMax(corpusYears.max);
  }, [corpusYears]);

  useEffect(() => {
    if (evidenceSchoolFilter !== null && evidenceSchoolFilter !== undefined) {
      setSelectedSchools(new Set([evidenceSchoolFilter]));
      setPage(1);
    }
  }, [evidenceSchoolFilter]);
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [qualityFilter, setQualityFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all');
  const [selectedPaper, setSelectedPaper] = useState<EnrichedPaper | null>(null);

  const [savedPaperIds, setSavedPaperIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('litmap_saved_papers') || '[]');
    } catch {
      return [];
    }
  });

  const handleToggleSave = useCallback((paperId: string) => {
    setSavedPaperIds((prev) => {
      const isSaved = prev.includes(paperId);
      const next = isSaved ? prev.filter((id) => id !== paperId) : [...prev, paperId];
      try {
        localStorage.setItem('litmap_saved_papers', JSON.stringify(next));
        window.dispatchEvent(new Event('storage'));
      } catch {}
      return next;
    });
  }, []);

  const handleAskAiCopilot = useCallback((p: EnrichedPaper) => {
    window.dispatchEvent(new CustomEvent('open-ai-copilot', { detail: { paper: p } }));
  }, []);

  /* ---- callbacks ---- */
  const toggleSchool = useCallback((id: number) => {
    setSelectedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setPage(1);
  }, []);

  const toggleModality = useCallback((m: string) => {
    setSelectedModalities((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
    setPage(1);
  }, []);

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir(key === 'author' ? 'asc' : 'desc');
      return key;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedSchools(new Set());
    setSelectedModalities(new Set());
    setYearMin(1990);
    setYearMax(2026);
    setQualityFilter('all');
    setPage(1);
  }, []);

  /* ---- filtered & sorted data ---- */
  const filtered = useMemo(() => {
    let rows = [...allPapers];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (Array.isArray(p.authors) ? p.authors.some((a) => a.toLowerCase().includes(q)) : p.authors.toLowerCase().includes(q)) ||
          p.abstract.toLowerCase().includes(q) ||
          p.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }

    // School
    if (selectedSchools.size > 0) {
      rows = rows.filter((p) => selectedSchools.has(p.community));
    }

    // Modality
    if (selectedModalities.size > 0) {
      rows = rows.filter((p) => selectedModalities.has(p.modality));
    }

    // Year
    rows = rows.filter((p) => p.year >= yearMin && p.year <= yearMax);

    // Quality
    if (qualityFilter !== 'all') {
      rows = rows.filter((p) => p.quality === qualityFilter);
    }

    // Sort
    rows.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'year') cmp = a.year - b.year;
      else if (sortKey === 'citations') cmp = a.citations - b.citations;
      else cmp = (a.authors[0] || '').localeCompare(b.authors[0] || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [allPapers, search, selectedSchools, selectedModalities, yearMin, yearMax, sortKey, sortDir, qualityFilter]);

  /* ---- pagination ---- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const authorYear = (p: EnrichedPaper) => {
    const first = p.authors[0] || 'Unknown';
    const surname = first.includes(' ') ? first.split(' ').pop() : first;
    return `${surname} et al. ${p.year}`;
  };

  return (
    <section
      id="evidence"
      ref={sectionRef}
      role="region"
      aria-label="Evidence Table and Synthesis"
      className="w-full bg-warm-gray py-space-24"
    >
      <div className="section-container">
        {/* ---- Header ---- */}
        <div className="scroll-animate mb-space-6">
          <span className="label text-accent-gold tracking-[0.08em]">ANALYSIS 08</span>
        </div>
        <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-4">
          Evidence Table
        </h2>
        <p className="scroll-animate body-lg text-text-secondary mb-space-8 max-w-3xl">
          Comprehensive synthesis and evidence audit across {allPapers.length} publications in {config.domain}.
        </p>

        {/* ---- Filter Bar ---- */}
        <div className="scroll-animate bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-4 md:p-space-5 mb-space-6 space-y-space-4">
          {/* Row 1: Search + Quality + Clear */}
          <div className="flex flex-col md:flex-row gap-space-3 items-start md:items-center">
            <div className="relative flex-1 w-full md:w-auto">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search author, title, keyword..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-border-light bg-surface-elevated font-mono text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-indigo transition-colors"
              />
            </div>

            <select
              value={qualityFilter}
              onChange={(e) => { setQualityFilter(e.target.value as typeof qualityFilter); setPage(1); }}
              className="px-3 py-2 rounded-md border border-border-light bg-surface-elevated font-mono text-[12px] text-text-primary focus:outline-none focus:border-accent-indigo cursor-pointer"
            >
              <option value="all">All Quality</option>
              <option value="green">Good</option>
              <option value="yellow">Moderate</option>
              <option value="red">Limited</option>
            </select>

            <button
              onClick={clearFilters}
              className="font-mono text-[11px] text-accent-indigo hover:text-accent-gold transition-colors px-2 py-2"
            >
              Clear all
            </button>
          </div>

          {/* Row 2: School checkboxes */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-[11px] text-text-tertiary mr-1">School:</span>
            {schoolsList.map((s) => {
              const active = selectedSchools.has(s.id);
              const color = getCommunityColor(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSchool(s.id)}
                  className={[
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] transition-all',
                    active
                      ? 'border-accent-indigo bg-accent-indigo text-white'
                      : 'border-border-light bg-surface-elevated text-text-secondary hover:border-border-medium',
                  ].join(' ')}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: color }}
                  />
                  {s.short}
                </button>
              );
            })}
          </div>

          {/* Row 3: Facet / Modality checkboxes */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-[11px] text-text-tertiary mr-1">{facetLabel}:</span>
            {facetsList.map((m) => {
              const active = selectedModalities.has(m);
              return (
                <button
                  key={m}
                  onClick={() => toggleModality(m)}
                  className={[
                    'px-2.5 py-1 rounded-md border font-mono text-[10px] transition-all',
                    active
                      ? 'border-accent-indigo bg-accent-indigo text-white'
                      : 'border-border-light bg-surface-elevated text-text-secondary hover:border-border-medium',
                  ].join(' ')}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Row 4: Year range */}
          <div className="flex flex-wrap items-center gap-space-3">
            <span className="font-mono text-[11px] text-text-tertiary">Year:</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1990}
                max={2026}
                value={yearMin}
                onChange={(e) => { setYearMin(Math.min(parseInt(e.target.value), yearMax)); setPage(1); }}
                className="w-[100px] accent-accent-indigo"
              />
              <span className="font-mono text-[11px] text-text-secondary w-10 text-center">{yearMin}</span>
              <span className="text-text-tertiary">–</span>
              <input
                type="range"
                min={1990}
                max={2026}
                value={yearMax}
                onChange={(e) => { setYearMax(Math.max(parseInt(e.target.value), yearMin)); setPage(1); }}
                className="w-[100px] accent-accent-indigo"
              />
              <span className="font-mono text-[11px] text-text-secondary w-10 text-center">{yearMax}</span>
            </div>
          </div>

          {/* Active filter count & Side Inspector hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-text-tertiary">
            <span>Showing {filtered.length} of {allPapers.length} papers</span>
            <span className="text-accent-gold font-medium flex items-center gap-1.5 bg-[#D4A853]/10 px-2 py-0.5 rounded border border-[#D4A853]/20">
              <Eye size={12} />
              <span>Click any paper row to open details in side panel</span>
            </span>
          </div>
        </div>

        {/* ---- Table & Mobile Card Stack ---- */}
        <div className="scroll-animate bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] overflow-hidden">
          {/* Mobile Card Stack View (< md) */}
          <div className="block md:hidden divide-y divide-border-light bg-surface-white">
            {paginated.map((paper, idx) => {
              const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
              const authorStr = Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors;
              const isSelected = selectedPaper?.id === paper.id;
              return (
                <div
                  key={paper.id}
                  onClick={() => setSelectedPaper(paper)}
                  className={[
                    'p-4 space-y-3 transition-all cursor-pointer active:bg-[rgba(212,168,83,0.08)]',
                    isSelected
                      ? 'bg-[rgba(212,168,83,0.10)] border-l-4 border-l-[#D4A853]'
                      : 'hover:bg-[#FAFAF7]',
                  ].join(' ')}
                >
                  {/* Row 1: Index, School badge, Year, Citations */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-text-tertiary font-bold">#{globalIdx}</span>
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] border font-medium"
                        style={{
                          borderColor: `${getCommunityColor(paper.community)}40`,
                          backgroundColor: `${getCommunityColor(paper.community)}15`,
                          color: getCommunityColor(paper.community),
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: getCommunityColor(paper.community) }}
                        />
                        {schoolNameMap[paper.community] || `School ${paper.community}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-text-secondary">{paper.year}</span>
                      <span className="text-text-tertiary">·</span>
                      <span className="text-accent-gold font-bold">{paper.citations.toLocaleString()} cites</span>
                    </div>
                  </div>

                  {/* Row 2: Title */}
                  <h4 className="font-serif text-[15px] font-bold text-accent-indigo leading-snug hover:text-accent-gold transition-colors">
                    {paper.title}
                  </h4>

                  {/* Row 3: Authors & Journal */}
                  <p className="font-mono text-[11px] text-text-secondary line-clamp-2">
                    {authorStr}
                  </p>
                  {paper.journal && (
                    <p className="font-mono text-[10px] text-text-tertiary italic">
                      {paper.journal}
                    </p>
                  )}

                  {/* Row 4: Modality, Sample Size, Quality */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <ModalityPill modality={paper.modality} />
                    <SampleSizeBadge paper={paper} />
                    <QualityFlagPill quality={paper.quality} label={paper.qualityLabel} />
                  </div>

                  {/* Row 5: Key Findings & Limitations */}
                  {paper.keyFindings && (
                    <div className="p-2.5 rounded bg-surface-elevated border border-border-light text-[11px] space-y-1.5">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary font-bold block mb-0.5">Key Findings:</span>
                        <p className="text-text-primary leading-relaxed">{paper.keyFindings}</p>
                      </div>
                      {paper.limitations && (
                        <div className="pt-1.5 border-t border-border-light/60">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary font-bold block mb-0.5">Limitations:</span>
                          <p className="text-text-secondary italic leading-relaxed">{paper.limitations}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 6: Outlink & Inspect Action */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border-light/40">
                    <div className="flex items-center gap-2">
                      <a
                        href={
                          paper.doi
                            ? `https://doi.org/${paper.doi}`
                            : `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-accent-indigo hover:text-accent-gold underline cursor-pointer"
                      >
                        <span>{paper.doi ? 'View Paper (DOI)' : 'Google Scholar'}</span>
                        <span>↗</span>
                      </a>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPaper(paper);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-mono text-[11px] bg-accent-indigo text-white hover:bg-accent-indigo-light transition-colors cursor-pointer shadow-xs"
                    >
                      <Eye size={12} />
                      <span>Inspect Paper →</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {paginated.length === 0 && (
              <div className="text-center py-10 font-mono text-xs text-text-tertiary">
                No papers match the current filters.
              </div>
            )}
          </div>

          {/* Desktop & Tablet Table View (md+) */}
          <div className="hidden md:block overflow-x-auto max-h-[800px]">
            <table className="w-full min-w-[960px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface-elevated border-b-2 border-border-medium">
                  <th className="text-left px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo w-[40px]">#</th>
                  <th
                    className="text-left px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo cursor-pointer hover:text-accent-gold transition-colors w-[180px]"
                    onClick={() => handleSort('author')}
                  >
                    Author-Year
                    <SortIndicator active={sortKey === 'author'} dir={sortDir} />
                  </th>
                  <th className="text-left px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo w-[110px]">School</th>
                  <th className="text-left px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo w-[90px]">{facetLabel}</th>
                  <th
                    className="text-right px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo cursor-pointer hover:text-accent-gold transition-colors w-[60px]"
                    onClick={() => handleSort('year')}
                  >
                    Year
                    <SortIndicator active={sortKey === 'year'} dir={sortDir} />
                  </th>
                  <th
                    className="text-right px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo cursor-pointer hover:text-accent-gold transition-colors w-[70px]"
                    onClick={() => handleSort('citations')}
                  >
                    Citations
                    <SortIndicator active={sortKey === 'citations'} dir={sortDir} />
                  </th>
                  <th className="text-left px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo w-[50px]">N</th>
                  <th className="text-left px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo w-[26%]">Key Findings</th>
                  <th className="text-left px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo w-[18%]">Limitations</th>
                  <th className="text-left px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo w-[80px]">Quality</th>
                  <th className="text-center px-3 py-3 font-mono text-[11px] uppercase tracking-[0.04em] text-accent-indigo w-[75px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((paper, idx) => {
                  const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isSelected = selectedPaper?.id === paper.id;
                  return (
                    <tr
                      key={paper.id}
                      onClick={() => setSelectedPaper(paper)}
                      className={[
                        'border-b border-border-light transition-all duration-150 cursor-pointer group',
                        idx % 2 === 1 ? 'bg-[#FAFAF7]' : 'bg-surface-white',
                        isSelected
                          ? 'bg-[rgba(212,168,83,0.12)] border-l-4 border-l-[#D4A853]'
                          : 'hover:bg-[rgba(212,168,83,0.06)]',
                      ].join(' ')}
                      title="Click row to open details in side inspector"
                    >
                      <td className="px-3 py-2.5 font-mono text-[11px] text-text-tertiary">{globalIdx}</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-accent-indigo font-medium group-hover:text-accent-gold transition-colors">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span>{authorYear(paper)}</span>
                          <Eye size={12} className="opacity-0 group-hover:opacity-100 text-accent-gold transition-opacity shrink-0" />
                        </div>
                        <div className="font-serif text-[11px] text-text-secondary truncate max-w-[170px] font-normal" title={paper.title}>
                          {paper.title}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: getCommunityColor(paper.community) }}
                          />
                          <span className="font-mono text-[10px] text-text-secondary">{schoolNameMap[paper.community] || `School ${paper.community}`}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <ModalityPill modality={paper.modality} />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-text-secondary text-right">{paper.year}</td>
                      <td className="px-3 py-2.5 font-mono text-[12px] text-text-secondary text-right">
                        {paper.citations.toLocaleString()}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <SampleSizeBadge paper={paper} />
                      </td>
                      <td className="px-3 py-2.5 body-sm text-text-primary leading-snug max-w-[280px]">
                        {paper.keyFindings}
                      </td>
                      <td className="px-3 py-2.5 body-sm text-text-tertiary italic leading-snug max-w-[200px]">
                        {paper.limitations}
                      </td>
                      <td className="px-3 py-2.5">
                        <QualityFlagPill quality={paper.quality} label={paper.qualityLabel} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPaper(paper);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10px] text-accent-indigo bg-surface-elevated group-hover:bg-[#D4A853]/20 group-hover:text-accent-gold border border-border-light transition-all cursor-pointer shadow-xs"
                          title="Open side inspector"
                        >
                          <Eye size={11} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-space-12 font-mono text-text-tertiary">
                      No papers match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          {/* ---- Pagination ---- */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border-light bg-surface-elevated">
            <span className="font-mono text-[11px] text-text-tertiary">
              Page {currentPage} of {totalPages} ({filtered.length} papers)
            </span>
            <div className="flex items-center gap-1 flex-wrap justify-center">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded font-mono text-[11px] border border-border-light bg-surface-white text-text-secondary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {'<<'}
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded font-mono text-[11px] border border-border-light bg-surface-white text-text-secondary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {'<'}
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pg: number;
                if (totalPages <= 5) pg = i + 1;
                else if (currentPage <= 3) pg = i + 1;
                else if (currentPage >= totalPages - 2) pg = totalPages - 4 + i;
                else pg = currentPage - 2 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={[
                      'w-7 h-7 rounded font-mono text-[11px] transition-colors',
                      pg === currentPage
                        ? 'bg-accent-indigo text-white'
                        : 'border border-border-light bg-surface-white text-text-secondary hover:bg-surface-elevated',
                    ].join(' ')}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded font-mono text-[11px] border border-border-light bg-surface-white text-text-secondary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {'>'}
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded font-mono text-[11px] border border-border-light bg-surface-white text-text-secondary hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {'>>'}
              </button>
            </div>
          </div>
        </div>

        {/* ---- Meta-analytic Subset Note ---- */}
        <div className="scroll-animate mt-space-6 bg-[#F4F2EC] border border-[#E7E3DB] rounded-[4px] p-space-5">
          <p className="body-sm text-text-tertiary text-center">
            No formal meta-analysis subset was identified in this corpus. Meta-analytic quality tools (ROB-2, GRADE, funnel plots) would require a focused systematic review with effect-size extraction.
          </p>
        </div>
      </div>

      {/* ---- Slide-Over Paper Side Drawer (Inspector Panel) ---- */}
      {selectedPaper && (
        <PaperSideDrawer
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
          schoolName={schoolNameMap[selectedPaper.community] || `School ${selectedPaper.community}`}
          onFilterToSchool={(schoolId) => {
            setSelectedSchools(new Set([schoolId]));
            setPage(1);
          }}
          isSaved={savedPaperIds.includes(selectedPaper.id)}
          onToggleSave={handleToggleSave}
          onAskAiCopilot={handleAskAiCopilot}
        />
      )}
    </section>
  );
}

