import { useState, useEffect } from 'react';
import { X, Bookmark, Trash2, Download, Copy, Check, ExternalLink } from 'lucide-react';
import { useLiteratureMap, type NetworkNode } from '@/context/LiteratureMapContext';

interface SavedPapersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SavedPapersModal({ isOpen, onClose }: SavedPapersModalProps) {
  const { networkData } = useLiteratureMap();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('litmap_saved_papers');
      setSavedIds(raw ? JSON.parse(raw) : []);
    } catch {
      setSavedIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter matching papers from current networkData nodes
  const savedPapers: NetworkNode[] = networkData.nodes.filter((n) => savedIds.includes(n.id));

  const handleRemove = (id: string) => {
    const updated = savedIds.filter((item) => item !== id);
    setSavedIds(updated);
    try {
      localStorage.setItem('litmap_saved_papers', JSON.stringify(updated));
    } catch {}
  };

  const handleClearAll = () => {
    if (confirm('Clear all saved papers from your reading list?')) {
      setSavedIds([]);
      try {
        localStorage.removeItem('litmap_saved_papers');
      } catch {}
    }
  };

  const generateBibTeXAll = () => {
    return savedPapers
      .map((p) => {
        const authorStr = Array.isArray(p.authors) ? p.authors.join(', ') : (p.authors || 'Unknown');
        const firstAuth =
          authorStr
            .split(',')[0]
            .split(' ')
            .pop()
            ?.replace(/[^a-zA-Z]/g, '')
            .toLowerCase() || 'paper';
        const key = `${firstAuth}${p.year || 2024}`;
        return `@article{${key},
  title = {${(p.title || '').replace(/[{}]/g, '')}},
  author = {${authorStr.replace(/[{}]/g, '')}},
  year = {${p.year}},
  journal = {${(p.journal || 'Academic Publication').replace(/[{}]/g, '')}},
  doi = {${p.doi || ''}}
}`;
      })
      .join('\n\n');
  };

  const handleCopyBibTeXAll = () => {
    if (!navigator.clipboard || savedPapers.length === 0) return;
    navigator.clipboard.writeText(generateBibTeXAll());
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadBibTeX = () => {
    if (savedPapers.length === 0) return;
    const bib = generateBibTeXAll();
    const blob = new Blob([bib], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab_reading_list_${savedPapers.length}_papers.bib`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0B0D17] border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-star-gold/15 text-star-gold">
              <Bookmark size={18} className="fill-star-gold" />
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl text-white font-bold">
                Lab Reading List
              </h3>
              <p className="font-mono text-[11px] sm:text-xs text-white/60">
                {savedPapers.length} {savedPapers.length === 1 ? 'paper' : 'papers'} bookmarked for review
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Toolbar */}
        {savedPapers.length > 0 && (
          <div className="px-4 sm:px-6 py-2.5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleCopyBibTeXAll}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-mono text-[10px] sm:text-[11px] border border-white/20 bg-white/5 hover:bg-white/10 text-white/90 transition-colors cursor-pointer"
                title="Copy all BibTeX references to clipboard"
              >
                {copiedAll ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedAll ? 'All Copied!' : 'Copy BibTeX'}</span>
              </button>

              <button
                onClick={handleDownloadBibTeX}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md font-mono text-[10px] sm:text-[11px] border border-[#D4A853]/50 bg-[#D4A853]/15 text-[#D4A853] hover:bg-[#D4A853]/25 transition-colors cursor-pointer"
                title="Download .bib file for Overleaf / LaTeX"
              >
                <Download size={12} />
                <span>Export .bib</span>
              </button>
            </div>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-red-400/70 hover:text-red-400 transition-colors cursor-pointer px-2 py-1"
            >
              <Trash2 size={12} />
              <span>Clear list</span>
            </button>
          </div>
        )}

        {/* Paper List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-3">
          {savedPapers.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark size={36} className="mx-auto text-white/20 mb-3" />
              <h4 className="font-serif text-lg text-white/80">No papers saved yet</h4>
              <p className="font-mono text-xs text-white/50 max-w-sm mx-auto mt-1">
                Explore the 3D constellation, click on any paper node, and click &ldquo;Save Paper&rdquo; to build your research reading list.
              </p>
            </div>
          ) : (
            savedPapers.map((paper) => (
              <div
                key={paper.id}
                className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex items-start justify-between gap-3 sm:gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-serif text-[15px] text-white font-medium leading-snug">
                    {paper.title}
                  </h4>
                  <p className="font-mono text-[11px] text-white/60 mt-1 truncate">
                    {paper.authors}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {paper.year}
                    </span>
                    <span className="font-mono text-[10px] text-white/50 italic truncate max-w-[200px]">
                      {paper.journal || 'Academic Paper'}
                    </span>
                    <span className="font-mono text-[10px] text-[#D4A853]">
                      {(paper.citations || 0).toLocaleString()} cites
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-1">
                  <a
                    href={
                      paper.link_url ||
                      (paper.doi
                        ? `https://doi.org/${paper.doi}`
                        : `https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    title="Open paper link / DOI"
                  >
                    <ExternalLink size={14} />
                  </a>

                  <button
                    onClick={() => handleRemove(paper.id)}
                    className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Remove from saved list"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
