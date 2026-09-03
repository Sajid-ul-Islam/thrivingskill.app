import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lesson } from '../../types';

const OFFLINE_LESSONS_PREFIX = '@ts_offline_lesson_';
const OFFLINE_INDEX_KEY = '@ts_offline_index';

export interface OfflineLessonData {
  lessonId: string;
  courseId: string;
  title: string;
  duration: string;
  summary: string;
  savedAt: string;
  content: string;
}

export class OfflineManager {
  /**
   * Save lesson for offline reading
   */
  static async saveLessonOffline(
    courseId: string,
    lesson: Lesson,
    content?: string
  ): Promise<void> {
    const offlineData: OfflineLessonData = {
      lessonId: lesson.id,
      courseId,
      title: lesson.title,
      duration: lesson.duration,
      summary: lesson.summary || 'Downloaded offline lesson content for flexible learning without internet.',
      savedAt: new Date().toISOString(),
      content: content || lesson.summary || 'Complete study guide and key insights for this lecture.',
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
   * Remove downloaded lesson
   */
  static async removeDownloadedLesson(lessonId: string): Promise<void> {
    await AsyncStorage.removeItem(`${OFFLINE_LESSONS_PREFIX}${lessonId}`);
    const index = await this.getDownloadedLessonIds();
    const next = index.filter((id) => id !== lessonId);
    await AsyncStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(next));
  }
}
