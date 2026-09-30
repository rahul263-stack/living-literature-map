/**
 * Professional Draw.io Architecture Generator for Living Literature Map
 * Generates an executive-ready, cleanly laid out, non-overlapping mxGraphModel.
 */
const fs = require('fs');
const path = require('path');

function xmlEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const cells = [];

function addCell(cell) {
  cells.push(cell);
}

// --------------------------------------------------------------------------
// Canvas Setup
// --------------------------------------------------------------------------
// Canvas width: 2600, height: 1350
// 5 Major Columns (Width: 440px each, Gap: 60px)
// Col 0: X = 80
// Col 1: X = 580
// Col 2: X = 1080
// Col 3: X = 1580
// Col 4: X = 2080

// Title & Banner
addCell(`
  <mxCell id="canvas_title" value="&lt;div style=&quot;font-size: 26px; font-weight: 700; color: #1E1B4B;&quot;&gt;Living Literature Map — Full End-to-End System Architecture&lt;/div&gt;&lt;div style=&quot;font-size: 13px; color: #64748B; margin-top: 6px;&quot;&gt;Comprehensive Technical Flow &amp;bull; Data Pipeline, Science Engine, React Client Architecture &amp;amp; Export Artifacts&lt;/div&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Segoe UI,Helvetica,Arial;" vertex="1" parent="1">
    <mxGeometry x="80" y="30" width="1400" height="60" as="geometry" />
  </mxCell>
`);

// Legend Banner
addCell(`
  <mxCell id="legend_banner" value="&lt;div style=&quot;font-size: 11px; color: #475569; display: flex; align-items: center; gap: 18px;&quot;&gt;&lt;b&gt;Flow Legend:&lt;/b&gt; &lt;span style=&quot;color:#0284C7;&quot;&gt;━ Ingestion Flow&lt;/span&gt; &amp;nbsp;|&amp;nbsp; &lt;span style=&quot;color:#7C3AED;&quot;&gt;━ Graph Science &amp;amp; Metrics&lt;/span&gt; &amp;nbsp;|&amp;nbsp; &lt;span style=&quot;color:#059669;&quot;&gt;━ State &amp;amp; In-Browser Engine&lt;/span&gt; &amp;nbsp;|&amp;nbsp; &lt;span style=&quot;color:#D97706;&quot;&gt;━ UI Render &amp;amp; Visualization&lt;/span&gt; &amp;nbsp;|&amp;nbsp; &lt;span style=&quot;color:#E11D48;&quot;&gt;━ User Actions &amp;amp; Export&lt;/span&gt;&lt;/div&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E2E8F0;strokeWidth=1;fontFamily=Segoe UI,Helvetica,Arial;align=right;spacingRight=16;" vertex="1" parent="1">
    <mxGeometry x="1780" y="35" width="740" height="40" as="geometry" />
  </mxCell>
`);

// --------------------------------------------------------------------------
// Column Background Containers (parent="1" so no relative clipping!)
// --------------------------------------------------------------------------
function addContainerBox(id, label, x, y, w, h, headerBg, strokeColor) {
  addCell(`
    <mxCell id="${id}" value="" style="rounded=1;arcSize=4;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=${strokeColor};strokeWidth=2;shadow=0;" vertex="1" parent="1">
      <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" />
    </mxCell>
    <mxCell id="${id}_hdr" value="&lt;b style=&quot;font-size: 13px; color: #FFFFFF;&quot;&gt;${xmlEscape(label)}&lt;/b&gt;" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=${headerBg};strokeColor=none;align=left;spacingLeft=16;fontFamily=Segoe UI,Helvetica,Arial;" vertex="1" parent="1">
      <mxGeometry x="${x}" y="${y}" width="${w}" height="42" as="geometry" />
    </mxCell>
  `);
}

const COL_Y = 110;
const COL_H = 1120;
const COL_W = 440;

addContainerBox('col0_bg', 'TIER 1 &bull; Data Sources &amp; Ingestion Swarm', 80, COL_Y, COL_W, COL_H, '#0284C7', '#BAE6FD');
addContainerBox('col1_bg', 'TIER 2 &bull; Network Science &amp; Graph Analytics', 580, COL_Y, COL_W, COL_H, '#7C3AED', '#DDD6FE');
addContainerBox('col2_bg', 'TIER 3 &bull; React State &amp; Dynamic Client Engine', 1080, COL_Y, COL_W, COL_H, '#059669', '#A7F3D0');
addContainerBox('col3_bg', 'TIER 4 &bull; Presentation Canvas &amp; WebGL Visualizations', 1580, COL_Y, COL_W, COL_H, '#D97706', '#FDE68A');
addContainerBox('col4_bg', 'TIER 5 &bull; Interaction, Synthesis &amp; Output Artifacts', 2080, COL_Y, COL_W, COL_H, '#E11D48', '#FECDD3');


// --------------------------------------------------------------------------
// Card Helper Function
// --------------------------------------------------------------------------
function addCard(id, title, tag, bullets, x, y, w, h, borderColor = '#CBD5E1', accentColor = '#1E293B', badgeBg = '#F1F5F9', badgeText = '#475569') {
  const bulletHtml = bullets.map(b => `&bull; ${b}`).join('&lt;br/&gt;');
  const content = `
    &lt;div style=&quot;display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;&quot;&gt;
      &lt;span style=&quot;font-size: 13px; font-weight: 700; color: ${accentColor};&quot;&gt;${xmlEscape(title)}&lt;/span&gt;
      &lt;span style=&quot;font-size: 10px; font-weight: 600; background: ${badgeBg}; color: ${badgeText}; padding: 2px 7px; border-radius: 4px;&quot;&gt;${xmlEscape(tag)}&lt;/span&gt;
    &lt;/div&gt;
    &lt;div style=&quot;font-size: 11px; color: #475569; line-height: 1.45;&quot;&gt;${bulletHtml}&lt;/div&gt;
  `;
  
  addCell(`
    <mxCell id="${id}" value="${content}" style="rounded=1;arcSize=6;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=${borderColor};strokeWidth=1.5;fontFamily=Segoe UI,Helvetica,Arial;align=left;spacingLeft=14;spacingRight=14;shadow=0;" vertex="1" parent="1">
      <mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry" />
    </mxCell>
  `);
}

// --------------------------------------------------------------------------
// TIER 1: Ingestion & Harvest (Col 0: x=80)
// --------------------------------------------------------------------------
addCard(
  'c1_sources', 'Scholarly Repositories & APIs', 'Inputs',
  ['Google Scholar search scraper &amp; citation crawler', 'arXiv API (e-prints &amp; recent advances)', 'OpenAlex Works API (v2 REST metadata)', 'Local uploads (CSV, BibTeX, PDFs)'],
  105, 175, 390, 110, '#93C5FD', '#0369A1', '#E0F2FE', '#0369A1'
);

addCard(
  'c1_crawler', 'Deep Research Harvester', 'Agent Swarm',
  ['Metadata extraction: Title, Authors, Year, DOI', 'Abstract retrieval &amp; semantic deduplication', 'Citation graph &amp; reference list resolution', 'Corpus size: ~200-250 verified high-impact papers'],
  105, 310, 390, 110, '#93C5FD', '#0369A1', '#E0F2FE', '#0369A1'
);

addCard(
  'c1_nlp', 'NLP & Semantic Tokenizer', 'Processing',
  ['Stopwords filtering: general &amp; academic fillers', 'Unigram &amp; bigram domain keyword extraction', 'Term frequency &amp; inverted index generation', 'Field-specific ontology normalization'],
  105, 445, 390, 110, '#93C5FD', '#0369A1', '#E0F2FE', '#0369A1'
);

addCard(
  'c1_raw_artifacts', 'Raw Corpus Repository', 'Raw Data Store',
  ['raw_papers.json (full text &amp; bibliometrics)', 'edges.json (citation &amp; co-occurrence pairs)', 'bibliography.bib (standard BibTeX archive)', 'bibliography.csv (tabular spreadsheet export)'],
  105, 580, 390, 115, '#FCD34D', '#B45309', '#FEF3C7', '#B45309'
);

addCard(
  'c1_cli', 'CLI Literature Generator', 'scripts/generate_lit...',
  ['Executable Node.js batch pipeline generator', 'Generates end-to-end bundles for any domain', 'Automated graph layout &amp; metric computation', 'Exports standardized artifacts for webapp ingestion'],
  105, 725, 390, 115, '#DDD6FE', '#6D28D9', '#EDE9FE', '#6D28D9'
);

addCard(
  'c1_summary', 'Corpus Baseline Metrics', 'Connectomics',
  ['244 Real Papers (1994–2026)', '21,285 Network Edges (Keyword &amp; Citation)', '300,000+ Cross-Citations Aggregated', '9 Thematic Schools of Thought Identified'],
  105, 875, 390, 110, '#CBD5E1', '#334155', '#F1F5F9', '#334155'
);


// --------------------------------------------------------------------------
// TIER 2: Network Science & Graph Analytics (Col 1: x=580)
// --------------------------------------------------------------------------
addCard(
  'c2_vosviewer', 'VOSviewer Association Strength', 'Graph Weighting',
  ['Normalized co-occurrence similarity: S_ij = C_ij / (w_i * w_j)', 'Corrects for highly-cited generalist paper bias', 'Dynamic sparsification threshold (keeps top N edges)', 'Produces dense, topologically robust adjacency matrix'],
  605, 175, 390, 115, '#C4B5FD', '#6D28D9', '#EDE9FE', '#6D28D9'
);

addCard(
  'c2_louvain', 'Louvain Modularity Clustering', 'Communities',
  ['Maximizes Newman-Girvan Modularity Q', 'Iterative local modularity optimization &amp; grouping', 'Identifies 9 cohesive Schools of Thought', 'Calculates Modularity Q = 0.08 (interdisciplinary baseline)'],
  605, 315, 390, 115, '#C4B5FD', '#6D28D9', '#EDE9FE', '#6D28D9'
);

addCard(
  'c2_centrality', 'Betweenness Centrality Engine', 'Bridge Metrics',
  ['Brandes algorithm for all-pairs shortest paths', 'Identifies top boundary spanners (betweenness scores)', 'Counts cross-community bridge edges per paper', 'Ranks pivotal papers linking disparate paradigms'],
  605, 455, 390, 110, '#C4B5FD', '#6D28D9', '#EDE9FE', '#6D28D9'
);

addCard(
  'c2_burt', 'Structural Holes & Gaps', 'Burt Topology',
  ['Detects sparse cross-cluster connections', 'Identifies verified research frontiers (e.g. Precision SC)', 'Synthesizes epistemic debate timelines (1995–present)', 'Constructs logical research argument spine'],
  605, 590, 390, 115, '#C4B5FD', '#6D28D9', '#EDE9FE', '#6D28D9'
);

addCard(
  'c2_bundles', 'Production JSON Bundles', 'Static Contracts',
  ['corpus.json &amp; corpus_full.json (paper records)', 'analysis.json (Louvain communities, bridges, gaps)', 'network_data.json (nodes, 3D coordinates, links)', 'analysis_data.json (precomputed streamgraph &amp; stats)'],
  605, 735, 390, 120, '#FCD34D', '#B45309', '#FEF3C7', '#B45309'
);

addCard(
  'c2_methodology', 'Methodological Integrity', 'Audit & Rigor',
  ['Deterministic seed for reproducible graph layouts', 'Double-checked citation links across DOIs', 'Automated PRISMA 2020 record tracking', 'Guarantees zero synthetic / hallucinated papers'],
  605, 885, 390, 105, '#CBD5E1', '#334155', '#F1F5F9', '#334155'
);


// --------------------------------------------------------------------------
// TIER 3: React State & Dynamic Client Engine (Col 2: x=1080)
// --------------------------------------------------------------------------
addCard(
  'c3_context', 'LiteratureMapContext.tsx', 'State Hub',
  ['Central React Context &amp; Custom Hook (useLiteratureMap)', 'Exposes: networkData, analysisData, activePresetId', 'Selected node &amp; active community highlight state', 'Broadcasts instant reactive updates across all 12 views'],
  1105, 175, 390, 120, '#6EE7B7', '#047857', '#D1FAE5', '#047857'
);

addCard(
  'c3_openalex_service', 'openAlexService.ts (Live Engine)', 'In-Browser Math',
  ['Real-time client-side literature mapping for ANY query', 'In-browser TF-IDF &amp; Association Strength calculation', 'Client-side Louvain clustering &amp; betweenness graph', 'Zero backend dependency — 100% static client execution'],
  1105, 320, 390, 120, '#6EE7B7', '#047857', '#D1FAE5', '#047857'
);

addCard(
  'c3_presets', 'Preset Engine (mapConfig.ts)', 'Multi-Domain',
  ['Preset 1: Network Neuroscience (244 papers)', 'Preset 2: Quantum Computing / QEC (200 papers)', 'Preset 3: Topological Deep Learning (200 papers)', 'Dynamic theme tokens, color scales &amp; stat overrides'],
  1105, 465, 390, 115, '#6EE7B7', '#047857', '#D1FAE5', '#047857'
);

addCard(
  'c3_persistence', 'Client Storage & Caching', 'Persistence',
  ['localStorage Topic Search History', 'Live query result caching (prevents repeat API hits)', 'Saved user annotations, reading lists &amp; bookmarks', 'URL hash state for shareable filtered views'],
  1105, 605, 390, 110, '#6EE7B7', '#047857', '#D1FAE5', '#047857'
);

addCard(
  'c3_error_boundary', 'Resilient Error Boundary Grid', 'Stability',
  ['Per-section class ErrorBoundary components in App.tsx', 'Prevents individual chart errors from crashing page', 'Isolated fallback notice cards with debug details', 'Ensures 99.9% uptime during malformed user uploads'],
  1105, 740, 390, 115, '#FCA5A5', '#B91C1C', '#FEE2E2', '#B91C1C'
);

addCard(
  'c3_performance', 'Performance & Animation Stack', 'Core Libs',
  ['Tailwind CSS (warm academic theme &amp; deep space dark)', 'useScrollAnimation hook for smooth reveal triggers', 'Source Serif Pro (body) + JetBrains Mono (data)', 'Lucide React icon system &amp; clsx/twMerge utilities'],
  1105, 880, 390, 110, '#CBD5E1', '#334155', '#F1F5F9', '#334155'
);


// --------------------------------------------------------------------------
// TIER 4: Presentation Canvas & Visualizations (Col 3: x=1580)
// --------------------------------------------------------------------------
addCard(
  'c4_hero', 'HeroSection (3D Star Map)', 'WebGL / 3D',
  ['react-force-graph-3d with Three.js engine', 'UnrealBloomPass post-processing (jewel nodes &amp; filaments)', 'THREE.Points star-dust background particles', 'Gold pill color mode toggle: School / Year / Journal', 'Camera Fly-To on node select with inspect drawer'],
  1605, 175, 390, 140, '#FDE68A', '#92400E', '#FEF3C7', '#92400E'
);

addCard(
  'c4_thematic', 'Thematic & Structural Sections', 'Epistemics',
  ['SchoolsSection: Louvain cards with Modularity Q meter', 'DebateSection: Interactive controversy timeline (1995–now)', 'GapSection: Structural hole visualization &amp; argument spine', 'BridgeSection: Betweenness leaderboard &amp; boundary spanners'],
  1605, 335, 390, 125, '#FDE68A', '#92400E', '#FEF3C7', '#92400E'
);

addCard(
  'c4_d3_charts', 'ClusterSection (D3 Dynamics)', 'D3.js Charts',
  ['Stacked Area Streamgraph: School publication trends over time', 'Dynamic X/Y linear scales with responsive SVG resize', 'Co-Citation Heatmap: Top 30 Bridge Papers similarity matrix', 'Hover tooltips, dynamic domain clamps, PNG/SVG/CSV export'],
  1605, 485, 390, 130, '#93C5FD', '#0369A1', '#E0F2FE', '#0369A1'
);

addCard(
  'c4_evidence', 'Methodology & Evidence Tables', 'PRISMA & Data',
  ['PrismaSection: PRISMA 2020 Systematic Flowchart', 'EvidenceSection: Filterable table (Modality, N, Findings, Limits)', 'JournalSection: Top publishing venues &amp; decade histograms', 'Multi-column search, sorting, and pagination'],
  1605, 640, 390, 120, '#FDE68A', '#92400E', '#FEF3C7', '#92400E'
);

addCard(
  'c4_synthesis', 'Authoring & Ingestion Hubs', 'Interactive Hub',
  ['WritingSection: AI literature review assistant &amp; gap outline', 'UploadSection: Drag &amp; drop BibTeX, CSV &amp; PDF parser', 'DownloadSection: 1-click comprehensive corpus bundle center', 'TopicSearchBar: Live OpenAlex querying interface in Navbar'],
  1605, 785, 390, 120, '#FDE68A', '#92400E', '#FEF3C7', '#92400E'
);

addCard(
  'c4_footer', 'Navigation & Layout Shell', 'Layout.tsx',
  ['Sticky Navbar with smooth anchor scrolling', 'Progress indicator &amp; topic badge', 'Footer with project metadata, version &amp; attribution', 'Full responsive design (Mobile, Tablet, 4K Desktop)'],
  1605, 930, 390, 95, '#CBD5E1', '#334155', '#F1F5F9', '#334155'
);


// --------------------------------------------------------------------------
// TIER 5: Interaction & Output Artifacts (Col 4: x=2080)
// --------------------------------------------------------------------------
addCard(
  'c5_user_actions', 'User Interactive Actions', 'User Events',
  ['Explore: Pan, rotate 3D graph, click papers for details', 'Search: Type any scholarly topic for live map generation', 'Filter: Toggle school communities, year range sliders', 'Annotate: Add notes, comments &amp; export citations'],
  2105, 175, 390, 120, '#FECDD3', '#9F1239', '#FFE4E6', '#9F1239'
);

addCard(
  'c5_webapp', 'Static Web App Deployment', 'Hosted Target',
  ['Hosted on Cloudflare Pages / Vercel / Static CDN', 'Zero backend maintenance &bull; 100% static CDN delivery', 'Instant initial page load (&lt;1s cold start)', 'Client-side routing with URL deep-linking'],
  2105, 320, 390, 115, '#FECDD3', '#9F1239', '#FFE4E6', '#9F1239'
);

addCard(
  'c5_docx', 'Publication-Ready Manuscript', 'Synthesis Doc',
  ['literature_review.docx (Formatted Microsoft Word document)', 'literature_review.md (Markdown source version)', 'APA 7th Edition formatted bibliographies &amp; citations', 'Comprehensive synthesis of schools, debates &amp; frontiers'],
  2105, 460, 390, 120, '#FECDD3', '#9F1239', '#FFE4E6', '#9F1239'
);

addCard(
  'c5_corpus_zip', 'Complete Corpus Archive', 'Data Deliverable',
  ['corpus.zip containing full JSON bibliometrics', 'All 244 papers metadata + direct DOI resolver links', 'Standardized bibliography.bib &amp; bibliography.csv', 'Ready for ingestion in Zotero, Mendeley, or Python pandas'],
  2105, 605, 390, 120, '#FECDD3', '#9F1239', '#FFE4E6', '#9F1239'
);

addCard(
  'c5_graphics', 'High-Resolution Visual Assets', '300 DPI Figures',
  ['Publication-grade 300 DPI PNG exports for papers', 'Lossless Scalable Vector Graphics (SVG) exports', 'Raw tabular CSV data downloads per chart', 'Ready for LaTeX inclusion or slide presentations'],
  2105, 750, 390, 115, '#FECDD3', '#9F1239', '#FFE4E6', '#9F1239'
);

addCard(
  'c5_extensibility', 'Ecosystem Extensibility', 'Future Scale',
  ['Custom domain plugins via mapConfig.ts', 'Batch automation via generate_literature_map.js', 'LLM writing copilot integration hooks', 'Multi-tenant export &amp; publication engine'],
  2105, 890, 390, 105, '#CBD5E1', '#334155', '#F1F5F9', '#334155'
);


// --------------------------------------------------------------------------
// Clean Explicit Edges (Horizontal, Orthogonal, Port-Anchored)
// --------------------------------------------------------------------------
function addEdge(sourceId, targetId, label = '', color = '#64748B', width = 2, dash = 0) {
  const dashStyle = dash ? ';dashed=1;' : '';
  const style = `edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;strokeColor=${color};strokeWidth=${width}${dashStyle};fontFamily=Segoe UI,Helvetica,Arial;fontSize=10;fontColor=${color};`;
  addCell(`
    <mxCell id="edge_${sourceId}_${targetId}" value="${xmlEscape(label)}" style="${style}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>
  `);
}

// Col 0 -> Col 0 Internal
addEdge('c1_sources', 'c1_crawler', 'Harvests', '#0284C7', 2);
addEdge('c1_crawler', 'c1_nlp', 'Tokens', '#0284C7', 2);
addEdge('c1_nlp', 'c1_raw_artifacts', 'Saves', '#0284C7', 2);
addEdge('c1_raw_artifacts', 'c1_cli', 'Batch Input', '#0284C7', 2);

// Col 0 -> Col 1 (Data to Algorithms)
addEdge('c1_cli', 'c2_vosviewer', 'Co-occurrence', '#7C3AED', 2.5);
addEdge('c2_vosviewer', 'c2_louvain', 'Adjacency', '#7C3AED', 2);
addEdge('c2_louvain', 'c2_centrality', 'Partitions', '#7C3AED', 2);
addEdge('c2_centrality', 'c2_burt', 'Bridge Metrics', '#7C3AED', 2);
addEdge('c2_burt', 'c2_bundles', 'Synthesizes', '#7C3AED', 2.5);

// Col 1 -> Col 2 (Bundles to Context)
addEdge('c2_bundles', 'c3_context', 'Static Ingest', '#059669', 2.5);
addEdge('c3_presets', 'c3_context', 'Presets', '#059669', 1.5);
addEdge('c3_openalex_service', 'c3_context', 'Live Updates', '#059669', 2);
addEdge('c3_context', 'c3_persistence', 'Caches', '#059669', 1.5);
addEdge('c3_error_boundary', 'c3_context', 'Guards', '#EF4444', 1.5, 1);

// Col 2 -> Col 3 (State to UI Presentation)
addEdge('c3_context', 'c4_hero', '3D Nodes/Links', '#D97706', 2.5);
addEdge('c3_context', 'c4_thematic', 'Communities & Debates', '#D97706', 2);
addEdge('c3_context', 'c4_d3_charts', 'Yearly Evolution', '#D97706', 2);
addEdge('c3_context', 'c4_evidence', 'Paper Matrices', '#D97706', 2);
addEdge('c3_context', 'c4_synthesis', 'Gaps & Arguments', '#D97706', 2);

// Col 3 <-> Col 2 (User Upload loop)
// When user uploads or searches in UI, it triggers openAlexService
const feedbackStyle = 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;exitX=0;exitY=0.75;exitDx=0;exitDy=0;entryX=1;entryY=0.75;entryDx=0;entryDy=0;strokeColor=#059669;strokeWidth=2;dashed=1;fontFamily=Segoe UI,Helvetica,Arial;fontSize=10;fontColor=#059669;';
addCell(`
  <mxCell id="edge_user_query_loop" value="Live In-Browser Query" style="${feedbackStyle}" edge="1" parent="1" source="c4_synthesis" target="c3_openalex_service">
    <mxGeometry relative="1" as="geometry" />
  </mxCell>
`);

// Col 3 -> Col 4 (UI Views to Outputs)
addEdge('c4_hero', 'c5_webapp', 'Renders 3D View', '#E11D48', 2);
addEdge('c4_synthesis', 'c5_docx', 'Exports Review', '#E11D48', 2.5);
addEdge('c4_synthesis', 'c5_corpus_zip', 'Bundles All', '#E11D48', 2);
addEdge('c4_d3_charts', 'c5_graphics', 'PNG / SVG', '#E11D48', 2);
addEdge('c5_user_actions', 'c4_hero', 'Interacts', '#E11D48', 1.5, 1);


// --------------------------------------------------------------------------
// XML Assembly
// --------------------------------------------------------------------------
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="Antigravity" version="24.0.0" type="device">
  <diagram id="living-literature-map-pro-architecture" name="Living Literature Map — Master End-to-End Architecture">
    <mxGraphModel dx="2800" dy="1600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2600" pageHeight="1300" background="#FAF9F6" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        ${cells.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

const outputPath = path.resolve('literature_map_architecture.drawio');
fs.writeFileSync(outputPath, xmlContent, 'utf8');
console.log('Successfully written pro drawio to:', outputPath);

const artifactPath = path.resolve('C:/Users/rahul/.gemini/antigravity-ide/brain/e9098d0f-6df0-4e27-a976-8cd4228df97d/literature_map_architecture.drawio');
try {
  fs.writeFileSync(artifactPath, xmlContent, 'utf8');
  console.log('Successfully written pro drawio to artifact:', artifactPath);
} catch (e) {
  console.log('Artifact dir note:', e.message);
}
