# Living Literature Map — Network Neuroscience / Brain Connectomics

## Overview
A publication-ready, STATIC (no-backend) "living literature map" web app grounded in ~200 real papers, plus a companion literature-review document, deployable to Cloudflare Pages, Vercel, or any static CDN.

## Aesthetic Reference
- Hero: 诗云星图 deep-space star map — pure black bg, glowing jewel-tone nodes, warm gold/white gossamer edges, star-dust particles, gold pill toggle
- Analysis sections: Clean academic light — warm off-white #FAF9F6 + deep indigo #1A1B3A accent
- Typography: Source Serif Pro body, JetBrains Mono for data

## Stage 1 — Deep Research: Corpus Collection (~200 papers)
**Skill**: `deep-research-swarm` (Route A — Wide Search)
**Agents**: Multiple parallel research agents
- Search Google Scholar and arXiv for ~200 highly-cited, tightly-connected papers on:
  - connectome, brain network, functional connectivity, structural connectivity
  - graph theory neuroscience, network neuroscience, resting-state fMRI
  - tractography, DTI, dMRI, small-world brain networks
  - dynamic functional connectivity, modularity, rich-club organization
- Collect: title, authors+institutions, year, journal, citation count, abstract, DOI, keywords, reference list
- Build edges: direct citation + co-citation strength
- Output: `/mnt/agents/output/corpus/raw_papers.json` + `/mnt/agents/output/corpus/edges.json`

## Stage 2 — Data Processing: Analysis & Static JSON
**Agents**: Data processing agents (no skill — custom data science pipeline)
- Run Louvain community detection, name + characterize schools, compute Modularity Q
- Build debate evolution timeline
- Detect structural holes → identify ONE research gap
- Build argument spine
- Compute centrality metrics, bridge papers
- Build co-authorship & institution networks
- Output: `/mnt/agents/output/corpus/analysis.json`, `/mnt/agents/output/corpus/network_stats.json`
- Also: PDF download attempts, BibTeX + CSV bibliography

## Stage 3 — Web App Build
**Skill**: `vibecoding-webapp-swarm`
**Stack**: React + TypeScript + Vite + Tailwind + react-force-graph + D3.js + Zustand
**Sections** (single scrolling page):
1. **Hero**: Full-viewport ForceGraph3D with bloom post-processing, THREE.Points starfield, jewel-tone nodes, gold filaments
2. **Schools of Thought**: Louvain communities with Modularity Q
3. **Debate Evolution**: Timeline of shifting dominant questions
4. **Research Gap + Argument Spine**: Structural holes analysis
5. **Cluster Evolution**: Stacked area chart
6. **Co-citation Heatmap**: Top 30 papers
7. **Network Stats**: Centrality leaderboard, bridge papers
8. **Co-authorship & Institution Networks**
9. **Journal & Year Distribution**
10. **PRISMA Flow + Inclusion Checklist**
11. **Evidence Table**: Author-Year | modality | N | key findings | limitations
12. **Writing Assistant**: Pre-computed review gaps + argument spine, export .docx
13. **Upload Section**: Client-side DOI/BibTeX/PDF parsing + live layout recompute

**Features**:
- 3 color modes (school / year blue→red / journal) via gold pill toggle
- Sticky nav with smooth-scroll anchors
- Scroll-triggered animations
- Shareable URL-encoded filtered views
- localStorage comments + version history
- 300 DPI chart export
- "Download corpus" button with ZIP

## Stage 4 — Literature Review Document
**Skill**: `report-writing` (for the review doc) + `docx` (for conversion)
- Publication-ready literature review section in English
- Grounded only in the real 200 papers (real DOIs)
- Schools, debates, gap, argument spine
- Export: Markdown + .docx (APA style)

## Stage 5 — Deploy
- Deploy to Cloudflare Pages / Vercel / GitHub Pages
- Bundle corpus ZIP with PDFs + BibTeX + CSV + JSON
- Report data completeness numbers

## File Outputs
- `/mnt/agents/output/corpus.zip` — All 200 papers' metadata + downloadable PDFs + BibTeX + CSV
- `/mnt/agents/output/literature_review.md` — Review document
- `/mnt/agents/output/literature_review.docx` — Review document (Word)
- Deployed web app at Cloudflare Pages / Vercel
