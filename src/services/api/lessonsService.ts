import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { cleanHtml } from './transformers';

export interface LessonDetail {
  id: number | string;
  name: string;
  content: string;
  videoUrl?: string;
  duration?: string;
  completed?: boolean;
}

export class LessonsService {
  /**
   * Fetch lesson content and metadata
   */
  static async getLessonDetail(lessonId: string | number): Promise<LessonDetail> {
    const cacheKey = `lesson_detail_${lessonId}`;
    const cached = await CacheManager.get<LessonDetail>(cacheKey);
    if (cached) return cached;

    try {
      const raw = await HttpClient.get<any>(Endpoints.LEARNPRESS.LESSON_DETAIL(lessonId));
      const detail: LessonDetail = {
        id: raw.id,
        name: cleanHtml(raw.name || raw.title),
        content: cleanHtml(raw.content),
        videoUrl: raw.video_url || raw.meta_data?.video_url,
        duration: raw.duration,
        completed: raw.completed,
      };

      await CacheManager.set(cacheKey, detail, 300000);
      return detail;
    } catch (err) {
      const stale = await CacheManager.get<LessonDetail>(cacheKey, true);
      if (stale) return stale;
      throw err;
    }
  }

  /**
   * Mark lesson as completed on the backend
   */
  static async completeLesson(lessonId: string | number): Promise<any> {
    return HttpClient.post(Endpoints.LEARNPRESS.LESSON_FINISH, { id: lessonId });
  }

  /**
   * Fetch quiz details
   */
  static async getQuiz(quizId: string | number): Promise<any> {
    return HttpClient.get(Endpoints.LEARNPRESS.QUIZ_DETAIL(quizId));
  }

  /**
   * Start a quiz attempt
   */
  static async startQuiz(quizId: string | number): Promise<any> {
    return HttpClient.post(Endpoints.LEARNPRESS.QUIZ_START, { id: quizId });
  }

  /**
   * Check answer for a quiz question
   */
  static async checkAnswer(quizId: string | number, questionId: string | number, answer: any): Promise<any> {
    return HttpClient.post(Endpoints.LEARNPRESS.QUIZ_CHECK_ANSWER, {
      id: quizId,
      question_id: questionId,
      answer,
    });
  }

  /**
   * Submit quiz and finish
   */
  static async finishQuiz(quizId: string | number): Promise<any> {
    return HttpClient.post(Endpoints.LEARNPRESS.QUIZ_FINISH, { id: quizId });
  }
}
