const fs = require('fs');
const path = require('path');

// Helper to escape XML
function xmlEscape(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

let cellId = 2;
function nextId() {
  return String(cellId++);
}

const cells = [];

function addCell(cell) {
  cells.push(cell);
}

// Containers
function createContainer(id, label, x, y, width, height, fillColor, strokeColor, headerColor = '#1A1B3A') {
  addCell(`
    <mxCell id="${id}" value="${xmlEscape(label)}" style="swimlane;startSize=36;fontFamily=Helvetica;fontSize=14;fontStyle=1;align=left;spacingLeft=14;fillColor=${fillColor};strokeColor=${strokeColor};strokeWidth=2;swimlaneFillColor=${fillColor};swimlaneLine=1;arcSize=10;rounded=1;collapsible=0;" vertex="1" parent="1">
      <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />
    </mxCell>`);
}

// Nodes inside containers or top-level
function createNode(id, parentId, label, x, y, width, height, style) {
  addCell(`
    <mxCell id="${id}" value="${xmlEscape(label)}" style="${style}" vertex="1" parent="${parentId}">
      <mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" />
    </mxCell>`);
}

// Edges
function createEdge(id, sourceId, targetId, label = '', style = 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#B89A4A;strokeWidth=2;fontSize=11;fontColor=#1A1B3A;') {
  addCell(`
    <mxCell id="${id}" value="${xmlEscape(label)}" style="${style}" edge="1" parent="1" source="${sourceId}" target="${targetId}">
      <mxGeometry relative="1" as="geometry" />
    </mxCell>`);
}

// Header / Title Banner
addCell(`
  <mxCell id="title_banner" value="&lt;b style=&quot;font-size: 24px;&quot;&gt;Living Literature Map — Complete End-to-End System Architecture&lt;/b&gt;&lt;br&gt;&lt;span style=&quot;font-size: 13px; color: #5A5C7A;&quot;&gt;Static Web App &amp;bull; Offline Swarm Ingestion &amp;bull; Dynamic Client-Side Graph Engine &amp;bull; Publication Synthesizer&lt;/span&gt;" style="text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontFamily=Helvetica;" vertex="1" parent="1">
    <mxGeometry x="60" y="20" width="1200" height="50" as="geometry" />
  </mxCell>
`);

// ==========================================
// 1. DATA SOURCES & INGESTION
// ==========================================
createContainer('group_ingestion', '1. Data Ingestion & Harvesting Swarm', 60, 90, 420, 680, '#F8FAFC', '#3B82F6');

createNode('node_sources', 'group_ingestion', 
  `<b>Scholarly Sources & APIs</b><br/>• Google Scholar (Deep Search)<br/>• arXiv.org (Preprints API)<br/>• OpenAlex REST API (v2)<br/>• Local CSV / BibTeX Files`, 
  30, 60, 360, 90, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#EFF6FF;strokeColor=#3B82F6;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_crawler', 'group_ingestion', 
  `<b>Corpus Harvester (deep-research-swarm)</b><br/>• Metadata Extraction (Title, Authors, Year, DOI)<br/>• Abstract Ingestion & Corpus Deduplication<br/>• Citation & Reference List Resolution`, 
  30, 180, 360, 85, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#93C5FD;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_nlp_clean', 'group_ingestion', 
  `<b>NLP & Semantic Feature Extractor</b><br/>• Stopwords Filtering (Academic Fillers Removal)<br/>• Keyphrase / n-gram Tokenization<br/>• Inverted Index & Semantic Bag-of-Words`, 
  30, 295, 360, 85, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#93C5FD;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_raw_output', 'group_ingestion', 
  `<b>Raw Corpus Artifacts</b><br/>• raw_papers.json (Full Bibliometrics)<br/>• edges.json (Direct Citations & Co-occurrences)<br/>• bibliography.bib & bibliography.csv`, 
  30, 410, 360, 85, 
  'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_cli_generator', 'group_ingestion', 
  `<b>CLI Map Generator Engine</b><br/><code>scripts/generate_literature_map.js</code><br/>Automates end-to-end bundling for arbitrary topics`, 
  30, 525, 360, 70, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#EDE9FE;strokeColor=#8B5CF6;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);


// ==========================================
// 2. NETWORK ANALYSIS & GRAPH ALGORITHMS
// ==========================================
createContainer('group_algorithms', '2. Network Science & Analytics Pipeline', 520, 90, 460, 680, '#F8FAFC', '#8B5CF6');

createNode('node_vosviewer', 'group_algorithms', 
  `<b>Association Strength Similarity (VOSviewer)</b><br/>• Normalized Co-occurrence: S_ij = C_ij / (w_i * w_j)<br/>• Thresholding & Graph Densification Filter<br/>• Dynamic Edge Weight Construction`, 
  30, 60, 400, 85, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#C4B5FD;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_louvain', 'group_algorithms', 
  `<b>Community Detection (Louvain Modularity)</b><br/>• Objective: Maximize Newman-Girvan Modularity Q<br/>• Iterative Node Movement & Aggregation<br/>• School of Thought Synthesis & Thematic Labeling`, 
  30, 175, 400, 90, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#C4B5FD;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_centrality', 'group_algorithms', 
  `<b>Centrality & Bridge Node Detection</b><br/>• Brandes Algorithm for Betweenness Centrality<br/>• Cross-Community Edge Counting<br/>• Identification of Key Interdisciplinary Boundary Spanners`, 
  30, 295, 400, 85, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#C4B5FD;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_structural_holes', 'group_algorithms', 
  `<b>Structural Hole & Debate Synthesizer</b><br/>• Detection of Sparse Cross-Cluster Bridges (Burt's Gaps)<br/>• Chronological Epistemic Controversy Mapping<br/>• Argument Spine & Unaddressed Research Frontier`, 
  30, 410, 400, 85, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#C4B5FD;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_bundled_json', 'group_algorithms', 
  `<b>Processed Static Data Bundles</b><br/>• corpus.json & corpus_full.json<br/>• analysis.json (Metrics, Communities, Bridges)<br/>• network_data.json & analysis_data.json`, 
  30, 525, 400, 85, 
  'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=10;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);


// ==========================================
// 3. REACT STATE & LIVE ENGINE
// ==========================================
createContainer('group_frontend_core', '3. Frontend State & In-Browser Engine', 1020, 90, 460, 680, '#F8FAFC', '#10B981');

createNode('node_context', 'group_frontend_core', 
  `<b>LiteratureMapContext (State Orchestrator)</b><br/>• Global React Context & Hook (useLiteratureMap)<br/>• Active Preset Switcher (Neuroscience / Quantum / Custom)<br/>• Filter & Selection State (Active Community, Search Query)<br/>• Live Dataset Injection & State Hydration`, 
  30, 60, 400, 110, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#ECFDF5;strokeColor=#10B981;strokeWidth=2;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_map_config', 'group_frontend_core', 
  `<b>Preset Configuration Engine (mapConfig.ts)</b><br/>• Multi-Domain Configurations (Color Palettes, Topics)<br/>• Precomputed Defaults & Stat Overrides<br/>• Extensible Preset Metadata Registry`, 
  30, 195, 400, 80, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#A7F3D0;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_openalex_live', 'group_frontend_core', 
  `<b>Live In-Browser OpenAlex Engine (openAlexService.ts)</b><br/>• Client-Side Topic Querying without Backend Server<br/>• Dynamic TF-IDF & Association Strengths in JS<br/>• Client-Side Louvain & Betweenness Graph Generation<br/>• Live Cache Management & Local History`, 
  30, 300, 400, 110, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#A7F3D0;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_local_storage', 'group_frontend_core', 
  `<b>Client Persistence Layer</b><br/>• localStorage Topic Query History<br/>• User Annotations, Custom Uploads, & Comments<br/>• Filter State Preservation & Shareable URL Encodings`, 
  30, 435, 400, 75, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#A7F3D0;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);

createNode('node_error_boundaries', 'group_frontend_core', 
  `<b>Resilient Error Boundary Grid</b><br/>Isolated Component Failsafes with Fallback Cards<br/>Ensures zero full-page crashes upon malformed data`, 
  30, 535, 400, 75, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FEF2F2;strokeColor=#EF4444;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=left;spacingLeft=12;'
);


// ==========================================
// 4. UI SECTIONS & VISUALIZATION
// ==========================================
createContainer('group_ui_views', '4. Presentation Layer — Single Scrolling Map (App.tsx)', 1520, 90, 520, 1080, '#F8FAFC', '#D97706');

createNode('node_nav', 'group_ui_views', 
  `<b>Sticky Nav & Controls</b><br/>Navbar.tsx &bull; TopicSearchBar.tsx &bull; Theme / Color Mode Pill Toggle`, 
  30, 50, 460, 50, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFBEB;strokeColor=#F59E0B;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=center;'
);

createNode('node_hero_3d', 'group_ui_views', 
  `<b>HeroSection (3D Star Map Constellation)</b><br/>• react-force-graph-3d with Three.js WebGL Engine<br/>• UnrealBloomPass Post-Processing & Starfield Particles<br/>• Dynamic Camera Fly-To & 3 Color Modes (School/Year/Journal)`, 
  30, 115, 460, 85, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#1E1E38;strokeColor=#B89A4A;strokeWidth=2;fontFamily=Helvetica;fontSize=11;fontColor=#FAF9F6;align=left;spacingLeft=12;'
);

createNode('node_schools', 'group_ui_views', 
  `<b>SchoolsSection (Foundational Communities)</b><br/>Louvain cluster cards, Modularity Q display, keywords & citation stats`, 
  30, 215, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_debates', 'group_ui_views', 
  `<b>DebateSection (Epistemic Controversy Timeline)</b><br/>Chronological evolution of foundational dilemmas and opposing paradigms`, 
  30, 285, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_gap', 'group_ui_views', 
  `<b>GapSection (Structural Holes & Argument Spine)</b><br/>Visualizing under-connected research boundaries and synthesis opportunities`, 
  30, 355, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_cluster', 'group_ui_views', 
  `<b>ClusterSection (D3 Temporal Dynamics & Co-citation)</b><br/>• Stacked Area Streamgraph (School Publications Over Time)<br/>• Co-Citation Heatmap (Top 30 Bridge Papers Matrix)<br/>• Interactive Tooltips, Dynamic Scales, PNG/SVG/CSV Exports`, 
  30, 425, 460, 85, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#3B82F6;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_bridges', 'group_ui_views', 
  `<b>BridgeSection (Interdisciplinary Leaderboard)</b><br/>Betweenness centrality ranking, boundary spanners, cross-citation counts`, 
  30, 525, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_journals', 'group_ui_views', 
  `<b>JournalSection (Bibliometric Distributions)</b><br/>Top publishing journals, impact factors, decade histograms`, 
  30, 595, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_prisma', 'group_ui_views', 
  `<b>PrismaSection (Systematic Review Methodology)</b><br/>Interactive PRISMA 2020 Flow Diagram: Identification &bull; Screening &bull; Inclusion`, 
  30, 665, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_evidence', 'group_ui_views', 
  `<b>EvidenceSection (Structured Evidence Matrix)</b><br/>Interactive Filterable Table: Modality &bull; Sample Size (N) &bull; Key Findings &bull; Limitations`, 
  30, 735, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_writing', 'group_ui_views', 
  `<b>WritingSection (AI Synthesis & Literature Review Assistant)</b><br/>Pre-computed argument spine, narrative draft synthesis, export to .docx`, 
  30, 805, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_upload', 'group_ui_views', 
  `<b>UploadSection (Client-Side Ingestion Hub)</b><br/>Drag-and-drop CSV, BibTeX, PDF parser, live graph re-computation`, 
  30, 875, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('node_download', 'group_ui_views', 
  `<b>DownloadSection (Corpus & Research Bundle Center)</b><br/>One-click bundle download: corpus.zip, BibTeX, CSV, JSON, Word Review`, 
  30, 945, 460, 55, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#10B981;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);


// ==========================================
// 5. EXPORT ARTIFACTS & DEPLOYMENT
// ==========================================
createContainer('group_outputs', '5. System Artifacts & Deployment Targets', 60, 800, 1420, 370, '#F8FAFC', '#475569');

createNode('out_webapp', 'group_outputs', 
  `<b>Static Web App Deployment</b><br/>• Zero-Backend Host (Cloudflare Pages / Vercel / Static CDN)<br/>• Fast Client-Side Routing & Smooth Scrolling<br/>• Offline PWA / Local Browser Execution`, 
  30, 60, 310, 110, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#F1F5F9;strokeColor=#475569;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('out_review_doc', 'group_outputs', 
  `<b>Publication-Ready Review Document</b><br/>• literature_review.docx (Formatted Word Document)<br/>• literature_review.md (Markdown Source)<br/>• Grounded in 244 Verified DOIs with APA Citations`, 
  370, 60, 310, 110, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#F1F5F9;strokeColor=#475569;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('out_corpus_bundle', 'group_outputs', 
  `<b>Comprehensive Research Corpus ZIP</b><br/>• corpus.zip (All Papers Metadata + Full JSONs)<br/>• bibliography.bib (Standard BibTeX Archive)<br/>• bibliography.csv (Spreadsheet Ingestion)`, 
  710, 60, 310, 110, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#F1F5F9;strokeColor=#475569;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('out_graphics', 'group_outputs', 
  `<b>High-Res Academic Figures</b><br/>• 300 DPI Publication PNGs<br/>• Scalable Vector Graphics (SVG)<br/>• Interactive CSV Data Table Exports`, 
  1050, 60, 330, 110, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#F1F5F9;strokeColor=#475569;strokeWidth=1.5;fontFamily=Helvetica;fontSize=11;align=left;spacingLeft=12;'
);

createNode('out_stats_summary', 'group_outputs', 
  `<b>Verified Corpus Metrics (Brain Connectomics Baseline)</b><br/>• 244 Peer-Reviewed Papers &bull; 21,285 Network Edges &bull; 9 Schools of Thought &bull; Modularity Q = 0.08 &bull; ~300,000+ Citations Analyzed`, 
  30, 200, 1350, 60, 
  'rounded=1;whiteSpace=wrap;html=1;fillColor=#FEF3C7;strokeColor=#D97706;strokeWidth=1.5;fontFamily=Helvetica;fontSize=12;align=center;fontStyle=1;'
);


// ==========================================
// CONNECTING EDGES
// ==========================================
createEdge(nextId(), 'node_sources', 'node_crawler', 'Harvests');
createEdge(nextId(), 'node_crawler', 'node_nlp_clean', 'Tokenizes');
createEdge(nextId(), 'node_nlp_clean', 'node_raw_output', 'Persists');
createEdge(nextId(), 'node_raw_output', 'node_cli_generator', 'Input Data');

createEdge(nextId(), 'node_cli_generator', 'node_vosviewer', 'Computes');
createEdge(nextId(), 'node_vosviewer', 'node_louvain', 'Adjacency Matrix');
createEdge(nextId(), 'node_louvain', 'node_centrality', 'Community Partitions');
createEdge(nextId(), 'node_centrality', 'node_structural_holes', 'Bridge Metrics');
createEdge(nextId(), 'node_structural_holes', 'node_bundled_json', 'Generates Bundles');

createEdge(nextId(), 'node_bundled_json', 'node_context', 'Static Ingestion');
createEdge(nextId(), 'node_map_config', 'node_context', 'Presets');
createEdge(nextId(), 'node_openalex_live', 'node_context', 'Live Topic Mapping');
createEdge(nextId(), 'node_context', 'node_local_storage', 'Syncs History');

createEdge(nextId(), 'node_context', 'node_nav', 'Feeds Active Topic');
createEdge(nextId(), 'node_context', 'node_hero_3d', 'Network Nodes/Edges');
createEdge(nextId(), 'node_context', 'node_schools', 'Community Stats');
createEdge(nextId(), 'node_context', 'node_debates', 'Timeline Data');
createEdge(nextId(), 'node_context', 'node_cluster', 'Evolution Series');
createEdge(nextId(), 'node_upload', 'node_openalex_live', 'User Queries / Files');

createEdge(nextId(), 'node_writing', 'out_review_doc', 'Generates Docx');
createEdge(nextId(), 'node_download', 'out_corpus_bundle', 'Zips Corpus');
createEdge(nextId(), 'group_ui_views', 'out_webapp', 'Build & Deploy');
createEdge(nextId(), 'node_cluster', 'out_graphics', 'Direct Export');

// Complete XML Construction
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-09-26T01:15:00.000Z" agent="Antigravity" version="24.0.0" type="device">
  <diagram id="literature-map-architecture" name="Living Literature Map — End-to-End Architecture">
    <mxGraphModel dx="2400" dy="1600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2200" pageHeight="1300" background="#FAF9F6" math="0" shadow="0">
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
console.log('Successfully written to:', outputPath);

const artifactPath = path.resolve('C:/Users/rahul/.gemini/antigravity-ide/brain/e9098d0f-6df0-4e27-a976-8cd4228df97d/literature_map_architecture.drawio');
try {
  fs.writeFileSync(artifactPath, xmlContent, 'utf8');
  console.log('Successfully written to artifact:', artifactPath);
} catch (e) {
  console.log('Could not write to artifact directory directly:', e.message);
}
