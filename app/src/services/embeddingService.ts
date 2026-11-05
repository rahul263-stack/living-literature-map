/* ------------------------------------------------------------------ */
/*  In-Browser Neural Embedding Service (Transformers.js via CDN)     */
/*  Model: all-MiniLM-L6-v2 (~23MB ONNX, cached locally in browser)   */
/* ------------------------------------------------------------------ */

// Singleton pipeline instance
let extractorPromise: Promise<any> | null = null;

export async function getExtractor(onProgress?: (status: string) => void): Promise<any> {
  if (!extractorPromise) {
    onProgress?.('Initializing neural embedding model (all-MiniLM-L6-v2)...');
    extractorPromise = (async () => {
      // Dynamically load Transformers.js from fast edge CDN at runtime
      // @ts-ignore
      const { pipeline, env } = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3/+esm');
      if (env) {
        env.allowLocalModels = false;
      }
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (p: any) => {
          if (p.status === 'progress' && p.file) {
            const pct = Math.round(p.progress || 0);
            onProgress?.(`Downloading embedding model (${p.file}): ${pct}%`);
          }
        },
      });
    })();
  }
  return extractorPromise;
}

/**
 * Computes a normalized vector embedding for a text string.
 */
export async function getEmbedding(text: string, onProgress?: (status: string) => void): Promise<number[]> {
  const extractor = await getExtractor(onProgress);
  const clean = text.slice(0, 512); // Truncate to maximum sequence length
  const output = await extractor(clean, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Computes cosine similarity between two unit-normalized embedding vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < len; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Re-ranks candidate research works based on dense semantic vector similarity
 * between the user's research query and paper titles + abstracts.
 */
export async function semanticRerankWorks<T extends { title: string; abstract?: string; cited_by_count?: number }>(
  query: string,
  works: T[],
  onProgress?: (status: string) => void
): Promise<{ ranked: (T & { semanticSimilarity: number; embedding: number[] })[]; queryEmbedding: number[] }> {
  if (works.length === 0) {
    return { ranked: [], queryEmbedding: [] };
  }

  onProgress?.('Generating semantic neural embeddings for query and papers...');
  const queryEmbedding = await getEmbedding(query, onProgress);

  const scoredWorks: (T & { semanticSimilarity: number; embedding: number[] })[] = [];

  // Batch process candidate embeddings
  for (let i = 0; i < works.length; i++) {
    const w = works[i];
    if (i % 10 === 0) {
      onProgress?.(`Embedding papers for semantic similarity (${i + 1}/${works.length})...`);
    }

    const passage = `${w.title}. ${w.abstract ? w.abstract.slice(0, 250) : ''}`;
    try {
      const paperEmbedding = await getEmbedding(passage);
      const similarity = cosineSimilarity(queryEmbedding, paperEmbedding);
      scoredWorks.push({
        ...w,
        semanticSimilarity: similarity,
        embedding: paperEmbedding,
      });
    } catch {
      scoredWorks.push({
        ...w,
        semanticSimilarity: 0.5,
        embedding: [],
      });
    }
  }

  // Combined score: 65% dense semantic similarity + 35% citation prominence
  scoredWorks.sort((a, b) => {
    const citeScoreA = Math.log10((a.cited_by_count || 0) + 1) * 0.1;
    const citeScoreB = Math.log10((b.cited_by_count || 0) + 1) * 0.1;
    const scoreA = a.semanticSimilarity * 0.9 + citeScoreA;
    const scoreB = b.semanticSimilarity * 0.9 + citeScoreB;
    return scoreB - scoreA;
  });

  return { ranked: scoredWorks, queryEmbedding };
}
