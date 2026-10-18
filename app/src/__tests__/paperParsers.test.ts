import { describe, it, expect } from 'vitest';
import { parseCSVRows, parseBibTeX, jaccardSimilarity, authorOverlap } from '../lib/paperParsers';

describe('paperParsers', () => {
  describe('parseCSVRows', () => {
    it('parses standard comma-separated values with headers', () => {
      const csv = `title,year,citations\nQuantum Computing,2023,45\nNeural Network,2021,120`;
      const records = parseCSVRows(csv);
      expect(records).toHaveLength(2);
      expect(records[0]).toEqual({
        title: 'Quantum Computing',
        year: '2023',
        citations: '45',
      });
      expect(records[1]).toEqual({
        title: 'Neural Network',
        year: '2021',
        citations: '120',
      });
    });

    it('handles quoted fields with commas and line breaks', () => {
      const csv = `"title, full","authors","year"\n"Deep Learning, Graph Theory","Smith, J., Doe, A.",2024`;
      const records = parseCSVRows(csv);
      expect(records).toHaveLength(1);
      expect(records[0]['title, full']).toBe('Deep Learning, Graph Theory');
      expect(records[0]['authors']).toBe('Smith, J., Doe, A.');
      expect(records[0]['year']).toBe('2024');
    });

    it('returns empty array when CSV has fewer than 2 rows', () => {
      expect(parseCSVRows('')).toEqual([]);
      expect(parseCSVRows('title,year')).toEqual([]);
    });
  });

  describe('parseBibTeX', () => {
    it('parses single and multiple BibTeX entries correctly', () => {
      const bibtex = `
@article{rubinov2010complex,
  title = {Complex network measures of brain connectivity: uses and interpretations},
  author = {Rubinov, Mikail and Sporns, Olaf},
  journal = {NeuroImage},
  year = {2010},
  doi = {10.1016/j.neuroimage.2009.10.003},
  abstract = {Graph theoretical analysis of complex brain networks...},
  keywords = {Brain connectivity, Graph theory, Complex networks}
}
      `;
      const entries = parseBibTeX(bibtex);
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Complex network measures of brain connectivity: uses and interpretations');
      expect(entries[0].authors).toBe('Rubinov, Mikail, Sporns, Olaf');
      expect(entries[0].year).toBe(2010);
      expect(entries[0].journal).toBe('NeuroImage');
      expect(entries[0].doi).toBe('10.1016/j.neuroimage.2009.10.003');
    });

    it('ignores non-entry content and gracefully handles missing fields', () => {
      const bibtex = `
Some random text before
@misc{anonymous2025,
  title = "Emergent Quantum Coherence in Condensed Matter",
  year = 2025
}
      `;
      const entries = parseBibTeX(bibtex);
      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Emergent Quantum Coherence in Condensed Matter');
      expect(entries[0].year).toBe(2025);
      expect(entries[0].authors).toBe('');
    });
  });

  describe('jaccardSimilarity', () => {
    it('calculates Jaccard index between two keyword lists', () => {
      const a = ['quantum', 'entanglement', 'qubit'];
      const b = ['quantum', 'qubit', 'superposition'];
      // intersection: quantum, qubit (2)
      // union: quantum, entanglement, qubit, superposition (4)
      // similarity: 2/4 = 0.5
      expect(jaccardSimilarity(a, b)).toBeCloseTo(0.5);
    });

    it('returns 0 for empty or disjoint lists', () => {
      expect(jaccardSimilarity([], ['test'])).toBe(0);
      expect(jaccardSimilarity(['neuroscience'], ['quantum'])).toBe(0);
    });

    it('is case-insensitive and ignores extra whitespace', () => {
      expect(jaccardSimilarity(['BRAIN ', 'fMRI'], ['brain', 'fmri'])).toBe(1.0);
    });
  });

  describe('authorOverlap', () => {
    it('detects overlapping authors across two citation strings', () => {
      const a = 'Sporns, O., Tononi, G., Kötter, R.';
      const b = 'Sporns, O., Honey, C. J.';
      expect(authorOverlap(a, b)).toBeGreaterThanOrEqual(1);
    });

    it('returns 0 if either author string is empty or disjoint', () => {
      expect(authorOverlap('', 'Sporns, O.')).toBe(0);
      expect(authorOverlap('Friston, K.', 'Turing, A.')).toBe(0);
    });
  });
});
