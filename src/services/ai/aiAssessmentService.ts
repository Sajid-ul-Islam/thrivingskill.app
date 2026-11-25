import { AiTutorContext } from './aiTutorService';
import { QuizItem } from '../../components/modals/QuizPlayerModal';
import { Flashcard, SpacedRepetitionService } from '../study/spacedRepetitionService';
import { getDomainQuestionsForCourse } from '../../data/domainQuizBank';
import { Course, Lesson } from '../../types';

export interface LectureCheatSheet {
  available: boolean;
  lessonTitle: string;
  takeaways: string[];
  practicalFormula: string;
  actionItem: string;
}

/**
 * AiAssessmentService
 * In-lecture assessment & SM-2 active recall helpers backed strictly by verified
 * LearnPress quiz questions, curated domain question banks, and real lesson summaries.
 */
export class AiAssessmentService {
  /**
   * Returns real quiz items from the active lesson/course curriculum or matching curated domain bank.
   * Returns `[]` when no verified questions exist rather than fabricating generic boilerplate.
   */
  static async generateDiagnosticQuiz(
    context: AiTutorContext,
    isBangla: boolean = false,
    options?: { currentLesson?: Lesson; course?: Course }
  ): Promise<QuizItem[]> {
    const lessonQuiz = options?.currentLesson?.quiz;
    if (Array.isArray(lessonQuiz) && lessonQuiz.length > 0) {
      return lessonQuiz.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctAnswerIndex,
        explanation: q.explanation,
      }));
    }

    const courseQuizLesson = options?.course?.modules
      ?.flatMap((m) => m.lessons || [])
      .find((l) => Array.isArray(l.quiz) && l.quiz.length > 0);
    if (courseQuizLesson?.quiz?.length) {
      return courseQuizLesson.quiz.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctAnswerIndex,
        explanation: q.explanation,
      }));
    }

    return getDomainQuestionsForCourse(context.courseTitle, context.courseCategory, isBangla);
  }

  /**
   * Extracts real takeaways from published lecture text without fabricating placeholder bullets.
   */
  static generateCheatSheet(context: AiTutorContext, isBangla: boolean = false): LectureCheatSheet {
    const clean = (context.lessonSummary || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const sentences = clean
      .split(/(?<=[.!?।])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 25);

    if (sentences.length === 0) {
      return {
        available: false,
        lessonTitle: context.lessonTitle,
        takeaways: [],
        practicalFormula: '',
        actionItem: '',
      };
    }

    return {
      available: true,
      lessonTitle: context.lessonTitle,
      takeaways: sentences.slice(0, 4),
      practicalFormula: isBangla
        ? `${context.courseTitle} • ${context.moduleTitle}`
        : `${context.courseTitle} • ${context.moduleTitle}`,
      actionItem: isBangla
        ? `"${context.lessonTitle}" পাঠের মূল বিষয়গুলো লেকচার নোটসে সংরক্ষণ করুন এবং কুইজে অংশ নিন।`
        : `Capture your key observations from "${context.lessonTitle}" in Notes and review flashcards.`,
    };
  }

  /**
   * Converts missed quiz questions into SuperMemo SM-2 flashcards for active recall.
   */
  static convertMissedQuestionsToFlashcards(
    questions: QuizItem[],
    missedIndices: number[],
    courseId: string,
    lessonId: string,
    courseTitle: string = 'Course Concept'
  ): Flashcard[] {
    const newCards: Flashcard[] = [];
    const now = Date.now();

    missedIndices.forEach((idx, offset) => {
      const q = questions[idx];
      if (!q) return;

      const correctAnswer = q.options[q.correctIndex] || 'Correct answer';
      const front = `[Question] ${q.question}`;
      const back = `[Answer] ${correctAnswer}\n\n[Explanation] ${q.explanation}`;

      const card: Flashcard = {
        id: `card_${courseId}_${lessonId}_${now}_${offset}`,
        courseId,
        courseTitle,
        lessonId,
        question: front,
        answer: back,
        category: 'Quiz Review',
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        nextReviewDate: now,
      };
      newCards.push(card);
    });

    if (newCards.length > 0) {
      SpacedRepetitionService.saveCardsBulk(newCards).catch(() => {});
    }

    return newCards;
  }
}
