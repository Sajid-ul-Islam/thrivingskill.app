import { HttpClient } from './httpClient';
import { Endpoints } from './endpoints';
import { CacheManager } from '../cache/cacheManager';
import { cleanHtml } from './transformers';
import { LessonVideoType, resolveLessonVideoData } from '../../data/lessonVideosRegistry';

export interface LessonDetail {
  id: number | string;
  name: string;
  content: string;
  summary?: string;
  videoUrl?: string;
  videoIntro?: string;
  videoId?: string;
  videoType?: LessonVideoType;
  duration?: string;
  completed?: boolean;
}

export class LessonsService {
  /**
   * Fetch lesson content and metadata including verified video details from WordPress/LearnPress.
   * Fails closed (videoType: 'none', videoUrl: undefined) when no video is assigned.
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
          const title = cleanHtml(companionRaw.title);
          const content = cleanHtml(companionRaw.content);
          const summary = cleanHtml(companionRaw.summary || companionRaw.excerpt || '');
          const duration = cleanHtml(companionRaw.duration || '');
          const resolvedVideo = resolveLessonVideoData(undefined, {
            id: String(companionRaw.id),
            title,
            duration,
            summary,
            videoUrl: companionRaw.video_url || undefined,
            videoIntro: companionRaw.video_intro || undefined,
          });

          const detail: LessonDetail = {
            id: companionRaw.id,
            name: title,
            content,
            summary: summary || undefined,
            videoUrl: resolvedVideo.videoUrl,
            videoIntro: resolvedVideo.videoIntro,
            videoId: resolvedVideo.videoId,
            videoType: resolvedVideo.videoType,
            duration: resolvedVideo.duration,
            completed: Boolean(companionRaw.completed),
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

      const rawVideoIntro = raw.video_intro || raw.meta_data?._lp_lesson_video_intro || '';
      const rawVideoUrl = raw.video_url || raw.meta_data?.video_url || '';
      const title = cleanHtml(raw.name || raw.title);
      const content = cleanHtml(raw.content);
      const summary = cleanHtml(raw.excerpt || raw.summary || '');
      const duration = cleanHtml(raw.duration || raw.meta_data?._lp_duration || '');

      const resolvedVideo = resolveLessonVideoData(undefined, {
        id: String(raw.id),
        title,
        duration,
        summary,
        videoUrl: rawVideoUrl || undefined,
        videoIntro: rawVideoIntro || undefined,
      });

      const detail: LessonDetail = {
        id: raw.id,
        name: title,
        content,
        summary: summary || undefined,
        videoUrl: resolvedVideo.videoUrl,
        videoIntro: resolvedVideo.videoIntro,
        videoId: resolvedVideo.videoId,
        videoType: resolvedVideo.videoType,
        duration: resolvedVideo.duration,
        completed: Boolean(raw.completed),
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
