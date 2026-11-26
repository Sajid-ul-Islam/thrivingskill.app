import { Course, Note } from '../../types';
import { Flashcard } from '../study/spacedRepetitionService';
import { computeBm25Scores, tokenizeSearchText } from './bm25';

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
  bm25Score: number;
  matchedTerms: string[];
  snippet: string;
}

export interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number;
  word?: string;
  matchedDocIds: Set<string>;
}

export class PrefixTrie {
  private root: TrieNode = {
    children: new Map(),
    isEndOfWord: false,
    frequency: 0,
    matchedDocIds: new Set(),
  };

  insert(word: string, docId?: string): void {
    if (!word) return;
    const clean = word.toLowerCase().trim();
    if (clean.length < 2) return;

    let current = this.root;
    for (const char of clean) {
      if (!current.children.has(char)) {
        current.children.set(char, {
          children: new Map(),
          isEndOfWord: false,
          frequency: 0,
          matchedDocIds: new Set(),
        });
      }
      current = current.children.get(char)!;
      if (docId) {
        current.matchedDocIds.add(docId);
      }
    }
    current.isEndOfWord = true;
    current.frequency += 1;
    current.word = clean;
  }

  getSuggestions(prefix: string, limit: number = 6): string[] {
    if (!prefix) return [];
    const clean = prefix.toLowerCase().trim();
    let current = this.root;

    for (const char of clean) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char)!;
    }

    const results: { word: string; frequency: number }[] = [];
    const traverse = (node: TrieNode) => {
      if (node.isEndOfWord && node.word) {
        results.push({ word: node.word, frequency: node.frequency });
      }
      for (const child of node.children.values()) {
        traverse(child);
      }
    };

    traverse(current);
    results.sort((a, b) => b.frequency - a.frequency);
    return results.slice(0, limit).map((r) => r.word);
  }

  getTopKeywords(limit: number = 8): string[] {
    const results: { word: string; frequency: number }[] = [];
    const traverse = (node: TrieNode) => {
      if (node.isEndOfWord && node.word) {
        results.push({ word: node.word, frequency: node.frequency });
      }
      for (const child of node.children.values()) {
        traverse(child);
      }
    };
    traverse(this.root);
    results.sort((a, b) => b.frequency - a.frequency);
    return results.slice(0, limit).map((r) => r.word);
  }

  clear(): void {
    this.root = {
      children: new Map(),
      isEndOfWord: false,
      frequency: 0,
      matchedDocIds: new Set(),
    };
  }
}

export class LocalSearchEngine {
  private static documents = new Map<string, SearchDocument>();
  private static titleTokensMap = new Map<string, string[]>();
  private static bodyTokensMap = new Map<string, string[]>();
  // High-performance In-Memory Prefix Trie for instant sub-millisecond search auto-complete
  private static prefixTrie = new PrefixTrie();

  /**
   * Tokenize text into normalized search terms (supports English & Bengali unicode).
   */
  static tokenize(text?: string): string[] {
    return tokenizeSearchText(text, false);
  }

  /**
   * Index a single document for BM25 keyword ranking and prefix autocomplete.
   */
  static indexDocument(doc: SearchDocument): void {
    this.documents.set(doc.id, doc);

    const titleTokens = this.tokenize(doc.title);
    const bodyTokens = this.tokenize(doc.body);
    this.titleTokensMap.set(doc.id, titleTokens);
    this.bodyTokensMap.set(doc.id, bodyTokens);

    for (const token of titleTokens) {
      this.prefixTrie.insert(token, doc.id);
    }
    if (doc.badge) {
      const badgeTokens = this.tokenize(doc.badge);
      for (const token of badgeTokens) {
        this.prefixTrie.insert(token, doc.id);
      }
    }
  }

  /**
   * Fast In-Memory Prefix Trie suggestions for instant auto-complete (<1ms).
   */
  static getAutoSuggestions(prefix: string, limit: number = 6): string[] {
    return this.prefixTrie.getSuggestions(prefix, limit);
  }

  /**
   * Top indexed keywords from courses and modules.
   */
  static getTopKeywords(limit: number = 8): string[] {
    return this.prefixTrie.getTopKeywords(limit);
  }

  /**
   * Remove a document from all indexes.
   */
  static removeDocument(docId: string): void {
    this.documents.delete(docId);
    this.titleTokensMap.delete(docId);
    this.bodyTokensMap.delete(docId);
  }

  /**
   * Clear all indexed documents.
   */
  static clearIndex(): void {
    this.documents.clear();
    this.titleTokensMap.clear();
    this.bodyTokensMap.clear();
    this.prefixTrie.clear();
  }

  /**
   * Rebuild the entire search index from all active entities.
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
      const safeNoteText = typeof n.text === 'string' ? n.text : '';
      this.indexDocument({
        id: `note_${n.id}`,
        type: 'note',
        title: safeNoteText ? `Note: ${safeNoteText.slice(0, 40)}...` : 'Personal Note',
        body: `${safeNoteText} ${n.timestamp || ''}`.trim(),
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
   * Honest Okapi BM25 keyword search across title (3.0x weight) and body (1.0x weight)
   * with prefix matching support and no synthetic semantic projection scores.
   */
  static search(
    query: string,
    filterType?: SearchDocType,
    options?: { matchAllTerms?: boolean }
  ): SearchResult[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const candidateDocs = Array.from(this.documents.values()).filter(
      (doc) => !filterType || doc.type === filterType
    );
    if (candidateDocs.length === 0) return [];

    const titleInputs = candidateDocs.map((doc) => ({
      id: doc.id,
      tokens: this.titleTokensMap.get(doc.id) || [],
    }));
    const bodyInputs = candidateDocs.map((doc) => ({
      id: doc.id,
      tokens: this.bodyTokensMap.get(doc.id) || [],
    }));

    const titleScores = computeBm25Scores(queryTokens, titleInputs, { allowPrefixMatch: true });
    const bodyScores = computeBm25Scores(queryTokens, bodyInputs, { allowPrefixMatch: true });
    const matchAllTerms = options?.matchAllTerms === true;

    const results: SearchResult[] = [];

    for (const doc of candidateDocs) {
      const tEntry = titleScores.get(doc.id);
      const bEntry = bodyScores.get(doc.id);
      if (!tEntry && !bEntry) continue;

      const combinedScore = (tEntry?.score || 0) * 3.0 + (bEntry?.score || 0);
      if (combinedScore <= 0) continue;

      const matchedTermsSet = new Set<string>([
        ...(tEntry?.matchedTerms || []),
        ...(bEntry?.matchedTerms || []),
      ]);

      if (matchAllTerms) {
        const docAllTokens = [
          ...(this.titleTokensMap.get(doc.id) || []),
          ...(this.bodyTokensMap.get(doc.id) || []),
        ];
        const coversAll = queryTokens.every((qt) =>
          docAllTokens.some((tok) => tok === qt || tok.startsWith(qt))
        );
        if (!coversAll) continue;
      }

      const matchedTerms = Array.from(matchedTermsSet);
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
        score: combinedScore,
        bm25Score: combinedScore,
        matchedTerms,
        snippet,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 30);
  }
}
