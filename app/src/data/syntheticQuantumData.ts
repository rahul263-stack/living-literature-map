import type { NetworkData, AnalysisData, NetworkNode, NetworkLink, CommunityRecord } from '@/types';
import { QUANTUM_COMPUTING_CONFIG } from '@/config/mapConfig';

/* ------------------------------------------------------------------ */
/*  Procedural Quantum Benchmark Dataset Generator                     */
/* ------------------------------------------------------------------ */
export function generateSyntheticQuantumData(): { network: NetworkData; analysis: AnalysisData } {
  const communitiesList = [
    'Surface & Color Codes',
    'qLDPC & High-Rate Codes',
    'Real-Time Decoding & MWPM',
    'Superconducting Qubits',
    'Trapped-Ion & Neutral-Atom',
    'Fault-Tolerant Thresholds',
    'Magic State Distillation',
  ];

  const nodes: NetworkNode[] = [];
  const links: NetworkLink[] = [];
  const clusterFirstNodes: string[] = [];

  const authorsPool = [
    'AG Fowler', 'SB Bravyi', 'AY Kitaev', 'ET Campbell', 'BM Terhal',
    'C Horsman', 'H Bombin', 'P Panteleev', 'G Kalachev', 'D Gottesman',
    'RJ Schoelkopf', 'MD Lukin', 'C Monroe', 'J Preskill', 'A Wallraff'
  ];

  let idCounter = 0;
  communitiesList.forEach((commName, commIdx) => {
    const clusterSize = 25 + Math.floor(Math.random() * 10);
    const clusterNodes: string[] = [];

    for (let i = 0; i < clusterSize; i++) {
      const id = `q_${idCounter++}`;
      clusterNodes.push(id);
      const year = 2005 + Math.floor(Math.random() * 22);
      const citations = Math.floor(Math.pow(Math.random(), 2) * 2200) + 15;
      const author = `${authorsPool[(commIdx + i) % authorsPool.length]}, ${authorsPool[(commIdx + i + 3) % authorsPool.length]}`;
      nodes.push({
        id,
        title: `${commName}: Landmark study on ${['fault-tolerant scaling', 'threshold benchmarking', 'correlated syndrome extraction', 'lattice surgery gates', 'decoder parallelization'][i % 5]} (${year})`,
        authors: author,
        year,
        journal: ['Physical Review X', 'Nature Quantum Information', 'Physical Review Letters', 'Quantum', 'IEEE Micro'][i % 5],
        citations,
        community: commIdx,
        community_name: commName,
        abstract: `This paper introduces scalable fault-tolerant methods for ${commName.toLowerCase()}, demonstrating threshold bounds and architectural trade-offs under realistic physical error models.`,
        doi: `10.1103/PhysRevX.${year}.${1000 + idCounter}`,
        keywords: [commName.split(' ')[0], 'Fault-tolerance', 'Threshold', 'Decoding'],
        val: Math.max(2, Math.log10(citations) * 3),
      });
    }

    // Track first node of each cluster for cross-cluster links
    clusterFirstNodes.push(clusterNodes[0]);

    // Intra-cluster links
    for (let i = 0; i < clusterNodes.length; i++) {
      for (let j = i + 1; j < Math.min(i + 4, clusterNodes.length); j++) {
        links.push({
          source: clusterNodes[i],
          target: clusterNodes[j],
          value: Math.floor(Math.random() * 8) + 2,
        });
      }
    }
  });

  // Cross-cluster links — use tracked first-node IDs (not hardcoded offsets)
  for (let c = 0; c < clusterFirstNodes.length - 1; c++) {
    links.push({ source: clusterFirstNodes[c], target: clusterFirstNodes[c + 1], value: 4 });
  }

  const communitiesMap: Record<string, CommunityRecord> = {};
  communitiesList.forEach((name, idx) => {
    const cNodes = nodes.filter((n) => n.community === idx);
    const cits = cNodes.reduce((s, n) => s + n.citations, 0);
    communitiesMap[String(idx)] = {
      id: idx,
      name,
      size: cNodes.length,
      total_citations: cits,
      mean_citations: Math.round(cits / cNodes.length),
      top_keywords: [[name.split(' ')[0], 18], ['Quantum', 15], ['Threshold', 12]],
      top_authors: [[authorsPool[idx % authorsPool.length], 4], [authorsPool[(idx + 1) % authorsPool.length], 3]],
      year_range: [2005, 2026],
    };
  });

  const bridgePapers = nodes
    .slice(0, 15)
    .sort((a, b) => b.citations - a.citations)
    .map((n, i) => ({
      id: n.id,
      title: n.title,
      authors: n.authors,
      year: n.year,
      community: n.community_name,
      betweenness: 0.018 - i * 0.001,
      cross_community_edges: 80 - i * 3,
      citations: n.citations,
    }));

  const analysis: AnalysisData = {
    modularity_q: 0.142,
    num_communities: communitiesList.length,
    communities: communitiesMap,
    bridge_papers: bridgePapers,
    research_gap: QUANTUM_COMPUTING_CONFIG.researchGap as any,
    argument_spine: QUANTUM_COMPUTING_CONFIG.researchGap?.argument_spine as any,
  };

  return { network: { nodes, links }, analysis };
}
