import { useEffect, useState, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import * as THREE from 'three';
import { forceCollide, forceCenter } from 'd3-force';
import { SCHOOL_COLORS, SCHOOL_NAMES, getCommunityColor } from '@/lib/colors';
import { useLiteratureMap } from '@/context/LiteratureMapContext';
import TopicSearchBar from '@/components/TopicSearchBar';
import { Copy, Check, Bookmark, ExternalLink, BookOpen, Quote, BarChart2, Layers, X, RotateCcw } from 'lucide-react';

const ForceGraph3D = lazy(async () => {
  const mod = await import('react-force-graph-3d');
  return { default: mod.default || (mod as any) };
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface NetworkNode {
  id: string; title: string; authors: string; year: number;
  journal: string; citations: number; community: number;
  community_name: string; abstract: string; doi: string;
  keywords: string[]; val: number;
  link_url?: string; link_type?: string;
  x?: number; y?: number; z?: number;
  fx?: number; fy?: number; fz?: number;
}


/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function getFirstAuthor(authors: string): string {
  if (!authors) return 'Unknown';
  return authors.split(',')[0]?.trim() || 'Unknown';
}

function makeStarTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0.00, 'rgba(255,255,255,1.00)');
  g.addColorStop(0.15, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.40, 'rgba(255,255,255,0.25)');
  g.addColorStop(1.00, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
const STAR_TEXTURE = makeStarTexture();

// Material cache to prevent memory leaks and GC thrashing
const materialCache = new Map<string, THREE.SpriteMaterial>();
function getCachedMaterial(color: string, dimmed: boolean): THREE.SpriteMaterial {
  const key = `${color}_${dimmed}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.SpriteMaterial({
      map: STAR_TEXTURE,
      color: new THREE.Color(color),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: dimmed ? 0.08 : 0.95,
    });
    materialCache.set(key, mat);
  }
  return mat;
}

function StatItem({ value, label, tip }: { value: string | number; label: string; tip?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="text-center relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} style={{ cursor: 'default' }}>
      <div className="font-mono text-[16px] font-bold" style={{ color: '#D4A853' }}>{value}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</div>
      {show && tip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 font-mono text-[10px] rounded-lg px-3 py-2 z-50"
             style={{ width: 200, background: 'rgba(10,10,20,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', whiteSpace: 'normal', lineHeight: 1.4 }}>
          {tip}
        </div>
      )}
    </div>
  );
}

function getNodeColor(n: NetworkNode, mode: string, top5Threshold: number): string {
  if (n.citations >= top5Threshold) return '#FFF6D8';
  if (mode === 'school') return getCommunityColor(n.community);
  if (mode === 'year') {
    const y = n.year;
    if (y <= 2000) return '#3B6FC4';
    if (y <= 2006) return '#5B8C7B';
    if (y <= 2012) return '#6E8C5B';
    if (y <= 2018) return '#B89A4A';
    if (y <= 2024) return '#B07A4A';
    return '#8C5B7B';
  }
  let hash = 0;
  for (let i = 0; i < n.journal.length; i++) hash = n.journal.charCodeAt(i) + ((hash << 5) - hash);
  const cs = ['#4A5A8C','#5B8C7B','#6E8C5B','#8C5B7B','#B07A4A','#4A6E8C','#B89A4A','#4A8C8C','#6E5B8C'];
  return cs[Math.abs(hash) % cs.length];
}

/* ------------------------------------------------------------------ */
/*  Three.js starfield (Points) - Lightweight                          */
/* ------------------------------------------------------------------ */
function createStarfield(scene: THREE.Scene) {
  // Check if starfield already exists
  if (scene.getObjectByName('hero_starfield')) return;

  const geo = new THREE.BufferGeometry();
  const count = 700; // Optimized star count
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color('#FFFAFA'), new THREE.Color('#FFF8DC'), new THREE.Color('#CDDCFF')];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1800 + Math.random() * 3000;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  stars.name = 'hero_starfield';
  scene.add(stars);
}

/* ------------------------------------------------------------------ */
/*  MAIN HERO SECTION                                                  */
/* ------------------------------------------------------------------ */
type ColorMode = 'school' | 'year' | 'journal';

export default function HeroSection() {
  const {
    config,
    networkData,
    analysisData,
    activePresetId,
    switchPreset,
    featuredPresets,
    focusedSchool,
    setFocusedSchool,
  } = useLiteratureMap();

  const [colorMode, setColorMode] = useState<ColorMode>('school');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredSchool, setHoveredSchool] = useState<number | null>(null);
  const [entrancePhase, setEntrancePhase] = useState(-1);
  const [graphReady, setGraphReady] = useState(false);
  const [hoveredPill, setHoveredPill] = useState<string | null>(null);
  const [showDistTip, setShowDistTip] = useState(false);
  const [mobileMetricsOpen, setMobileMetricsOpen] = useState(false);
  const [mobileClustersOpen, setMobileClustersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [mobileInteractive, setMobileInteractive] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setMobileInteractive(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const fgRef = useRef<any>(null);
  const isHeroVisibleRef = useRef(true);

  // Entrance animation
  useEffect(() => {
    const timers: number[] = [];
    for (let i = 0; i <= 7; i++) {
      timers.push(window.setTimeout(() => setEntrancePhase(i), i * 80));
    }
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Pause 3D WebGL rendering when Hero section is off-screen to free CPU/GPU completely
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? true;
        isHeroVisibleRef.current = isVisible;
        if (fgRef.current) {
          try {
            if (isVisible) {
              if (typeof fgRef.current.resumeAnimation === 'function') {
                fgRef.current.resumeAnimation();
              }
              const ctrl = fgRef.current.controls();
              if (ctrl) ctrl.autoRotate = true;
            } else {
              if (typeof fgRef.current.pauseAnimation === 'function') {
                fgRef.current.pauseAnimation();
              }
              const ctrl = fgRef.current.controls();
              if (ctrl) ctrl.autoRotate = false;
            }
          } catch {
            // ignore if not ready
          }
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Normalize data
  const data = useMemo(() => {
    if (!networkData?.nodes?.length) return null;
    const nodes: NetworkNode[] = networkData.nodes.map(n => ({
      ...n,
      authors: typeof n.authors === 'string' ? n.authors : (n.authors as any).join(', '),
      link_url: n.link_url || (n.doi && `https://doi.org/${n.doi}`) || undefined,
      link_type: n.link_type || (n.doi ? 'doi' : undefined),
    }));
    return { nodes, links: networkData.links || [] };
  }, [networkData]);

  // Adaptive Level of Detail (LOD) based on viewport:
  // Desktop: all nodes + top 500 links
  // Mobile (<1024px): top 65 nodes sorted by citation + top 150 links for locked 60 FPS
  const renderData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    if (isMobile && data.nodes.length > 70) {
      const sortedNodes = [...data.nodes].sort((a, b) => (b.citations || 0) - (a.citations || 0));
      const mobileNodes = sortedNodes.slice(0, 65);
      const nodeIds = new Set(mobileNodes.map((n) => n.id));
      const sortedLinks = [...data.links]
        .filter((l) => {
          const s = typeof l.source === 'object' ? (l.source as any).id : l.source;
          const t = typeof l.target === 'object' ? (l.target as any).id : l.target;
          return nodeIds.has(s) && nodeIds.has(t);
        })
        .sort((a, b) => (b.value || b.weight || 0) - (a.value || a.weight || 0));
      return { nodes: mobileNodes, links: sortedLinks.slice(0, 150) };
    }
    const sortedLinks = [...data.links].sort((a, b) => (b.value || b.weight || 0) - (a.value || a.weight || 0));
    const TOP_LINKS = sortedLinks.slice(0, 500);
    return { nodes: data.nodes, links: TOP_LINKS };
  }, [data, isMobile]);

  // Graph network analysis lookups (O(1))
  const { neighborsByNodeId, linksByNodeId, minA, maxA } = useMemo(() => {
    const neighbors = new Map<string, Set<string>>();
    const linksMap = new Map<string, Set<any>>();
    if (!renderData.links.length) {
      return { neighborsByNodeId: neighbors, linksByNodeId: linksMap, minA: 0, maxA: 1 };
    }

    for (const l of renderData.links) {
      const link = l as any;
      const s = typeof link.source === 'object' ? link.source.id : link.source;
      const t = typeof link.target === 'object' ? link.target.id : link.target;
      if (!neighbors.has(s)) neighbors.set(s, new Set());
      if (!neighbors.has(t)) neighbors.set(t, new Set());
      neighbors.get(s)!.add(t);
      neighbors.get(t)!.add(s);
      if (!linksMap.has(s)) linksMap.set(s, new Set());
      if (!linksMap.has(t)) linksMap.set(t, new Set());
      linksMap.get(s)!.add(link);
      linksMap.get(t)!.add(link);
    }

    const nodeStrength = new Map<string, number>();
    for (const l of renderData.links) {
      const s = typeof (l as any).source === 'object' ? (l as any).source.id : (l as any).source;
      const t = typeof (l as any).target === 'object' ? (l as any).target.id : (l as any).target;
      const w = (l as any).value || (l as any).weight || 1;
      nodeStrength.set(s, (nodeStrength.get(s) || 0) + w);
      nodeStrength.set(t, (nodeStrength.get(t) || 0) + w);
    }
    for (const l of renderData.links) {
      const s = typeof (l as any).source === 'object' ? (l as any).source.id : (l as any).source;
      const t = typeof (l as any).target === 'object' ? (l as any).target.id : (l as any).target;
      const w = (l as any).value || (l as any).weight || 1;
      (l as any).assoc = w / ((nodeStrength.get(s) || 1) * (nodeStrength.get(t) || 1));
    }
    const assocVals = renderData.links.map((l: any) => l.assoc || 0);
    const min = Math.min(...assocVals);
    const max = Math.max(...assocVals);
    return { neighborsByNodeId: neighbors, linksByNodeId: linksMap, minA: min, maxA: max };
  }, [renderData]);

  const top5Threshold = useMemo(() => {
    if (!data?.nodes.length) return 0;
    const sorted = [...data.nodes].sort((a, b) => b.citations - a.citations);
    return sorted[Math.floor(sorted.length * 0.05)]?.citations ?? 0;
  }, [data]);

  const top15Ids = useMemo(() => {
    if (!data?.nodes.length) return [];
    return [...data.nodes].sort((a, b) => b.citations - a.citations).slice(0, 15).map(n => n.id);
  }, [data]);

  const schoolCounts = useMemo(() => {
    if (!data) return {} as Record<number, number>;
    const c: Record<number, number> = {};
    for (const n of data.nodes) c[n.community] = (c[n.community] || 0) + 1;
    return c;
  }, [data]);

  const communitiesList = useMemo(() => {
    if (analysisData?.communities && Object.keys(analysisData.communities).length > 0) {
      return Object.entries(analysisData.communities).map(([id, comm]) => ({
        id: Number(id),
        name: comm.name,
        count: comm.size || schoolCounts[Number(id)] || 0,
      }));
    }
    const counts: Record<number, { name: string; count: number }> = {};
    if (data) {
      for (const n of data.nodes) {
        if (!counts[n.community]) {
          counts[n.community] = {
            name: n.community_name || (SCHOOL_NAMES as any)[n.community] || `School ${n.community}`,
            count: 0,
          };
        }
        counts[n.community].count++;
      }
    }
    return Object.entries(counts).map(([id, val]) => ({
      id: Number(id),
      name: val.name,
      count: val.count,
    }));
  }, [analysisData, data, schoolCounts]);

  const metrics = useMemo(() => {
    if (!data) return null;
    const ns = data.nodes;
    const N = ns.length;
    const cits = ns.map(n => n.citations || 0).sort((a, b) => b - a);
    const totalCit = cits.reduce((s, c) => s + c, 0);
    const avgCit = N > 0 ? Math.round(totalCit / N) : 0;
    let h = 0;
    for (let i = 0; i < cits.length; i++) {
      if (cits[i] >= i + 1) h = i + 1;
      else break;
    }
    const years = ns.map(n => n.year).filter(Boolean).sort((a, b) => a - b);
    const medianYear = years[Math.floor(years.length / 2)] || 0;
    const E = data.links.length;
    const density = N > 1 ? (2 * E / (N * (N - 1))).toFixed(2) : '0';
    return { totalCit, avgCit, h, medianYear, density, numLinks: E };
  }, [data]);

  // Fast Sprite generator using cached materials
  const buildNodeThreeObject = useCallback((node: any) => {
    const n = node as NetworkNode;
    const isHub = n.citations >= top5Threshold;
    const color = isHub ? '#FFF6D8' : getNodeColor(n, colorMode, top5Threshold);
    let dimmed = false;
    if (selectedNode) {
      const isSelected = n.id === selectedNode.id;
      const isNeighbor = neighborsByNodeId.get(selectedNode.id)?.has(n.id);
      dimmed = !isSelected && !isNeighbor;
    } else if (focusedSchool !== null && focusedSchool !== undefined) {
      dimmed = n.community !== focusedSchool;
    }
    const mat = getCachedMaterial(color, dimmed);
    const sprite = new THREE.Sprite(mat);
    const base = Math.sqrt(n.citations || 1);
    const diameter = Math.min(base * 1.1, 14) * (isHub ? 1.6 : 1.0);
    sprite.scale.set(diameter, diameter, 1);
    return sprite;
  }, [top5Threshold, colorMode, selectedNode, focusedSchool, neighborsByNodeId]);

  // Once WebGL graph is ready, configure controls and starfield (zero bloom overhead)
  useEffect(() => {
    if (!fgRef.current || !data) return;

    const timer = setTimeout(() => {
      try {
        const renderer = fgRef.current.renderer();
        const scene = fgRef.current.scene();
        const camera = fgRef.current.camera();
        if (!renderer || !scene || !camera) return;

        // Cap pixel ratio to 1.25 to prevent 4K/retina GPU thermal throttling
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));

        createStarfield(scene);

        const ctrl = fgRef.current.controls();
        if (ctrl) {
          ctrl.enableDamping = true;
          ctrl.dampingFactor = 0.05;
          ctrl.autoRotate = isHeroVisibleRef.current;
          ctrl.autoRotateSpeed = 0.35;
          let resumeTimer: number | undefined;
          const pause = () => {
            ctrl.autoRotate = false;
            if (resumeTimer) window.clearTimeout(resumeTimer);
          };
          const scheduleResume = () => {
            if (resumeTimer) window.clearTimeout(resumeTimer);
            resumeTimer = window.setTimeout(() => {
              if (isHeroVisibleRef.current) ctrl.autoRotate = true;
            }, 1800);
          };
          const el = renderer.domElement;
          el.addEventListener('mousedown', pause);
          el.addEventListener('mouseup', scheduleResume);
          el.addEventListener('wheel', () => { pause(); scheduleResume(); }, { passive: true });
          el.addEventListener('touchstart', pause);
          el.addEventListener('touchend', scheduleResume);
        }

        // Fast physics forces with zero UI freeze
        try {
          fgRef.current.d3Force('charge')?.strength(-220)?.distanceMax(800);
          fgRef.current.d3Force('collide', forceCollide(25).strength(0.6).iterations(1));
          const linkForce = fgRef.current.d3Force('link');
          if (linkForce) {
            linkForce.distance((l: any) => {
              const norm = Math.sqrt(((l.assoc ?? minA) - minA) / ((maxA - minA) || 1));
              return 400 - norm * 280;
            }).strength(0.08);
          }
          fgRef.current.d3Force('center', forceCenter(0, 0).strength(0.05));
        } catch {
          // ignore if physics engine already settled
        }

        setGraphReady(true);
      } catch (e) {
        console.error('Three.js setup:', e);
        setGraphReady(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [data, minA, maxA]);

  // Camera helpers
  const flyToSchool = useCallback((schoolIdx: number) => {
    if (!fgRef.current || !data) return;
    const commNodes = data.nodes.filter(n => n.community === schoolIdx);
    if (commNodes.length === 0) return;
    const cx = commNodes.reduce((s, n) => s + (n.x || 0), 0) / commNodes.length;
    const cy = commNodes.reduce((s, n) => s + (n.y || 0), 0) / commNodes.length;
    const cz = commNodes.reduce((s, n) => s + (n.z || 0), 0) / commNodes.length;
    const dist = Math.hypot(cx, cy, cz) || 1;
    fgRef.current.cameraPosition(
      { x: cx + (cx / dist) * 220, y: cy + (cy / dist) * 220, z: cz + (cz / dist) * 220 },
      { x: cx, y: cy, z: cz },
      1100
    );
  }, [data]);

  const resetCamera = useCallback(() => {
    if (!fgRef.current) return;
    setFocusedSchool(null);
    fgRef.current.cameraPosition({ x: 0, y: 0, z: 420 }, { x: 0, y: 0, z: 0 }, 1000);
  }, []);

  const handleEngineStop = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 280 }, { x: 0, y: 0, z: 0 }, 2200);
    }
    setGraphReady(true);
  }, []);

  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedApa, setCopiedApa] = useState(false);
  const [savedPapers, setSavedPapers] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('litmap_saved_papers') || '[]');
    } catch {
      return [];
    }
  });

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node as NetworkNode);
    setCopiedBib(false);
    setCopiedApa(false);
  }, []);

  const handleCopyBibtex = () => {
    if (!selectedNode || !navigator.clipboard) return;
    const firstAuth = getFirstAuthor(selectedNode.authors).replace(/[^a-zA-Z]/g, '').toLowerCase() || 'paper';
    const bibKey = `${firstAuth}${selectedNode.year || 2024}`;
    const bib = `@article{${bibKey},\n  title = {${selectedNode.title}},\n  author = {${selectedNode.authors}},\n  year = {${selectedNode.year}},\n  journal = {${selectedNode.journal || 'Academic Paper'}},\n  doi = {${selectedNode.doi || ''}}\n}`;
    navigator.clipboard.writeText(bib);
    setCopiedBib(true);
    setTimeout(() => setCopiedBib(false), 2000);
  };

  const handleCopyApa = () => {
    if (!selectedNode || !navigator.clipboard) return;
    const apa = `${selectedNode.authors} (${selectedNode.year}). ${selectedNode.title}. ${selectedNode.journal ? `${selectedNode.journal}. ` : ''}${selectedNode.doi ? `https://doi.org/${selectedNode.doi}` : ''}`;
    navigator.clipboard.writeText(apa);
    setCopiedApa(true);
    setTimeout(() => setCopiedApa(false), 2000);
  };

  const handleToggleSavePaper = () => {
    if (!selectedNode) return;
    setSavedPapers((prev) => {
      const isSaved = prev.includes(selectedNode.id);
      const next = isSaved ? prev.filter((id) => id !== selectedNode.id) : [...prev, selectedNode.id];
      try {
        localStorage.setItem('litmap_saved_papers', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const vis = (phase: number) => entrancePhase >= phase ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2';

  if (!data) {
    return (
      <section className="w-full h-[88dvh] lg:h-[100dvh]" style={{ background: '#05060B' }}>
        <div className="flex items-center justify-center h-full">
          <div className="font-mono text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading constellation...</div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="network" className="relative w-full h-[88dvh] lg:h-[100dvh] overflow-hidden" style={{ background: '#05060B' }}>
      {/* 3D Force Graph Container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          pointerEvents: isMobile && !mobileInteractive ? 'none' : 'auto',
        }}
      >
        <Suspense fallback={null}>
          <ForceGraph3D
            ref={fgRef}
            graphData={renderData}
            backgroundColor="#000000"
            nodeRelSize={1}
            linkWidth={(link: any) => {
              if (!selectedNode) return 0.10;
              const ls = linksByNodeId.get(selectedNode.id);
              return ls && ls.has(link) ? 1.2 : 0.10;
            }}
            linkCurvature={0.08}
            linkColor={(link: any) => {
              if (selectedNode) {
                const ls = linksByNodeId.get(selectedNode.id);
                return ls && ls.has(link) ? '#FFF6D8' : 'rgba(255, 210, 122, 0.02)';
              }
              const focus = focusedSchool ?? hoveredSchool;
              if (focus !== null && focus !== undefined) {
                const s = typeof link.source === 'object' ? (link.source as any).community : null;
                const t = typeof link.target === 'object' ? (link.target as any).community : null;
                return (s === focus && t === focus) ? 'rgba(255, 210, 122, 0.40)' : 'rgba(255, 210, 122, 0.02)';
              }
              return 'rgba(255, 210, 122, 0.20)';
            }}
            linkDirectionalParticles={0}
            linkDirectionalArrowLength={0}
            warmupTicks={0}
            cooldownTicks={60}
            d3AlphaDecay={0.06}
            d3VelocityDecay={0.4}
            showNavInfo={false}
            enableNavigationControls={true}
            controlType="orbit"
            enableNodeDrag={true}
            onNodeClick={handleNodeClick}
            onBackgroundClick={() => setSelectedNode(null)}
            onNodeDragEnd={(node: any) => { node.fx = node.x; node.fy = node.y; node.fz = node.z; }}
            nodeThreeObject={buildNodeThreeObject}
            nodeLabel={(node: any) => {
              const n = node as NetworkNode;
              if (!top15Ids.includes(n.id)) return '';
              return `<div style="color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.9);font-family:'JetBrains Mono',monospace;font-size:11px;padding:3px 8px;background:rgba(0,0,0,0.6);border-radius:4px;white-space:nowrap;">${n.title}<br/><span style="opacity:0.65">${getFirstAuthor(n.authors || '')} · ${n.year}</span></div>`;
            }}
            onEngineStop={handleEngineStop}
          />
        </Suspense>
      </div>

      {/* Loading state indicator */}
      {!graphReady && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/60 backdrop-blur border border-white/10 text-white/60 font-mono text-[11px] animate-pulse">
          <span className="w-2 h-2 rounded-full bg-star-gold animate-ping" />
          <span>Igniting constellation...</span>
        </div>
      )}

      {/* Warm central nebula background */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'radial-gradient(circle at 50% 45%, rgba(212,168,83,0.10) 0%, transparent 55%)' }} />

      {/* Subtle Vignette */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)' }} />

      {/* Top Center Content (Eyebrow + Title + Subtitle + Topic Search + Curated Presets) */}
      <div className="absolute z-20 w-full max-w-2xl px-4 flex flex-col items-center pointer-events-none" style={{ top: '68px', left: '50%', transform: 'translateX(-50%)' }}>
        {/* Title & Subtitle */}
        <div className={`flex flex-col items-center pointer-events-none text-center transition-all duration-500 ease-out ${vis(2)}`}>
          <div className="font-mono text-[10px] md:text-[11px] tracking-[0.08em] uppercase text-[#D4A853] opacity-80 mb-1">
            Living Literature Map · {config.domain}
          </div>
          <h1 className="font-serif italic text-2xl md:text-3xl" style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}>
            {config.title}
          </h1>
          <p className={`font-mono text-[11px] text-center mt-1 tracking-wide transition-all duration-500 ease-out ${vis(3)}`} style={{ color: 'rgba(255,255,255,0.5)' }}>
            {config.subtitle || `${data.nodes.length} papers · ${communitiesList.length} schools · ${data.links.length.toLocaleString()} connections`}
          </p>
        </div>

        {/* Universal Live Topic Search Bar */}
        <div className={`pointer-events-auto w-full mt-3 transition-all duration-500 ease-out ${vis(4)}`}>
          <TopicSearchBar variant="hero" showPopular={false} />
        </div>

        {/* 1-Click Curated Domain Quick Switcher */}
        <div className={`pointer-events-auto flex items-center justify-start sm:justify-center gap-1.5 mt-2.5 max-w-full overflow-x-auto no-scrollbar px-2 py-1 transition-all duration-500 ease-out ${vis(5)}`}>
          <span className="font-mono text-[10px] text-white/40 uppercase tracking-wider mr-1 shrink-0">
            Featured:
          </span>
          {(featuredPresets || []).map((preset) => (
            <button
              key={preset.id}
              onClick={() => switchPreset(preset.id)}
              className={cn(
                'font-mono text-[11px] px-2.5 py-0.5 rounded-full transition-all duration-200 flex items-center gap-1.5 cursor-pointer backdrop-blur-md shrink-0',
                activePresetId === preset.id
                  ? 'bg-[#C9A24B]/30 border border-[#C9A24B] text-[#D4A853] font-medium shadow-[0_0_12px_rgba(212,168,83,0.3)]'
                  : 'bg-black/40 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
              )}
              title={preset.domain}
            >
              <span>{preset.shortName}</span>
              <span className="text-[9px] opacity-60 font-mono">
                {preset.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar — Desktop (lg+) */}
      <div className={`absolute z-20 pointer-events-auto transition-all duration-500 ease-out hidden lg:block ${vis(6)}`} style={{ bottom: '32px', left: '32px' }}>
        <div className="grid grid-cols-4 gap-x-6 gap-y-3 rounded-lg px-4 py-3" style={{ background: 'rgba(10,10,20,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <StatItem value={data.nodes.length} label="Papers" tip="Total papers in the corpus." />
          <StatItem value={communitiesList.length} label="Schools" tip="Research communities found by Louvain community detection." />
          <StatItem value={Math.min(500, data.links.length).toLocaleString()} label="Edges" tip="Keyword co-occurrence links rendered (top-weighted subset)." />
          <StatItem value={analysisData?.modularity_q ? analysisData.modularity_q.toFixed(2) : (metrics ? metrics.density : '—')} label="Modularity Q" tip="How tightly the field clusters. >0.3 = strong communities, <0.3 = interdisciplinary." />
          <StatItem value={metrics ? metrics.totalCit.toLocaleString() : '—'} label="Total Cites" tip="Sum of citations across all papers." />
          <StatItem value={metrics ? metrics.avgCit.toLocaleString() : '—'} label="Avg Cites" tip="Mean citations per paper." />
          <StatItem value={metrics ? metrics.h : '—'} label="h-index" tip="h papers each cited at least h times — corpus size+impact." />
          <StatItem value={metrics ? metrics.density : '—'} label="Density" tip="Network density: actual edges ÷ all possible edges. Higher = more interconnected." />
        </div>
      </div>

      {/* Legend & Color Mode — Desktop (lg+) */}
      <div className={`absolute z-20 pointer-events-auto transition-all duration-500 ease-out hidden lg:flex flex-col items-end gap-2.5 ${vis(7)}`} style={{ bottom: '32px', right: '32px' }}>
        {/* Color Mode Toggle */}
        <div className="flex items-center gap-1 rounded-full p-1 bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
          {(['school', 'year', 'journal'] as const).map(mode => {
            const tips: Record<string, string> = {
              school: `Color nodes by research community — ${communitiesList.length} schools found via Louvain clustering.`,
              year: 'Color nodes by publication year — blue (older) → red (newer).',
              journal: 'Color nodes by the journal each paper was published in.',
            };
            return (
              <div key={mode} className="relative" onMouseEnter={() => setHoveredPill(mode)} onMouseLeave={() => setHoveredPill(null)}>
                <button onClick={() => setColorMode(mode)}
                  className={cn('font-mono text-[11px] font-medium rounded-full px-3 py-0.5 transition-all duration-200 cursor-pointer', colorMode === mode ? 'text-[#D4A853]' : 'hover:text-white')}
                  style={colorMode === mode ? { background: 'rgba(201,162,75,0.25)', border: '1px solid #C9A24B' } : { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.5)' }}>
                  By {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
                {hoveredPill === mode && (
                  <div className="absolute bottom-full right-0 mb-2 font-mono text-[10px] rounded-lg px-3 py-2 z-50 pointer-events-none"
                       style={{ width: 220, background: 'rgba(10,10,20,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', whiteSpace: 'normal', lineHeight: 1.4 }}>
                    {tips[mode]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cluster List */}
        <div className="rounded-lg px-4 py-3 w-[280px] max-h-[200px] overflow-y-auto" style={{ background: 'rgba(10,10,20,0.5)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Clusters ({communitiesList.length})
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetCamera();
              }}
              className="font-mono text-[9px] text-[#D4A853] hover:underline cursor-pointer transition-colors"
              title="Reset 3D camera to constellation overview"
            >
              Reset 3D
            </button>
          </div>
          {communitiesList.map((comm, i) => {
            const idx = comm.id;
            const delay = Math.min(i * 30, 300);
            const isFocused = focusedSchool === idx;
            const color = getCommunityColor(idx);
            return (
              <div key={idx}
                className="flex items-center gap-2 leading-[22px] rounded-sm px-1 -mx-1 transition-all duration-200"
                style={{
                  opacity: entrancePhase >= 7 ? 1 : 0, transform: entrancePhase >= 7 ? 'translateX(0)' : 'translateX(8px)',
                  transition: `opacity 300ms ease-out ${delay}ms, transform 300ms ease-out ${delay}ms`,
                  borderLeft: isFocused ? '2px solid #D4A853' : '2px solid transparent', paddingLeft: isFocused ? '6px' : '4px',
                  cursor: 'pointer', background: isFocused ? 'rgba(212,168,83,0.08)' : 'transparent',
                }}
                onMouseEnter={() => setHoveredSchool(idx)} onMouseLeave={() => setHoveredSchool(null)}
                onClick={() => {
                  if (isFocused) {
                    setFocusedSchool(null);
                    resetCamera();
                  } else {
                    setFocusedSchool(idx);
                    flyToSchool(idx);
                  }
                }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="font-mono text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{comm.name}</span>
                <span className="font-mono text-[10px] ml-auto shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>{comm.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data mode badge — Desktop */}
      <div className="absolute bottom-[32px] right-[320px] z-20 pointer-events-none hidden lg:block">
        <span className="font-mono text-[9px] tracking-[0.06em]" style={{ color: 'rgba(255,255,255,0.25)' }}>Data mode: keyword co-occurrence (not citation)</span>
      </div>

      {/* Mobile Tap-to-Interact 3D Floating Pill */}
      {isMobile && !mobileInteractive && (
        <div className="absolute bottom-[58px] left-1/2 -translate-x-1/2 z-20 lg:hidden">
          <button
            onClick={() => setMobileInteractive(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0a0a14]/90 backdrop-blur-md border border-[#D4A853]/70 text-[#D4A853] font-mono text-[10px] shadow-[0_0_16px_rgba(212,168,83,0.35)] cursor-pointer hover:bg-[#D4A853]/15 transition-all"
          >
            <span>👆 Tap to Orbit 3D Constellation</span>
          </button>
        </div>
      )}

      {/* Mobile Exit-3D (Resume Page Scroll) Button */}
      {isMobile && mobileInteractive && (
        <div className="absolute top-[68px] right-3 z-30 lg:hidden">
          <button
            onClick={() => setMobileInteractive(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-[#D4A853] text-[#D4A853] font-mono text-[10px] shadow-lg cursor-pointer hover:bg-white/10 transition-all"
          >
            <X size={12} className="text-[#D4A853]" />
            <span>Exit 3D (Scroll)</span>
          </button>
        </div>
      )}

      {/* Mobile Scroll Indicator Cue */}
      {isMobile && !mobileInteractive && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none lg:hidden flex flex-col items-center gap-0.5 opacity-60">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[#D4A853]">Scroll down</span>
          <span className="text-white/50 text-[10px] animate-bounce">↓</span>
        </div>
      )}

      {/* Mobile Floating HUD Bar (< lg) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 lg:hidden flex items-center gap-1.5 p-1 rounded-full bg-[#0a0a14]/90 backdrop-blur-xl border border-white/15 shadow-[0_4px_24px_rgba(0,0,0,0.8)] max-w-[96vw]">
        {/* Metrics Button */}
        <button
          onClick={() => setMobileMetricsOpen(true)}
          className="flex items-center gap-1 font-mono text-[11px] text-white/80 hover:text-white px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 transition-all cursor-pointer shrink-0"
        >
          <BarChart2 size={12} className="text-[#D4A853]" />
          <span>Stats</span>
        </button>

        {/* Compact Color Switcher */}
        <div className="flex items-center bg-black/50 rounded-full p-0.5 border border-white/10">
          {(['school', 'year', 'journal'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              className={cn(
                'font-mono text-[10px] px-2 py-0.5 rounded-full transition-all cursor-pointer',
                colorMode === mode
                  ? 'bg-[#C9A24B]/30 text-[#D4A853] font-semibold border border-[#C9A24B]/60'
                  : 'text-white/50 hover:text-white'
              )}
            >
              {mode === 'school' ? 'School' : mode === 'year' ? 'Year' : 'Journal'}
            </button>
          ))}
        </div>

        {/* Clusters Button */}
        <button
          onClick={() => setMobileClustersOpen(true)}
          className="flex items-center gap-1 font-mono text-[11px] text-white/80 hover:text-white px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 transition-all cursor-pointer shrink-0"
        >
          <Layers size={12} className="text-[#D4A853]" />
          <span>Clusters ({communitiesList.length})</span>
        </button>
      </div>

      {/* Mobile Metrics Bottom Sheet */}
      {mobileMetricsOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setMobileMetricsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0D0F18] border-t sm:border border-white/20 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-[#D4A853]" />
                <h3 className="font-serif text-lg text-white font-bold">Bibliometric Indicators</h3>
              </div>
              <button
                onClick={() => setMobileMetricsOpen(false)}
                className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="font-mono text-[18px] font-bold text-[#D4A853]">{data.nodes.length}</div>
                <div className="font-mono text-[10px] uppercase text-white/50 mt-0.5">Total Papers</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="font-mono text-[18px] font-bold text-[#D4A853]">{communitiesList.length}</div>
                <div className="font-mono text-[10px] uppercase text-white/50 mt-0.5">Schools (Clusters)</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="font-mono text-[18px] font-bold text-[#D4A853]">{Math.min(500, data.links.length).toLocaleString()}</div>
                <div className="font-mono text-[10px] uppercase text-white/50 mt-0.5">Rendered Edges</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="font-mono text-[18px] font-bold text-[#D4A853]">
                  {analysisData?.modularity_q ? analysisData.modularity_q.toFixed(2) : (metrics ? metrics.density : '—')}
                </div>
                <div className="font-mono text-[10px] uppercase text-white/50 mt-0.5">Modularity Q</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="font-mono text-[18px] font-bold text-[#D4A853]">
                  {metrics ? metrics.totalCit.toLocaleString() : '—'}
                </div>
                <div className="font-mono text-[10px] uppercase text-white/50 mt-0.5">Total Citations</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="font-mono text-[18px] font-bold text-[#D4A853]">
                  {metrics ? metrics.avgCit.toLocaleString() : '—'}
                </div>
                <div className="font-mono text-[10px] uppercase text-white/50 mt-0.5">Avg Citations</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="font-mono text-[18px] font-bold text-[#D4A853]">
                  {metrics ? metrics.h : '—'}
                </div>
                <div className="font-mono text-[10px] uppercase text-white/50 mt-0.5">Corpus h-index</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                <div className="font-mono text-[18px] font-bold text-[#D4A853]">
                  {metrics ? metrics.density : '—'}
                </div>
                <div className="font-mono text-[10px] uppercase text-white/50 mt-0.5">Network Density</div>
              </div>
            </div>

            <p className="font-mono text-[10px] text-white/40 text-center">
              Data mode: keyword co-occurrence &amp; VOSviewer association strength
            </p>
          </div>
        </div>
      )}

      {/* Mobile Clusters Bottom Sheet */}
      {mobileClustersOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setMobileClustersOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0D0F18] border-t sm:border border-white/20 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#D4A853]" />
                <h3 className="font-serif text-lg text-white font-bold">
                  Clusters ({communitiesList.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setFocusedSchool(null);
                    resetCamera();
                    setMobileClustersOpen(false);
                  }}
                  className="font-mono text-[11px] text-[#D4A853] hover:underline flex items-center gap-1 px-2 py-1 rounded bg-[#D4A853]/10 cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Reset 3D</span>
                </button>
                <button
                  onClick={() => setMobileClustersOpen(false)}
                  className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {communitiesList.map((comm) => {
                const idx = comm.id;
                const isFocused = focusedSchool === idx;
                const color = getCommunityColor(idx);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2 rounded-lg transition-all cursor-pointer"
                    style={{
                      borderLeft: isFocused ? '3px solid #D4A853' : '3px solid transparent',
                      background: isFocused ? 'rgba(212,168,83,0.15)' : 'rgba(255,255,255,0.03)',
                    }}
                    onClick={() => {
                      if (isFocused) {
                        setFocusedSchool(null);
                        resetCamera();
                      } else {
                        setFocusedSchool(idx);
                        flyToSchool(idx);
                      }
                      setMobileClustersOpen(false);
                    }}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="font-mono text-[12px] text-white/80 font-medium truncate">{comm.name}</span>
                    <span className="font-mono text-[11px] text-[#D4A853] ml-auto shrink-0 font-bold">{comm.count} papers</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Node Detail Slide-in Panel / Mobile Bottom Sheet */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end bg-black/60 backdrop-blur-sm"
             onClick={(e) => { if (e.target === e.currentTarget) setSelectedNode(null); }}>
          <div className="h-auto max-h-[85vh] sm:max-h-full sm:h-full overflow-y-auto border-t sm:border-t-0 sm:border-l border-white/15 w-full sm:w-[420px] max-w-full rounded-t-2xl sm:rounded-none bg-[#080910]/95 backdrop-blur-xl relative"
               style={{ animation: 'slideIn 0.3s ease forwards' }}
               onClick={(e) => e.stopPropagation()}>
            {/* Mobile drag handle */}
            <div className="sm:hidden w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1" />
            <button onClick={() => setSelectedNode(null)}
                    className="absolute top-3 sm:top-4 right-4 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 z-10 transition-colors cursor-pointer"
                    aria-label="Close details">
              <X size={20} />
            </button>
            <div className="p-4 sm:p-6 pt-5 sm:pt-12">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="font-mono text-[10px] px-2.5 py-0.5 rounded-full border border-white/20 font-semibold"
                  style={{
                    backgroundColor: `${SCHOOL_COLORS[selectedNode.community] || '#D4A853'}30`,
                    color: SCHOOL_COLORS[selectedNode.community] || '#D4A853',
                  }}
                >
                  {selectedNode.community_name || `Cluster #${selectedNode.community}`}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                  {selectedNode.year}
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#D4A853]/20 text-[#D4A853] font-bold">
                  {(selectedNode.citations || 0).toLocaleString()} citations
                </span>
              </div>

              <h2 className="font-serif text-[20px] text-white leading-snug font-medium">{selectedNode.title}</h2>
              <p className="font-mono text-[11px] text-white/60 mt-2">{selectedNode.authors}</p>
              <p className="font-mono text-[10px] text-white/40 mt-1 italic">
                {selectedNode.journal || 'Peer-reviewed scientific publication'}
              </p>

              {/* Fast Academic Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/10">
                <button
                  onClick={handleCopyBibtex}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                  title="Copy BibTeX reference to clipboard"
                >
                  {copiedBib ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedBib ? 'BibTeX Copied!' : 'Copy BibTeX'}</span>
                </button>

                <button
                  onClick={handleCopyApa}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 transition-colors cursor-pointer"
                  title="Copy APA formatted reference"
                >
                  {copiedApa ? <Check size={12} className="text-emerald-400" /> : <Quote size={12} />}
                  <span>{copiedApa ? 'APA Copied!' : 'Copy APA'}</span>
                </button>

                <button
                  onClick={handleToggleSavePaper}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] border transition-colors cursor-pointer',
                    savedPapers.includes(selectedNode.id)
                      ? 'border-[#D4A853] bg-[#D4A853]/20 text-[#D4A853]'
                      : 'border-white/20 bg-white/5 hover:bg-white/10 text-white/80'
                  )}
                  title="Add to Lab Reading List"
                >
                  <Bookmark size={12} className={savedPapers.includes(selectedNode.id) ? 'fill-[#D4A853]' : ''} />
                  <span>{savedPapers.includes(selectedNode.id) ? 'Saved in Lab List' : 'Save Paper'}</span>
                </button>
              </div>
              {selectedNode.abstract && (
                <div className="mt-5 overflow-y-auto" style={{ maxHeight: 300 }}>
                  <p className="font-mono text-[12px] text-white/80 leading-relaxed">{selectedNode.abstract}</p>
                </div>
              )}
              {/* Keywords chips */}
              {(() => {
                const kw = selectedNode.keywords;
                const kwList: string[] = Array.isArray(kw)
                  ? kw
                      .map((item: any) => (typeof item === 'string' ? item : item?.name || item?.keyword || String(item)))
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : typeof kw === 'string'
                  ? (kw as string).split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
                  : [];
                if (kwList.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1.5 mt-5">
                    {kwList.map((item: string, i: number) => (
                      <span
                        key={`${item}-${i}`}
                        className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/70"
                        style={{ backgroundColor: `${SCHOOL_COLORS[selectedNode.community] || '#D4A853'}20` }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                );
              })()}
              {/* Scholarly Outlinks */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-2">
                <a
                  href={
                    selectedNode.link_url ||
                    (selectedNode.doi
                      ? `https://doi.org/${selectedNode.doi}`
                      : `https://scholar.google.com/scholar?q=${encodeURIComponent(
                          selectedNode.title + ' ' + getFirstAuthor(selectedNode.authors || '')
                        )}`)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full font-mono text-[10px] uppercase tracking-wider border border-[#D4A853] text-[#D4A853] hover:bg-[#D4A853]/20 transition-colors"
                >
                  <ExternalLink size={11} />
                  <span>{selectedNode.doi ? 'Open DOI / PDF' : 'Find Paper'}</span>
                </a>

                <a
                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(
                    selectedNode.title + ' ' + getFirstAuthor(selectedNode.authors || '')
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full font-mono text-[10px] border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <BookOpen size={11} />
                  <span>Google Scholar</span>
                </a>

                <a
                  href={`https://www.semanticscholar.org/search?q=${encodeURIComponent(selectedNode.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full font-mono text-[10px] border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span>Semantic Scholar</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distance = relatedness chip (Desktop only to prevent mobile HUD overlap) */}
      <div className="absolute z-20 hidden md:block" style={{ bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}
           onMouseEnter={() => setShowDistTip(true)} onMouseLeave={() => setShowDistTip(false)}>
        <div className="font-mono text-[10px] px-3 py-1.5 rounded-full cursor-default flex items-center gap-1.5"
             style={{ background: 'rgba(10,10,20,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
          <span>↔ distance = relatedness</span><span style={{ opacity: 0.5 }}>ⓘ</span>
        </div>
        {showDistTip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 font-mono text-[10px] rounded-lg px-3 py-2.5 z-50"
               style={{ width: 320, background: 'rgba(10,10,20,0.94)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.5 }}>
            Line length encodes <span style={{ color: '#D4A853' }}>Association Strength</span> — the relatedness measure used by VOSviewer. Two papers sit closer when they share more keywords <i>relative to each paper's total keyword activity</i>. Shorter line = stronger relationship.
          </div>
        )}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </section>
  );
}
