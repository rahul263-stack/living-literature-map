import { X, Network, GitFork, Compass, FileCheck } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MethodologyModal({ isOpen, onClose }: MethodologyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0B0D17] border border-white/20 rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-white/50 hover:text-white transition-colors cursor-pointer p-1"
        >
          <X size={20} />
        </button>

        <div className="mb-5 sm:mb-6 pr-6">
          <span className="font-mono text-[10px] uppercase tracking-wider text-star-gold">
            Scientific Framework &bull; Epistemological Cartography
          </span>
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-white font-bold tracking-tight mt-1">
            How The Living Literature Map Works
          </h2>
          <p className="font-mono text-xs text-white/70 mt-2">
            Bridging network science, Kuhnian sociology of science, and modern bibliometrics into an automated discovery engine.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Pillar 1 */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2.5 text-star-gold mb-2 font-mono text-xs font-semibold">
              <Network size={16} />
              <span>1. Scholarly Graph Ingestion</span>
            </div>
            <p className="font-mono text-[11px] text-white/70 leading-relaxed">
              Fetches seminal literature from OpenAlex (250M+ scholarly works) and Crossref. Constructs edges via bibliographic coupling and co-citation strength:
              <br />
              <code className="text-star-gold text-[10px]">S_ij = C_ij / sqrt(C_i * C_j)</code>
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2.5 text-cyan-400 mb-2 font-mono text-xs font-semibold">
              <GitFork size={16} />
              <span>2. Kuhnian Paradigm Detection</span>
            </div>
            <p className="font-mono text-[11px] text-white/70 leading-relaxed">
              Applies Louvain modularity optimization to detect distinct &quot;Schools of Thought&quot;. Modularity scores ($Q &gt; 0.4$) reveal strongly siloed academic communities operating under competing epistemological frameworks.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2.5 text-rose-400 mb-2 font-mono text-xs font-semibold">
              <Compass size={16} />
              <span>3. Burt&apos;s Structural Holes &amp; Gaps</span>
            </div>
            <p className="font-mono text-[11px] text-white/70 leading-relaxed">
              Detects structural holes (unbridged network deficits) between adjacent paradigms. Uses Granovetter weak-tie theory to identify &quot;Bridge Papers&quot; with high betweenness centrality that connect disparate fields.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2.5 text-emerald-400 mb-2 font-mono text-xs font-semibold">
              <FileCheck size={16} />
              <span>4. PRISMA 2020 Compliance</span>
            </div>
            <p className="font-mono text-[11px] text-white/70 leading-relaxed">
              Complies with the PRISMA 2020 systematic review flow standard. Produces publication-grade evidence tables, methodology audit trails, and instant APA/IEEE formatted review drafts.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-star-gold/10 border border-star-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h4 className="font-serif text-sm text-white font-semibold">Ready to test with your research topic?</h4>
            <p className="font-mono text-[11px] text-white/70">Search any keyword above or drop in a custom BibTeX file.</p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-star-gold text-black font-mono text-xs font-semibold rounded-lg hover:bg-star-gold-light transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Explore Map Now
          </button>
        </div>
      </div>
    </div>
  );
}
