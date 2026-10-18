import { describe, it, expect } from 'vitest';
import { normalizeKeywords, normalizeNodes, normalizeBundle } from '../lib/datasetNormalizer';

describe('datasetNormalizer', () => {
  describe('normalizeKeywords', () => {
    it('returns empty array for falsy input', () => {
      expect(normalizeKeywords(null)).toEqual([]);
      expect(normalizeKeywords(undefined)).toEqual([]);
      expect(normalizeKeywords('')).toEqual([]);
    });

    it('splits string keywords by comma, semicolon, or pipe', () => {
      expect(normalizeKeywords('graph theory, connectome; brain')).toEqual([
        'graph theory',
        'connectome',
        'brain',
      ]);
      expect(normalizeKeywords('fMRI | resting state | DMN')).toEqual([
        'fMRI',
        'resting state',
        'DMN',
      ]);
    });

    it('processes array of string keywords or OpenAlex objects', () => {
      const mixed = ['quantum', { display_name: 'superposition' }, { name: 'entanglement' }];
      expect(normalizeKeywords(mixed)).toEqual(['quantum', 'superposition', 'entanglement']);
    });
  });

  describe('normalizeNodes', () => {
    it('populates default fields for incomplete paper nodes', () => {
      const nodes = normalizeNodes([
        { title: 'Test Paper', year: 2022 },
      ]);
      expect(nodes).toHaveLength(1);
      expect(nodes[0].title).toBe('Test Paper');
      expect(nodes[0].authors).toBe('Unknown');
      expect(nodes[0].year).toBe(2022);
      expect(nodes[0].journal).toBe('Preprint');
      expect(nodes[0].citations).toBe(0);
      expect(nodes[0].val).toBeGreaterThan(0);
      expect(Array.isArray(nodes[0].keywords)).toBe(true);
    });

    it('joins array of authors into a comma-separated string', () => {
      const nodes = normalizeNodes([
        { title: 'Multi-Author Paper', authors: ['Alice Smith' as any, 'Bob Jones' as any] },
      ]);
      expect(nodes[0].authors).toBe('Alice Smith, Bob Jones');
    });
  });

  describe('normalizeBundle', () => {
    it('normalizes arbitrary bundle into strict LiteratureMap structures', () => {
      const rawBundle = {
        config: {
          title: 'Quantum Computing Literature',
          domain: 'Quantum Physics',
        },
        network: {
          nodes: [
            { id: 'q1', title: 'Quantum Supremacy', citations: 500, community: 1 },
            { id: 'q2', title: 'Error Mitigation', citations: 80, community: 1 },
          ],
          links: [
            { source: 'q1', target: 'q2', value: 3 },
          ],
        },
        analysis: {
          schools: [{ id: 1, name: 'Quantum Error Correction', count: 2 }],
        },
      };

      const { config, networkData, analysisData } = normalizeBundle(rawBundle);
      expect(config.title).toBe('Quantum Computing Literature');
      expect(config.domain).toBe('Quantum Physics');
      expect(config.stats?.numPapers).toBe(2);
      expect(config.stats?.numLinks).toBe(1);

      expect(networkData.nodes).toHaveLength(2);
      expect(networkData.nodes[0].id).toBe('q1');
      expect(networkData.nodes[0].citations).toBe(500);

      expect(networkData.links).toHaveLength(1);
      expect(analysisData).toBeDefined();
    });
  });
});
