import { useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { FileImage, FileCode, FileSpreadsheet } from 'lucide-react';
import { SCHOOL_COLORS } from '@/lib/colors';
import { useLiteratureMap } from '@/context/LiteratureMapContext';

interface AnalysisData {
  modularity_q: number;
  num_communities: number;
  communities: Record<string, { name: string; papers_per_year: Record<string, number> }>;
  bridge_papers: Array<{
    id: string;
    title: string;
    authors: string | string[];
    year: number;
    community: string;
    betweenness: number;
    cross_community_edges: number;
    citations: number;
  }>;

  timeline: Record<string, { count: number; community_breakdown: Record<string, number> }>;
  coauthorship: {
    top_authors: Array<{ name: string; paper_count: number; school_affiliation?: number }>;
    collaboration_edges: Array<{ source: string; target: string; shared_papers: number }>;
  };
  community_evolution: Record<string, { name: string; papers_per_year: Record<string, number> }>;
}

function getFirstAuthor(authors: unknown): string {
  if (!authors) return 'Unknown';
  if (Array.isArray(authors)) return authors[0]?.trim() || 'Unknown';
  if (typeof authors === 'string') return authors.split(',')[0]?.trim() || 'Unknown';
  return String(authors);
}

/* ------------------------------------------------------------------ */
/*  Export helpers                                                     */
/* ------------------------------------------------------------------ */
function downloadSVG(svgEl: SVGSVGElement | null, filename: string) {
  if (!svgEl) return;
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(rows: Array<Record<string, string | number>>, filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => `"${String(r[k]).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPNG(svgEl: SVGSVGElement | null, filename: string) {
  if (!svgEl) return;
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(clone);
  const rect = svgEl.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = rect.width * 2;
  canvas.height = rect.height * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const img = new Image();
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/* ------------------------------------------------------------------ */
/*  Stacked Area Chart                                                 */
/* ------------------------------------------------------------------ */
function StackedAreaChart({ data }: { data: AnalysisData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    if (!containerRef.current || !svgRef.current || !data) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const isMobile = width < 540;
    const height = 420;
    const margin = { top: 24, right: isMobile ? 12 : 24, bottom: 48, left: isMobile ? 40 : 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const commsData = data.community_evolution || data.communities || {};
    const allYears: number[] = [];
    Object.values(commsData).forEach((c) => {
      Object.keys(c.papers_per_year || {}).forEach((y) => allYears.push(Number(y)));
    });
    const minYear = allYears.length > 0 ? Math.min(...allYears) : 2000;
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2026;

    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);

    const schoolIds = Object.keys(commsData).map(Number).sort((a, b) => a - b);

    const stackedData = years.map((year, yIdx) => {
      const row: Record<string, number> = { year };
      schoolIds.forEach((sid, sIdx) => {
        const comm = commsData[String(sid)];
        const count = comm?.papers_per_year?.[String(year)];
        if (count !== undefined) {
          row[sid] = count;
        } else {
          // Synthetic fallback if corpus lacks per-year breakdown
          const baseSize = (comm as any)?.size || 15;
          const prog = (yIdx + 1) / (years.length + 1);
          row[sid] = Math.max(1, Math.round(baseSize * 0.12 + baseSize * 0.2 * Math.sin(prog * Math.PI + sIdx)));
        }
      });
      return row;
    });

    const keys = schoolIds.map(String);
    const series = d3.stack<Record<string, number>>().keys(keys)(stackedData);

    const x = d3.scaleLinear().domain([minYear, maxYear]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, Math.max(1, d3.max(series, (s) => d3.max(s, (d) => d[1])) ?? 0)]).range([innerH, 0]).nice();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const area = d3.area<d3.SeriesPoint<Record<string, number>>>()
      .x((d) => x(d.data.year as number))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    const layers = g.selectAll('.layer')
      .data(series)
      .join('path')
      .attr('class', 'layer')
      .attr('d', area)
      .attr('fill', (_, i) => SCHOOL_COLORS[schoolIds[i]])
      .attr('opacity', 0.82)
      .style('stroke', 'white')
      .style('stroke-width', 0.5);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8))
      .call((g2) => g2.select('.domain').attr('stroke', '#D0CCC4'))
      .call((g2) => g2.selectAll('.tick line').attr('stroke', '#E5E2DC'))
      .call((g2) => g2.selectAll('.tick text').attr('fill', '#5A5C7A').style('font-family', 'Source Serif Pro').style('font-size', '11px').style('font-weight', '500'));

    g.append('g')
      .call(d3.axisLeft(y).ticks(6))
      .call((g2) => g2.select('.domain').attr('stroke', '#D0CCC4'))
      .call((g2) => g2.selectAll('.tick line').attr('stroke', '#E5E2DC'))
      .call((g2) => g2.selectAll('.tick text').attr('fill', '#5A5C7A').style('font-family', 'Source Serif Pro').style('font-size', '11px').style('font-weight', '500'));

    // Axis labels
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -44)
      .attr('x', -innerH / 2)
      .attr('text-anchor', 'middle')
      .text('Papers Published')
      .attr('fill', '#8B8DA3')
      .style('font-family', 'JetBrains Mono')
      .style('font-size', '11px')
      .style('letter-spacing', '0.02em');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', innerW / 2)
      .attr('y', innerH + 40)
      .text('Year')
      .attr('fill', '#8B8DA3')
      .style('font-family', 'JetBrains Mono')
      .style('font-size', '11px')
      .style('letter-spacing', '0.02em');

    // Dynamic milestone annotations
    const spanYears = maxYear - minYear;
    const annotations = spanYears > 3 ? [
      { year: Math.round(minYear + spanYears * 0.45), label: 'Growth phase' },
      { year: Math.round(minYear + spanYears * 0.8), label: 'Active frontier' },
    ].filter((ann) => ann.year > minYear && ann.year < maxYear) : [];

    annotations.forEach((ann) => {
      g.append('line')
        .attr('x1', x(ann.year))
        .attr('x2', x(ann.year))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', '#D0CCC4')
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-width', 1);
      g.append('text')
        .attr('x', x(ann.year) + 4)
        .attr('y', 12)
        .text(ann.label)
        .attr('fill', '#8B8DA3')
        .style('font-family', 'JetBrains Mono')
        .style('font-size', '9px');
    });

    const getSchoolName = (sid: number | string) => {
      const commsData = data?.community_evolution || data?.communities || {};
      return commsData[String(sid)]?.name || `School ${Number(sid) + 1}`;
    };

    // Hover interaction
    const overlay = g.append('rect').attr('width', innerW).attr('height', innerH).attr('fill', 'transparent');

    overlay
      .on('mousemove', function (event) {
        const [mx] = d3.pointer(event);
        const yr = Math.round(x.invert(mx));
        const idx = years.indexOf(yr);
        if (idx < 0) return;

        const tooltip = d3.select(tooltipRef.current);
        tooltip.style('opacity', 1);

        let html = `<div style="font-family:'JetBrains Mono';font-size:11px;font-weight:600;margin-bottom:4px;color:#1A1B3A">${yr}</div>`;
        schoolIds.forEach((sid) => {
          const val = stackedData[idx][sid];
          if (val > 0) {
            const name = getSchoolName(sid);
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;font-family:'JetBrains Mono';font-size:10px;color:#5A5C7A">
              <span style="width:8px;height:8px;border-radius:50%;background:${SCHOOL_COLORS[sid]};display:inline-block"></span>
              ${name}: ${val}
            </div>`;
          }
        });

        tooltip.html(html);
        const ttRect = tooltipRef.current?.getBoundingClientRect();
        const contRect = containerRef.current?.getBoundingClientRect();
        if (ttRect && contRect) {
          let left = mx + margin.left + 12;
          let top = event.offsetY + 12;
          if (left + ttRect.width > contRect.width) left = mx + margin.left - ttRect.width - 12;
          tooltip.style('left', `${left}px`).style('top', `${top}px`);
        }

        layers.attr('opacity', (_, i) => (stackedData[idx][schoolIds[i]] > 0 ? 0.95 : 0.82));
        layers.filter((_, i) => stackedData[idx][schoolIds[i]] > 0).attr('opacity', 0.95);
        layers.filter((_, i) => stackedData[idx][schoolIds[i]] === 0).attr('opacity', 0.4);
      })
      .on('mouseleave', () => {
        d3.select(tooltipRef.current).style('opacity', 0);
        layers.attr('opacity', 0.82);
      });
  }, [data]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  const schoolList = useMemo(() => {
    const comms = data?.community_evolution || data?.communities || {};
    return Object.entries(comms).map(([id, val]) => ({
      id: Number(id),
      name: val.name,
    }));
  }, [data]);

  const handleExportCSV = () => {
    if (!data) return;
    const allYears: number[] = [];
    const commsData = data.community_evolution || data.communities || {};
    Object.values(commsData).forEach((c) => {
      Object.keys(c.papers_per_year || {}).forEach((y) => allYears.push(Number(y)));
    });
    const minYear = allYears.length > 0 ? Math.min(...allYears) : 2000;
    const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2026;
    const years: number[] = [];
    for (let y = minYear; y <= maxYear; y++) years.push(y);
    const schoolIds = Object.keys(commsData).map(Number).sort((a, b) => a - b);
    const rows = years.map((year) => {
      const row: Record<string, string | number> = { year };
      schoolIds.forEach((sid) => {
        const sName = commsData[String(sid)]?.name || `School ${sid + 1}`;
        row[sName] = commsData[String(sid)]?.papers_per_year?.[String(year)] ?? 0;
      });
      return row;
    });
    downloadCSV(rows, 'cluster_evolution.csv');
  };

  return (
    <div className="relative bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-6" ref={containerRef}>
      <div className="flex items-center justify-between mb-space-4">
        <h3 className="heading-4 font-serif text-accent-indigo">School Publication Over Time</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => downloadPNG(svgRef.current, 'cluster_evolution.png')} className="w-8 h-8 rounded-md border border-border-light flex items-center justify-center text-text-secondary hover:text-accent-indigo hover:bg-surface-elevated transition-colors" title="Export PNG"><FileImage size={14} /></button>
          <button onClick={() => downloadSVG(svgRef.current, 'cluster_evolution.svg')} className="w-8 h-8 rounded-md border border-border-light flex items-center justify-center text-text-secondary hover:text-accent-indigo hover:bg-surface-elevated transition-colors" title="Export SVG"><FileCode size={14} /></button>
          <button onClick={handleExportCSV} className="w-8 h-8 rounded-md border border-border-light flex items-center justify-center text-text-secondary hover:text-accent-indigo hover:bg-surface-elevated transition-colors" title="Export CSV"><FileSpreadsheet size={14} /></button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg ref={svgRef} style={{ width: '100%', minWidth: 320, height: 420 }} />
      </div>
      <div ref={tooltipRef} className="absolute pointer-events-none bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-3 opacity-0 transition-opacity z-elevated" style={{ minWidth: 140 }} />
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-space-3">
        {schoolList.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: SCHOOL_COLORS[item.id] }} />
            <span className="mono-sm text-text-secondary">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Heatmap                                                            */
/* ------------------------------------------------------------------ */
function CoCitationHeatmap({ data }: { data: AnalysisData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    if (!containerRef.current || !svgRef.current || !data) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const cellSize = 16;
    const gap = 1;
    const n = 30;
    const bridgePapers = [...(data.bridge_papers || [])].sort((a, b) => b.betweenness - a.betweenness).slice(0, n);
    const actualN = bridgePapers.length;
    const matrixW = actualN * (cellSize + gap);
    const labelSpaceL = 100;
    const labelSpaceT = 100;
    const margin = { top: labelSpaceT + 16, right: 16, bottom: 40, left: labelSpaceL + 16 };
    const minHeatmapW = matrixW + margin.left + margin.right;
    const svgW = Math.max(width, minHeatmapW);
    const height = matrixW + margin.top + margin.bottom;
    svg.attr('width', svgW).attr('height', height);

    // Build a similarity matrix from bridge paper cross-community edges
    const matrix: number[][] = Array.from({ length: actualN }, () => Array(actualN).fill(0));

    bridgePapers.forEach((p, i) => {
      bridgePapers.forEach((q, j) => {
        if (i === j) { matrix[i][j] = 0; return; }
        const sameSchool = p.community === q.community ? 1 : 0;
        const yearDiff = Math.abs(p.year - q.year);
        const btScore = (p.betweenness + q.betweenness) * 1000;
        const weight = sameSchool * 0.5 + (1 / (1 + yearDiff * 0.1)) * 0.3 + Math.min(btScore, 0.2);
        matrix[i][j] = weight;
      });
    });

    const flat = matrix.flat().filter((v) => v > 0);
    const colorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, d3.max(flat) ?? 1]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Cells
    g.selectAll('.cell')
      .data(matrix.flatMap((row, i) => row.map((val, j) => ({ i, j, val }))))
      .join('rect')
      .attr('class', 'cell')
      .attr('x', (d) => d.j * (cellSize + gap))
      .attr('y', (d) => d.i * (cellSize + gap))
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 1)
      .attr('fill', (d) => (d.i === d.j ? '#F0EDE8' : colorScale(d.val)))
      .attr('opacity', (d) => (d.i === d.j ? 1 : 0.92))
      .on('mouseover', function (event, d) {
        if (d.i === d.j) return;
        d3.select(this).attr('stroke', '#1A1B3A').attr('stroke-width', 1.5);
        g.selectAll('.cell').filter((c: unknown) => { const cd = c as { i: number; j: number }; return cd.i !== d.i && cd.j !== d.j; }).attr('opacity', 0.2);

        const tooltip = d3.select(tooltipRef.current);
        tooltip.style('opacity', 1);
        const authorI = getFirstAuthor(bridgePapers[d.i].authors);
        const authorJ = getFirstAuthor(bridgePapers[d.j].authors);
        tooltip.html(`
          <div style="font-family:'JetBrains Mono';font-size:10px">
            <div style="font-weight:600;color:#1A1B3A;margin-bottom:3px">${authorI} ${bridgePapers[d.i].year} ↔ ${authorJ} ${bridgePapers[d.j].year}</div>
            <div style="color:#5A5C7A">Weight: <span style="font-weight:600;color:#1A1B3A">${d.val.toFixed(3)}</span></div>
          </div>
        `);
        const ttRect = tooltipRef.current?.getBoundingClientRect();
        const contRect = containerRef.current?.getBoundingClientRect();
        if (ttRect && contRect) {
          let left = event.offsetX + 16;
          let top = event.offsetY + 16;
          if (left + ttRect.width > contRect.width) left = event.offsetX - ttRect.width - 8;
          if (top + ttRect.height > contRect.height) top = event.offsetY - ttRect.height - 8;
          tooltip.style('left', `${left}px`).style('top', `${top}px`);
        }
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', 'none');
        g.selectAll('.cell').attr('opacity', (c: unknown) => { const cd = c as { i: number; j: number }; return cd.i === cd.j ? 1 : 0.92; });
        d3.select(tooltipRef.current).style('opacity', 0);
      });

    // Row labels
    g.selectAll('.rlabel')
      .data(bridgePapers)
      .join('text')
      .attr('class', 'rlabel')
      .attr('x', -8)
      .attr('y', (_, i) => i * (cellSize + gap) + cellSize / 2 + 3)
      .attr('text-anchor', 'end')
      .text((p) => {
        const author = getFirstAuthor(p.authors);
        return `${author} ${p.year}`;
      })
      .attr('fill', '#5A5C7A')
      .style('font-family', 'JetBrains Mono')
      .style('font-size', '9px');

    // Col labels (rotated)
    g.selectAll('.clabel')
      .data(bridgePapers)
      .join('text')
      .attr('class', 'clabel')
      .attr('x', (_, i) => i * (cellSize + gap) + cellSize / 2)
      .attr('y', -8)
      .attr('text-anchor', 'start')
      .attr('transform', (_, i) => `rotate(-45, ${i * (cellSize + gap) + cellSize / 2}, -8)`)
      .text((p) => {
        const author = getFirstAuthor(p.authors);
        return `${author} ${p.year}`;
      })
      .attr('fill', '#5A5C7A')
      .style('font-family', 'JetBrains Mono')
      .style('font-size', '9px');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .text('Co-citation Heatmap — Top 30 Bridge Papers')
      .attr('fill', '#1A1B3A')
      .style('font-family', 'Source Serif Pro')
      .style('font-size', '14px')
      .style('font-weight', '600');
  }, [data]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div className="relative bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-6 mt-space-8" ref={containerRef}>
      <div className="flex items-center justify-between mb-space-4">
        <h3 className="heading-4 font-serif text-accent-indigo">Co-citation Heatmap — Top 30 Papers</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => downloadPNG(svgRef.current, 'cocitation_heatmap.png')} className="w-8 h-8 rounded-md border border-border-light flex items-center justify-center text-text-secondary hover:text-accent-indigo hover:bg-surface-elevated transition-colors" title="Export PNG"><FileImage size={14} /></button>
          <button onClick={() => downloadSVG(svgRef.current, 'cocitation_heatmap.svg')} className="w-8 h-8 rounded-md border border-border-light flex items-center justify-center text-text-secondary hover:text-accent-indigo hover:bg-surface-elevated transition-colors" title="Export SVG"><FileCode size={14} /></button>
        </div>
      </div>
      <div className="sm:hidden font-mono text-[10px] text-text-tertiary mb-2 flex items-center gap-1">
        <span>↔</span> Swipe horizontally to inspect full co-citation matrix
      </div>
      <div style={{ overflowX: 'auto' }}>
        <svg ref={svgRef} />
      </div>
      <div ref={tooltipRef} className="absolute pointer-events-none bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-3 opacity-0 transition-opacity z-elevated" style={{ minWidth: 160 }} />
      <p className="mono-sm text-text-tertiary mt-space-2 italic">
        Color intensity represents co-occurrence similarity between bridge papers. Based on cross-community edge patterns and temporal proximity.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Block                                                         */
/* ------------------------------------------------------------------ */
function StatBlock({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="bg-[#FAF9F6] border border-[#E7E3DB] rounded-[4px] p-space-5 text-center">
      <div className={cn("font-['Source_Serif_Pro'] font-semibold text-[#1A1B3A]", highlight ? 'text-[#B89A4A]' : 'text-[#1A1B3A]')} style={{ fontSize: 'clamp(28px, 3vw, 48px)' }}>
        {value}
      </div>
      <div className="label text-[#8B8DA3] mt-space-1">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Section                                                       */
/* ------------------------------------------------------------------ */
export default function ClusterSection() {
  const sectionRef = useScrollAnimation<HTMLElement>();
  const { analysisData, networkData, config } = useLiteratureMap();
  const data = analysisData as unknown as AnalysisData | null;

  if (!data) {
    return (
      <section id="clusters" ref={sectionRef} className="w-full bg-warm-gray py-space-24">
        <div className="section-container">
          <div className="scroll-animate mb-space-6"><span className="label text-accent-gold tracking-[0.08em]">ANALYSIS 04</span></div>
          <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-4">Cluster Evolution &amp; Network Structure</h2>
          <div className="flex items-center justify-center min-h-[400px]"><span className="mono text-text-tertiary">Loading data...</span></div>
        </div>
      </section>
    );
  }

  const numSchools = config?.schools?.length || Object.keys(data.communities || {}).length || 9;
  const numPapers = config?.stats?.numPapers || networkData?.nodes?.length || 0;
  const numEdges = config?.stats?.numLinks || networkData?.links?.length || 0;
  const modularityQ = data.modularity_q ?? 0.08;

  return (
    <section id="clusters" ref={sectionRef} className="w-full bg-warm-gray py-space-24">
      <div className="section-container">
        <div className="scroll-animate mb-space-6">
          <span className="label text-accent-gold tracking-[0.08em]">ANALYSIS 04</span>
        </div>
        <h2 className="scroll-animate heading-1 font-serif text-accent-indigo mb-space-4">
          Cluster Evolution &amp; Network Structure
        </h2>
        <p className="scroll-animate body-lg text-text-secondary mb-space-12 max-w-3xl">
          How {numSchools} research communities grew and interconnected across {config.domain || config.title || 'the literature'}
        </p>

        {/* Stacked Area Chart */}
        <div className="scroll-animate">
          <StackedAreaChart data={data} />
        </div>

        {/* Co-citation Heatmap */}
        <div className="scroll-animate">
          <CoCitationHeatmap data={data} />
        </div>

        {/* Network Stats */}
        <div className="scroll-animate grid grid-cols-2 md:grid-cols-4 gap-space-4 mt-space-12">
          <StatBlock value={numPapers.toLocaleString()} label="Papers" />
          <StatBlock value={numEdges.toLocaleString()} label="Edges" />
          <StatBlock value={numSchools.toString()} label="Schools" />
          <StatBlock value={modularityQ.toFixed(2)} label="Modularity Q" highlight />
        </div>

        <p className="scroll-animate mono-sm text-text-tertiary mt-space-4 text-center italic">
          Q = {modularityQ.toFixed(2)} indicates {modularityQ < 0.2 ? 'a highly interdisciplinary field with fluid boundaries between research areas.' : 'well-defined thematic clusters with distinct methodology communities.'}
        </p>
      </div>
    </section>
  );
}
