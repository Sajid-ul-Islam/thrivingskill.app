import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson } from '../../types';

const OFFLINE_LESSONS_PREFIX = '@ts_offline_lesson_';
const OFFLINE_INDEX_KEY = '@ts_offline_index';

export interface OfflineResource {
  title: string;
  url: string;
  type: string;
}

/**
 * Text-only study guide record stored locally for offline reading.
 * Course videos stream online only and are never saved as offline video binaries.
 */
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
}

export class OfflineManager {
  /**
   * Save lesson text study guide, summary, and resources for offline reading.
   * Does not download or store video files (all course videos stream online).
   */
  static async saveLessonOffline(
    courseId: string,
    lesson: Lesson,
    content?: string,
    courseTitle?: string,
    takeaways?: string[],
    resources?: OfflineResource[]
  ): Promise<void> {
    const cleanSummary = (lesson.summary || '').trim();
    const cleanContent = (content || cleanSummary).trim();
    const validTakeaways = (takeaways || []).map((t) => t.trim()).filter(Boolean);

    const offlineData: OfflineLessonData = {
      lessonId: lesson.id,
      courseId,
      courseTitle: courseTitle || 'Thriving Skills Course',
      title: lesson.title,
      duration: lesson.duration || '',
      summary: cleanSummary || 'Saved lesson notes and overview for offline reading.',
      savedAt: new Date().toISOString(),
      content: cleanContent || 'Open this lesson online to watch the lecture video.',
      ...(validTakeaways.length > 0 ? { takeaways: validTakeaways } : {}),
      resources: resources || [],
    };

    await AsyncStorage.setItem(
      `${OFFLINE_LESSONS_PREFIX}${lesson.id}`,
      JSON.stringify(offlineData)
    );

    const index = await this.getDownloadedLessonIds();
    if (!index.includes(lesson.id)) {
      index.push(lesson.id);
      await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(index));
    }
  }

  /**
   * Check if lesson study guide is saved for offline reading
   */
  static async isLessonDownloaded(lessonId: string): Promise<boolean> {
    const item = await AsyncStorage.getItem(`${OFFLINE_LESSONS_PREFIX}${lessonId}`);
    return !!item;
  }

  /**
   * Get single saved lesson study guide
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
   * Get all saved study guide lesson IDs
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
   * Get all saved lesson study guides
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
   * Get saved study guides grouped by course
   */
  static async getDownloadedCoursesGrouped(): Promise<
    { courseId: string; courseTitle: string; lessons: OfflineLessonData[] }[]
  > {
    const lessons = await this.getAllDownloadedLessons();
    const map = new Map<
      string,
      { courseId: string; courseTitle: string; lessons: OfflineLessonData[] }
    >();

    for (const l of lessons) {
      const existing = map.get(l.courseId);
      if (existing) {
        existing.lessons.push(l);
      } else {
        map.set(l.courseId, {
          courseId: l.courseId,
          courseTitle: l.courseTitle || 'Thriving Skills Course',
          lessons: [l],
        });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Remove saved study guide for a lesson
   */
  static async removeDownloadedLesson(lessonId: string): Promise<void> {
    await AsyncStorage.removeItem(`${OFFLINE_LESSONS_PREFIX}${lessonId}`);
    const index = await this.getDownloadedLessonIds();
    const next = index.filter((id) => id !== lessonId);
    await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(next));
  }
}
