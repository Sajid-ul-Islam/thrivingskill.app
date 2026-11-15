import { Course, Note, Lesson } from '../../types';
import { Flashcard } from '../study/spacedRepetitionService';
import { LiteRtService } from '../ai/liteRtService';

export type SearchDocType = 'course' | 'lesson' | 'note' | 'flashcard';

export interface SearchDocument {
  id: string;
  type: SearchDocType;
  title: string;
  body: string;
  badge?: string;
  courseId?: string;
  lessonId?: string;
  extraMeta?: any;
}

export interface SearchResult {
  doc: SearchDocument;
  score: number;
  lexicalScore: number;
  semanticScore: number;
  isSemanticMatch: boolean;
  matchedTerms: string[];
  snippet: string;
}

export class LocalSearchEngine {
  private static documents = new Map<string, SearchDocument>();
  // Inverted index: term -> Map<docId, termFrequency>
  private static invertedIndex = new Map<string, Map<string, number>>();
  // Title inverted index for weighted scoring (3x)
  private static titleIndex = new Map<string, Map<string, number>>();
  // LiteRT Dense Vector Embeddings (Phase 4 AI Hybrid Search)
  private static documentEmbeddings = new Map<string, number[]>();

  /**
   * Tokenize text into normalized search terms (supports English & Bengali unicode)
   */
  static tokenize(text?: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/<[^>]+>/g, ' ') // Strip HTML tags
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'|[\]\\+]/g, ' ') // Strip punctuation
      .split(/\s+/)
      .filter((t) => t.length >= 2); // Exclude single characters
  }

  /**
   * Index a single document with both Inverted Index tokens and LiteRT Vector Embeddings
   */
  static indexDocument(doc: SearchDocument): void {
    this.documents.set(doc.id, doc);

    // 1. Index title
    const titleTokens = this.tokenize(doc.title);
    for (const token of titleTokens) {
      if (!this.titleIndex.has(token)) {
        this.titleIndex.set(token, new Map());
      }
      const post = this.titleIndex.get(token)!;
      post.set(doc.id, (post.get(doc.id) || 0) + 1);
    }

    // 2. Index body
    const bodyTokens = this.tokenize(doc.body);
    for (const token of bodyTokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Map());
      }
      const post = this.invertedIndex.get(token)!;
      post.set(doc.id, (post.get(doc.id) || 0) + 1);
    }

    // 3. Generate and index dense vector embedding for LiteRT Semantic Search (Phase 4)
    const embedding = LiteRtService.generateEmbedding(`${doc.title} ${doc.body}`);
    this.documentEmbeddings.set(doc.id, embedding);
  }

  /**
   * Remove a document from all indexes
   */
  static removeDocument(docId: string): void {
    this.documents.delete(docId);
    this.titleIndex.forEach((post) => post.delete(docId));
    this.invertedIndex.forEach((post) => post.delete(docId));
    this.documentEmbeddings.delete(docId);
  }

  /**
   * Clear all indexed documents
   */
  static clearIndex(): void {
    this.documents.clear();
    this.titleIndex.clear();
    this.invertedIndex.clear();
    this.documentEmbeddings.clear();
  }

  /**
   * Rebuild the entire search index from all active entities
   */
  static rebuildIndex(
    courses: Course[] = [],
    notes: Note[] = [],
    flashcards: Flashcard[] = []
  ): void {
    this.clearIndex();

    // 1. Index Courses & their Lessons
    for (const c of courses) {
      this.indexDocument({
        id: `course_${c.id}`,
        type: 'course',
        title: c.title,
        body: `${c.description || ''} ${c.instructor?.name || ''} ${c.category || ''}`,
        badge: c.category,
        courseId: c.id,
      });

      for (const m of c.modules || []) {
        for (const l of m.lessons || []) {
          this.indexDocument({
            id: `lesson_${c.id}_${l.id}`,
            type: 'lesson',
            title: l.title,
            body: `${l.summary || ''} ${m.title} ${c.title}`,
            badge: `${m.title}`,
            courseId: c.id,
            lessonId: l.id,
          });
        }
      }
    }

    // 2. Index Personal Notes
    for (const n of notes) {
      this.indexDocument({
        id: `note_${n.id}`,
        type: 'note',
        title: `Note: ${n.text.slice(0, 40)}...`,
        body: `${n.text} ${n.timestamp || ''}`,
        badge: n.timestamp ? `At ${n.timestamp}` : 'Personal Note',
        courseId: n.courseId,
        lessonId: n.lessonId,
      });
    }

    // 3. Index Spaced Repetition Flashcards
    for (const f of flashcards) {
      this.indexDocument({
        id: `card_${f.id}`,
        type: 'flashcard',
        title: f.question,
        body: `${f.answer} ${f.courseTitle || ''}`,
        badge: `Interval: ${f.interval}d`,
        courseId: f.courseId,
        lessonId: f.lessonId,
      });
    }
  }

  /**
   * Hybrid Search: Combines Lexical Inverted Index (BM25/TF-IDF) with
   * On-Device LiteRT Vector Semantic Similarity.
   */
  static search(query: string, filterType?: SearchDocType): SearchResult[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const lexicalScores = new Map<string, { score: number; matched: Set<string> }>();

    // 1. Lexical Matching
    for (const qToken of queryTokens) {
      // Title Matches (3.0x weight)
      this.titleIndex.forEach((postMap, term) => {
        if (term === qToken || term.startsWith(qToken)) {
          const matchBoost = term === qToken ? 1.0 : 0.7;
          postMap.forEach((tf, docId) => {
            if (!lexicalScores.has(docId)) {
              lexicalScores.set(docId, { score: 0, matched: new Set() });
            }
            const entry = lexicalScores.get(docId)!;
            entry.score += tf * 3.0 * matchBoost;
            entry.matched.add(term);
          });
        }
      });

      // Body Matches (1.0x weight)
      this.invertedIndex.forEach((postMap, term) => {
        if (term === qToken || term.startsWith(qToken)) {
          const matchBoost = term === qToken ? 1.0 : 0.6;
          postMap.forEach((tf, docId) => {
            if (!lexicalScores.has(docId)) {
              lexicalScores.set(docId, { score: 0, matched: new Set() });
            }
            const entry = lexicalScores.get(docId)!;
            entry.score += tf * 1.0 * matchBoost;
            entry.matched.add(term);
          });
        }
      });
    }

    // 2. LiteRT On-Device Vector Semantic Similarity (Phase 4)
    const isSemanticActive = LiteRtService.isSemanticEnabled();
    const queryEmbedding = isSemanticActive ? LiteRtService.generateEmbedding(query) : null;
    const semanticScores = new Map<string, number>();

    if (queryEmbedding) {
      this.documentEmbeddings.forEach((docVec, docId) => {
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < queryEmbedding.length; i++) {
          dot += queryEmbedding[i] * docVec[i];
          normA += queryEmbedding[i] * queryEmbedding[i];
          normB += docVec[i] * docVec[i];
        }
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        const similarity = denom > 0 ? dot / denom : 0;
        if (similarity > 0.25) {
          semanticScores.set(docId, similarity);
        }
      });
    }

    // 3. Merge Lexical & Semantic Scores
    const allCandidateIds = new Set<string>([
      ...Array.from(lexicalScores.keys()),
      ...Array.from(semanticScores.keys()),
    ]);

    const results: SearchResult[] = [];

    allCandidateIds.forEach((docId) => {
      const doc = this.documents.get(docId);
      if (!doc) return;
      if (filterType && doc.type !== filterType) return;

      const lexEntry = lexicalScores.get(docId);
      const lexScore = lexEntry ? lexEntry.score : 0;
      const semScore = semanticScores.get(docId) || 0;

      // Hybrid combination formula:
      // Combined = LexicalScore + (SemanticScore * 6.5)
      const hybridScore = lexScore + semScore * 6.5;

      const matchedTerms = lexEntry ? Array.from(lexEntry.matched) : [];
      const isSemanticMatch = semScore >= 0.35 && lexScore === 0;

      // Relevant snippet extraction
      let snippet = doc.body.slice(0, 120);
      if (matchedTerms.length > 0) {
        const firstMatchIdx = doc.body.toLowerCase().indexOf(matchedTerms[0]);
        if (firstMatchIdx >= 0) {
          const start = Math.max(0, firstMatchIdx - 30);
          snippet = (start > 0 ? '...' : '') + doc.body.slice(start, start + 120) + '...';
        }
      }

      results.push({
        doc,
        score: hybridScore,
        lexicalScore: lexScore,
        semanticScore: semScore,
        isSemanticMatch,
        matchedTerms,
        snippet,
      });
    });

    // Sort by hybrid score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 30);
  }
}
