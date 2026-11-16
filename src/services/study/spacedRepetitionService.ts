import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from '../../types';

const FLASHCARDS_PREFIX = '@ts_flashcards_';

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface Flashcard {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  question: string;
  answer: string;
  category?: string;
  repetitions: number;
  interval: number; // in days
  easeFactor: number; // default 2.5, min 1.3
  nextReviewDate: number; // timestamp
  lastReviewedDate?: number;
}

export class SpacedRepetitionService {
  private static userScope = '_guest';

  static setUserScope(scope: string): void {
    this.userScope = scope;
  }

  private static getStorageKey(): string {
    return `${FLASHCARDS_PREFIX}${this.userScope}`;
  }

  /**
   * Get all flashcards for active user
   */
  static async getAllCards(): Promise<Flashcard[]> {
    try {
      const raw = await AsyncStorage.getItem(this.getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get cards due for review (nextReviewDate <= now)
   */
  static async getDueCards(courseId?: string): Promise<Flashcard[]> {
    const all = await this.getAllCards();
    const now = Date.now();
    return all.filter((c) => {
      const isDue = c.nextReviewDate <= now;
      if (courseId) return isDue && c.courseId === courseId;
      return isDue;
    });
  }

  /**
   * Get cards for a specific course
   */
  static async getCardsByCourse(courseId: string): Promise<Flashcard[]> {
    const all = await this.getAllCards();
    return all.filter((c) => c.courseId === courseId);
  }

  /**
   * Save or update a card
   */
  static async saveCard(card: Flashcard): Promise<void> {
    const all = await this.getAllCards();
    const idx = all.findIndex((c) => c.id === card.id);
    if (idx >= 0) {
      all[idx] = card;
    } else {
      all.push(card);
    }
    await AsyncStorage.setItem(this.getStorageKey(), JSON.stringify(all));
  }

  /**
   * Save multiple cards in bulk
   */
  static async saveCardsBulk(cards: Flashcard[]): Promise<void> {
    const all = await this.getAllCards();
    const map = new Map<string, Flashcard>();
    all.forEach((c) => map.set(c.id, c));
    cards.forEach((c) => map.set(c.id, c));
    await AsyncStorage.setItem(this.getStorageKey(), JSON.stringify(Array.from(map.values())));
  }

  /**
   * Delete a card
   */
  static async deleteCard(cardId: string): Promise<void> {
    const all = await this.getAllCards();
    const filtered = all.filter((c) => c.id !== cardId);
    await AsyncStorage.setItem(this.getStorageKey(), JSON.stringify(filtered));
  }

  /**
   * Review card using the SuperMemo-2 (SM-2) Spaced Repetition Algorithm
   */
  static async reviewCard(cardId: string, rating: ReviewRating): Promise<Flashcard> {
    const all = await this.getAllCards();
    const card = all.find((c) => c.id === cardId);
    if (!card) throw new Error('Flashcard not found');

    const qualityMap: Record<ReviewRating, number> = {
      again: 1,
      hard: 3,
      good: 4,
      easy: 5,
    };
    const quality = qualityMap[rating];

    let { repetitions, interval, easeFactor } = card;

    if (quality < 3) {
      // Failed recall: reset repetitions and schedule for immediate tomorrow review
      repetitions = 0;
      interval = 1;
    } else {
      // Successful recall: increment interval according to SM-2 formula
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    // Update Ease Factor (EF)
    // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const now = Date.now();
    const updatedCard: Flashcard = {
      ...card,
      repetitions,
      interval,
      easeFactor,
      nextReviewDate: now + interval * 86400000,
      lastReviewedDate: now,
    };

    await this.saveCard(updatedCard);
    return updatedCard;
  }

  /**
   * Auto-generate a high-yield flashcard deck from a course's curriculum
   */
  static async generateDeckForCourse(course: Course): Promise<Flashcard[]> {
    const existing = await this.getCardsByCourse(course.id);
    if (existing.length >= 4) {
      return existing;
    }

    const newCards: Flashcard[] = [];
    const now = Date.now();

    // 1. High-level Course Definition Card
    newCards.push({
      id: `card_${course.id}_overview`,
      courseId: course.id,
      courseTitle: course.title,
      question: `What are the primary objectives and key skills taught in "${course.title}"?`,
      answer: course.description
        ? `${course.description.replace(/<[^>]+>/g, '').slice(0, 220)}...`
        : 'Comprehensive professional mastery, practical workflows, and real-world execution.',
      category: course.category,
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: now,
    });

    // 2. Module & Lesson Takeaway Cards
    let count = 0;
    for (const mod of course.modules || []) {
      for (const lesson of mod.lessons || []) {
        if (count >= 5) break;
        newCards.push({
          id: `card_${course.id}_${lesson.id}`,
          courseId: course.id,
          courseTitle: course.title,
          lessonId: lesson.id,
          question: `In "${mod.title}", what core concept is explored in the lecture: "${lesson.title}"?`,
          answer: lesson.summary || `Hands-on understanding of ${lesson.title}, best practices, and enterprise workflows.`,
          category: course.category,
          repetitions: 0,
          interval: 1,
          easeFactor: 2.5,
          nextReviewDate: now,
        });
        count++;
      }
      if (count >= 5) break;
    }

    await this.saveCardsBulk(newCards);
    return this.getCardsByCourse(course.id);
  }
}
