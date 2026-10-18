import type { EnrichedPaper, SortDir } from './types';

export function QualityFlagPill({
  quality,
  label,
}: {
  quality: 'green' | 'yellow' | 'red';
  label: string;
}) {
  const styles = {
    green: 'bg-[rgba(34,165,89,0.12)] text-[#22A559] border-[rgba(34,165,89,0.25)]',
    yellow: 'bg-[rgba(232,168,32,0.12)] text-[#B8860B] border-[rgba(232,168,32,0.25)]',
    red: 'bg-[rgba(140,91,91,0.12)] text-[#8C5B5B] border-[rgba(140,91,91,0.25)]',
  };
  return (
    <span
      className={[
        'inline-block rounded-full px-2.5 py-0.5 font-mono text-[10px] border',
        styles[quality],
      ].join(' ')}
    >
      {label}
    </span>
  );
}

export function ModalityPill({ modality }: { modality: string }) {
  const colors: Record<string, string> = {
    Empirical: 'bg-[rgba(59,111,196,0.12)] text-[#3B6FC4] border-[rgba(59,111,196,0.25)]',
    Computational: 'bg-[rgba(90,92,122,0.15)] text-[#4A4C6A] border-[rgba(90,92,122,0.3)]',
    Experimental: 'bg-[rgba(34,165,89,0.12)] text-[#22A559] border-[rgba(34,165,89,0.25)]',
    Clinical: 'bg-[rgba(217,64,64,0.12)] text-[#D94040] border-[rgba(217,64,64,0.25)]',
    Theoretical: 'bg-[rgba(139,92,246,0.12)] text-[#7C3AED] border-[rgba(139,92,246,0.25)]',
    Review: 'bg-[rgba(232,168,32,0.12)] text-[#B8860B] border-[rgba(232,168,32,0.25)]',
    Methodological: 'bg-[rgba(14,165,233,0.12)] text-[#0284C7] border-[rgba(14,165,233,0.25)]',
    fMRI: 'bg-[rgba(75,90,140,0.12)] text-[#4A5A8C] border-[rgba(75,90,140,0.25)]',
    dMRI: 'bg-[rgba(110,140,91,0.12)] text-[#6E8C5B] border-[rgba(110,140,91,0.25)]',
    EEG: 'bg-[rgba(74,110,140,0.12)] text-[#4A6E8C] border-[rgba(74,110,140,0.25)]',
    MEG: 'bg-[rgba(110,91,140,0.12)] text-[#6E5B8C] border-[rgba(110,91,140,0.25)]',
    TMS: 'bg-[rgba(176,122,74,0.12)] text-[#B07A4A] border-[rgba(176,122,74,0.25)]',
    Multi: 'bg-[rgba(212,168,83,0.15)] text-[#A0822A] border-[rgba(212,168,83,0.3)]',
    Other: 'bg-[rgba(224,222,220,0.5)] text-text-tertiary border-border-medium',
  };
  return (
    <span
      className={[
        'inline-block rounded-full px-2 py-0.5 font-mono text-[10px] border',
        colors[modality] || colors.Other,
      ].join(' ')}
    >
      {modality}
    </span>
  );
}

export function SampleSizeBadge({ paper }: { paper: EnrichedPaper }) {
  if (paper.sampleSize) {
    return <span className="font-mono text-[12px] text-text-primary">{paper.sampleSize}</span>;
  }
  if (paper.sampleSizeCategory) {
    const labels = { small: '~20–50', medium: '~50–200', large: '200+' };
    return (
      <span className="font-mono text-[11px] text-text-tertiary">
        {labels[paper.sampleSizeCategory]}
      </span>
    );
  }
  return <span className="font-mono text-[11px] text-text-tertiary">—</span>;
}

export function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="inline-block w-3 ml-1" aria-hidden="true" />;
  return <span className="text-[#D4A853] ml-1">{dir === 'asc' ? '▲' : '▼'}</span>;
}
