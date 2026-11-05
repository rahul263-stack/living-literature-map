/* ------------------------------------------------------------------ */
/*  Semantic Scholar Fallback Service                                  */
/*  Used when OpenAlex returns 429 after retries                       */
/* ------------------------------------------------------------------ */

interface S2Paper {
  paperId: string;
  externalIds?: { DOI?: string };
  title: string;
  year: number | null;
  citationCount: number;
  abstract: string | null;
  venue?: string;
  publicationVenue?: { name?: string } | null;
  authors?: { authorId: string; name: string }[];
  fieldsOfStudy?: string[] | null;
  references?: { paperId: string }[];
}

export async function fetchSemanticScholarWorks(
  query: string,
  limit = 70,
  onProgress?: (status: string) => void
): Promise<S2Paper[]> {
  onProgress?.(`Querying Semantic Scholar for "${query}"...`);

  const fields = 'paperId,externalIds,title,year,citationCount,abstract,venue,publicationVenue,authors,fieldsOfStudy,references';
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
    query
  )}&limit=${Math.min(limit, 100)}&fields=${fields}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Semantic Scholar API responded with HTTP status ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Converts Semantic Scholar results into the same OpenAlexWork shape
 * so the rest of the pipeline (buildLiteratureMapFromWorks) works unchanged.
 */
export function convertS2ToOpenAlexShape(papers: S2Paper[]): any[] {
  return papers
    .filter((p) => p.title && p.year)
    .map((p) => ({
      id: `https://api.semanticscholar.org/graph/v1/paper/${p.paperId}`,
      doi: p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : undefined,
      title: p.title,
      display_name: p.title,
      publication_year: p.year || 2020,
      cited_by_count: p.citationCount || 0,
      primary_location: {
        source: {
          display_name: p.publicationVenue?.name || p.venue || 'Academic Venue',
        },
      },
      authorships: (p.authors || []).map((a) => ({
        author: { id: a.authorId, display_name: a.name },
      })),
      // Convert fieldsOfStudy strings into concept-like objects
      concepts: (p.fieldsOfStudy || []).map((f, i) => ({
        id: f,
        display_name: f,
        level: i < 2 ? 1 : 2,
        score: Math.max(0.3, 0.9 - i * 0.15),
      })),
      referenced_works: (p.references || [])
        .filter((r) => r.paperId)
        .map((r) => `https://api.semanticscholar.org/graph/v1/paper/${r.paperId}`),
      // S2 gives plain text abstracts — convert to inverted index format
      abstract_inverted_index: p.abstract ? textToInvertedIndex(p.abstract) : null,
    }));
}

function textToInvertedIndex(text: string): Record<string, number[]> {
  const words = text.split(/\s+/);
  const index: Record<string, number[]> = {};
  words.forEach((word, pos) => {
    if (!index[word]) index[word] = [];
    index[word].push(pos);
  });
  return index;
}

