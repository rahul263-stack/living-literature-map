import { useState, useMemo } from 'react';
import { X, ExternalLink, BookOpen, Layers, TableProperties, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import { getCommunityColor } from '@/lib/colors';

export interface SchoolModalData {
  id: number;
  commId: number;
  name: string;
  papers: number;
  citations: string;
  keyFigures: string;
  tags: string[];
  description: string;
  yearRange: string;
}

interface SchoolExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: SchoolModalData | null;
}

export default function SchoolExplorerModal({ isOpen, onClose, school }: SchoolExplorerModalProps) {
  const { networkData, setFocusedSchool, setEvidenceSchoolFilter } = useLiteratureMap();
  const [expandedAbstractId, setExpandedAbstractId] = useState<string | null>(null);

  const schoolPapers = useMemo(() => {
    if (!school || !networkData?.nodes) return [];
    return networkData.nodes
      .filter((n) => n.community === school.commId)
      .sort((a, b) => (b.citations || 0) - (a.citations || 0));
  }, [school, networkData]);

  if (!isOpen || !school) return null;

  const color = getCommunityColor(school.commId);

  const handleFocusIn3D = () => {
    setFocusedSchool(school.commId);
    onClose();
    const heroEl = document.getElementById('hero') || document.getElementById('constellation');
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterEvidence = () => {
    setEvidenceSchoolFilter(school.commId);
    onClose();
    const evidenceEl = document.getElementById('evidence');
    if (evidenceEl) {
      evidenceEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0D0F18] border border-white/20 rounded-2xl p-5 sm:p-7 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `5px solid ${color}` }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/10"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="pr-8 mb-5 shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-block w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/60">
              Louvain Community #{school.commId} &bull; {school.papers} Papers &bull; {school.citations} Citations
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-white font-bold tracking-tight">
            {school.name}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-[11px] text-white/70">
            <span className="px-2 py-0.5 rounded bg-white/10 text-[#D4A853]">
              Active span: {school.yearRange}
            </span>
            <span>&bull;</span>
            <span className="text-white/60">Key figures: {school.keyFigures}</span>
          </div>
        </div>

        {/* Description & Narrative */}
        <div className="mb-4 p-3.5 rounded-lg bg-white/[0.04] border border-white/10 shrink-0">
          <p className="font-mono text-xs text-white/80 leading-relaxed">
            {school.description}
          </p>
          {school.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-white/10">
              {school.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/15"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pb-4 mb-3 border-b border-white/10 shrink-0">
          <button
            onClick={handleFocusIn3D}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-semibold bg-[#D4A853] text-[#0A0B10] hover:bg-[#E5BC64] transition-all cursor-pointer shadow-sm"
          >
            <Layers size={14} />
            <span>Focus in 3D Constellation</span>
          </button>

          <button
            onClick={handleFilterEvidence}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-medium bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer border border-white/15"
          >
            <TableProperties size={14} className="text-[#D4A853]" />
            <span>Isolate in Evidence Table</span>
          </button>
        </div>

        {/* Papers Section (Scrollable) */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-3">
          <div className="flex items-center justify-between sticky top-0 bg-[#0D0F18]/95 backdrop-blur-sm py-1 z-10">
            <span className="font-mono text-[11px] uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#D4A853]" />
              Seminal Papers in this Cluster ({schoolPapers.length})
            </span>
            <span className="font-mono text-[10px] text-white/40">Sorted by Citations</span>
          </div>

          {schoolPapers.length === 0 ? (
            <div className="text-center py-8 font-mono text-xs text-white/50">
              No individual paper records indexed for this community.
            </div>
          ) : (
            schoolPapers.slice(0, 15).map((paper, idx) => {
              const isExpanded = expandedAbstractId === paper.id;
              const authorStr = Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors;
              return (
                <div
                  key={paper.id || idx}
                  className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/60">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-[11px] text-white/50">{paper.year}</span>
                        <span className="font-mono text-[10px] text-[#D4A853] bg-[#D4A853]/15 px-2 py-0.5 rounded-full font-semibold">
                          {(paper.citations || 0).toLocaleString()} cites
                        </span>
                      </div>
                      <h4 className="font-serif text-[15px] text-white font-medium leading-snug">
                        {paper.title}
                      </h4>
                      <p className="font-mono text-[11px] text-white/60 mt-1 line-clamp-1">
                        {authorStr} &bull; <span className="italic">{paper.journal || 'Journal'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Abstract Snippet */}
                  {paper.abstract && (
                    <div className="mt-2.5 pt-2 border-t border-white/5">
                      <p className={`font-mono text-[11px] text-white/70 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {paper.abstract}
                      </p>
                      {paper.abstract.length > 140 && (
                        <button
                          onClick={() => setExpandedAbstractId(isExpanded ? null : paper.id)}
                          className="flex items-center gap-1 font-mono text-[10px] text-[#D4A853] hover:underline mt-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <><span>Show less</span><ChevronUp size={11} /></>
                          ) : (
                            <><span>Read abstract</span><ChevronDown size={11} /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Scholarly Outlinks */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5 font-mono text-[10px]">
                    <a
                      href={paper.link_url || (paper.doi ? `https://doi.org/${paper.doi}` : `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-[#D4A853] transition-colors"
                    >
                      <ExternalLink size={10} />
                      <span>{paper.doi ? 'DOI Link' : 'Paper Web'}</span>
                    </a>
                    <a
                      href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                      <BookOpen size={10} />
                      <span>Google Scholar</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
