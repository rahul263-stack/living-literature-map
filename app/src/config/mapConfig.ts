/* ------------------------------------------------------------------ */
/*  Literature Map Domain Configuration Types & Presets                */
/* ------------------------------------------------------------------ */

export interface DebateItem {
  id: number;
  name: string;
  color?: string;
  startYear: number;
  endYear: number;
  peakPeriod: string;
  consensus: 'SETTLED' | 'ONGOING' | 'EMERGING';
  consensusPercent: number;
  description: string;
  keyPapers: { year: number; author: string; title: string; citations?: number }[];
  intensity: { year: number; count: number }[];
}

export interface SchoolConfig {
  id: number;
  name: string;
  color?: string;
  description?: string;
  paperCount?: number;
  papers_count?: number;
  key_authors?: string[];
  core_concepts?: string[];
}

export interface ResearchGapConfig {
  statement: string;
  gap_title?: string;
  title?: string;
  metric?: string;
  metric_label?: string;
  detected_via?: string;
  source_community?: string;
  target_community?: string;
  why_it_matters?: string;
  proposed_direction?: string;
  gap_metrics?: {
    structural_hole_weight?: number;
    mean_weight?: number;
    gap_pct?: string;
    description?: string;
    density_deficit?: string | number;
    expected_density?: string | number;
    actual_density?: string | number;
    cross_citations?: number;
    inter_community_edges?: number;
    inter_cluster_edges?: number;
    inter_modular_density?: number;
  };
  cross_community_bars?: Array<{
    pair: string;
    sourceSchool?: string;
    targetSchool?: string;
    value?: number;
    weight?: number;
    highlight?: boolean;
    isReference?: boolean;
    expected?: number;
    actual?: number;
    density?: number;
  }>;
  argument_spine?: {
    claim?: any;
    evidence_for?: string[];
    counter_evidence?: string[];
    the_gap?: string;
    significance?: string;
    evidence?: any;
    counter?: any;
    gap?: any;
    why?: any;
  };
  argumentSpine?: {
    claim: string;
    evidence: string;
    counter: string;
    gap: string;
    whyItMatters: string;
  };
}

export interface LiteratureMapConfig {
  id: string;
  title: string;
  subtitle: string;
  supertitle?: string;
  domain: string;
  domainName?: string;
  yearRange: [number, number];
  primaryFacetName: string;
  facets: string[];
  theme?: {
    accentGold: string;
    accentIndigo: string;
    darkBg: string;
  };
  schools?: SchoolConfig[];
  topic?: string;
  stats?: {
    numPapers: number;
    numSchools: number;
    numLinks: number;
    modularityQ: number;
    yearRange?: string;
  };
  debates: DebateItem[];
  researchGap: ResearchGapConfig;
}

/* ------------------------------------------------------------------ */
/*  Default Preset: Network Neuroscience & Brain Connectomics         */
/* ------------------------------------------------------------------ */
export const NETWORK_NEUROSCIENCE_CONFIG: LiteratureMapConfig = {
  id: 'connectomics',
  title: 'Connectome Constellation',
  subtitle: '244 papers · 9 schools · 21,285 connections · 1994–2026',
  supertitle: 'Living Literature Map · Network Neuroscience',
  domain: 'Network Neuroscience & Brain Connectomics',
  yearRange: [1994, 2026],
  primaryFacetName: 'Modality',
  facets: ['fMRI', 'dMRI', 'EEG', 'MEG', 'TMS', 'Multi', 'Computational', 'Other'],
  theme: {
    accentGold: '#D4A853',
    accentIndigo: '#1A1B3A',
    darkBg: '#05060B',
  },
  debates: [
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
        'Whether resting-state connectivity is stable over time or inherently time-varying. The 2014 Allen et al. and Hutchison et al. papers established dynamic FC as a real phenomenon, but debate continues on biological significance.',
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
        { year: 2015, author: 'Finn et al.', title: 'Functional connectome fingerprinting', citations: 3300 },
        { year: 2017, author: 'Gordon et al.', title: 'Precision functional mapping', citations: 1540 },
        { year: 2019, author: 'Seitzman et al.', title: 'Trait-like features of individual connectomes', citations: 420 },
      ],
      intensity: [
        { year: 2015, count: 2 }, { year: 2016, count: 3 }, { year: 2017, count: 6 },
        { year: 2018, count: 8 }, { year: 2019, count: 7 }, { year: 2020, count: 6 },
        { year: 2021, count: 5 }, { year: 2022, count: 4 }, { year: 2023, count: 4 },
        { year: 2024, count: 3 }, { year: 2025, count: 2 }, { year: 2026, count: 1 },
      ],
    },
    {
      id: 3,
      name: 'Null Model Controversy',
      color: '#B89A4A',
      startYear: 2009,
      endYear: 2026,
      peakPeriod: 'Ongoing',
      consensus: 'ONGOING',
      consensusPercent: 40,
      description:
        'What constitutes an appropriate null model for brain networks. Standard configuration models preserve degree distribution but destroy spatial embedding. Spatial null models (Roberts et al. 2016, Betzel et al. 2017) are increasingly recognized as essential.',
      keyPapers: [
        { year: 2009, author: 'Rubinov & Sporns', title: 'Complex network measures', citations: 13800 },
        { year: 2016, author: 'Roberts et al.', title: 'Geometric constraints on brain networks', citations: 680 },
        { year: 2017, author: 'Betzel & Bassett', title: 'Generative models of brain networks', citations: 520 },
      ],
      intensity: [
        { year: 2009, count: 1 }, { year: 2011, count: 1 }, { year: 2013, count: 2 },
        { year: 2015, count: 3 }, { year: 2016, count: 5 }, { year: 2017, count: 6 },
        { year: 2018, count: 5 }, { year: 2019, count: 4 }, { year: 2020, count: 4 },
        { year: 2021, count: 4 }, { year: 2022, count: 3 }, { year: 2023, count: 3 },
        { year: 2024, count: 2 }, { year: 2025, count: 2 }, { year: 2026, count: 1 },
      ],
    },
    {
      id: 4,
      name: 'Structure-Function Coupling',
      color: '#B07A4A',
      startYear: 2008,
      endYear: 2026,
      peakPeriod: '2013–2019',
      consensus: 'SETTLED',
      consensusPercent: 65,
      description:
        'How strongly structural connectivity constrains functional connectivity. Early work suggested strong correspondence; subsequent research revealed polysynaptic communication and communication dynamics decouple structure from function.',
      keyPapers: [
        { year: 2009, author: 'Honey et al.', title: 'Predicting human resting-state FC from SC', citations: 2900 },
        { year: 2014, author: 'Mišić et al.', title: 'Network-level structure-function relationships', citations: 480 },
        { year: 2019, author: 'Suárez et al.', title: 'Linking structure and function in macroscale networks', citations: 390 },
      ],
      intensity: [
        { year: 2008, count: 1 }, { year: 2009, count: 2 }, { year: 2010, count: 2 },
        { year: 2012, count: 3 }, { year: 2014, count: 5 }, { year: 2016, count: 6 },
        { year: 2017, count: 5 }, { year: 2018, count: 6 }, { year: 2019, count: 5 },
        { year: 2020, count: 4 }, { year: 2021, count: 3 }, { year: 2022, count: 3 },
        { year: 2023, count: 2 }, { year: 2024, count: 2 }, { year: 2025, count: 1 },
        { year: 2026, count: 1 },
      ],
    },
  ],
  researchGap: {
    gap_title: 'Precision Structural Connectome Mapping',
    statement:
      'Despite extensive research on both structural connectivity (dMRI tractography) and individual variability in functional connectivity, there is a critical lack of integrative frameworks that link individual differences in structural topology to personalized functional network organization.',
    source_community: 'Structural Connectivity & dMRI',
    target_community: 'Precision Mapping & Individual Differences',
    why_it_matters:
      'Without individual-level structural-functional mapping, precision medicine in neurology remains incomplete. Biomarkers based on functional connectivity lack mechanistic anatomical anchoring, limiting targeted neuromodulation and personalized surgical planning.',
    proposed_direction:
      'Develop high-angular-resolution dMRI pipelines optimized for individual connectome fingerprinting, paired with generative models linking personalized white-matter tractography to individual functional boundaries.',
    argument_spine: {
      claim:
        'Individual differences in brain network organization are primarily studied through functional connectivity, while structural connectivity remains analyzed at the group level.',
      evidence_for: [
        'Connectome fingerprinting reliably identifies individuals from functional connectivity (Finn et al., 2015)',
        'Precision functional mapping demonstrates extensive cross-subject boundary variability (Gordon et al., 2017)',
        'Clinical biomarker discovery has shifted strongly to individual functional networks (Fornito et al., 2015)',
      ],
      counter_evidence: [
        'Diffusion MRI tractography suffers from high false-positive rates and crossing-fiber ambiguities (Maier-Hein et al., 2017)',
        'Structural connectivity is widely considered more anatomically static than functional states (Hagmann et al., 2008)',
        'Harmonization across MRI scanners remains challenging for individual structural metrics (Tax et al., 2019)',
      ],
      the_gap:
        'No standardized methodological framework exists for precision individual-level structural connectome mapping or personalized structure-function coupling.',
      significance:
        'Bridging this gap will establish the anatomical ground truth for precision functional mapping, enabling targeted therapeutic neuromodulation (TMS/DBS) calibrated to each patient’s unique white matter tracts.',
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Secondary Preset: Quantum Error Correction & Fault Tolerance      */
/* ------------------------------------------------------------------ */
export const QUANTUM_COMPUTING_CONFIG: LiteratureMapConfig = {
  id: 'quantum-computing',
  title: 'Quantum Horizon',
  subtitle: '210 papers · 7 clusters · 16,840 connections · 1995–2026',
  supertitle: 'Living Literature Map · Quantum Information Science',
  domain: 'Quantum Error Correction & Fault-Tolerant Architectures',
  yearRange: [1995, 2026],
  primaryFacetName: 'Architecture',
  facets: ['Superconducting', 'Trapped Ion', 'Neutral Atom', 'Photonic', 'Semiconductor Spin', 'Theoretical'],
  theme: {
    accentGold: '#00E5FF',
    accentIndigo: '#0B132B',
    darkBg: '#030712',
  },
  debates: [
    {
      id: 1,
      name: 'Surface Codes vs. High-Rate qLDPC Codes',
      color: '#00E5FF',
      startYear: 2019,
      endYear: 2026,
      peakPeriod: '2022–2025',
      consensus: 'ONGOING',
      consensusPercent: 50,
      description:
        'Whether nearest-neighbor 2D surface codes or non-local quantum Low-Density Parity-Check (qLDPC) codes will provide the practical path to commercial fault tolerance with manageable physical qubit overhead.',
      keyPapers: [
        { year: 2012, author: 'Fowler et al.', title: 'Surface codes: Towards practical large-scale quantum computation', citations: 2400 },
        { year: 2022, author: 'Panteleev & Kalachev', title: 'Asymptotically good quantum and locally testable classical codes', citations: 410 },
        { year: 2024, author: 'Bravyi et al.', title: 'High-threshold and low-overhead fault-tolerant quantum memory', citations: 290 },
      ],
      intensity: [
        { year: 2019, count: 2 }, { year: 2020, count: 3 }, { year: 2021, count: 5 },
        { year: 2022, count: 8 }, { year: 2023, count: 12 }, { year: 2024, count: 15 },
        { year: 2025, count: 14 }, { year: 2026, count: 10 },
      ],
    },
    {
      id: 2,
      name: 'Transversal Gates vs. Magic State Distillation',
      color: '#4895EF',
      startYear: 2005,
      endYear: 2026,
      peakPeriod: '2015–2021',
      consensus: 'SETTLED',
      consensusPercent: 75,
      description:
        'By the Eastin-Knill theorem, no quantum error-correcting code can implement a universal gate set transversally. The field settled on magic state distillation as the standard, but code-switching remains active.',
      keyPapers: [
        { year: 2005, author: 'Bravyi & Kitaev', title: 'Universal quantum computation with ideal Clifford gates', citations: 1850 },
        { year: 2014, author: 'Bombin', title: 'Gauge color codes: optimal transversal gates', citations: 490 },
      ],
      intensity: [
        { year: 2005, count: 1 }, { year: 2008, count: 2 }, { year: 2012, count: 3 },
        { year: 2015, count: 6 }, { year: 2018, count: 7 }, { year: 2021, count: 5 },
        { year: 2024, count: 4 }, { year: 2026, count: 2 },
      ],
    },
  ],
  researchGap: {
    gap_title: 'Hardware-Agnostic Real-Time Decoding Under Correlated Noise',
    statement:
      'While logical qubit lifetimes now exceed physical qubit thresholds, existing decoders (MWPM, BP-OSD) cannot execute in real-time under non-Markovian correlated noise environments in large distance-15+ lattices.',
    source_community: 'Fault-Tolerant Decoder Algorithms',
    target_community: 'Experimental Hardware Control Systems',
    why_it_matters:
      'Without sub-microsecond decoding bandwidth, syndrome data accumulates exponentially (the "decoding backlog problem"), leading to logical gate failure during deep circuit execution.',
    proposed_direction:
      'FPGA and ASIC-accelerated neural tensor network decoders trained on hardware-specific correlated noise models.',
    argument_spine: {
      claim:
        'Fault-tolerant quantum computing is currently bottlenecked by decoding throughput rather than physical gate error rates.',
      evidence_for: [
        'Experimental demonstrations of break-even logical qubits achieved in superconducting and ion-trap platforms',
        'qLDPC codes require complex Tanner graph decoders with polynomial or high heuristic latency',
      ],
      counter_evidence: [
        'Two-qubit gate fidelities in multi-qubit devices still hover near 99.5%, requiring high code distances',
        'Cryogenic CMOS control hardware is still in early development stages',
      ],
      the_gap:
        'Absence of unified benchmarking frameworks evaluating decoder latency alongside threshold under realistic correlated spatial noise.',
      significance:
        'Solving real-time decoding unlocks deep fault-tolerant algorithms like Shor’s factoring and quantum chemistry simulations.',
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Preset 3: Topological & Geometric Deep Learning                   */
/* ------------------------------------------------------------------ */
export const TOPOLOGICAL_DL_CONFIG: LiteratureMapConfig = {
  id: 'topological-dl',
  title: 'Topological DL Horizon',
  subtitle: '25 pioneering works · 3 structural clusters · 2022–2026',
  supertitle: 'Living Literature Map · Higher-Order Graph Deep Learning',
  domain: 'Topological & Geometric Deep Learning',
  yearRange: [2022, 2026],
  primaryFacetName: 'Representation',
  facets: ['Simplicial Complexes', 'Cell Complexes', 'Hypergraphs', 'Sheaf Neural Networks', 'Hodge Theory'],
  theme: {
    accentGold: '#A855F7',
    accentIndigo: '#1E1B4B',
    darkBg: '#090514',
  },
  stats: {
    numPapers: 25,
    numSchools: 3,
    numLinks: 23,
    modularityQ: 0.85,
    yearRange: '2022–2026',
  },
  debates: [
    {
      id: 1,
      name: 'Higher-Order Message Passing vs. Over-Smoothing',
      color: '#A855F7',
      startYear: 2022,
      endYear: 2026,
      peakPeriod: '2023–2025',
      consensus: 'ONGOING',
      consensusPercent: 45,
      description:
        'Whether simplicial and cellular complexes inherently resolve over-squashing and over-smoothing issues present in standard Weisfeiler-Lehman graph neural networks.',
      keyPapers: [
        { year: 2022, author: 'Bodnar et al.', title: 'Cellular Weisfeiler-Lehman networks', citations: 420 },
        { year: 2023, author: 'Giusti et al.', title: 'Cinematic higher-order representations', citations: 180 },
        { year: 2026, author: 'Bispo et al.', title: 'Multimodal Higher-Order Brain Networks', citations: 65 },
      ],
      intensity: [
        { year: 2022, count: 3 },
        { year: 2023, count: 7 },
        { year: 2024, count: 12 },
        { year: 2025, count: 10 },
        { year: 2026, count: 8 },
      ],
    },
    {
      id: 2,
      name: 'Sheaf Diffusion vs. Empirical Scalability',
      color: '#06B6D4',
      startYear: 2023,
      endYear: 2026,
      peakPeriod: '2024–2026',
      consensus: 'EMERGING',
      consensusPercent: 60,
      description:
        'Evaluating whether non-linear cellular sheaf Laplacians justify the cubic tensor contraction complexity on million-edge heterophilic networks.',
      keyPapers: [
        { year: 2023, author: 'Bodnar et al.', title: 'Neural Sheaf Diffusion', citations: 310 },
        { year: 2025, author: 'Barbero et al.', title: 'Sheaf Neural Networks for Heterophilic Graphs', citations: 140 },
      ],
      intensity: [
        { year: 2023, count: 2 },
        { year: 2024, count: 5 },
        { year: 2025, count: 9 },
        { year: 2026, count: 6 },
      ],
    },
  ],
  researchGap: {
    gap_title: 'Multimodal Cell Complex Inference from Continuous Dynamics',
    statement:
      'Current advances in Topological Deep Learning have predominantly consolidated within isolated methodological paradigms without generalizable inference tools to lift raw continuous time-series into topological cell complexes.',
    source_community: 'Higher-Order Topological Signals',
    target_community: 'Empirical Dynamic Graph Benchmarks',
    why_it_matters:
      'Without automated cell complex lifting scaffolds, higher-order GNNs remain confined to synthetic benchmark datasets rather than practical biological and physical sciences.',
    proposed_direction:
      'Develop differentiable discrete exterior calculus layers that learn cell complex structures directly from continuous state dynamics.',
    argument_spine: {
      claim:
        'Standard pairwise graphs fundamentally cannot represent circulatory or higher-order multi-agent topological interactions.',
      evidence_for: [
        'Hodge Laplacians decompose signals into divergence-free gradient and curl components',
        'Cellular complexes provably exceed 1-WL expressive power on graph isomorphism tests',
      ],
      counter_evidence: [
        'Boundary matrix construction introduces combinatorial memory overhead',
        'Sparse higher-order approximations risk missing non-local topological invariants',
      ],
      the_gap:
        'Absence of unified differentiable scaffolds for inductive cell complex generation from empirical streaming signals.',
      significance:
        'Bridging this gap brings topological signal processing to large-scale neuroscience, climate modeling, and particle physics.',
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Preset 4: Core-Periphery Network Dynamics                         */
/* ------------------------------------------------------------------ */
export const CORE_PERIPHERY_CONFIG: LiteratureMapConfig = {
  id: 'core-periphery',
  title: 'Core-Periphery Atlas',
  subtitle: 'Mesoscale structure · Rich-club dynamics · 2008–2026',
  supertitle: 'Living Literature Map · Network Science & Mesoscale Topology',
  domain: 'Core-Periphery Network Dynamics & Mesoscale Structure',
  yearRange: [2008, 2026],
  primaryFacetName: 'Topology',
  facets: ['Discrete Core-Periphery', 'Continuous Ranking', 'Rich-Club Organization', 'Nested Structures'],
  theme: {
    accentGold: '#F59E0B',
    accentIndigo: '#1E293B',
    darkBg: '#0B0F19',
  },
  stats: {
    numPapers: 10,
    numSchools: 2,
    numLinks: 30,
    modularityQ: 0.49,
    yearRange: '2008–2020',
  },
  debates: [
    {
      id: 1,
      name: 'Binary vs. Continuous Core-Periphery Models',
      color: '#F59E0B',
      startYear: 2008,
      endYear: 2026,
      peakPeriod: '2012–2018',
      consensus: 'SETTLED',
      consensusPercent: 80,
      description:
        'Whether networks exhibit strict bipartite core-periphery partition or a continuous spectrum of coreness and nodal centrality.',
      keyPapers: [
        { year: 2000, author: 'Borgatti & Everett', title: 'Models of core/periphery structures', citations: 2800 },
        { year: 2014, author: 'Rombach et al.', title: 'Core-periphery structure in networks', citations: 450 },
      ],
      intensity: [
        { year: 2008, count: 2 },
        { year: 2012, count: 6 },
        { year: 2016, count: 8 },
        { year: 2020, count: 5 },
        { year: 2024, count: 3 },
      ],
    },
  ],
  researchGap: {
    gap_title: 'Dynamic Time-Varying Core Reconfiguration',
    statement:
      'Most core-periphery algorithms assume static time-aggregated topologies, failing to capture ephemeral core participation during functional state transitions.',
    source_community: 'Static Mesoscale Detection',
    target_community: 'Temporal Network Dynamics',
    why_it_matters:
      'Biological, financial, and infrastructural networks undergo critical state shifts where peripheral nodes transiently coalesce into core clusters.',
    proposed_direction:
      'Tensor-based multilayer stochastic block models tracking continuous nodal coreness trajectories.',
    argument_spine: {
      claim:
        'Static core-periphery classification conflates chronic hubs with temporary coordination drivers.',
      evidence_for: [
        'Time-resolved functional connectivity shows peripheral brain regions join rich-club cores during complex cognitive tasks',
      ],
      counter_evidence: [
        'Temporal windowing introduces arbitrary hyperparameter sensitivity and statistical noise',
      ],
      the_gap:
        'Lack of principled generative null models for non-stationary core-periphery transitions.',
      significance:
        'Allows early detection of systemic fragility in financial contagions and epileptic seizure onset.',
    },
  },
};

export const NUCLEAR_RISK_REDUCTION_CONFIG: LiteratureMapConfig = {
  id: 'nuclear-risk-reduction',
  title: 'Nuclear Risk Reduction & Arms Control',
  subtitle: '45 seminal papers · 5 strategic schools · US-Russia Strategic Dynamics',
  supertitle: 'Living Literature Map · International Security',
  domain: 'Nuclear Risk Reduction & US-Russia Strategic Stability',
  domainName: 'Nuclear Risk Reduction',
  yearRange: [1990, 2026],
  primaryFacetName: 'Strategic Schools',
  facets: [
    'Cold War Crisis Management & Hotlines',
    'Formal Strategic Arms Treaties (START/INF)',
    'Entanglement & Inadvertent Escalation',
    'Post-Cold War Deterrence & NATO-Russia',
    'Norms, Taboo & Unilateral Risk Reduction',
  ],
  theme: {
    accentGold: '#D4A853',
    accentIndigo: '#1A1B3A',
    darkBg: '#05060B',
  },
  debates: [
    {
      id: 1,
      name: 'Formal Treaties vs. Informal Risk Reduction',
      color: '#3B6FC4',
      startYear: 2002,
      endYear: 2026,
      peakPeriod: '2019–2024',
      consensus: 'ONGOING',
      consensusPercent: 48,
      description:
        'Can non-binding risk reduction mechanisms (military hotlines, INCSEA, notifications) prevent escalation when formal treaties (ABM, INF, New START) collapse, or does arms racing inevitably overwhelm informal guardrails?',
      keyPapers: [
        { year: 2018, author: 'Acton', title: 'Escalation through Entanglement', citations: 174 },
        { year: 1999, author: 'Tannenwald', title: 'The Nuclear Taboo', citations: 781 },
        { year: 2020, author: 'Arbatov', title: 'The End of Arms Control?', citations: 17 },
      ],
      intensity: [
        { year: 2002, count: 2 },
        { year: 2010, count: 5 },
        { year: 2019, count: 18 },
        { year: 2023, count: 32 },
      ],
    },
    {
      id: 2,
      name: 'Cross-Domain Entanglement vs. Separate Thresholds',
      color: '#D4A853',
      startYear: 2015,
      endYear: 2026,
      peakPeriod: '2018–2024',
      consensus: 'EMERGING',
      consensusPercent: 72,
      description:
        'Whether cyber, counter-space, and hypersonic attacks against dual-use early warning systems inadvertently trigger nuclear counterforce alert cascades.',
      keyPapers: [
        { year: 2018, author: 'Acton', title: 'Escalation through Entanglement', citations: 174 },
        { year: 2021, author: 'Lieber & Press', title: 'The Myth of the Nuclear Revolution', citations: 210 },
      ],
      intensity: [
        { year: 2015, count: 3 },
        { year: 2018, count: 12 },
        { year: 2022, count: 25 },
        { year: 2024, count: 38 },
      ],
    },
  ],
  researchGap: {
    gap_title: 'Unbridged Structural Hole: Informal Guardrails vs. Emerging Dual-Use Tech',
    statement:
      'While classical risk reduction mechanisms (INCSEA, NRRCs) rely on predictable force structures, modern nuclear-conventional entanglement (cyber, ASAT, hypersonics) creates inadvertent escalation pathways that bilateral hotlines cannot de-escalate without verified posture constraints.',
    source_community: 'Cold War Crisis Management & Hotlines',
    target_community: 'Entanglement & Inadvertent Escalation',
    why_it_matters:
      'The suspension of New START inspections removes mutual telemetry and baseline transparency, leaving crisis hotlines vulnerable to algorithmic false alarms or decapitation fears during conventional warfare.',
    proposed_direction:
      'Multilateral technical verification protocols and normative codes of conduct for non-nuclear interference with early-warning satellites and NC3 architectures.',
    argument_spine: {
      claim:
        'Informal risk reduction mechanisms are insufficient on their own to prevent catastrophic nuclear escalation in high-intensity conventional crises.',
      evidence_for: [
        'Historical INCSEA and NRRC mechanisms successfully de-escalated Cold War tactical encounters',
        'Track 1.5 dialogues provide ongoing communication channels even during diplomatic freezes',
      ],
      counter_evidence: [
        'Dual-capable missile systems and cyber penetration of NC3 blur the boundary between conventional attack and nuclear decapitation',
      ],
      the_gap:
        'Absence of verified behavioral thresholds or technical guardrails prohibiting attacks on nuclear command, control, and early-warning sensors.',
      significance:
        'Provides the empirical and theoretical rationale for new crisis stability agreements between the US, Russia, and emerging nuclear powers.',
    },
  },
};

export const FEATURED_PRESETS = [
  {
    id: 'connectomics',
    name: '🧠 Connectome Constellation',
    shortName: 'Connectomics',
    domain: 'Network Neuroscience & Brain Connectomics',
    badge: '244 Papers',
    config: NETWORK_NEUROSCIENCE_CONFIG,
  },
  {
    id: 'nuclear-risk-reduction',
    name: '🕊️ Nuclear Risk Reduction',
    shortName: 'Nuclear Risk (US-RU)',
    domain: 'Nuclear Risk Reduction & US-Russia Strategic Stability',
    badge: '45 Papers',
    config: NUCLEAR_RISK_REDUCTION_CONFIG,
  },
  {
    id: 'quantum-computing',
    name: '⚛️ Quantum Horizon',
    shortName: 'Quantum QEC',
    domain: 'Quantum Error Correction & Fault Tolerance',
    badge: '210 Papers',
    config: QUANTUM_COMPUTING_CONFIG,
  },
  {
    id: 'topological-dl',
    name: '🧬 Topological DL',
    shortName: 'Topological DL',
    domain: 'Topological & Geometric Deep Learning',
    badge: '25 Papers',
    config: TOPOLOGICAL_DL_CONFIG,
  },
  {
    id: 'core-periphery',
    name: '🌐 Core-Periphery',
    shortName: 'Core-Periphery',
    domain: 'Core-Periphery Network Dynamics',
    badge: '10 Papers',
    config: CORE_PERIPHERY_CONFIG,
  },
];


