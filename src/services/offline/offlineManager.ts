import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson } from '../../types';

const OFFLINE_LESSONS_PREFIX = '@ts_offline_lesson_';
const OFFLINE_INDEX_KEY = '@ts_offline_index';

export interface OfflineResource {
  title: string;
  url: string;
  type: string;
}

export interface OfflineLessonData {
  lessonId: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  duration: string;
  summary: string;
  savedAt: string;
  content: string;
  takeaways?: string[];
  resources?: OfflineResource[];
  quality?: string;
  fileSize?: string;
}

export class OfflineManager {
  /**
   * Save lesson for offline reading with rich takeaways & companion resources
   */
  static async saveLessonOffline(
    courseId: string,
    lesson: Lesson,
    content?: string,
    courseTitle?: string,
    takeaways?: string[],
    resources?: OfflineResource[],
    quality?: string
  ): Promise<void> {
    const offlineData: OfflineLessonData = {
      lessonId: lesson.id,
      courseId,
      courseTitle: courseTitle || 'Thriving Skills Professional Course',
      title: lesson.title,
      duration: lesson.duration || '10 min',
      summary: lesson.summary || 'Downloaded offline lesson content for flexible learning without internet.',
      savedAt: new Date().toISOString(),
      content: content || lesson.summary || 'Complete study guide and key insights for this lecture.',
      takeaways: takeaways || [
        'Core architectural concepts and practical application.',
        'Production readiness and industry best practices.',
        'Step-by-step implementation notes.'
      ],
      resources: resources || [],
      quality: quality || '720p HD',
      fileSize: quality === '1080p' ? '~140 MB' : quality === '360p' ? '~25 MB' : '~65 MB',
    };

    await AsyncStorage.setItem(
      `${OFFLINE_LESSONS_PREFIX}${lesson.id}`,
      JSON.stringify(offlineData)
    );

    // Update index
    const index = await this.getDownloadedLessonIds();
    if (!index.includes(lesson.id)) {
      index.push(lesson.id);
      await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(index));
    }
  }

  /**
   * Check if lesson is downloaded
   */
  static async isLessonDownloaded(lessonId: string): Promise<boolean> {
    const item = await AsyncStorage.getItem(`${OFFLINE_LESSONS_PREFIX}${lessonId}`);
    return !!item;
  }

  /**
   * Get single downloaded lesson data
   */
  static async getDownloadedLesson(lessonId: string): Promise<OfflineLessonData | null> {
    try {
      const raw = await AsyncStorage.getItem(`${OFFLINE_LESSONS_PREFIX}${lessonId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get all downloaded lesson IDs
   */
  static async getDownloadedLessonIds(): Promise<string[]> {
    try {
      const index = await AsyncStorage.getItem(OFFLINE_INDEX_KEY);
      return index ? JSON.parse(index) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get all downloaded lessons with full contents
   */
  static async getAllDownloadedLessons(): Promise<OfflineLessonData[]> {
    const ids = await this.getDownloadedLessonIds();
    if (ids.length === 0) return [];

    const keys = ids.map((id) => `${OFFLINE_LESSONS_PREFIX}${id}`);
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const lessons: OfflineLessonData[] = [];
      for (const [, val] of pairs) {
        if (val) {
          try {
            lessons.push(JSON.parse(val));
          } catch {}
        }
      }
      return lessons;
    } catch {
      return [];
    }
  }

  /**
   * Get downloaded lessons grouped by course
   */
  static async getDownloadedCoursesGrouped(): Promise<{ courseId: string; courseTitle: string; lessons: OfflineLessonData[] }[]> {
    const lessons = await this.getAllDownloadedLessons();
    const map = new Map<string, { courseId: string; courseTitle: string; lessons: OfflineLessonData[] }>();

    for (const l of lessons) {
      const existing = map.get(l.courseId);
      if (existing) {
        existing.lessons.push(l);
      } else {
        map.set(l.courseId, {
          courseId: l.courseId,
          courseTitle: l.courseTitle || 'Professional Course',
          lessons: [l],
        });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Remove downloaded lesson
   */
  static async removeDownloadedLesson(lessonId: string): Promise<void> {
    await AsyncStorage.removeItem(`${OFFLINE_LESSONS_PREFIX}${lessonId}`);
    const index = await this.getDownloadedLessonIds();
    const next = index.filter((id) => id !== lessonId);
    await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(next));
  }
}
