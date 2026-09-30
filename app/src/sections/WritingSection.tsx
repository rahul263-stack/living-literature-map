import { useState, useCallback, useMemo, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import { SCHOOL_COLORS } from '@/lib/colors';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PaperNode {
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
}

// Safe helpers for authors field (context normalizes to string, but be defensive)
function authorsToString(authors: string | string[]): string {
  return Array.isArray(authors) ? authors.join(', ') : (authors || '');
}
function authorsToArray(authors: string | string[]): string[] {
  if (Array.isArray(authors)) return authors;
  return (authors || '').split(',').map((s) => s.trim()).filter(Boolean);
}

interface CitationSuggestion {
  paper: PaperNode;
  sharedKeywords: string[];
  score: number;
  reason: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ARGUMENT_SPINE_STEPS = [
  {
    key: 'claim' as const,
    label: 'CLAIM',
    color: '#1A1B3A',
    textColor: '#FFFFFF',
    title: 'Claim',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    key: 'evidence' as const,
    label: 'EVIDENCE',
    color: '#3B6FC4',
    textColor: '#FFFFFF',
    title: 'Evidence',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    key: 'counter' as const,
    label: 'COUNTER',
    color: '#E8A820',
    textColor: '#1A1B3A',
    title: 'Counter-Evidence',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
      </svg>
    ),
  },
  {
    key: 'gap' as const,
    label: 'GAP',
    color: '#D94040',
    textColor: '#FFFFFF',
    title: 'Gap',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    key: 'significance' as const,
    label: 'SIGNIFICANCE',
    color: '#22A559',
    textColor: '#FFFFFF',
    title: 'Why It Matters',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
  },
];

const SCHOOL_ABBR: Record<number, string> = {
  0: 'Foundations',
  1: 'fMRI/DMN',
  2: 'Structural',
  3: 'Dynamic FC',
  4: 'Clinical',
  5: 'Hubs',
  6: 'Precision',
  7: 'Methods',
  8: 'Recent',
};

const DEFAULT_FALLBACK_GAP =
  'Despite extensive foundational progress across this domain, there remains a critical lack of integrative frameworks linking specialized methodological models to broader empirical translations.';

/* ------------------------------------------------------------------ */
/*  Citation suggestion engine (graph-based, NO LLM)                  */
/* ------------------------------------------------------------------ */

function findMissingCitations(
  userRefs: string[],
  allPapers: PaperNode[]
): CitationSuggestion[] {
  if (!userRefs.length) return [];

  // Normalize user references: lowercase, trim punctuation
  const normalized = userRefs.map((r) => r.toLowerCase().replace(/[.,;]/g, '').trim()).filter(Boolean);

  // Build a set of paper IDs the user already cites
  const citedIds = new Set<string>();
  for (const norm of normalized) {
    for (const p of allPapers) {
      const matchStr = (p.title + ' ' + (Array.isArray(p.authors) ? p.authors.join(' ') : p.authors) + ' ' + p.doi + ' ' + p.year).toLowerCase();
      if (matchStr.includes(norm) || norm.includes(p.id.toLowerCase())) {
        citedIds.add(p.id);
        break;
      }
      // Try matching author surname + year
      if (Array.isArray(p.authors) ? p.authors.length > 0 : p.authors) {
        const authorStr = Array.isArray(p.authors) ? p.authors[0] : p.authors.split(',')[0];
        const surname = (authorStr.split(' ').pop() || '').toLowerCase();
        if (norm.includes(surname) && norm.includes(String(p.year))) {
          citedIds.add(p.id);
          break;
        }
      }
    }
  }

  if (citedIds.size === 0) return [];

  // Get keywords from cited papers
  const citedKeywords = new Set<string>();
  const citedCommunities = new Set<number>();
  for (const cid of citedIds) {
    const paper = allPapers.find((p) => p.id === cid);
    if (paper) {
      const pKw = Array.isArray(paper.keywords) ? paper.keywords : [];
      pKw.forEach((k) => citedKeywords.add(k.toLowerCase()));
      citedCommunities.add(paper.community);
    }
  }

  // Score uncited papers by shared keyword count
  const scored: CitationSuggestion[] = [];
  for (const paper of allPapers) {
    if (citedIds.has(paper.id)) continue;
    const pKw = Array.isArray(paper.keywords) ? paper.keywords : [];
    const shared = pKw.filter((k) => citedKeywords.has(k.toLowerCase()));
    if (shared.length === 0) continue;

    const score = shared.length;
    let reason = `Shares ${shared.length} keyword${shared.length > 1 ? 's' : ''} with your references`;
    if (citedCommunities.has(paper.community)) {
      reason += `; same school (${SCHOOL_ABBR[paper.community] || paper.community_name || 'School ' + (paper.community + 1)})`;
    }
    if (paper.citations > 1000) {
      reason += '; highly cited';
    }

    scored.push({ paper, sharedKeywords: shared, score, reason });
  }

  // Sort by score descending, then citations
  scored.sort((a, b) => b.score - a.score || b.paper.citations - a.paper.citations);
  return scored.slice(0, 20);
}

/* ------------------------------------------------------------------ */
/*  Export helpers                                                     */
/* ------------------------------------------------------------------ */

interface SpineContent {
  claim: string;
  evidence: string[];
  counter: string[];
  gap: string;
  why: string;
}

function generateMarkdownExport(
  gapText: string,
  topic: string,
  papers: PaperNode[],
  spine: SpineContent,
  whyItMatters?: string,
  proposedDirection?: string
): string {
  let md = `# Literature Review: ${topic}\n\n`;
  md += `> **Note:** This document was auto-generated by the Living Literature Map.\n\n`;

  md += `## Research Gap Summary\n\n${gapText}\n\n`;

  md += `## Argument Spine\n\n`;
  md += `### Claim\n${spine.claim}\n\n`;
  md += `### Evidence\n${spine.evidence.map((e) => `- ${e}`).join('\n')}\n\n`;
  md += `### Counter-Evidence\n${spine.counter.map((e) => `- ${e}`).join('\n')}\n\n`;
  md += `### The Gap\n${spine.gap}\n\n`;
  md += `### Why It Matters\n${spine.why}\n\n`;

  if (whyItMatters) {
    md += `## Why It Matters (Extended)\n\n${whyItMatters}\n\n`;
  }
  if (proposedDirection) {
    md += `## Proposed Direction\n\n${proposedDirection}\n\n`;
  }

  // Add bibliography
  md += `## Bibliography (${papers.length} papers)\n\n`;
  const sorted = [...papers].sort((a, b) => (b.citations || 0) - (a.citations || 0));
  sorted.forEach((p, i) => {
    const authors = authorsToString(p.authors);
    md += `${i + 1}. ${authors} (${p.year}). ${p.title}. *${p.journal}*.`;
    if (p.doi) md += ` https://doi.org/${p.doi}`;
    md += `\n`;
  });

  return md;
}

function generateBibTeXExport(papers: PaperNode[]): string {
  const escapeBib = (s: string) => (s || '').replace(/[{}]/g, '');
  return papers
    .map((p) => {
      const firstAuth =
        (authorsToArray(p.authors)[0] || 'paper').split(' ').pop()?.replace(/[^a-zA-Z]/g, '').toLowerCase() || 'paper';
      const key = `${firstAuth}${p.year || 2024}`;
      const authors = authorsToArray(p.authors).map(escapeBib).join(' and ');
      return `@article{${key},
  title = {${escapeBib(p.title)}},
  author = {${authors}},
  year = {${p.year}},
  journal = {${escapeBib(p.journal || 'Academic Publication')}},
  doi = {${p.doi || ''}}
}`;
    })
    .join('\n\n');
}

function generateDocxHtml(
  gapText: string,
  topic: string,
  papers: PaperNode[],
  spine: SpineContent,
  whyItMatters?: string,
  proposedDirection?: string
): string {
  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let html = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><title>Literature Review: ${escapeHtml(topic)}</title></head>
<body style="font-family:Georgia,serif;font-size:11pt;line-height:1.6;color:#1A1B3A;">
<h1 style="font-size:18pt;color:#1A1B3A;">Literature Review: ${escapeHtml(topic)}</h1>
<p style="font-size:10pt;color:#5A5C7A;font-style:italic;">Auto-generated by Living Literature Map.</p>

<h2 style="font-size:14pt;color:#1A1B3A;margin-top:24pt;">Research Gap Summary</h2>
<p>${escapeHtml(gapText)}</p>

<h2 style="font-size:14pt;color:#1A1B3A;margin-top:24pt;">Argument Spine</h2>

<h3 style="font-size:12pt;color:#3B6FC4;">Claim</h3>
<p>${escapeHtml(spine.claim)}</p>

<h3 style="font-size:12pt;color:#22A559;">Evidence</h3>
<ul>
${spine.evidence.map((e) => `<li>${escapeHtml(e)}</li>`).join('\n')}
</ul>

<h3 style="font-size:12pt;color:#E8A820;">Counter-Evidence</h3>
<ul>
${spine.counter.map((e) => `<li>${escapeHtml(e)}</li>`).join('\n')}
</ul>

<h3 style="font-size:12pt;color:#D94040;">The Gap</h3>
<p>${escapeHtml(spine.gap)}</p>

<h3 style="font-size:12pt;color:#22A559;">Why It Matters</h3>
<p>${escapeHtml(spine.why)}</p>
`;

  if (whyItMatters) {
    html += `\n<h2 style="font-size:14pt;color:#1A1B3A;margin-top:24pt;">Why It Matters (Extended)</h2>\n<p>${escapeHtml(whyItMatters)}</p>\n`;
  }
  if (proposedDirection) {
    html += `\n<h2 style="font-size:14pt;color:#1A1B3A;margin-top:24pt;">Proposed Direction</h2>\n<p>${escapeHtml(proposedDirection)}</p>\n`;
  }

  // Bibliography
  html += `\n<h2 style="font-size:14pt;color:#1A1B3A;margin-top:24pt;">Bibliography (${papers.length} papers)</h2>\n`;
  const sorted = [...papers].sort((a, b) => (b.citations || 0) - (a.citations || 0));
  html += '<div style="font-size:10pt;">\n';
  sorted.forEach((p, i) => {
    const authors = escapeHtml(authorsToString(p.authors));
    html += `<p style="margin-bottom:6pt;text-indent:-24pt;margin-left:24pt;">${i + 1}. ${authors} (${p.year}). ${escapeHtml(p.title)}. <em>${escapeHtml(p.journal)}</em>.${p.doi ? ` https://doi.org/${escapeHtml(p.doi)}` : ''}</p>\n`;
  });
  html += '</div>\n';

  html += '</body></html>';
  return html;
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function WritingSection() {
  const sectionRef = useScrollAnimation<HTMLElement>();
  const { analysisData, networkData, config } = useLiteratureMap();

  const papers: PaperNode[] = useMemo(() => {
    return (networkData?.nodes || []).map((node: any) => ({
      ...node,
      authors: Array.isArray(node.authors)
        ? node.authors
        : typeof node.authors === 'string'
        ? node.authors.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      keywords: Array.isArray(node.keywords)
        ? node.keywords
        : typeof node.keywords === 'string'
        ? node.keywords.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
        : [],
    }));
  }, [networkData]);

  const defaultGap = config.researchGap?.statement ||
    (analysisData as any)?.research_gap?.gap_statement ||
    DEFAULT_FALLBACK_GAP;

  const [gapText, setGapText] = useState(defaultGap);

  useEffect(() => {
    setGapText(defaultGap);
  }, [defaultGap]);

  const [copied, setCopied] = useState(false);

  // Argument spine
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const toggleStep = (key: string) => setExpandedStep((prev) => (prev === key ? null : key));

  // Citation suggestions
  const [userRefs, setUserRefs] = useState('');
  const [suggestions, setSuggestions] = useState<CitationSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Persist gap text to localStorage
  const handleGapChange = (val: string) => {
    setGapText(val);
    try {
      localStorage.setItem('cc_gap_paragraph', val);
    } catch {
      // ignore
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gapText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = gapText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFindCitations = useCallback(() => {
    setSuggestionsLoading(true);
    setTimeout(() => {
      const refs = userRefs.split('\n').map((r) => r.trim()).filter(Boolean);
      const results = findMissingCitations(refs, papers);
      setSuggestions(results);
      setSuggestionsLoading(false);
    }, 100);
  }, [userRefs, papers]);

  // Dynamic spine parsing
  const rawSpine = (analysisData as any)?.argument_spine || config.researchGap?.argument_spine || {};
  const getSpineText = (val: any) => (typeof val === 'string' ? val : val?.title || val?.statement || '');
  const getSpineList = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((x) => (typeof x === 'string' ? x : x.text || ''));
    if (Array.isArray(val.bullets)) return val.bullets.map((x: any) => (typeof x === 'string' ? x : x.text || ''));
    return [];
  };

  const claimText = getSpineText(rawSpine.claim) || 'Major conceptual paradigms face identifiable empirical limits.';
  const rawEv = getSpineList(rawSpine.evidence);
  const evidenceList = rawEv.length > 0 ? rawEv : getSpineList(rawSpine.evidence_for);
  const rawCtr = getSpineList(rawSpine.counter);
  const counterList = rawCtr.length > 0 ? rawCtr : getSpineList(rawSpine.counter_evidence);
  const gapTextVal = getSpineText(rawSpine.gap) || getSpineText(rawSpine.the_gap) || 'A measurable disconnect exists across adjacent sub-disciplines.';
  const whyTextVal = getSpineText(rawSpine.why) || getSpineText(rawSpine.significance) || 'Closing this gap unlocks unified theoretical and practical breakthroughs.';

  const spinePayload: SpineContent = {
    claim: claimText,
    evidence: evidenceList.length > 0 ? evidenceList : ['Key literature benchmarks support the foundation.'],
    counter: counterList.length > 0 ? counterList : ['Boundary conditions and replication challenges.'],
    gap: gapTextVal,
    why: whyTextVal,
  };

  const handleExportMd = () => {
    const md = generateMarkdownExport(
      gapText,
      config.topic || 'Literature Map',
      papers,
      spinePayload,
      config.researchGap?.gap_metrics?.description,
      config.researchGap?.detected_via
    );
    const safeTopic = (config.topic || 'literature_review').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadFile(md, `${safeTopic}_review.md`, 'text/markdown');
  };

  const handleExportDocx = () => {
    const html = generateDocxHtml(
      gapText,
      config.topic || 'Literature Map',
      papers,
      spinePayload,
      config.researchGap?.gap_metrics?.description,
      config.researchGap?.detected_via
    );
    const safeTopic = (config.topic || 'literature_review').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadFile(html, `${safeTopic}_review.doc`, 'application/msword');
  };

  const handleExportBib = () => {
    const bib = generateBibTeXExport(papers);
    const safeTopic = (config.topic || 'literature_review').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadFile(bib, `${safeTopic}_bibliography.bib`, 'text/plain');
  };

  const stepContent: Record<string, { body: string; bullets: string[] }> = {
    claim: { body: claimText, bullets: [] },
    evidence: { body: 'Supporting evidence identified across the literature:', bullets: spinePayload.evidence },
    counter: { body: 'Limitations and contradictory findings:', bullets: spinePayload.counter },
    gap: { body: gapTextVal, bullets: [] },
    significance: { body: whyTextVal, bullets: [] },
  };

  return (
    <section
      id="writing"
      ref={sectionRef}
      className="w-full bg-off-white py-space-24"
    >
      <div className="section-container">
        {/* ---- Header ---- */}
        <div className="scroll-animate mb-space-6">
          <span className="label text-accent-gold tracking-[0.08em]">WRITING TOOLS</span>
        </div>
        <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-4">
          Writing Assistant
        </h2>
        <p className="scroll-animate body-lg text-text-secondary mb-space-12 max-w-3xl">
          Pre-computed analysis to support your writing &mdash; no LLM required at runtime.
        </p>

        {/* ---- A. Gap Paragraph ---- */}
        <div className="scroll-animate mb-space-12">
          <div className="bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] overflow-hidden">
            <div className="border-l-4 border-accent-gold p-space-6 md:p-space-8">
              <div className="flex items-center justify-between mb-space-4">
                <h3 className="heading-3 font-serif text-accent-indigo">Research Gap Summary</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-light bg-surface-elevated font-mono text-[11px] text-text-secondary hover:border-accent-indigo hover:text-accent-indigo transition-colors"
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22A559" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-success">Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={gapText}
                onChange={(e) => handleGapChange(e.target.value)}
                className="w-full min-h-[180px] p-space-4 rounded-md border border-border-light bg-surface-elevated font-serif text-[15px] text-text-primary leading-relaxed resize-y focus:outline-none focus:border-accent-indigo transition-colors"
              />
              <p className="mt-space-2 font-mono text-[10px] text-text-tertiary">
                Editable. Changes persist to localStorage. You can modify this text for your review.
              </p>
            </div>
          </div>
        </div>

        {/* ---- B. Argument Spine Expansion ---- */}
        <div className="scroll-animate mb-space-12">
          <h3 className="heading-3 font-serif text-accent-indigo mb-space-4">Argument Spine</h3>

          {/* Flow diagram */}
          <div className="flex flex-col md:flex-row items-stretch gap-0 mb-space-6">
            {ARGUMENT_SPINE_STEPS.map((step, i) => (
              <div key={step.key} className="flex flex-col md:flex-row items-center flex-1">
                {/* Card */}
                <button
                  onClick={() => toggleStep(step.key)}
                  className="w-full md:flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-[4px] font-mono text-[12px] font-semibold uppercase tracking-[0.06em] transition-all duration-200"
                  style={{ backgroundColor: step.color, color: step.textColor }}
                >
                  {step.icon}
                  {step.label}
                </button>
                {/* Arrow between cards */}
                {i < ARGUMENT_SPINE_STEPS.length - 1 && (
                  <div className="flex items-center justify-center py-1 md:py-0 md:px-1">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D4A853"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="rotate-90 md:rotate-0"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Expandable content */}
          <div className="space-y-space-3">
            {ARGUMENT_SPINE_STEPS.map((step) => {
              const isOpen = expandedStep === step.key;
              const content = stepContent[step.key];
              if (!content) return null;
              return (
                <div
                  key={step.key}
                  className="bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleStep(step.key)}
                    className="w-full flex items-center justify-between px-space-5 py-space-3 hover:bg-surface-elevated transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: step.color, color: step.textColor }}
                      >
                        {step.icon}
                      </span>
                      <span className="heading-4 font-serif text-accent-indigo">{step.title}</span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`text-text-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-space-5 pb-space-4 pt-space-1 border-t border-border-light">
                      <p className="body text-text-primary leading-relaxed mb-space-3">{content.body}</p>
                      {content.bullets.length > 0 && (
                        <ul className="space-y-2">
                          {content.bullets.map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-accent-gold mt-1.5 shrink-0">
                                <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                                  <circle cx="3" cy="3" r="3" />
                                </svg>
                              </span>
                              <span className="body-sm text-text-secondary">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ---- C. Papers You Should Cite ---- */}
        <div className="scroll-animate mb-space-12">
          <h3 className="heading-3 font-serif text-accent-indigo mb-space-4">
            Papers You Should Cite
          </h3>
          <div className="bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-5 md:p-space-6 space-y-space-4">
            {/* Input area */}
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-[0.04em] text-text-tertiary mb-space-2">
                Paste your reference list (one per line)
              </label>
              <textarea
                value={userRefs}
                onChange={(e) => setUserRefs(e.target.value)}
                placeholder={"e.g.,\nSporns 2005\nBullmore 2009\nFinn et al. 2015\n10.1016/j.neuroimage.2010.01.001"}
                className="w-full min-h-[120px] p-space-3 rounded-md border border-border-light bg-surface-elevated font-mono text-[12px] text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:border-accent-indigo transition-colors"
              />
              <div className="flex items-center justify-between mt-space-2">
                <p className="font-mono text-[10px] text-text-tertiary">
                  Uses keyword matching and community analysis &mdash; no LLM calls.
                </p>
                <button
                  onClick={handleFindCitations}
                  disabled={!userRefs.trim() || suggestionsLoading}
                  className="px-4 py-2 rounded-md bg-accent-indigo text-white font-mono text-[12px] font-medium hover:bg-accent-indigo-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {suggestionsLoading ? 'Analyzing...' : 'Find Missing Citations'}
                </button>
              </div>
            </div>

            {/* Results */}
            {suggestions.length > 0 && (
              <div className="border-t border-border-light pt-space-4">
                <p className="font-mono text-[11px] text-text-secondary mb-space-3">
                  Found {suggestions.length} paper{suggestions.length > 1 ? 's' : ''} you may want to cite:
                </p>
                <div className="space-y-space-2 max-h-[400px] overflow-y-auto">
                  {suggestions.map((s, i) => {
                    const firstAuthor = s.paper.authors[0] || 'Unknown';
                    const surname = firstAuthor.includes(' ') ? firstAuthor.split(' ').pop() : firstAuthor;
                    return (
                      <div
                        key={s.paper.id}
                        className="flex items-start gap-3 p-space-3 rounded-[4px] border border-[#E7E3DB] hover:bg-[rgba(212,168,83,0.04)] transition-colors"
                      >
                        <span className="font-mono text-[11px] text-text-tertiary w-6 shrink-0 text-right">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[12px] font-medium text-accent-indigo">
                              {surname} et al. {s.paper.year}
                            </span>
                            <span
                              className="font-mono text-[9px] px-1.5 py-0.5 rounded border"
                              style={{
                                backgroundColor: `${SCHOOL_COLORS[s.paper.community]}18`,
                                borderColor: `${SCHOOL_COLORS[s.paper.community]}40`,
                                color: SCHOOL_COLORS[s.paper.community],
                              }}
                            >
                              {SCHOOL_ABBR[s.paper.community]}
                            </span>
                          </div>
                          <p className="body-sm text-text-secondary truncate mt-0.5">{s.paper.title}</p>
                          <p className="font-mono text-[10px] text-text-tertiary mt-0.5">
                            {s.reason} &middot; {s.paper.citations.toLocaleString()} citations
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {s.sharedKeywords.slice(0, 5).map((k) => (
                              <span key={k} className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-accent-gold-light text-accent-indigo">
                                {k}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {suggestions.length === 0 && userRefs.trim() && !suggestionsLoading && (
              <div className="border-t border-border-light pt-space-4">
                <p className="body-sm text-text-tertiary text-center">
                  No matching papers found in the corpus. Try adding author surnames or years.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---- D. Export Options ---- */}
        <div className="scroll-animate">
          <h3 className="heading-3 font-serif text-accent-indigo mb-space-4">Export Options</h3>
          <div className="bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-6">
            <p className="body-sm text-text-secondary mb-space-5">
              Download a complete literature review document including the gap paragraph, argument spine, and full bibliography of {papers.length} papers.
            </p>
            <div className="flex flex-wrap gap-space-4">
              <button
                onClick={handleExportDocx}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-accent-indigo bg-accent-indigo text-white font-mono text-[13px] font-medium hover:bg-accent-indigo-light transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Export as .docx
              </button>
              <button
                onClick={handleExportMd}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-border-light bg-surface-elevated font-mono text-[13px] font-medium text-accent-indigo hover:border-accent-indigo transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 15l2 2 4-4" />
                </svg>
                Export as Markdown
              </button>
              <button
                onClick={handleExportBib}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-[#D4A853]/60 bg-[#D4A853]/10 font-mono text-[13px] font-medium text-[#B88728] hover:bg-[#D4A853]/20 transition-colors cursor-pointer"
                title="Download BibTeX (.bib) file for LaTeX / Overleaf"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Export as BibTeX (.bib)
              </button>
            </div>
            <p className="font-mono text-[10px] text-text-tertiary mt-space-4">
              .docx export generates Word-compatible document. Markdown includes APA-formatted references. BibTeX (.bib) can be imported directly into LaTeX/Overleaf or Zotero.
            </p>

            {/* Pro Upgrade Callout */}
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-[#D4A853]/15 to-transparent border border-[#D4A853]/30 flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#B88728] font-bold">
                  ✨ Pro Scientist Feature
                </span>
                <p className="font-serif text-sm text-accent-indigo font-semibold mt-0.5">
                  Need a full 15-page comprehensive Literature Review with AI narrative synthesis?
                </p>
                <p className="font-mono text-[11px] text-text-secondary">
                  Unlock 500+ paper deep queries, LaTeX format, and continuous citation frontier monitoring.
                </p>
              </div>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-pricing-modal'));
                }}
                className="px-4 py-2 rounded-md bg-[#D4A853] hover:bg-[#C29540] text-black font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
