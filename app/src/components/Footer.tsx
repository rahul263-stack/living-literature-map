import { useLiteratureMap } from '@/context/LiteratureMapContext';

export default function Footer() {
  const { config, networkData } = useLiteratureMap();

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPapers = networkData?.nodes?.length || 244;
  const totalLinks = networkData?.links?.length || 21285;
  const totalSchools = config?.schools?.length || 8;

  return (
    <footer className="bg-accent-indigo text-white w-full">
      <div className="section-container py-space-12 sm:py-space-16">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 pb-space-6 sm:pb-space-8 border-b border-[rgba(255,255,255,0.1)] text-center md:text-left">
          <span className="font-mono text-[13px] sm:text-[14px] font-semibold text-star-gold">
            {config.title || config.domain || 'Living Literature Map'}
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] text-[rgba(255,255,255,0.4)]">
            {totalPapers} papers · {totalLinks.toLocaleString()} connections · {totalSchools} schools
          </span>
          <span className="font-mono text-[9px] sm:text-[10px] text-[rgba(255,255,255,0.3)]">
            Data mode: Keyword Co-occurrence
          </span>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-space-6">
          <span className="font-mono text-[11px] text-[rgba(255,255,255,0.25)] text-center">
            Built with React · D3.js · Three.js · Zustand
          </span>
          <button
            onClick={handleScrollTop}
            className="font-mono text-[11px] text-[rgba(255,255,255,0.4)] hover:text-star-gold transition-colors duration-200 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Scroll to top
          </button>
        </div>
      </div>
    </footer>
  );
}
