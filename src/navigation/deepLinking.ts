import { LinkingOptions, NavigatorScreenParams } from '@react-navigation/native';
import { RootTab } from '../types';

export type MainTabParamList = {
  Home: undefined;
  Courses: { category?: string } | undefined;
  MyLearning: undefined;
  Workshops: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  CourseDetail: { courseId: string };
  LessonPlayer: { courseId: string; lessonId: string };
  YouTubeVideos: undefined;
};

export type ParsedDeepLink =
  | { type: 'course'; courseId: string }
  | { type: 'lesson'; courseId: string; lessonId: string }
  | { type: 'tab'; tab: RootTab }
  | { type: 'youtube' }
  | { type: 'auth'; mode: 'login' | 'register' };

const SUPPORTED_WEB_HOSTS = new Set(['thrivingskill.com', 'www.thrivingskill.com']);
const CUSTOM_SCHEMES = new Set(['thrivingskill', 'exp+thrivingskillapp']);

/**
 * Parses internal custom-scheme (`thrivingskill://`) and verified Universal/App Link URLs
 * (`https://thrivingskill.com/...`) into typed navigation targets.
 */
export function parseAppDeepLink(rawUrl: string | null | undefined): ParsedDeepLink | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const scheme = parsed.protocol.replace(/:$/, '').toLowerCase();
    const host = parsed.hostname.toLowerCase();

    if (scheme === 'http' || scheme === 'https') {
      if (!SUPPORTED_WEB_HOSTS.has(host)) {
        return null;
      }
    } else if (!CUSTOM_SCHEMES.has(scheme)) {
      return null;
    }

    // For custom schemes like `thrivingskill://courses/123`, host is 'courses' and pathname is '/123'.
    const normalizedPath = CUSTOM_SCHEMES.has(scheme)
      ? `/${host}${parsed.pathname}`.replace(/\/+/g, '/')
      : parsed.pathname.replace(/\/+/g, '/');

    const segments = normalizedPath
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);

    if (segments.length === 0) {
      return { type: 'tab', tab: 'Home' };
    }

    const head = segments[0].toLowerCase();
    if (head === 'login' || head === 'signin') {
      return { type: 'auth', mode: 'login' };
    }
    if (head === 'register' || head === 'signup') {
      return { type: 'auth', mode: 'register' };
    }
    if (head === 'courses' || head === 'course') {
      const targetId = segments[1];
      if (!targetId) {
        return { type: 'tab', tab: 'Courses' };
      }
      if (
        (segments[2]?.toLowerCase() === 'lessons' || segments[2]?.toLowerCase() === 'lesson') &&
        segments[3]
      ) {
        return {
          type: 'lesson',
          courseId: decodeURIComponent(targetId),
          lessonId: decodeURIComponent(segments[3]),
        };
      }
      return { type: 'course', courseId: decodeURIComponent(targetId) };
    }
    if (head === 'my-learning' || head === 'mylearning') {
      return { type: 'tab', tab: 'MyLearning' };
    }
    if (
      head === 'workshops' ||
      head === 'live' ||
      head === 'masterclass' ||
      head === 'masterclasses'
    ) {
      return { type: 'tab', tab: 'Workshops' };
    }
    if (head === 'profile') {
      return { type: 'tab', tab: 'Profile' };
    }
    if (head === 'videos' || head === 'youtube') {
      return { type: 'youtube' };
    }
    return null;
  } catch {
    return null;
  }
}

export const APP_LINKING_CONFIG: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'thrivingskill://',
    'exp+thrivingskillapp://',
    'https://thrivingskill.com',
    'https://www.thrivingskill.com',
  ],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Courses: 'courses',
          MyLearning: 'my-learning',
          Workshops: 'workshops',
          Profile: 'profile',
        },
      },
      CourseDetail: 'courses/:courseId',
      LessonPlayer: 'courses/:courseId/lessons/:lessonId',
      YouTubeVideos: 'videos',
    },
  },
};
