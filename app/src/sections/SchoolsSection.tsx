import { useRef, useEffect, useState, useMemo } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { getCommunityColor } from '@/lib/colors';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import * as d3 from 'd3';
import SchoolExplorerModal from '@/components/SchoolExplorerModal';

interface School {
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

function getFallbackSchools(domainName: string): School[] {
  return [
    {
      id: 1,
      commId: 0,
      name: `Foundations of ${domainName}`,
      papers: 24,
      citations: 'High Impact',
      keyFigures: 'Foundational Authors',
      tags: ['Theory', 'Foundations', 'Frameworks'],
      description: `Theoretical and mathematical formulations establishing core principles in ${domainName}.`,
      yearRange: '2000–2026',
    },
    {
      id: 2,
      commId: 1,
      name: `Applied Methods & Experiments`,
      papers: 20,
      citations: 'Broadly Cited',
      keyFigures: 'Domain Researchers',
      tags: ['Empirical', 'Testing', 'Pipelines'],
      description: `Methodological implementations, empirical validation, and standard experimental protocols in ${domainName}.`,
      yearRange: '2010–2026',
    },
    {
      id: 3,
      commId: 2,
      name: `Frontiers & Emerging Paradigms`,
      papers: 16,
      citations: 'Emerging',
      keyFigures: 'Frontier Investigators',
      tags: ['Frontier', 'Emerging', 'Novel'],
      description: `Recent exploratory investigations, computational frontiers, and open challenges in ${domainName}.`,
      yearRange: '2020–2026',
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  MINI DONUT CHART (D3)                                              */
/* ------------------------------------------------------------------ */

function MiniDonutChart({ schools, totalPapers }: { schools: School[]; totalPapers: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    container.innerHTML = '';

    const width = 220;
    const height = 220;
    const radius = Math.min(width, height) / 2 - 10;
    const innerRadius = radius * 0.55;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<School>()
      .value((d) => d.papers)
      .sort(null)
      .padAngle(0.02);

    const arc = d3.arc<d3.PieArcDatum<School>>().innerRadius(innerRadius).outerRadius(radius);

    const arcs = pie(schools);

    // Background circle
    g.append('circle').attr('r', radius).attr('fill', 'none').attr('stroke', '#E5E2DC').attr('stroke-width', 1);

    // Segments
    g.selectAll('path')
      .data(arcs)
      .join('path')
      .attr('fill', (d) => getCommunityColor(d.data.commId))
      .attr('d', arc as any)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay((_, i) => i * 60)
      .attr('opacity', 0.9);

    // Center text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('class', 'font-mono')
      .style('font-size', '22px')
      .style('font-weight', 700)
      .style('fill', '#1A1B3A')
      .text(totalPapers.toLocaleString());

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.3em')
      .attr('class', 'font-mono')
      .style('font-size', '10px')
      .style('fill', '#8B8DA3')
      .style('letter-spacing', '0.04em')
      .text('PAPERS');

    return () => {
      container.innerHTML = '';
    };
  }, [schools, totalPapers]);

  return <div ref={ref} className="flex items-center justify-center" />;
}

/* ------------------------------------------------------------------ */
/*  SCHOOL CARD                                                        */
/* ------------------------------------------------------------------ */

function SchoolCard({
  school,
  maxPapers,
  onExplore,
  onFocus3D,
}: {
  school: School;
  maxPapers: number;
  onExplore: (school: School) => void;
  onFocus3D: (school: School, e: React.MouseEvent) => void;
}) {
  const color = getCommunityColor(school.commId);
  const [hovered, setHovered] = useState(false);

  // Mini bar width percentage relative to max papers in this map
  const barWidth = Math.min(100, Math.max(5, (school.papers / maxPapers) * 100));

  return (
    <div
      onClick={() => onExplore(school)}
      className="scroll-animate bg-[#FAF9F6] border border-[#E7E3DB] hover:border-[#D4A853]/60 rounded-[6px] p-space-6 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
      style={{
        borderTopWidth: '4px',
        borderTopColor: color,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onExplore(school);
        }
      }}
    >
      {/* Color dot + paper count row */}
      <div className="flex items-center justify-between mb-space-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="mono text-text-secondary">
            {school.papers} papers
          </span>
        </div>
        <span className="mono-sm text-text-tertiary">{school.yearRange}</span>
      </div>

      {/* School name */}
      <h3 className="heading-3 font-serif text-accent-indigo mb-space-2">
        {school.name}
      </h3>

      {/* Citations + Key figures */}
      <div className="flex items-center gap-2 mb-space-3">
        <span className="mono text-accent-gold font-medium">{school.citations}</span>
        <span className="mono-sm text-text-tertiary">citations</span>
      </div>

      {/* Mini relative size bar */}
      <div className="w-full h-2 bg-warm-gray rounded-full mb-space-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${barWidth}%`, backgroundColor: color, opacity: 0.8 }}
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-space-3">
        {school.tags.map((tag) => (
          <span
            key={tag}
            className="inline-block bg-[rgba(212,168,83,0.10)] border border-[#D4A853] text-[#B8860B] rounded-[2px] px-2 py-0.5 text-[12px] font-mono font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Key figures */}
      <p className="mono-sm text-text-secondary mb-space-2">
        <span className="text-text-tertiary">Key: </span>
        {school.keyFigures}
      </p>

      {/* Description */}
      <p className="body-sm text-text-secondary leading-relaxed">
        {school.description}
      </p>

      {/* Explore link & Quick actions */}
      <div className="mt-space-4 pt-space-3 border-t border-border-light flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExplore(school);
          }}
          className="inline-flex items-center gap-1.5 font-mono text-[12px] text-accent-indigo hover:text-accent-gold font-semibold cursor-pointer transition-colors"
        >
          <span>Explore</span>
          <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
        </button>

        <button
          type="button"
          onClick={(e) => onFocus3D(school, e)}
          className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-border-medium hover:border-[#D4A853] hover:text-[#D4A853] hover:bg-[#D4A853]/10 text-text-tertiary transition-colors cursor-pointer"
          title="Highlight this cluster in 3D Constellation"
        >
          3D Focus
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN SECTION                                                       */
/* ------------------------------------------------------------------ */

export default function SchoolsSection() {
  const { config, analysisData, setFocusedSchool } = useLiteratureMap();
  const [modalSchool, setModalSchool] = useState<School | null>(null);

  const handleFocus3D = (school: School, e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusedSchool(school.commId);
    const heroEl = document.getElementById('hero') || document.getElementById('constellation');
    if (heroEl) {
      heroEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const schools: School[] = useMemo(() => {
    if (analysisData?.communities && Object.keys(analysisData.communities).length > 0) {
      return Object.entries(analysisData.communities).map(([idStr, comm]) => {
        const commId = Number(idStr);
        const topAuthors = comm.top_authors?.slice(0, 3).map((a) => a[0]).join(', ') || 'Various';
        const topKeywords = comm.top_keywords?.slice(0, 3).map((k) => k[0]) || ['Research'];
        const yearRange = comm.year_range ? `${comm.year_range[0]}–${comm.year_range[1]}` : 'All time';
        const citationsStr = comm.total_citations >= 1000
          ? `~${Math.round(comm.total_citations / 1000)}K`
          : `${comm.total_citations || 0}`;

        return {
          id: commId + 1,
          commId,
          name: comm.name,
          papers: comm.size,
          citations: citationsStr,
          keyFigures: topAuthors,
          tags: topKeywords,
          description: comm.description || `Thematic school of thought examining ${comm.name.toLowerCase()} architectures, computational methods, and empirical evidence.`,
          yearRange,
        };
      });
    }

    if (config?.schools && config.schools.length > 0) {
      return config.schools.map((s, idx) => {
        const rawSchool = s as any;
        const authors = s.key_authors || rawSchool.keyFigures || [];
        const tags = s.core_concepts || rawSchool.keywords || ['Research', 'Methods'];
        const pCount = s.paperCount || s.papers_count || 10;
        const yr = rawSchool.yearRange ? `${rawSchool.yearRange[0]}–${rawSchool.yearRange[1]}` : 'All time';

        return {
          id: s.id ?? idx + 1,
          commId: idx,
          name: s.name,
          papers: pCount,
          citations: 'Active',
          keyFigures: authors.length > 0 ? authors.join(', ') : 'Various Authors',
          tags,
          description: s.description || `Research paradigm investigating ${s.name.toLowerCase()} principles.`,
          yearRange: yr,
        };
      });
    }

    const domainName = config?.domainName || config?.domain || 'Scientific Field';
    return getFallbackSchools(domainName);
  }, [config, analysisData]);

  const totalPapers = useMemo(() => {
    return schools.reduce((sum, s) => sum + s.papers, 0);
  }, [schools]);

  const maxPapers = useMemo(() => {
    return Math.max(...schools.map((s) => s.papers), 1);
  }, [schools]);

  const sectionRef = useScrollAnimation<HTMLElement>({
    selector: '.scroll-animate',
    stagger: 0.07,
    y: 25,
    duration: 0.5,
  });

  return (
    <section
      id="schools"
      ref={sectionRef}
      className="w-full bg-off-white py-space-24"
    >
      <div className="section-container">
        {/* Section Header */}
        <div className="scroll-animate mb-space-6">
          <span className="label text-accent-gold tracking-[0.08em]">
            ANALYSIS 01
          </span>
        </div>
        <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-4">
          Schools of Thought
        </h2>
        <p className="scroll-animate body-lg text-text-secondary mb-space-12 max-w-3xl">
          {schools.length} research communities identified in {config.domain} via Louvain modularity optimization (Q = {analysisData?.modularity_q?.toFixed(2) || '0.22'})
        </p>

        {/* Donut chart + stats row */}
        <div className="scroll-animate flex flex-col lg:flex-row items-center gap-space-8 mb-space-12 p-space-6 bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px]">
          <MiniDonutChart schools={schools} totalPapers={totalPapers} />
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-space-4">
            {schools.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getCommunityColor(s.commId) }}
                />
                <div className="flex flex-col">
                  <span className="font-mono text-[11px] text-text-primary font-medium leading-tight">
                    {s.name.length > 22 ? s.name.slice(0, 22) + '...' : s.name}
                  </span>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    {s.papers} papers
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-6">
          {schools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              maxPapers={maxPapers}
              onExplore={(s) => setModalSchool(s)}
              onFocus3D={handleFocus3D}
            />
          ))}
        </div>
      </div>

      {/* School Deep-Dive Exploration Modal */}
      <SchoolExplorerModal
        isOpen={!!modalSchool}
        onClose={() => setModalSchool(null)}
        school={modalSchool}
      />
    </section>
  );
}

