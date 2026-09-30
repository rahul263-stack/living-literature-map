# Network Neuroscience / Brain Connectomics — Research Findings

## Dataset
- 244 real papers collected from Google Scholar and arXiv
- 9 research communities (schools of thought) identified
- 21,285 edges (keyword co-occurrence network)
- Modularity Q = 0.08 (highly interdisciplinary field)
- Year range: 1994–2026 (peak publication: 2013-2018)
- Total citations across corpus: ~300,000+

## The 9 Schools of Thought
1. **Foundations & Graph Theory** (47 papers, ~122K citations) — Sporns, Bullmore, Rubinov; small-world, efficiency, complexity
2. **Resting-State fMRI & Default Mode** (24 papers, ~42K citations) — Raichle, Greicius, Biswal; DMN, ICA, seed-based FC
3. **Structural Connectivity & dMRI** (23 papers, ~15K citations) — Hagmann, Behrens, Jeurissen; DTI tractography, white matter
4. **Dynamic FC & Brain States** (25 papers, ~11K citations) — Calhoun, Allen, Damaraju; time-varying connectivity
5. **Clinical Applications** (25 papers, ~20K citations) — Fornito, Crossley; disorder biomarkers
6. **Hubs, Rich-Club & Gradients** (25 papers, ~23K citations) — van den Heuvel, Margulies; network hubs, gradients
7. **Precision Mapping & Individual Differences** (25 papers, ~9K citations) — Finn, Gordon, Laumann; connectome fingerprinting
8. **Methods, Tools & Parcellations** (25 papers, ~15K citations) — Schaefer, Ciric, Kong; preprocessing, atlases
9. **Recent Advances (arXiv)** (25 papers, ~0 citations) — GNNs, Koopman operators, multimodal fusion

## Key Debates in the Field
1. **Static vs Dynamic FC** (2010–present): Whether resting-state connectivity is stable or time-varying. Dominant since 2014.
2. **Group vs Individual Networks** (2015–present): Whether group-averaged parcellations miss individual network topology.
3. **Null Model Controversy** (2009–present): What constitutes appropriate null models for brain networks.
4. **Structure-Function Coupling** (2008–present): How well structural connectivity predicts functional connectivity.

## Research Gap (Verified)
**Precision Structural Connectome Mapping**: Despite extensive individual-variability research in functional connectivity, structural connectivity remains dominated by group-average analyses. No standardized methodology exists for precision structural connectome mapping. Cross-community edge strength between Structural Connectivity and Precision Mapping communities is below average (3.845 vs mean 4.5).

## Aesthetic Reference
- Hero: Deep-space "star map" (诗云星图 style) — pure black background, glowing jewel-tone star nodes, warm gold/white gossamer filaments
- Analysis sections: Clean academic — warm off-white #FAF9F6 + deep indigo #1A1B3A accent
- Typography: Source Serif Pro body, JetBrains Mono for data
- Charts: Economist / Our World in Data clarity

## Technical Requirements
- Single scrolling page with sticky nav
- Full-viewport hero with react-force-graph (3D with bloom or 2D with glow)
- 3 color modes: school / year gradient / journal
- Gold pill toggle for color modes
- Sections animate on scroll-in
- Shareable URL-encoded views
- localStorage for comments and version history
- Client-side upload (DOI/BibTeX/PDF parsing)
- Chart export at 300 DPI
- "Download corpus" button
