import { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  Sparkles,
  Quote,
  Filter,
  Award,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { getCommunityColor } from '@/lib/colors';
import type { EnrichedPaper } from './types';

export interface PaperSideDrawerProps {
  paper: EnrichedPaper;
  onClose: () => void;
  schoolName: string;
  onFilterToSchool?: (schoolId: number) => void;
  isSaved: boolean;
  onToggleSave: (paperId: string) => void;
  onAskAiCopilot: (paper: EnrichedPaper) => void;
}

export function PaperSideDrawer({
  paper,
  onClose,
  schoolName,
  onFilterToSchool,
  isSaved,
  onToggleSave,
  onAskAiCopilot,
}: PaperSideDrawerProps) {
  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedApa, setCopiedApa] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const authorStr = Array.isArray(paper.authors)
    ? paper.authors.join(', ')
    : paper.authors || 'Unknown';
  const communityColor = getCommunityColor(paper.community);

  const handleCopyBib = () => {
    if (!navigator.clipboard) return;
    const firstAuth = (Array.isArray(paper.authors) ? paper.authors[0] : paper.authors || 'paper')
      .split(' ')
      .pop()
      ?.replace(/[^a-zA-Z]/g, '')
      .toLowerCase() || 'paper';
    const bibKey = `${firstAuth}${paper.year || 2024}`;
    const bib = `@article{${bibKey},\n  title = {${(paper.title || '').replace(
      /[{}]/g,
      ''
    )}},\n  author = {${authorStr}},\n  year = {${paper.year}},\n  journal = {${
      paper.journal || 'Academic Publication'
    }},\n  doi = {${paper.doi || ''}}\n}`;
    navigator.clipboard.writeText(bib);
    setCopiedBib(true);
    setTimeout(() => setCopiedBib(false), 2000);
  };

  const handleCopyApa = () => {
    if (!navigator.clipboard) return;
    const apa = `${authorStr} (${paper.year}). ${paper.title}. ${
      paper.journal ? `${paper.journal}. ` : ''
    }${paper.doi ? `https://doi.org/${paper.doi}` : ''}`;
    navigator.clipboard.writeText(apa);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paper-drawer-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:w-[480px] md:w-[540px] h-full bg-[#090A12] border-l border-white/15 text-[#FAF9F6] shadow-2xl flex flex-col overflow-hidden animate-slide-in-right relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0E101D]/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold border"
              style={{
                borderColor: `${communityColor}50`,
                backgroundColor: `${communityColor}20`,
                color: communityColor,
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: communityColor }}
                aria-hidden="true"
              />
              {schoolName}
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/70">
              {paper.year}
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#D4A853]/20 text-[#D4A853] font-bold">
              {paper.citations.toLocaleString()} cites
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close inspector"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Paper Title */}
          <div>
            <h2
              id="paper-drawer-title"
              className="font-serif text-xl sm:text-2xl text-white font-bold leading-snug tracking-tight"
            >
              {paper.title}
            </h2>
            <p className="font-mono text-[12px] text-white/70 mt-2.5 leading-relaxed">
              {authorStr}
            </p>
            {paper.journal && (
              <p className="font-mono text-[11px] text-[#D4A853] mt-1 italic">{paper.journal}</p>
            )}
          </div>

          {/* Modality, Sample Size, Quality Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/40 font-semibold mr-1">
              Methodology:
            </span>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
              {paper.modality}
            </span>
            {paper.sampleSize && (
              <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                N = {paper.sampleSize}
              </span>
            )}
            <span
              className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border ${
                paper.quality === 'green'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : paper.quality === 'yellow'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              Quality: {paper.qualityLabel}
            </span>
          </div>

          {/* Quick Academic Actions */}
          <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 space-y-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 block font-semibold">
              Scholarly Actions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={handleCopyBib}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors cursor-pointer"
                title="Copy BibTeX citation"
                aria-label="Copy BibTeX citation"
              >
                {copiedBib ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copiedBib ? 'Copied!' : 'BibTeX'}</span>
              </button>

              <button
                onClick={handleCopyApa}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors cursor-pointer"
                title="Copy APA citation"
                aria-label="Copy APA citation"
              >
                {copiedApa ? <Check size={13} className="text-emerald-400" /> : <Quote size={13} />}
                <span>{copiedApa ? 'Copied!' : 'APA'}</span>
              </button>

              <button
                onClick={() => onToggleSave(paper.id)}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] border transition-colors cursor-pointer ${
                  isSaved
                    ? 'border-[#D4A853] bg-[#D4A853]/20 text-[#D4A853]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                }`}
                title="Bookmark paper in reading list"
                aria-label={isSaved ? 'Remove from saved reading list' : 'Bookmark paper'}
              >
                <Bookmark size={13} className={isSaved ? 'fill-[#D4A853]' : ''} />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              <button
                onClick={() => onAskAiCopilot(paper)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-md font-mono text-[11px] bg-[#D4A853]/15 hover:bg-[#D4A853]/25 text-[#D4A853] border border-[#D4A853]/30 transition-colors cursor-pointer font-medium"
                title="Ask AI Copilot to analyze this paper"
                aria-label="Ask AI Copilot to analyze this paper"
              >
                <Sparkles size={13} />
                <span>AI Analyze</span>
              </button>
            </div>
          </div>

          {/* Key Findings Card */}
          {paper.keyFindings && (
            <div className="p-4 rounded-lg bg-[#D4A853]/[0.08] border border-[#D4A853]/30 space-y-1.5">
              <div className="flex items-center gap-2 text-[#D4A853]">
                <Award size={15} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                  Core Empirical Finding
                </span>
              </div>
              <p className="text-[13px] text-white/90 leading-relaxed font-sans">
                {paper.keyFindings}
              </p>
            </div>
          )}

          {/* Limitations & Caveats */}
          {paper.limitations && (
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 space-y-1.5">
              <div className="flex items-center gap-2 text-white/60">
                <AlertCircle size={14} className="text-amber-400" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300/90">
                  Methodological Boundary & Caveats
                </span>
              </div>
              <p className="text-[12px] text-white/70 italic leading-relaxed font-sans">
                {paper.limitations}
              </p>
            </div>
          )}

          {/* Full Abstract */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/80">
              <FileText size={15} className="text-[#D4A853]" />
              <h3 className="font-mono text-[11px] uppercase tracking-wider font-bold">Abstract</h3>
            </div>
            <div className="p-4 rounded-lg bg-black/40 border border-white/10 max-h-[220px] overflow-y-auto">
              <p className="font-sans text-[13px] text-white/80 leading-relaxed whitespace-pre-line">
                {paper.abstract || 'No abstract text available in current OpenAlex corpus record.'}
              </p>
            </div>
          </div>

          {/* Keywords / Concepts */}
          {paper.keywords && paper.keywords.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 block font-semibold">
                Extracted Topics & Concepts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {paper.keywords.map((kw, i) => (
                  <span
                    key={`${kw}-${i}`}
                    className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-white/80 bg-white/5"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scholarly Outlinks */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 block font-semibold">
              External Scholarly Access
            </span>
            <div className="flex flex-wrap gap-2">
              {paper.doi && (
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] bg-[#D4A853]/20 text-[#D4A853] hover:bg-[#D4A853]/30 border border-[#D4A853]/40 transition-colors"
                >
                  <ExternalLink size={12} />
                  <span>Publisher DOI ↗</span>
                </a>
              )}
              <a
                href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <ExternalLink size={12} />
                <span>Google Scholar ↗</span>
              </a>
              {paper.id && (
                <a
                  href={
                    paper.id.startsWith('http')
                      ? paper.id
                      : `https://openalex.org/works/${paper.id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[11px] bg-white/5 text-white/80 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <ExternalLink size={12} />
                  <span>OpenAlex Record ↗</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-white/10 bg-[#0E101D]/90 backdrop-blur flex items-center justify-between gap-3 shrink-0">
          {onFilterToSchool && (
            <button
              onClick={() => onFilterToSchool(paper.community)}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#D4A853] hover:underline cursor-pointer"
            >
              <Filter size={12} />
              <span>Filter table to this School</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-1.5 rounded-md font-mono text-[11px] bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
