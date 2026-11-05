/* ------------------------------------------------------------------ */
/*  Crossref Fallback Service                                          */
/*  Completely free, 150M+ records, no API key needed                 */
/* ------------------------------------------------------------------ */

interface CrossrefAuthor {
  given?: string;
  family?: string;
  name?: string;
}

interface CrossrefWork {
  DOI: string;
  title?: string[];
  abstract?: string;
  author?: CrossrefAuthor[];
  created?: { 'date-parts'?: number[][] };
  published?: { 'date-parts'?: number[][] };
  'published-print'?: { 'date-parts'?: number[][] };
  'published-online'?: { 'date-parts'?: number[][] };
  'is-referenced-by-count'?: number;
  'container-title'?: string[];
  subject?: string[];
}

export async function fetchCrossrefWorks(
  query: string,
  limit = 70,
  onProgress?: (status: string) => void
): Promise<any[]> {
  onProgress?.(`Querying Crossref (150M+ records) for "${query}"...`);

  const mailto = 'rahulpathak263@gmail.com';
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(
    query
  )}&rows=${Math.min(limit, 100)}&mailto=${encodeURIComponent(mailto)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Crossref responded with HTTP ${response.status}`);
  }

  const data = await response.json();
  const items: CrossrefWork[] = data.message?.items || [];

  return items
    .filter((item) => item.title && item.title.length > 0)
    .map((item) => {
      const title = item.title ? item.title[0] : 'Untitled Work';
      const year =
        item['published-print']?.['date-parts']?.[0]?.[0] ||
        item['published-online']?.['date-parts']?.[0]?.[0] ||
        item.published?.['date-parts']?.[0]?.[0] ||
        item.created?.['date-parts']?.[0]?.[0] ||
        2022;

      const authorships = (item.author || []).map((a) => {
        const name = a.name || `${a.given || ''} ${a.family || ''}`.trim() || 'Unknown Author';
        return { author: { id: name, display_name: name } };
      });

      const cleanAbstract = (item.abstract || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const subjects = item.subject || [];
      const concepts = subjects.map((subj, i) => ({
        id: subj,
        display_name: subj,
        level: i < 2 ? 1 : 2,
        score: Math.max(0.3, 0.9 - i * 0.15),
      }));

      // Inverted index for abstract
      const abstractIndex: Record<string, number[]> = {};
      if (cleanAbstract) {
        cleanAbstract.split(/\s+/).forEach((w, pos) => {
          if (!abstractIndex[w]) abstractIndex[w] = [];
          abstractIndex[w].push(pos);
        });
      }

      return {
        id: `https://doi.org/${item.DOI}`,
        doi: `https://doi.org/${item.DOI}`,
        title,
        display_name: title,
        publication_year: year,
        cited_by_count: item['is-referenced-by-count'] || 0,
        primary_location: {
          source: {
            display_name: item['container-title']?.[0] || 'Peer-Reviewed Venue',
          },
        },
        authorships,
        concepts: concepts.length > 0 ? concepts : [{ id: query, display_name: query, level: 1, score: 0.8 }],
        referenced_works: [],
        abstract_inverted_index: Object.keys(abstractIndex).length > 0 ? abstractIndex : null,
      };
    });
}

