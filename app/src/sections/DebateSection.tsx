import { useRef, useEffect } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import * as d3 from 'd3';

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

export interface DebateTrack {
  id: number;
  name: string;
  color: string;
  startYear: number;
  endYear: number;
  peakPeriod: string;
  consensus: 'SETTLED' | 'ONGOING' | 'EMERGING';
  consensusPercent: number;
  description: string;
  keyPapers: { year: number; author: string; title: string; citations?: number }[];
  // Intensity per year (paper count on this topic)
  intensity: { year: number; count: number }[];
}

const DEFAULT_DEBATE_TRACKS: DebateTrack[] = [
  {
    id: 1,
    name: 'Static vs Dynamic FC',
    color: '#3B6FC4',
    startYear: 2010,
    endYear: 2026,
    peakPeriod: '2014–2018',
    consensus: 'SETTLED',
    consensusPercent: 70,
    description:
      'Whether resting-state connectivity is stable over time or inherently time-varying. The 2014 Allen et al. and Hutchison et al. papers established dynamic FC as a real phenomenon, but debate continues on methods and biological significance.',
    keyPapers: [
      { year: 2014, author: 'Allen et al.', title: 'Tracking whole-brain connectivity dynamics', citations: 3400 },
      { year: 2014, author: 'Hutchison et al.', title: 'Dynamic functional connectivity', citations: 2100 },
      { year: 2016, author: 'Preti et al.', title: 'Dynamic reconfiguration', citations: 890 },
    ],
    intensity: [
      { year: 2010, count: 1 }, { year: 2011, count: 1 }, { year: 2012, count: 2 },
      { year: 2013, count: 3 }, { year: 2014, count: 6 }, { year: 2015, count: 7 },
      { year: 2016, count: 8 }, { year: 2017, count: 7 }, { year: 2018, count: 6 },
      { year: 2019, count: 5 }, { year: 2020, count: 4 }, { year: 2021, count: 4 },
      { year: 2022, count: 3 }, { year: 2023, count: 3 }, { year: 2024, count: 2 },
      { year: 2025, count: 1 }, { year: 2026, count: 1 },
    ],
  },
  {
    id: 2,
    name: 'Group vs Individual Networks',
    color: '#5B8C7B',
    startYear: 2015,
    endYear: 2026,
    peakPeriod: '2017–2021',
    consensus: 'ONGOING',
    consensusPercent: 55,
    description:
      'Whether group-averaged parcellations miss critical individual differences in network topology. Finn et al. 2015 showed connectome fingerprinting; Gordon et al. 2017 demonstrated individual parcellation variability.',
    keyPapers: [
      { year: 2015, author: 'Finn et al.', title: 'Functional connectome fingerprinting', citations: 3318 },
      { year: 2017, author: 'Gordon et al.', title: 'Precision functional mapping', citations: 1543 },
      { year: 2015, author: 'Laumann et al.', title: 'Individual differences', citations: 780 },
    ],
    intensity: [
      { year: 2015, count: 2 }, { year: 2016, count: 3 }, { year: 2017, count: 6 },
      { year: 2018, count: 7 }, { year: 2019, count: 7 }, { year: 2020, count: 6 },
      { year: 2021, count: 5 }, { year: 2022, count: 4 }, { year: 2023, count: 4 },
      { year: 2024, count: 3 }, { year: 2025, count: 2 }, { year: 2026, count: 1 },
    ],
  },
  {
    id: 3,
    name: 'Null Model Controversy',
    color: '#E8A820',
    startYear: 2009,
    endYear: 2026,
    peakPeriod: 'Ongoing',
    consensus: 'ONGOING',
    consensusPercent: 40,
    description:
      'What constitutes appropriate null models for brain networks. Rubinov & Sporns 2010 standardized approaches, but Zalesky et al. 2012 showed that null model choice dramatically affects conclusions.',
    keyPapers: [
      { year: 2010, author: 'Rubinov & Sporns', title: 'Complex network measures', citations: 5200 },
      { year: 2012, author: 'Zalesky et al.', title: 'On the use of null models', citations: 450 },
      { year: 2014, author: 'Colizza et al.', title: 'Detecting rich-clusters', citations: 320 },
    ],
    intensity: [
      { year: 2009, count: 1 }, { year: 2010, count: 3 }, { year: 2011, count: 2 },
      { year: 2012, count: 4 }, { year: 2013, count: 3 }, { year: 2014, count: 4 },
      { year: 2015, count: 3 }, { year: 2016, count: 3 }, { year: 2017, count: 2 },
      { year: 2018, count: 3 }, { year: 2019, count: 2 }, { year: 2020, count: 2 },
      { year: 2021, count: 3 }, { year: 2022, count: 2 }, { year: 2023, count: 2 },
      { year: 2024, count: 2 }, { year: 2025, count: 1 }, { year: 2026, count: 1 },
    ],
  },
  {
    id: 4,
    name: 'Structure-Function Coupling',
    color: '#D4A853',
    startYear: 2008,
    endYear: 2026,
    peakPeriod: 'Steady',
    consensus: 'EMERGING',
    consensusPercent: 50,
    description:
      'How well structural connectivity predicts functional connectivity. Honey et al. 2009 showed coupling is partial; subsequent work explored the "missing link" — why structure doesn\'t fully explain function.',
    keyPapers: [
      { year: 2009, author: 'Honey et al.', title: 'Predicting human resting-state', citations: 1800 },
      { year: 2014, author: 'Suárez et al.', title: 'Structural architecture regulates', citations: 560 },
      { year: 2016, author: 'Messé et al.', title: 'Relating structural and functional', citations: 340 },
    ],
    intensity: [
      { year: 2008, count: 1 }, { year: 2009, count: 2 }, { year: 2010, count: 2 },
      { year: 2011, count: 2 }, { year: 2012, count: 3 }, { year: 2013, count: 3 },
      { year: 2014, count: 4 }, { year: 2015, count: 3 }, { year: 2016, count: 4 },
      { year: 2017, count: 3 }, { year: 2018, count: 3 }, { year: 2019, count: 3 },
      { year: 2020, count: 4 }, { year: 2021, count: 3 }, { year: 2022, count: 3 },
      { year: 2023, count: 3 }, { year: 2024, count: 2 }, { year: 2025, count: 2 },
      { year: 2026, count: 1 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  CONSENSUS BADGE                                                    */
/* ------------------------------------------------------------------ */

function ConsensusBadge({ status }: { status: DebateTrack['consensus']; percent?: number }) {
  const colors = {
    SETTLED: { bg: 'rgba(91,140,123,0.12)', text: '#5B8C7B', border: 'rgba(91,140,123,0.25)' },
    ONGOING: { bg: 'rgba(232,168,32,0.12)', text: '#B8860B', border: 'rgba(232,168,32,0.25)' },
    EMERGING: { bg: 'rgba(59,111,196,0.12)', text: '#3B6FC4', border: 'rgba(59,111,196,0.25)' },
  };
  const c = colors[status];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-medium border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: c.text }}
      />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  D3 TIMELINE CHART                                                  */
/* ------------------------------------------------------------------ */

function TimelineChart({ tracks }: { tracks: DebateTrack[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !tracks || tracks.length === 0) return;
    const container = ref.current;

    const draw = () => {
      container.innerHTML = '';
      const isMobile = container.clientWidth < 640;

      const allYears = tracks.flatMap((t) => t.intensity.map((i) => i.year));
      const yearMin = allYears.length > 0 ? Math.min(...allYears) : 2008;
      const yearMax = allYears.length > 0 ? Math.max(...allYears) : 2026;

      const margin = { top: 40, right: isMobile ? 16 : 30, bottom: 60, left: isMobile ? 120 : 220 };
      const minW = isMobile ? 380 : 600;
      const width = Math.max(minW, container.clientWidth - margin.left - margin.right);
      const height = Math.max(380, tracks.length * 85) - margin.top - margin.bottom;

      const svg = d3
        .select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Scales
      const xScale = d3.scaleLinear().domain([yearMin, yearMax]).range([0, width]);

      const trackHeight = height / tracks.length;
      const barHeight = trackHeight * 0.35;

      // Find max intensity for scaling
      const maxCount = d3.max(tracks, (d) => d3.max(d.intensity, (i) => i.count)) || 10;
      const yBarScale = d3.scaleLinear().domain([0, maxCount]).range([0, barHeight]);

      // Draw era dividers
      const span = yearMax - yearMin;
      const eras = [
        { year: Math.round(yearMin + span * 0.33), label: 'Formative Phase' },
        { year: Math.round(yearMin + span * 0.66), label: 'Methodological Shift' },
      ];

      eras.forEach((era) => {
        if (era.year <= yearMin || era.year >= yearMax) return;
        g.append('line')
          .attr('x1', xScale(era.year))
          .attr('x2', xScale(era.year))
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', '#D0CCC4')
          .attr('stroke-dasharray', '4,4')
          .attr('stroke-width', 1)
          .attr('opacity', 0.5);

        if (era.label) {
          g.append('text')
            .attr('x', xScale(era.year))
            .attr('y', height + 35)
            .attr('text-anchor', 'middle')
            .attr('class', 'font-mono')
            .style('font-size', '10px')
            .style('fill', '#8B8DA3')
            .text(era.label);
        }
      });

      // X-axis
      const xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d')).ticks(Math.min(10, span)).tickSize(0).tickPadding(8);
      const xAxisG = g
        .append('g')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);
      xAxisG.select('.domain').attr('stroke', '#E5E2DC').attr('stroke-width', 1);
      xAxisG.selectAll('.tick line').remove();
      xAxisG.selectAll('.tick text').attr('class', 'font-mono').style('font-size', '11px').style('fill', '#8B8DA3');

      // Draw tracks
      tracks.forEach((track, trackIdx) => {
        const trackY = trackIdx * trackHeight;
        const centerY = trackY + trackHeight / 2;

        // Track background (alternating)
        if (trackIdx % 2 === 0) {
          g.append('rect')
            .attr('x', 0)
            .attr('y', trackY)
            .attr('width', width)
            .attr('height', trackHeight)
            .attr('fill', '#FFFFFF')
            .attr('opacity', 0.6)
            .attr('rx', 4);
        }

        // Track label (left side)
        const labelG = svg.append('g').attr('transform', `translate(0, ${margin.top + centerY})`);

        // Color indicator bar
        labelG
          .append('rect')
          .attr('x', 8)
          .attr('y', -barHeight / 2 - 6)
          .attr('width', 4)
          .attr('height', barHeight + 12)
          .attr('fill', track.color)
          .attr('rx', 2);

        const maxNameLen = isMobile ? 13 : 28;
        const displayName = track.name.length > maxNameLen ? track.name.slice(0, maxNameLen - 1) + '…' : track.name;
        const subText = isMobile ? `${track.startYear}–${track.endYear}` : `${track.startYear}–${track.endYear}  ·  Peak: ${track.peakPeriod}`;

        labelG
          .append('text')
          .attr('x', 18)
          .attr('y', -4)
          .attr('class', 'font-mono')
          .style('font-size', isMobile ? '10px' : '12px')
          .style('font-weight', 600)
          .style('fill', '#1A1B3A')
          .text(displayName);

        labelG
          .append('text')
          .attr('x', 18)
          .attr('y', 12)
          .attr('class', 'font-mono')
          .style('font-size', isMobile ? '9px' : '10px')
          .style('fill', '#8B8DA3')
          .text(subText);

        // Intensity bars (grouped by year)
        const barGroup = g.append('g');

        track.intensity.forEach((d) => {
          const x = xScale(d.year);
        const barW = Math.max(3, (width / Math.max(1, (yearMax - yearMin))) * 0.7);

        barGroup
          .append('rect')
          .attr('x', x - barW / 2)
          .attr('y', centerY - yBarScale(d.count) / 2)
          .attr('width', barW)
          .attr('height', 0)
          .attr('fill', track.color)
          .attr('opacity', 0.6)
          .attr('rx', 2)
          .transition()
          .duration(800)
          .delay(200 + trackIdx * 150 + (d.year - yearMin) * 20)
          .attr('height', yBarScale(d.count))
          .attr('y', centerY - yBarScale(d.count) / 2);
      });

      // Key paper markers (circles)
      track.keyPapers.forEach((paper) => {
        const px = xScale(paper.year);
        const circleR = paper.citations
          ? Math.max(4, Math.min(10, Math.sqrt(paper.citations) / 15))
          : 5;

        const markerG = g.append('g');

        markerG
          .append('circle')
          .attr('cx', px)
          .attr('cy', centerY + barHeight / 2 + 12)
          .attr('r', 0)
          .attr('fill', track.color)
          .attr('opacity', 0.85)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .transition()
          .duration(400)
          .delay(600 + trackIdx * 100)
          .attr('r', circleR);

        });
      });
    };

    draw();
    window.addEventListener('resize', draw);

    return () => {
      window.removeEventListener('resize', draw);
      container.innerHTML = '';
    };
  }, [tracks]);

  return <div ref={ref} className="w-full overflow-x-auto" />;
}

/* ------------------------------------------------------------------ */
/*  DEBATE DETAIL CARD                                                 */
/* ------------------------------------------------------------------ */

function DebateCard({ track }: { track: DebateTrack }) {
  return (
    <div
      className="scroll-animate bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-6"
      style={{ borderLeftWidth: '4px', borderLeftColor: track.color }}
    >
      <div className="flex items-center gap-2 mb-space-2">
        <h3 className="heading-3 font-serif text-accent-indigo">
          {track.name}
        </h3>
      </div>

      <div className="flex items-center gap-3 mb-space-3">
        <span
          className="inline-block rounded px-2 py-0.5 font-mono text-[11px] font-medium"
          style={{ background: 'rgba(231,227,219,0.5)', color: '#5A5C7A' }}
        >
          {track.startYear}–{track.endYear}
        </span>
        <span className="mono-sm text-text-tertiary">Peak: {track.peakPeriod}</span>
        <div className="ml-auto">
          <ConsensusBadge status={track.consensus} percent={track.consensusPercent} />
        </div>
      </div>

      {/* Description */}
      <p className="body-sm text-text-secondary leading-relaxed mb-space-4">
        {track.description}
      </p>

      {/* Consensus progress bar */}
      <div className="mb-space-4">
        <div className="flex items-center justify-between mb-space-1">
          <span className="mono-sm text-text-tertiary">Field Consensus</span>
          <span className="mono text-text-primary font-medium">{track.consensusPercent}%</span>
        </div>
        <div className="w-full h-2 bg-warm-gray rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${track.consensusPercent}%`, backgroundColor: track.color }}
          />
        </div>
      </div>

      {/* Key papers */}
      <div className="pt-space-3 border-t border-border-light">
        <span className="mono-sm text-text-tertiary uppercase tracking-wide">Key Papers</span>
        <ul className="mt-space-2 space-y-1">
          {track.keyPapers.map((paper) => (
            <li key={`${paper.author}-${paper.year}`} className="mono text-text-secondary text-[12px]">
              {paper.author} {paper.year} — <em className="text-text-primary">{paper.title}</em>
              {paper.citations ? (
                <span className="text-text-tertiary ml-1">({paper.citations.toLocaleString()} cites)</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN SECTION                                                       */
/* ------------------------------------------------------------------ */

export default function DebateSection() {
  const { config } = useLiteratureMap();
  const tracks: DebateTrack[] = (config.debates && config.debates.length > 0)
    ? (config.debates as any)
    : DEFAULT_DEBATE_TRACKS;

  const sectionRef = useScrollAnimation<HTMLElement>({
    selector: '.scroll-animate',
    stagger: 0.08,
    y: 25,
    duration: 0.5,
  });

  return (
    <section
      id="debates"
      ref={sectionRef}
      className="w-full bg-warm-gray py-space-24"
    >
      <div className="section-container">
        {/* Section Header */}
        <div className="scroll-animate mb-space-6">
          <span className="label text-accent-gold tracking-[0.08em]">
            ANALYSIS 02
          </span>
        </div>
        <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-4">
          How the Debates Evolved
        </h2>
        <p className="scroll-animate body-lg text-text-secondary mb-space-12 max-w-3xl">
          {tracks.length} enduring debates that shaped {config.domain} from {Math.min(...tracks.map((t) => t.startYear))} to today
        </p>

        {/* D3 Timeline Chart */}
        <div className="scroll-animate mb-space-12 bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-4">
          <div className="sm:hidden flex items-center gap-1.5 font-mono text-[10px] text-text-tertiary mb-2">
            <span>↔</span> Swipe horizontally to inspect full timeline &amp; milestones
          </div>
          <div className="overflow-x-auto">
            <TimelineChart tracks={tracks} />
          </div>
        </div>

        {/* Debate Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
          {tracks.map((track) => (
            <DebateCard key={track.id} track={track} />
          ))}
        </div>
      </div>
    </section>
  );
}
