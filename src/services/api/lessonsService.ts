import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { cleanHtml } from './transformers';

export interface LessonDetail {
  id: number | string;
  name: string;
  content: string;
  videoUrl?: string;
  videoIntro?: string;
  videoType?: 'vimeo' | 'youtube' | 'mp4' | 'iframe' | 'none';
  duration?: string;
  completed?: boolean;
}

export class LessonsService {
  /**
   * Fetch lesson content and metadata including embedded video details
   */
  static async getLessonDetail(lessonId: string | number): Promise<LessonDetail> {
    const cacheKey = `lesson_detail_${lessonId}`;
    const cached = await CacheManager.get<LessonDetail>(cacheKey);
    if (cached) return cached;

    try {
      // Strategy 1: Attempt Companion Plugin clean lesson stream endpoint
      try {
        const companionRaw = await HttpClient.get<any>(Endpoints.COMPANION.LESSON_DETAIL(lessonId));
        if (companionRaw && companionRaw.id) {
          const detail: LessonDetail = {
            id: companionRaw.id,
            name: cleanHtml(companionRaw.title),
            content: cleanHtml(companionRaw.content),
            videoUrl: companionRaw.video_url || undefined,
            videoIntro: undefined,
            videoType: companionRaw.video_type || 'none',
            duration: companionRaw.duration,
            completed: false,
          };
          await CacheManager.set(cacheKey, detail, 300000);
          return detail;
        }
      } catch (companionErr: any) {
        // Re-throw rate limit immediately; for 401/403 allow fallback only to LearnPress so preview lessons still work
        if (companionErr?.status === 429) {
          throw companionErr;
        }
      }

      const raw = await HttpClient.get<any>(Endpoints.LEARNPRESS.LESSON_DETAIL(lessonId));

      const videoIntro = raw.video_intro || raw.meta_data?._lp_lesson_video_intro || '';
      let videoUrl = raw.video_url || raw.meta_data?.video_url || '';

      if (!videoUrl && videoIntro) {
        const srcMatch = videoIntro.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          videoUrl = srcMatch[1];
        } else if (videoIntro.startsWith('http://') || videoIntro.startsWith('https://')) {
          videoUrl = videoIntro.trim();
        }
      }

      let videoType: 'vimeo' | 'youtube' | 'mp4' | 'iframe' | 'none' = 'none';
      if (videoUrl) {
        if (videoUrl.includes('vimeo.com')) videoType = 'vimeo';
        else if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))
          videoType = 'youtube';
        else if (videoUrl.match(/\.(mp4|m3u8|webm)($|\?)/i)) videoType = 'mp4';
        else videoType = 'iframe';
      } else if (videoIntro) {
        videoType = 'iframe';
      }

      const detail: LessonDetail = {
        id: raw.id,
        name: cleanHtml(raw.name || raw.title),
        content: cleanHtml(raw.content),
        videoUrl: videoUrl || undefined,
        videoIntro: videoIntro || undefined,
        videoType,
        duration: raw.duration,
        completed: raw.completed,
      };

      await CacheManager.set(cacheKey, detail, 300000);
      return detail;
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        throw err;
      }
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
   * Fetch quiz details directly from live WordPress LearnPress API with anti-stale headers
   */
  static async getQuiz(quizId: string | number): Promise<any> {
    return HttpClient.get(
      Endpoints.LEARNPRESS.QUIZ_DETAIL(quizId),
      { _t: Date.now() },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
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
  static async checkAnswer(
    quizId: string | number,
    questionId: string | number,
    answer: any
  ): Promise<any> {
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
