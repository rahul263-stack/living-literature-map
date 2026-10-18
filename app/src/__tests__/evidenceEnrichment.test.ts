import { describe, it, expect } from 'vitest';
import {
  safeKeywords,
  inferModality,
  computeQuality,
  generateKeyFindings,
  inferSampleSize,
  enrichPapers,
} from '../components/evidence/evidenceEnrichment';
import type { PaperNode } from '../components/evidence/types';

describe('evidenceEnrichment', () => {
  const samplePaper: PaperNode = {
    id: 'p1',
    title: 'A Systematic Review and Meta-Analysis of Functional Connectivity in Patients',
    authors: ['Sporns, Olaf', 'Friston, Karl'],
    year: 2021,
    citations: 450,
    journal: 'Nature Reviews Neuroscience',
    community: 1,
    community_name: 'Connectomics',
    abstract: 'We conducted a randomized trial with a sample of 120 patients across multiple test centers.',
    doi: '10.1038/nrn.2021.1',
    keywords: ['fMRI', 'clinical', 'review'],
    val: 5,
  };

  it('safely normalizes keywords across types', () => {
    expect(safeKeywords(samplePaper)).toEqual(['fMRI', 'clinical', 'review']);
    expect(safeKeywords({ keywords: 'neuroimaging, biomarkers; graph' } as any)).toEqual([
      'neuroimaging',
      'biomarkers',
      'graph',
    ]);
  });

  it('infers modality accurately according to keywords and text heuristics', () => {
    expect(inferModality(samplePaper)).toBe('Review');

    const clinicalPaper: PaperNode = {
      ...samplePaper,
      title: 'Therapeutic trial on Alzheimer disease cohort',
      keywords: ['clinical'],
      abstract: 'Patient treatment cohort study.',
    };
    expect(inferModality(clinicalPaper)).toBe('Clinical');

    const compPaper: PaperNode = {
      ...samplePaper,
      title: 'Deep Graph Neural Network Model for Structural Connectome',
      keywords: ['algorithm', 'neural network'],
      abstract: 'We introduce a computational simulation framework.',
    };
    expect(inferModality(compPaper)).toBe('Computational');
  });

  it('computes quality score and label based on paper metadata', () => {
    const { quality, label } = computeQuality(samplePaper);
    expect(['green', 'yellow', 'red']).toContain(quality);
    expect(quality).toBe('green');
    expect(label).toBe('Good');
  });

  it('infers sample sizes and categories from abstract text', () => {
    const sampleSizeTest: PaperNode = {
      ...samplePaper,
      abstract: 'A cohort of N = 250 participants completed fMRI imaging.',
    };
    const { n, cat } = inferSampleSize(sampleSizeTest);
    expect(n).toBe(250);
    expect(cat).toBe('large');
  });

  it('generates domain key findings for papers', () => {
    const findings = generateKeyFindings(samplePaper);
    expect(findings).toBeTypeOf('string');
    expect(findings.length).toBeGreaterThan(15);
  });

  it('enriches paper list with all required evidence synthesis attributes', () => {
    const [enriched] = enrichPapers([samplePaper]);
    expect(enriched.id).toBe('p1');
    expect(enriched.quality).toBe('green');
    expect(enriched.qualityLabel).toBe('Good');
    expect(enriched.modality).toBe('Review');
    expect(enriched.keyFindings).toBeDefined();
    expect(enriched.limitations).toBeDefined();
  });
});
