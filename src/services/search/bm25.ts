/**
 * Standard Okapi BM25 keyword relevance scoring over tokenized documents and sentences.
 * Used for offline course/lesson search, lesson excerpt matching, and course affinity overlap
 * without fabricated semantic embeddings or hardcoded topic buckets.
 */

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'but',
  'by',
  'can',
  'do',
  'does',
  'for',
  'from',
  'has',
  'have',
  'how',
  'in',
  'into',
  'is',
  'it',
  'its',
  'me',
  'my',
  'not',
  'of',
  'on',
  'or',
  'our',
  'that',
  'the',
  'their',
  'these',
  'they',
  'this',
  'those',
  'to',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'you',
  'your',
]);

export function tokenizeSearchText(text?: string, removeStopwords: boolean = false): string[] {
  if (!text) return [];
  const rawTokens = text
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'|[\]\\+]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  if (!removeStopwords) {
    return rawTokens;
  }

  const contentTokens = rawTokens.filter((token) => !STOPWORDS.has(token));
  return contentTokens.length > 0 ? contentTokens : rawTokens;
}

export interface Bm25DocumentInput {
  id: string;
  tokens: string[];
}

export interface Bm25ScoreResult {
  id: string;
  score: number;
  matchedTerms: string[];
}

export function computeBm25Scores(
  queryTokens: string[],
  documents: Bm25DocumentInput[],
  options?: {
    k1?: number;
    b?: number;
    allowPrefixMatch?: boolean;
  }
): Map<string, Bm25ScoreResult> {
  const results = new Map<string, Bm25ScoreResult>();
  const uniqueQuery = Array.from(new Set(queryTokens.filter(Boolean)));
  if (uniqueQuery.length === 0 || documents.length === 0) {
    return results;
  }

  const k1 = options?.k1 ?? 1.5;
  const b = options?.b ?? 0.75;
  const allowPrefixMatch = options?.allowPrefixMatch === true;
  const docCount = documents.length;

  let totalLen = 0;
  const docFreqs = new Map<string, number>();
  const termCountsByDoc = new Map<string, Map<string, number>>();

  for (const doc of documents) {
    totalLen += doc.tokens.length;
    const tfMap = new Map<string, number>();
    for (const token of doc.tokens) {
      tfMap.set(token, (tfMap.get(token) || 0) + 1);
    }
    termCountsByDoc.set(doc.id, tfMap);

    for (const qTerm of uniqueQuery) {
      let matched = tfMap.has(qTerm);
      if (!matched && allowPrefixMatch) {
        for (const term of tfMap.keys()) {
          if (term.startsWith(qTerm)) {
            matched = true;
            break;
          }
        }
      }
      if (matched) {
        docFreqs.set(qTerm, (docFreqs.get(qTerm) || 0) + 1);
      }
    }
  }

  const avgdl = totalLen > 0 ? totalLen / docCount : 1;

  for (const doc of documents) {
    const tfMap = termCountsByDoc.get(doc.id);
    if (!tfMap || doc.tokens.length === 0) continue;

    let docScore = 0;
    const matchedTerms = new Set<string>();

    for (const qTerm of uniqueQuery) {
      const df = docFreqs.get(qTerm) || 0;
      if (df === 0) continue;

      let effectiveTf = tfMap.get(qTerm) || 0;
      if (effectiveTf > 0) {
        matchedTerms.add(qTerm);
      } else if (allowPrefixMatch) {
        for (const [term, count] of tfMap.entries()) {
          if (term.startsWith(qTerm)) {
            effectiveTf += count * 0.65;
            matchedTerms.add(term);
          }
        }
      }

      if (effectiveTf <= 0) continue;

      const idf = Math.log(1 + (docCount - df + 0.5) / (df + 0.5));
      const normLen = doc.tokens.length / avgdl;
      const numerator = effectiveTf * (k1 + 1);
      const denominator = effectiveTf + k1 * (1 - b + b * normLen);
      docScore += idf * (numerator / denominator);
    }

    if (docScore > 0) {
      results.set(doc.id, {
        id: doc.id,
        score: docScore,
        matchedTerms: Array.from(matchedTerms),
      });
    }
  }

  return results;
}

export function rankSentencesBm25(
  question: string,
  sentences: string[]
): { sentence: string; score: number; matchedTerms: string[] }[] {
  const queryTokens = tokenizeSearchText(question, true);
  if (queryTokens.length === 0 || sentences.length === 0) {
    return [];
  }

  const docs: Bm25DocumentInput[] = sentences.map((sentence, idx) => ({
    id: String(idx),
    tokens: tokenizeSearchText(sentence, true),
  }));

  const scores = computeBm25Scores(queryTokens, docs, { allowPrefixMatch: false });
  const ranked: { sentence: string; score: number; matchedTerms: string[] }[] = [];

  scores.forEach((entry, id) => {
    const idx = Number(id);
    if (entry.matchedTerms.length === 0 || entry.score <= 0) return;
    ranked.push({
      sentence: sentences[idx],
      score: entry.score,
      matchedTerms: entry.matchedTerms,
    });
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}
