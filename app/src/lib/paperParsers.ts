/* ────────────────────────────────────────────────
   CSV & BibTeX Parsers and Paper Similarity
   ──────────────────────────────────────────────── */

export function parseCSVRows(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase().replace(/^["']|["']$/g, '').trim());
  const records: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = row[c] !== undefined ? row[c] : '';
    }
    records.push(obj);
  }

  return records;
}

export function parseBibTeX(content: string): Array<{
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi: string;
  abstract: string;
  keywords: string;
}> {
  const entries: Array<{
    title: string;
    authors: string;
    year: number;
    journal: string;
    doi: string;
    abstract: string;
    keywords: string;
  }> = [];

  const entryRegex = /@\w+\s*\{[\s\S]*?\n\s*\}/g;
  const entriesRaw = content.match(entryRegex) || [];

  for (const raw of entriesRaw) {
    const extractField = (name: string): string => {
      const bracePattern = name + '\\s*=\\s*\\{([\\s\\S]*?)\\}(?=\\s*[,\\n\\r\\}])';
      const braceRe = new RegExp(bracePattern, 'i');
      let m = raw.match(braceRe);
      if (m && m[1]) return m[1].replace(/\\([{}&%$#_~^\\])/g, '$1').trim();

      const quotePattern = name + '\\s*=\\s*"([^"]*)"';
      const quoteRe = new RegExp(quotePattern, 'i');
      m = raw.match(quoteRe);
      if (m && m[1]) return m[1].replace(/\\([{}&%$#_~^\\])/g, '$1').trim();

      const barePattern = name + '\\s*=\\s*([0-9a-zA-Z_.-]+)';
      const bareRe = new RegExp(barePattern, 'i');
      m = raw.match(bareRe);
      if (m && m[1]) return m[1].trim();

      return '';
    };

    const title = extractField('title');
    const authorRaw = extractField('author');
    const yearStr = extractField('year');
    const journal =
      extractField('journal') || extractField('booktitle') || extractField('journaltitle') || '';
    const doi = extractField('doi');
    const abstract = extractField('abstract');
    const keywords = extractField('keywords');

    const authors = authorRaw
      .split(/\s+and\s+/i)
      .map((a: string) => a.trim())
      .filter(Boolean)
      .join(', ');

    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    if (title) {
      entries.push({ title, authors, year, journal, doi, abstract, keywords });
    }
  }

  return entries;
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase().trim()));
  const setB = new Set(b.map((s) => s.toLowerCase().trim()));
  const intersection = [...setA].filter((x) => setB.has(x));
  const union = new Set([...setA, ...setB]);
  return intersection.length / union.size;
}

export function authorOverlap(authorsA: string, authorsB: string): number {
  if (!authorsA || !authorsB) return 0;
  const a = authorsA.split(',').map((s) => s.trim().toLowerCase());
  const b = authorsB.split(',').map((s) => s.trim().toLowerCase());
  let matches = 0;
  for (const name of a) {
    if (name.length < 2) continue;
    for (const other of b) {
      if (other.includes(name) || name.includes(other)) {
        matches++;
        break;
      }
    }
  }
  return matches;
}
