import type { PaperNode, Modality, EnrichedPaper } from './types';

export function safeKeywords(paper: Partial<PaperNode>): string[] {
  if (!paper?.keywords) return [];
  if (Array.isArray(paper.keywords)) {
    return paper.keywords
      .map((item: unknown) =>
        typeof item === 'string'
          ? item
          : (item as { name?: string; keyword?: string })?.name ||
            (item as { name?: string; keyword?: string })?.keyword ||
            String(item)
      )
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  if (typeof paper.keywords === 'string') {
    return (paper.keywords as string)
      .split(/[,;|]/)
      .map((s: string) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function inferModality(paper: PaperNode): Modality {
  const text = (
    paper.title +
    ' ' +
    (paper.abstract || '') +
    ' ' +
    safeKeywords(paper).join(' ')
  ).toLowerCase();

  if (
    text.includes('review') ||
    text.includes('survey') ||
    text.includes('meta-analysis') ||
    text.includes('systematic review') ||
    text.includes('perspective')
  ) {
    return 'Review';
  }
  if (
    text.includes('clinical') ||
    text.includes('patient') ||
    text.includes('therapy') ||
    text.includes('disease') ||
    text.includes('treatment') ||
    text.includes('cohort')
  ) {
    return 'Clinical';
  }
  if (
    text.includes('in vitro') ||
    text.includes('in vivo') ||
    text.includes('assay') ||
    text.includes('experiment') ||
    text.includes('laboratory') ||
    text.includes('crispr') ||
    text.includes('synthesis')
  ) {
    return 'Experimental';
  }
  if (
    text.includes('algorithm') ||
    text.includes('simulation') ||
    text.includes('deep learning') ||
    text.includes('neural network') ||
    text.includes('machine learning') ||
    text.includes('computational') ||
    text.includes('in silico') ||
    text.includes('graph theory')
  ) {
    return 'Computational';
  }
  if (
    text.includes('framework') ||
    text.includes('theorem') ||
    text.includes('theory') ||
    text.includes('mathematical') ||
    text.includes('analytical') ||
    text.includes('proof')
  ) {
    return 'Theoretical';
  }
  if (
    text.includes('pipeline') ||
    text.includes('protocol') ||
    text.includes('benchmark') ||
    text.includes('method') ||
    text.includes('tool') ||
    text.includes('software')
  ) {
    return 'Methodological';
  }
  if (
    text.includes('fmri') ||
    text.includes('resting-state') ||
    text.includes('functional connectivity')
  )
    return 'fMRI';
  if (text.includes('dmri') || text.includes('dti') || text.includes('tractography')) return 'dMRI';
  if (text.includes('eeg') || text.includes('meg')) return 'EEG';
  if (
    text.includes('trial') ||
    text.includes('dataset') ||
    text.includes('measurement') ||
    text.includes('empirical') ||
    text.includes('sample') ||
    text.includes('participant')
  ) {
    return 'Empirical';
  }

  return 'Empirical';
}

export function inferSampleSize(paper: PaperNode): {
  n: number | null;
  cat: 'small' | 'medium' | 'large' | null;
} {
  const text = (paper.abstract || '') + ' ' + (paper.title || '');
  // Try to extract N=... or n=... from abstract
  const match = text.match(/[Nn]\s*=\s*(\d{1,4})/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 200) return { n, cat: 'large' };
    if (n >= 50) return { n, cat: 'medium' };
    return { n, cat: 'small' };
  }
  // Estimate based on field norms
  const modality = inferModality(paper);
  const kw = safeKeywords(paper).join(' ').toLowerCase();
  if (
    kw.includes('hcp') ||
    kw.includes('human connectome project') ||
    kw.includes('abcd') ||
    kw.includes('uk biobank')
  ) {
    return { n: null, cat: 'large' };
  }
  if (paper.citations > 2000) {
    return { n: null, cat: 'large' };
  }
  if (modality === 'Computational' || modality === 'Other') {
    return { n: null, cat: null };
  }
  return { n: null, cat: 'medium' };
}

export function generateKeyFindings(paper: PaperNode): string {
  if (paper.abstract && paper.abstract.length > 30) {
    const cleaned = paper.abstract.replace(/^\u2026\s*/, '').trim();
    const firstSentence = cleaned.split(/[.!?]\s+/)[0];
    if (firstSentence.length > 20) {
      return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1) + '.';
    }
  }
  const kw = safeKeywords(paper).slice(0, 3).join(', ');
  return `Investigated ${kw} in the context of ${(paper.title || '').split(':')[0].toLowerCase()}.`;
}

export function generateLimitations(paper: PaperNode): string {
  const text = ((paper.abstract || '') + ' ' + safeKeywords(paper).join(' ')).toLowerCase();
  if (text.includes('limitation')) {
    const m = (paper.abstract || '').match(/limitation[s]?[^.]*\.?/i);
    if (m) return m[0];
  }
  if (inferSampleSize(paper).cat === 'small') return 'Small sample size may limit generalizability.';
  if (!paper.doi) return 'DOI not available; limited traceability.';
  if (text.includes('preprint') || text.includes('arxiv')) return 'Preprint; not peer-reviewed.';
  if (inferModality(paper) === 'Computational')
    return 'Computational study; experimental validation needed.';
  return 'Not reported in abstract.';
}

export function computeQuality(paper: PaperNode): {
  quality: 'green' | 'yellow' | 'red';
  label: string;
} {
  const hasDoi = Boolean(paper.doi && paper.doi.length > 0);
  const hasAbs = Boolean(paper.abstract && paper.abstract.length > 50);
  const highCite = paper.citations > 100;
  const knownJournal = Boolean(
    paper.journal &&
      paper.journal.length > 2 &&
      !paper.journal.toLowerCase().includes('arxiv')
  );

  if ((hasDoi || highCite) && hasAbs && knownJournal) return { quality: 'green', label: 'Good' };
  if (paper.journal?.toLowerCase().includes('arxiv') || paper.citations < 50)
    return { quality: 'red', label: 'Limited' };
  return { quality: 'yellow', label: 'Moderate' };
}

export function enrichPapers(nodes: PaperNode[]): EnrichedPaper[] {
  return nodes.map((node) => {
    const modality = inferModality(node);
    const { n: sampleSize, cat: sampleSizeCategory } = inferSampleSize(node);
    const keyFindings = generateKeyFindings(node);
    const limitations = generateLimitations(node);
    const { quality, label } = computeQuality(node);
    return {
      ...node,
      modality,
      sampleSize,
      sampleSizeCategory,
      keyFindings,
      limitations,
      quality,
      qualityLabel: label,
    };
  });
}
