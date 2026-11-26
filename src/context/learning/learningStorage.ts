import AsyncStorage from '@react-native-async-storage/async-storage';
import { Certificate, Note, UserProgress } from '../../types';

export const LEARNING_STORAGE_KEYS = {
  PROGRESS: '@thriving_skill_progress',
  WATCH_POSITIONS: '@thriving_skill_watch_positions',
  BOOKMARKS: '@thriving_skill_bookmarks',
  NOTES: '@thriving_skill_notes',
  WORKSHOPS: '@thriving_skill_rsvps',
  AFFINITIES: '@thriving_skill_affinities',
  SEARCH_HISTORY: '@thriving_skill_searches',
  REVIEWS: '@thriving_skill_reviewed_courses',
  CERTIFICATES: '@thriving_skill_certificates',
} as const;

export interface HydratedLearningScope {
  userProgress: Record<string, UserProgress>;
  watchPositions: Record<string, Record<string, number>>;
  bookmarks: string[];
  notes: Note[];
  rsvpWorkshops: string[];
  categoryAffinities: Record<string, number>;
  searchKeywordsHistory: string[];
  reviewedCourseIds: string[];
  certificates: Certificate[];
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function persistUserLearningKey(
  key: string,
  userScope: string,
  data: unknown
): Promise<void> {
  try {
    await AsyncStorage.setItem(`${key}${userScope}`, JSON.stringify(data));
  } catch {}
}

export async function hydrateUserLearningScope(userScope: string): Promise<HydratedLearningScope> {
  const [
    savedProgress,
    savedWatchPositions,
    savedBookmarks,
    savedNotes,
    savedWorkshops,
    savedAffinities,
    savedSearches,
    savedReviews,
    savedCertificates,
  ] = await Promise.all([
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.PROGRESS}${userScope}`),
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.WATCH_POSITIONS}${userScope}`),
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.BOOKMARKS}${userScope}`),
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.NOTES}${userScope}`),
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.WORKSHOPS}${userScope}`),
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.AFFINITIES}${userScope}`),
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.SEARCH_HISTORY}${userScope}`),
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.REVIEWS}${userScope}`),
    AsyncStorage.getItem(`${LEARNING_STORAGE_KEYS.CERTIFICATES}${userScope}`),
  ]);

  return {
    userProgress: safeParseJson<Record<string, UserProgress>>(savedProgress, {}),
    watchPositions: safeParseJson<Record<string, Record<string, number>>>(savedWatchPositions, {}),
    bookmarks: safeParseJson<string[]>(savedBookmarks, []),
    notes: safeParseJson<Note[]>(savedNotes, []),
    rsvpWorkshops: safeParseJson<string[]>(savedWorkshops, []),
    categoryAffinities: safeParseJson<Record<string, number>>(savedAffinities, {}),
    searchKeywordsHistory: safeParseJson<string[]>(savedSearches, []),
    reviewedCourseIds: safeParseJson<string[]>(savedReviews, []),
    certificates: safeParseJson<Certificate[]>(savedCertificates, []),
  };
}
