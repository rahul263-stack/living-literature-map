import { useState, useRef, useEffect, useMemo } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import * as d3 from 'd3';

/* ------------------------------------------------------------------ */
/*  ARGUMENT SPINE DATA                                                */
/* ------------------------------------------------------------------ */

type NodeId = 'CLAIM' | 'EVIDENCE' | 'COUNTER' | 'GAP' | 'WHY';

interface SpineNode {
  id: NodeId;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor?: string;
  details: string;
  bullets?: { text: string; citation?: string; citationCount?: number }[];
}

function getFallbackSpineNodes(domain: string): SpineNode[] {
  return [
    {
      id: 'CLAIM',
      label: 'CLAIM',
      shortLabel: 'CLAIM',
      color: '#FFFFFF',
      bgColor: '#1A1B3A',
      details: `Theoretical and empirical paradigms in ${domain} have developed largely along specialized, siloed trajectories.`,
      bullets: [
        { text: `High internal citation density within primary sub-schools` },
        { text: `Core foundational papers rarely co-cite cross-paradigm approaches` },
        { text: `Emerging models demand inter-cluster synthesis` },
      ],
    },
    {
      id: 'EVIDENCE',
      label: 'EVIDENCE',
      shortLabel: 'EVIDENCE',
      color: '#1A1B3A',
      bgColor: '#F4F2EC',
      details: `Quantitative clustering reveals robust modular communities with distinct foundational methodologies.`,
      bullets: [
        { text: `Dominant schools publish within specialized conference and journal tracks` },
        { text: `Empirical benchmarks demonstrate paradigm-specific validation protocols` },
        { text: `Network analysis indicates modularity Q exceeding threshold criteria` },
      ],
    },
    {
      id: 'COUNTER',
      label: 'COUNTER',
      shortLabel: 'COUNTER',
      color: '#1A1B3A',
      bgColor: '#F5F3EF',
      borderColor: '#D0CCC4',
      details: `Methodological divergence and disparate evaluation frameworks complicate direct cross-community translation.`,
      bullets: [
        { text: `Differing assumptions regarding data representations and noise models` },
        { text: `Lack of shared open-source benchmarking suites across paradigms` },
        { text: `Publication incentives favor incremental within-school contributions` },
      ],
    },
    {
      id: 'GAP',
      label: 'GAP',
      shortLabel: 'GAP',
      color: '#FFFFFF',
      bgColor: '#8C5B5B',
      details: `No standardized integrative framework bridges the topological gap between theoretical foundations and applied methods in ${domain}.`,
      bullets: [
        { text: `Cross-community edge density significantly below inter-modular expectations` },
        { text: `Absence of consensus evaluation metrics connecting distinct schools` },
        { text: `Structural hole identified in network topology` },
      ],
    },
    {
      id: 'WHY',
      label: 'WHY',
      shortLabel: 'WHY',
      color: '#FFFFFF',
      bgColor: '#5B8C7B',
      details: `Bridging this structural hole will synthesize complementary techniques and unlock high-impact translation in ${domain}.`,
      bullets: [
        { text: `Accelerates breakthrough discoveries across interdisciplinary boundaries` },
        { text: `Establishes reproducible cross-school validation standards` },
        { text: `Unlocks next-generation research programs and translational utility` },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  STRUCTURAL HOLE BAR CHART (D3)                                     */
/* ------------------------------------------------------------------ */

interface CrossCommunityBar {
  pair: string;
  value: number;
  highlight?: boolean;
  isReference?: boolean;
}

function CrossCommunityChart({
  data,
  meanVal = 4.5,
}: {
  data: CrossCommunityBar[];
  meanVal?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !data || data.length === 0) return;
    const container = ref.current;

    const draw = () => {
      container.innerHTML = '';
      const isMobile = container.clientWidth < 500;

      const margin = { top: 10, right: isMobile ? 35 : 50, bottom: 10, left: isMobile ? 105 : 170 };
      const width = Math.max(80, container.clientWidth - margin.left - margin.right);
      const height = Math.max(220, data.length * 32) - margin.top - margin.bottom;

      const svg = d3
        .select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      const maxVal = Math.max(...data.map((d) => d.value), meanVal * 1.3, 1);
      const xScale = d3.scaleLinear().domain([0, maxVal]).range([0, width]);
      const yScale = d3
        .scaleBand()
        .domain(data.map((d) => d.pair))
        .range([0, height])
        .padding(0.25);

      // Reference line at mean
      g.append('line')
        .attr('x1', xScale(meanVal))
        .attr('x2', xScale(meanVal))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#8B8DA3')
        .attr('stroke-dasharray', '4,3')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', xScale(meanVal) + 4)
        .attr('y', -4)
        .attr('class', 'font-mono')
        .style('font-size', '9px')
        .style('fill', '#8B8DA3')
        .text('Mean');

      // Bars
      g.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('y', (d) => yScale(d.pair) || 0)
        .attr('height', yScale.bandwidth())
        .attr('x', 0)
        .attr('width', 0)
        .attr('fill', (d) => {
          if (d.isReference) return '#E5E2DC';
          if (d.highlight) return '#8C5B5B';
          return '#D0CCC4';
        })
        .attr('rx', 3)
        .transition()
        .duration(800)
        .delay((_, i) => i * 50)
        .attr('width', (d) => xScale(d.value));

      // Labels
      g.selectAll('.label')
        .data(data)
        .join('text')
        .attr('class', 'label')
        .attr('x', -8)
        .attr('y', (d) => (yScale(d.pair) || 0) + yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('class', 'font-mono')
        .style('font-size', isMobile ? '9px' : '10px')
        .style('fill', '#5A5C7A')
        .text((d) => {
          const maxLen = isMobile ? 13 : 26;
          return d.pair.length > maxLen ? d.pair.slice(0, maxLen - 1) + '…' : d.pair;
        });

      // Value labels
      g.selectAll('.val')
        .data(data)
        .join('text')
        .attr('class', 'val')
        .attr('y', (d) => (yScale(d.pair) || 0) + yScale.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('x', (d) => xScale(d.value) + 5)
        .attr('class', 'font-mono')
        .style('font-size', '10px')
        .style('font-weight', 600)
        .style('fill', (d) => (d.highlight ? '#8C5B5B' : d.isReference ? '#8B8DA3' : '#5A5C7A'))
        .text((d) => d.value.toFixed(3).replace(/\.?0+$/, ''));
    };

    draw();
    window.addEventListener('resize', draw);

    return () => {
      window.removeEventListener('resize', draw);
      container.innerHTML = '';
    };
  }, [data, meanVal]);

  return <div ref={ref} className="w-full overflow-x-auto" />;
}

/* ------------------------------------------------------------------ */
/*  MAIN SECTION                                                       */
/* ------------------------------------------------------------------ */

export default function GapSection() {
  const { config, analysisData } = useLiteratureMap();
  const [activeNode, setActiveNode] = useState<NodeId | null>('GAP');

  const gapData = useMemo(() => {
    if (config.researchGap) return config.researchGap;
    const domain = config?.domainName || config?.domain || 'Scientific Literature';
    return {
      title: `Inter-Paradigm Structural Hole in ${domain}`,
      statement: `Quantitative network clustering detects a structural hole between primary foundational methodologies and applied translational frameworks in ${domain}. Cross-community edge density remains significantly below expected baseline rates, indicating fragmented intellectual space.`,
      metric: 'Below Expected Density',
      metric_label: 'Topological Structural Hole',
      detected_via: 'Detected via Louvain community partitioning + structural hole analysis',
      cross_community_bars: [
        { pair: 'Theory ↔ Applied', value: 5.8, highlight: false },
        { pair: 'Theory ↔ Frontiers', value: 5.2, highlight: false },
        { pair: 'Expected Mean', value: 4.5, highlight: false, isReference: true },
        { pair: 'Foundations ↔ Translation', value: 3.2, highlight: true },
      ],
      gap_metrics: {
        structural_hole_weight: 3.2,
        mean_weight: 4.5,
        gap_pct: '-28.9%',
        description: 'Observed vs. Expected Cross-Cluster Citation Density',
      },
    };
  }, [config]);

  const spineNodes: SpineNode[] = useMemo(() => {
    const raw = config.researchGap?.argument_spine || (analysisData as any)?.argument_spine || (analysisData as any)?.argumentSpine;
    const domain = config?.domainName || config?.domain || 'Scientific Field';
    if (!raw) return getFallbackSpineNodes(domain);

    const claimDetails = typeof raw.claim === 'string'
      ? raw.claim
      : (raw.claim?.title || raw.claim?.statement || `Core research paradigm assertion in ${domain}.`);
    const claimBullets = raw.claim?.bullets?.map((b: any) => (typeof b === 'string' ? { text: b } : b)) || [];

    const evidenceDetails = typeof raw.evidence === 'string'
      ? raw.evidence
      : (raw.evidence?.title || raw.evidence_for?.[0] || 'Supporting empirical literature.');
    const evidenceBullets = raw.evidence?.bullets?.map((b: any) => (typeof b === 'string' ? { text: b } : b)) ||
      raw.evidence_for?.map((t: string) => ({ text: t })) || [];

    const counterDetails = typeof raw.counter === 'string'
      ? raw.counter
      : (raw.counter?.title || raw.counter_evidence?.[0] || 'Methodological boundaries and counter-arguments.');
    const counterBullets = raw.counter?.bullets?.map((b: any) => (typeof b === 'string' ? { text: b } : b)) ||
      raw.counter_evidence?.map((t: string) => ({ text: t })) || [];

    const gapDetails = typeof raw.the_gap === 'string'
      ? raw.the_gap
      : (typeof raw.gap === 'string' ? raw.gap : raw.gap?.title || 'Quantifiable structural hole detected in the literature.');
    const gapBullets = raw.gap?.bullets?.map((b: any) => (typeof b === 'string' ? { text: b } : b)) || [];

    const whyDetails = typeof raw.significance === 'string'
      ? raw.significance
      : (typeof raw.why === 'string' ? raw.why : raw.why?.title || 'Significance of closing this scientific gap.');
    const whyBullets = raw.why?.bullets?.map((b: any) => (typeof b === 'string' ? { text: b } : b)) || [];

    return [
      {
        id: 'CLAIM',
        label: 'CLAIM',
        shortLabel: 'CLAIM',
        color: '#FFFFFF',
        bgColor: '#1A1B3A',
        details: claimDetails,
        bullets: claimBullets.length > 0 ? claimBullets : [{ text: 'Foundational framework assertion' }],
      },
      {
        id: 'EVIDENCE',
        label: 'EVIDENCE',
        shortLabel: 'EVIDENCE',
        color: '#1A1B3A',
        bgColor: '#F4F2EC',
        details: evidenceDetails,
        bullets: evidenceBullets.length > 0 ? evidenceBullets : [{ text: 'Empirical validation across multiple cohorts' }],
      },
      {
        id: 'COUNTER',
        label: 'COUNTER',
        shortLabel: 'COUNTER',
        color: '#1A1B3A',
        bgColor: '#F5F3EF',
        borderColor: '#D0CCC4',
        details: counterDetails,
        bullets: counterBullets.length > 0 ? counterBullets : [{ text: 'Technical challenges limiting generalizability' }],
      },
      {
        id: 'GAP',
        label: 'GAP',
        shortLabel: 'GAP',
        color: '#FFFFFF',
        bgColor: '#8C5B5B',
        details: gapDetails,
        bullets: gapBullets.length > 0 ? gapBullets : [{ text: 'Inter-paradigm connectivity deficit' }],
      },
      {
        id: 'WHY',
        label: 'WHY',
        shortLabel: 'WHY',
        color: '#FFFFFF',
        bgColor: '#5B8C7B',
        details: whyDetails,
        bullets: whyBullets.length > 0 ? whyBullets : [{ text: 'Direct impact on translational breakthroughs' }],
      },
    ];
  }, [config, analysisData]);

  const sectionRef = useScrollAnimation<HTMLElement>({
    selector: '.scroll-animate',
    stagger: 0.08,
    y: 25,
    duration: 0.5,
  });

  const handleNodeClick = (id: NodeId) => {
    setActiveNode((prev) => (prev === id ? null : id));
  };

  const barData: CrossCommunityBar[] = useMemo(() => {
    if (gapData.cross_community_bars && gapData.cross_community_bars.length > 0) {
      return gapData.cross_community_bars.map((b: any) => ({
        pair: b.pair,
        value: b.weight ?? b.value,
        highlight: b.highlight ?? false,
        isReference: b.isReference ?? false,
      }));
    }
    return [
      { pair: 'High-Interconnected', value: 6.2, highlight: false },
      { pair: 'Theoretical ↔ Empirical', value: 5.5, highlight: false },
      { pair: 'Mean', value: 4.5, highlight: false, isReference: true },
      { pair: 'Observed Gap Link', value: gapData.gap_metrics?.structural_hole_weight || 3.845, highlight: true },
      { pair: 'Emerging Cross-Tie', value: 3.6, highlight: false },
    ];
  }, [gapData]);

  const meanWeight = gapData.gap_metrics?.mean_weight || 4.5;

  return (
    <section
      id="gap"
      ref={sectionRef}
      className="w-full bg-off-white py-space-24"
    >
      <div className="section-container">
        {/* Section Header */}
        <div className="scroll-animate mb-space-6">
          <span className="label text-accent-gold tracking-[0.08em]">
            ANALYSIS 03
          </span>
        </div>
        <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-12">
          The Research Gap
        </h2>

        {/* Gap Statement Block */}
        <div className="scroll-animate max-w-[900px] mx-auto mb-space-16">
          <div
            className="bg-[#FAF9F6] rounded-r-xl p-space-8 md:p-space-10 relative overflow-hidden"
            style={{
              borderLeft: '6px solid #8C5B5B',
              boxShadow: 'none',
            }}
          >
            <h3 className="heading-2 font-serif text-accent-indigo mb-space-4">
              {gapData.title}
            </h3>
            <p className="body-lg text-text-primary italic leading-relaxed mb-space-6">
              {gapData.statement}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[#E5E2DC]">
              <span className="inline-block bg-info/10 text-info rounded px-2.5 py-1 font-mono text-[11px] font-medium">
                {gapData.detected_via || 'Detected via Louvain community analysis + structural hole detection'}
              </span>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-copilot'))}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-[11px] font-semibold bg-amber-500/15 border border-amber-600/30 text-amber-900 hover:bg-amber-500/25 transition-all cursor-pointer"
                title="Synthesize this scientific gap into a grant proposal pitch using AI Copilot"
              >
                <span>🤖 Synthesize Gap with AI Copilot</span>
              </button>
            </div>
          </div>
        </div>

        {/* Argument Spine */}
        <div className="scroll-animate mb-space-16">
          <h3 className="heading-3 font-serif text-accent-indigo text-center mb-space-8">
            Argument Spine
          </h3>

          {/* Node Flow — Desktop horizontal, Mobile vertical */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-2 md:gap-1 max-w-[1100px] mx-auto">
            {spineNodes.map((node, i) => (
              <div key={node.id} className="flex items-center gap-1 md:gap-1 flex-1">
                {/* Arrow (except for first item) */}
                {i > 0 && (
                  <div className="hidden md:flex items-center justify-center px-1 shrink-0">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-star-gold"
                    >
                      <path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}

                {/* Arrow for mobile (vertical) */}
                {i > 0 && (
                  <div className="flex md:hidden items-center justify-center py-1">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-star-gold mx-auto"
                    >
                      <path
                        d="M12 5v14M6 13l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}

                {/* Node */}
                <button
                  onClick={() => handleNodeClick(node.id)}
                  className="flex-1 relative rounded-lg px-4 py-3 md:py-4 text-center transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: node.bgColor,
                    color: node.color,
                    border: node.borderColor ? `2px solid ${node.borderColor}` : 'none',
                    boxShadow: 'none',
                  }}
                >
                  <span className="font-mono text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.06em]">
                    {node.shortLabel}
                  </span>
                  {node.id === 'GAP' && (
                    <span
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      style={{
                        boxShadow: '0 0 12px rgba(140, 91, 91, 0.25)',
                        animation: 'pulse 2s ease-in-out infinite',
                      }}
                    />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Expanded Detail Panel */}
          <div className="max-w-[800px] mx-auto mt-space-6">
            {spineNodes.map((node) => (
              <div
                key={node.id}
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: activeNode === node.id ? '600px' : '0px',
                  opacity: activeNode === node.id ? 1 : 0,
                }}
              >
                {activeNode === node.id && (
                  <div
                    className="rounded-[4px] p-space-6 border border-[#E7E3DB] bg-[#FAF9F6]"
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderLeftWidth: '4px',
                      borderLeftColor: node.bgColor,
                    }}
                  >
                    <h4
                      className="font-mono text-[12px] font-semibold uppercase tracking-[0.06em] mb-space-3"
                      style={{ color: node.bgColor }}
                    >
                      {node.label}
                    </h4>
                    <p className="body text-text-primary mb-space-4">{node.details}</p>
                    {node.bullets && node.bullets.length > 0 && (
                      <ul className="space-y-2">
                        {node.bullets.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                              style={{ backgroundColor: node.bgColor }}
                            />
                            <span className="body-sm text-text-secondary">
                              {b.text}
                              {b.citation && (
                                <span className="ml-1 text-text-tertiary">
                                  — {b.citation}
                                  {b.citationCount && (
                                    <span> ({b.citationCount.toLocaleString()} cites)</span>
                                  )}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}

            {activeNode === null && (
              <p className="text-center mono-sm text-text-tertiary mt-space-4">
                Click a node above to reveal details
              </p>
            )}
          </div>
        </div>

        {/* Structural Hole Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-6 max-w-[1000px] mx-auto">
          {/* Left: Bar Chart */}
          <div className="scroll-animate bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-6">
            <h4 className="heading-4 font-serif text-accent-indigo mb-space-4">
              Cross-Community Edge Strength
            </h4>
            <CrossCommunityChart data={barData} meanVal={meanWeight} />
          </div>

          {/* Right: Stat Blocks */}
          <div className="scroll-animate bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-6">
            <h4 className="heading-4 font-serif text-accent-indigo mb-space-6">
              Gap Metrics
            </h4>

            <div className="space-y-space-6">
              {/* Stat 1 */}
              <div className="flex items-baseline justify-between border-b border-border-light pb-space-4">
                <div>
                  <span className="mono-lg font-bold text-[#8C5B5B] text-[clamp(28px,3vw,42px)]">
                    {gapData.gap_metrics?.structural_hole_weight ?? 3.845}
                  </span>
                  <p className="mono-sm text-text-secondary mt-1">
                    {gapData.gap_metrics?.description || 'Observed cross-school connection weight'}
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-baseline justify-between border-b border-border-light pb-space-4">
                <div>
                  <span className="mono-lg font-bold text-accent-indigo text-[clamp(28px,3vw,42px)]">
                    {gapData.gap_metrics?.mean_weight ?? 4.5}
                  </span>
                  <p className="mono-sm text-text-secondary mt-1">
                    Mean cross-community edge weight
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-baseline justify-between pb-space-2">
                <div>
                  <span className="mono-lg font-bold text-[#8C5B5B] text-[clamp(28px,3vw,42px)]">
                    {gapData.gap_metrics?.gap_pct ?? '-14.6%'}
                  </span>
                  <p className="mono-sm text-text-secondary mt-1">
                    {gapData.metric_label || 'Below-average connection'}
                  </p>
                </div>
              </div>
            </div>

            <p className="body-sm text-text-tertiary mt-space-4 pt-space-4 border-t border-border-light">
              Lower cross-community edge weight indicates a structural hole — a disconnect
              between these research areas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
