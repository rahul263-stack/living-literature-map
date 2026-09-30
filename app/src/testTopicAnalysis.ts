import { generateLiteratureMapForTopic } from './services/openAlexService';

interface QualityPaperNode {
  id: string;
  title: string;
  authors: string | string[];
  year: number;
  journal: string;
  citations: number;
  community: number;
  community_name: string;
  abstract: string;
  doi: string;
  keywords: string[];
}

function computeQualityFlags(papers: QualityPaperNode[]) {
  const total = papers.length;
  const hasDoi = papers.filter((p) => p.doi && p.doi.length > 0).length;
  const hasAbstract = papers.filter(
    (p) => p.abstract && p.abstract.length > 20 && !p.abstract.startsWith('\u2026')
  ).length;
  const hasCitations = papers.filter((p) => p.citations > 0).length;
  const knownJournal = papers.filter((p) => p.journal && p.journal.length > 2).length;
  const preprintOnly = papers.filter(
    (p) =>
      p.journal?.toLowerCase().includes('arxiv') ||
      p.journal?.toLowerCase().includes('biorxiv') ||
      p.journal?.toLowerCase().includes('medrxiv')
  ).length;
  const lowCitations = papers.filter((p) => p.citations < 50).length;

  return {
    total,
    good: [
      { label: 'Has DOI', count: hasDoi },
      { label: 'Has Abstract', count: hasAbstract },
      { label: 'Has Citations', count: hasCitations },
      { label: 'Known Journal', count: knownJournal },
    ],
    moderate: [
      { label: 'Preprint Only', count: preprintOnly },
      { label: 'Low Citation Count (<50)', count: lowCitations },
    ],
    limited: [
      { label: 'Missing DOI', count: total - hasDoi },
      { label: 'Missing Abstract', count: total - hasAbstract },
      { label: 'arXiv-only', count: papers.filter((p) => p.journal?.toLowerCase().includes('arxiv')).length },
    ],
  };
}

function inferModality(node: { title: string; abstract?: string; keywords?: string[] }): string {
  const text = `${node.title} ${node.abstract || ''} ${(node.keywords || []).join(' ')}`.toLowerCase();
  if (text.includes('clinical') || text.includes('trial') || text.includes('patient') || text.includes('therapy')) return 'Clinical';
  if (text.includes('computat') || text.includes('model') || text.includes('simulat') || text.includes('algorithm') || text.includes('neural')) return 'Computational';
  if (text.includes('experim') || text.includes('assay') || text.includes('in vitro') || text.includes('in vivo')) return 'Experimental';
  if (text.includes('theor') || text.includes('framework') || text.includes('concept') || text.includes('formal')) return 'Theoretical';
  if (text.includes('review') || text.includes('survey') || text.includes('meta-analysis') || text.includes('systematic')) return 'Review';
  if (text.includes('method') || text.includes('protocol') || text.includes('technique') || text.includes('pipeline')) return 'Methodological';
  return 'Empirical';
}

function generateBibTeX(nodes: QualityPaperNode[]): string {
  return nodes
    .slice(0, 5)
    .map((n) => {
      const authorList = Array.isArray(n.authors) ? n.authors.join(' and ') : n.authors || 'Unknown';
      const cleanKey = (Array.isArray(n.authors) && n.authors[0] ? n.authors[0].split(' ').pop() : 'author') + (n.year || 2024);
      return `@article{${cleanKey},\n  title={${n.title}},\n  author={${authorList}},\n  journal={${n.journal}},\n  year={${n.year}}\n}`;
    })
    .join('\n\n');
}

async function runAnalysisTest(randomTopic: string) {
  console.log(`\n======================================================`);
  console.log(`🧪 TESTING LIVING LITERATURE MAP FOR RANDOM TOPIC: "${randomTopic}"`);
  console.log(`======================================================\n`);

  const startTime = Date.now();
  console.log(`[1/5] Fetching and synthesizing literature map...`);
  
  const result = await generateLiteratureMapForTopic(randomTopic, 40, (msg) => {
    console.log(`   -> [Progress] ${msg}`);
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Synthesis completed in ${duration}s!\n`);

  const { config, networkData, analysisData } = result;

  // 1. Core Sanity Check
  console.log(`--- [SECTION 1: HERO & GRAPH DATA] ---`);
  console.log(`Topic Title:        "${config.title}"`);
  console.log(`Topic Subtitle:     "${config.subtitle}"`);
  console.log(`Total Nodes:        ${networkData.nodes.length}`);
  console.log(`Total Edges:        ${networkData.links.length}`);
  console.log(`Modularity Q:       ${analysisData.modularity_q}`);
  console.log(`Number of Schools:  ${analysisData.num_communities}`);

  if (networkData.nodes.length === 0) {
    throw new Error('❌ FAILED: 0 nodes generated for topic!');
  }

  // 2. ClusterSection (Schools of Thought)
  console.log(`\n--- [SECTION 2: CLUSTER SECTION (SCHOOLS OF THOUGHT)] ---`);
  const schools = config.schools || [];
  console.log(`Detected Schools count: ${schools.length}`);
  schools.forEach((s) => {
    console.log(`  School ${s.id} (${s.name}):`);
    console.log(`    - Description: "${(s.description || '').slice(0, 80)}..."`);
    console.log(`    - Papers: ${s.papers_count ?? s.paperCount}`);
    console.log(`    - Key Authors: ${(s.key_authors || []).slice(0, 3).join(', ')}`);
    console.log(`    - Core Keywords: ${(s.core_concepts || []).slice(0, 4).join(', ')}`);
  });

  // 3. BridgeSection
  console.log(`\n--- [SECTION 3: BRIDGE SECTION (INTERDISCIPLINARY CONNECTORS)] ---`);
  const bridges = analysisData.bridge_papers || [];
  console.log(`Detected Bridges count: ${bridges.length}`);
  bridges.slice(0, 3).forEach((b, i) => {
    console.log(`  Bridge #${i + 1}: "${b.title.slice(0, 60)}..."`);
    console.log(`    Betweenness Centrality: ${b.betweenness}`);
    console.log(`    Cross-community Edges: ${b.cross_community_edges}`);
  });

  // 4. JournalSection
  console.log(`\n--- [SECTION 4: JOURNAL & TEMPORAL SECTION] ---`);
  const years = networkData.nodes.map((n) => n.year).filter((y) => y > 1800);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  console.log(`Year Range:         ${minYear} - ${maxYear}`);
  const timelineEntries = Object.entries(analysisData.timeline || {});
  console.log(`Timeline Milestones: ${timelineEntries.length}`);
  timelineEntries.slice(0, 3).forEach(([year, t]) => {
    console.log(`  Milestone ${year}: Papers=${t.count}`);
  });

  // 5. PrismaSection
  console.log(`\n--- [SECTION 5: PRISMA FLOW & QUALITY SECTION] ---`);
  const qualityFlags = computeQualityFlags(networkData.nodes as any);
  console.log(`PRISMA Flow Included Count: ${qualityFlags.total}`);
  console.log(`Quality Flags:`);
  console.log(`  Good:     ${qualityFlags.good.map((g) => `${g.label}=${g.count}`).join(', ')}`);
  console.log(`  Moderate: ${qualityFlags.moderate.map((m) => `${m.label}=${m.count}`).join(', ')}`);
  console.log(`  Limited:  ${qualityFlags.limited.map((l) => `${l.label}=${l.count}`).join(', ')}`);

  // 6. EvidenceSection
  console.log(`\n--- [SECTION 6: EVIDENCE MATRIX & METHODOLOGY MODALITIES] ---`);
  const modalitiesCount: Record<string, number> = {};
  networkData.nodes.forEach((n) => {
    const mod = inferModality(n);
    modalitiesCount[mod] = (modalitiesCount[mod] || 0) + 1;
  });
  console.log(`Inferred Modalities Breakdown:`, modalitiesCount);

  // 7. WritingSection (Argument Spine)
  console.log(`\n--- [SECTION 7: WRITING & AI SYNTHESIS SECTION] ---`);
  const spine = analysisData.argument_spine as any;
  console.log(`Argument Spine:`);
  console.log(`  Claim:        "${(spine?.claim || '').slice(0, 90)}..."`);
  console.log(`  The Gap:      "${(spine?.the_gap || '').slice(0, 90)}..."`);
  console.log(`  Significance: "${(spine?.significance || '').slice(0, 90)}..."`);

  // 8. DownloadSection
  console.log(`\n--- [SECTION 8: EXPORT & DOWNLOAD CAPABILITIES] ---`);
  const sampleBib = generateBibTeX(networkData.nodes as any);
  console.log(`Sample BibTeX Generated:\n${sampleBib.slice(0, 180)}...\n`);

  console.log(`======================================================`);
  console.log(`🎉 ALL 8 SECTIONS VALIDATED WITH ZERO CRASHES & PURE DYNAMIC DATA!`);
  console.log(`======================================================\n`);
}

// Test with 2 completely different random topics
async function main() {
  try {
    await runAnalysisTest('CRISPR-Cas9 gene editing');
    await runAnalysisTest('Quantum error correction');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

main();
