import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Bookmark,
  ExternalLink,
  BookOpen,
  Quote,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCHOOL_COLORS } from '@/lib/colors';
import type { NetworkNode } from '@/types';

export interface HeroPaperDetailOverlayProps {
  selectedNode: NetworkNode;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (paper: NetworkNode) => void;
}

function getFirstAuthor(authors: string | string[]): string {
  if (!authors) return 'Unknown';
  if (Array.isArray(authors)) return authors[0] || 'Unknown';
  return authors.split(',')[0]?.trim() || 'Unknown';
}

export function HeroPaperDetailOverlay({
  selectedNode,
  onClose,
  isSaved,
  onToggleSave,
}: HeroPaperDetailOverlayProps) {
  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedApa, setCopiedApa] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const authorsString = Array.isArray(selectedNode.authors)
    ? selectedNode.authors.join(', ')
    : selectedNode.authors;

  const handleCopyBibtex = () => {
    if (!navigator.clipboard) return;
    const firstAuth =
      getFirstAuthor(selectedNode.authors).replace(/[^a-zA-Z]/g, '').toLowerCase() || 'paper';
    const bibKey = `${firstAuth}${selectedNode.year || 2024}`;
    const bib = `@article{${bibKey},\n  title = {${selectedNode.title.replace(
      /[{}]/g,
      ''
    )}},\n  author = {${authorsString}},\n  year = {${selectedNode.year}},\n  journal = {${
      selectedNode.journal || 'Academic Paper'
    }},\n  doi = {${selectedNode.doi || ''}}\n}`;
    navigator.clipboard.writeText(bib);
    setCopiedBib(true);
    setTimeout(() => setCopiedBib(false), 2000);
  };

  const handleCopyApa = () => {
    if (!navigator.clipboard) return;
    const apa = `${authorsString} (${selectedNode.year}). ${selectedNode.title}. ${
      selectedNode.journal ? `${selectedNode.journal}. ` : ''
    }${selectedNode.doi ? `https://doi.org/${selectedNode.doi}` : ''}`;
    navigator.clipboard.writeText(apa);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  const kw = selectedNode.keywords;
  const kwList: string[] = Array.isArray(kw)
    ? kw
        .map((item: unknown) =>
          typeof item === 'string'
            ? item
            : (item as { name?: string; keyword?: string })?.name ||
              (item as { name?: string; keyword?: string })?.keyword ||
              String(item)
        )
        .map((s) => s.trim())
        .filter(Boolean)
    : typeof kw === 'string'
    ? (kw as string)
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hero-paper-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="h-auto max-h-[85vh] sm:max-h-full sm:h-full overflow-y-auto border-t sm:border-t-0 sm:border-l border-white/15 w-full sm:w-[420px] max-w-full rounded-t-2xl sm:rounded-none bg-[#080910]/95 backdrop-blur-xl relative"
        style={{ animation: 'slideIn 0.3s ease forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-4 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 z-10 transition-colors cursor-pointer"
          aria-label="Close details"
        >
          <X size={20} />
        </button>
        <div className="p-4 sm:p-6 pt-5 sm:pt-12">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="font-mono text-[10px] px-2.5 py-0.5 rounded-full border border-white/20 font-semibold"
              style={{
                backgroundColor: `${SCHOOL_COLORS[selectedNode.community] || '#D4A853'}30`,
                color: SCHOOL_COLORS[selectedNode.community] || '#D4A853',
              }}
            >
              {selectedNode.community_name || `Cluster #${selectedNode.community}`}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
              {selectedNode.year}
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#D4A853]/20 text-[#D4A853] font-bold">
              {(selectedNode.citations || 0).toLocaleString()} citations
            </span>
          </div>

          <h2
            id="hero-paper-title"
            className="font-serif text-[20px] text-white leading-snug font-medium"
          >
            {selectedNode.title}
          </h2>
          <p className="font-mono text-[11px] text-white/60 mt-2">{authorsString}</p>
          <p className="font-mono text-[10px] text-white/40 mt-1 italic">
            {selectedNode.journal || 'Peer-reviewed scientific publication'}
          </p>

          {/* Fast Academic Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={handleCopyBibtex}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
              title="Copy BibTeX reference to clipboard"
              aria-label="Copy BibTeX citation"
            >
              {copiedBib ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedBib ? 'BibTeX Copied!' : 'Copy BibTeX'}</span>
            </button>

            <button
              onClick={handleCopyApa}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
              title="Copy APA formatted reference"
              aria-label="Copy APA citation"
            >
              {copiedApa ? <Check size={12} className="text-emerald-400" /> : <Quote size={12} />}
              <span>{copiedApa ? 'APA Copied!' : 'Copy APA'}</span>
            </button>

            <button
              onClick={() => onToggleSave(selectedNode)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] border transition-colors cursor-pointer',
                isSaved
                  ? 'border-[#D4A853] bg-[#D4A853]/20 text-[#D4A853]'
                  : 'border-white/20 bg-white/5 hover:bg-white/10 text-white/80'
              )}
              title="Add to Lab Reading List"
              aria-label={isSaved ? 'Remove from saved list' : 'Bookmark paper'}
            >
              <Bookmark size={12} className={isSaved ? 'fill-[#D4A853]' : ''} />
              <span>{isSaved ? 'Saved in Lab List' : 'Save Paper'}</span>
            </button>
          </div>

          {selectedNode.abstract && (
            <div className="mt-5 overflow-y-auto" style={{ maxHeight: 300 }}>
              <p className="font-mono text-[12px] text-white/80 leading-relaxed">
                {selectedNode.abstract}
              </p>
            </div>
          )}

          {/* Keywords chips */}
          {kwList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-5">
              {kwList.map((item: string, i: number) => (
                <span
                  key={`${item}-${i}`}
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/70"
                  style={{
                    backgroundColor: `${SCHOOL_COLORS[selectedNode.community] || '#D4A853'}20`,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          {/* Scholarly Outlinks */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
            <a
              href={
                selectedNode.link_url ||
                (selectedNode.doi
                  ? `https://doi.org/${selectedNode.doi}`
                  : `https://scholar.google.com/scholar?q=${encodeURIComponent(
                      selectedNode.title + ' ' + getFirstAuthor(selectedNode.authors)
                    )}`)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-mono text-[10px] uppercase tracking-wider border border-[#D4A853] text-[#D4A853] hover:bg-[#D4A853]/20 transition-colors"
            >
              <ExternalLink size={11} />
              <span>{selectedNode.doi ? 'Open DOI / PDF' : 'Find Paper'}</span>
            </a>

            <a
              href={`https://scholar.google.com/scholar?q=${encodeURIComponent(
                selectedNode.title + ' ' + getFirstAuthor(selectedNode.authors)
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-mono text-[10px] border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <BookOpen size={11} />
              <span>Google Scholar</span>
            </a>

            <a
              href={`https://www.semanticscholar.org/search?q=${encodeURIComponent(
                selectedNode.title
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full font-mono text-[10px] border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span>Semantic Scholar</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
