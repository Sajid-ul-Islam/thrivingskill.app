import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import {
  AnalyticsService,
  DEFAULT_RECOMMENDATION_ATTRIBUTION_WINDOW_MS,
  STORAGE_KEY_ANALYTICS_EVENTS,
  STORAGE_KEY_ANALYTICS_STATE,
} from '../services/analytics/analyticsService';
import { TelemetryService } from '../services/telemetry/telemetryService';
import { computeRecommendedCourses, DEFAULT_RECOMMENDATION_SOURCE } from '../utils/recommendations';
import { CategoryRow } from '../screens/HomeScreen';
import type { Category, Course } from '../types';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  AndroidImportance: { MAX: 5, HIGH: 4, DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons/Ionicons', () => () => null);
jest.mock('../utils/haptics', () => ({ triggerHaptic: jest.fn() }));
jest.mock('../context/LearningContext', () => ({ useLearning: () => ({}) }));
jest.mock('../context/SaaSContext', () => ({ useSaaS: () => ({}) }));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({}) }));
jest.mock('../context/GamificationContext', () => ({ useGamification: () => ({}) }));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDark: false,
    colors: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceCard: '#FFFFFF',
      surfaceSubtle: '#F8FAFC',
      border: '#E2E8F0',
      borderSubtle: '#E2E8F0',
      text: '#102F53',
      textMuted: '#64748B',
      textLight: '#94A3B8',
      primary: '#102F53',
      primaryLight: '#E8EEF5',
      secondary: '#1D4476',
      secondaryLight: '#EFF6FF',
      accent: '#E34234',
      accentLight: '#FEE2E2',
      danger: '#E34234',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
      onAccent: '#FFFFFF',
      starColor: '#FFB606',
    },
  }),
}));

jest.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ isBangla: false, language: 'en' }),
}));

jest.mock('../theme', () => ({
  useResponsive: () => ({
    isTablet: false,
    isLandscape: false,
    width: 390,
  }),
}));

jest.mock('../components', () => {
  const ReactActual = require('react');
  const { Pressable, Text } = require('react-native');
  return {
    CourseCard: ({ course, onPress }: any) =>
      ReactActual.createElement(
        Pressable,
        { testID: `course-card-${course.id}`, onPress },
        ReactActual.createElement(Text, null, course.title)
      ),
    SpringPressable: ({ children, onPress, ...rest }: any) =>
      ReactActual.createElement(Pressable, { onPress, ...rest }, children),
    StaggeredFadeIn: ({ children }: any) => children,
  };
});

const SAMPLE_CATEGORIES: Category[] = [
  { id: 'ai', name: 'AI & Automation', icon: 'sparkles', count: 2, color: '#102F53' },
  { id: 'excel', name: 'Excel & Analytics', icon: 'grid', count: 2, color: '#102F53' },
];

const makeSampleCourse = (
  overrides: Partial<Course> & { id: string; title: string; category: string }
): Course => ({
  id: overrides.id,
  title: overrides.title,
  slug: overrides.id,
  subtitle: overrides.subtitle ?? 'Executive course',
  description: overrides.description ?? 'Practical course description',
  category: overrides.category,
  instructor: {
    id: 'inst-1',
    name: 'Instructor',
    title: 'Lead Instructor',
    company: 'Thriving Skills',
    avatar: '',
    bio: 'Bio',
    rating: 4.8,
    studentsCount: 100,
    coursesCount: 3,
  },
  rating: overrides.rating ?? 4.8,
  reviewsCount: 10,
  enrolledCount: overrides.enrolledCount ?? 500,
  durationHours: 2,
  lecturesCount: 5,
  certificateIncluded: true,
  language: 'English',
  lastUpdated: '2026-01-01',
  level: 'Beginner',
  price: 15,
  originalPrice: 25,
  priceBdt: overrides.priceBdt ?? 1500,
  thumbnail: 'https://thrivingskill.com/thumb.jpg',
  highlights: [],
  prerequisites: [],
  modules: [],
  reviews: [],
  badge: overrides.badge,
});

const SAMPLE_COURSES: Course[] = [
  makeSampleCourse({
    id: 'c1',
    title: 'Generative AI for Leaders',
    subtitle: 'Executive workflows',
    category: 'ai',
    rating: 4.9,
    enrolledCount: 800,
    description: 'AI productivity',
    priceBdt: 1500,
    badge: 'Bestseller',
  }),
  makeSampleCourse({
    id: 'c2',
    title: 'Advanced Excel Analytics',
    subtitle: 'Dashboards',
    category: 'excel',
    rating: 4.8,
    enrolledCount: 650,
    description: 'Excel modeling',
    priceBdt: 1200,
  }),
  makeSampleCourse({
    id: 'c3',
    title: 'Python Data Workflows',
    subtitle: 'Automation',
    category: 'excel',
    rating: 4.7,
    enrolledCount: 400,
    description: 'Python reporting',
    priceBdt: 1400,
  }),
];

describe('App-only centralized analytics & recommendation attribution', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    TelemetryService.setUser(null);
    AnalyticsService.resetAnalytics();
    await AnalyticsService.whenIdle();
  });

  it('produces source-tagged deterministic recommendation IDs per ranking source', () => {
    const resV1 = computeRecommendedCourses({
      courses: SAMPLE_COURSES,
      categories: SAMPLE_CATEGORIES,
      userProgress: {},
      categoryAffinities: { ai: 3 },
      searchKeywordsHistory: ['ai'],
    });
    const resV2 = computeRecommendedCourses({
      courses: SAMPLE_COURSES,
      categories: SAMPLE_CATEGORIES,
      userProgress: {},
      categoryAffinities: { ai: 3 },
      searchKeywordsHistory: ['ai'],
      source: 'hybrid_graph_v2',
    });

    expect(resV1.source).toBe(DEFAULT_RECOMMENDATION_SOURCE);
    expect(resV1.recommendationId).toMatch(/^rec_/);
    expect(resV2.source).toBe('hybrid_graph_v2');
    expect(resV2.recommendationId).not.toBe(resV1.recommendationId);
  });

  it('tracks individual card impressions with consistent CTR and keeps events out of Sentry breadcrumbs', () => {
    AnalyticsService.setUser({ id: 'learner_1', username: 'learner1', role: 'subscriber' });
    (Sentry.addBreadcrumb as jest.Mock).mockClear();

    const recId = AnalyticsService.trackRecommendationImpression(['c1', 'c2'], {
      recommendationId: 'rec_card_test_1',
      surface: 'home',
      source: 'home_bm25_behavioral_v1',
      timestamp: 1_700_000_000_000,
    });

    // Incremental scroll brings c3 into view: only c3 adds a card impression
    AnalyticsService.trackRecommendationImpression(
      [
        { courseId: 'c1', position: 0 },
        { courseId: 'c2', position: 1 },
        { courseId: 'c3', position: 2 },
      ],
      {
        recommendationId: recId || undefined,
        surface: 'home',
        source: 'home_bm25_behavioral_v1',
        timestamp: 1_700_000_002_000,
      }
    );

    // Unclicked courses never get conversion credit
    expect(AnalyticsService.trackRecommendationConversion('c1', 'enroll')).toBe(false);
    expect(AnalyticsService.trackRecommendationConversion('c2', 'purchase')).toBe(false);

    AnalyticsService.trackRecommendationClick('c2', {
      recommendationId: recId || undefined,
      source: 'home_bm25_behavioral_v1',
      surface: 'home',
      position: 1,
      clickTimestamp: 1_700_000_010_000,
    });

    // 1 click / 3 card impressions = 0.3333 (same unit for numerator & denominator)
    const summary = AnalyticsService.getRecommendationAttributionSummary();
    expect(summary.impressions).toBe(3);
    expect(summary.clicks).toBe(1);
    expect(summary.conversions).toBe(0);
    expect(summary.unattributedConversions).toBe(2);
    expect(summary.ctr).toBe(0.3333);

    // Business events must NOT pollute Sentry breadcrumbs
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();

    const storedImpEvents = AnalyticsService.getEvents({ name: 'recommendation_impression' });
    expect(storedImpEvents).toHaveLength(3);
    expect(storedImpEvents.map((e) => e.properties.courseId)).toEqual(['c1', 'c2', 'c3']);
    expect(storedImpEvents.map((e) => e.properties.position)).toEqual([0, 1, 2]);
  });

  it('tracks per-card FlatList viewability on HomeScreen CategoryRow rather than whole-shelf impressions', async () => {
    jest.useFakeTimers();
    const onNavigateToCourse = jest.fn();
    const { getByTestId, unmount } = await render(
      <CategoryRow
        title="Recommended For You"
        courses={SAMPLE_COURSES}
        isRecommendationRow={true}
        recommendationId="rec_home_view_1"
        recommendationSource="home_bm25_behavioral_v1"
        onNavigateToCourse={onNavigateToCourse}
        onNavigateTab={jest.fn()}
        colors={
          {
            text: '#102F53',
            textMuted: '#64748B',
            primary: '#102F53',
          } as any
        }
      />
    );

    try {
      // On initial mount before FlatList viewability fires, offscreen cards are NOT counted
      expect(AnalyticsService.getRecommendationMetrics().impressions).toBe(0);

      const flatList = getByTestId('home-recommendation-flatlist');

      // Viewport shows card 0 and card 1 only (card 2 is offscreen)
      await act(async () => {
        fireEvent(flatList, 'viewableItemsChanged', {
          viewableItems: [
            { item: SAMPLE_COURSES[0], index: 0, isViewable: true },
            { item: SAMPLE_COURSES[1], index: 1, isViewable: true },
          ],
          changed: [],
        });
      });
      expect(AnalyticsService.getRecommendationMetrics().impressions).toBe(2);

      // User scrolls horizontally to reveal card 2
      await act(async () => {
        fireEvent(flatList, 'viewableItemsChanged', {
          viewableItems: [
            { item: SAMPLE_COURSES[1], index: 1, isViewable: true },
            { item: SAMPLE_COURSES[2], index: 2, isViewable: true },
          ],
          changed: [],
        });
      });
      expect(AnalyticsService.getRecommendationMetrics().impressions).toBe(3);

      // Pressing card 1 records click at position 1 with the row's recommendationId & source
      await act(async () => {
        fireEvent.press(getByTestId('course-card-c2'));
      });
      expect(onNavigateToCourse).toHaveBeenCalledWith('c2');
      const pending = AnalyticsService.getPendingRecommendationClicks();
      expect(pending).toHaveLength(1);
      expect(pending[0]).toMatchObject({
        recommendationId: 'rec_home_view_1',
        courseId: 'c2',
        source: 'home_bm25_behavioral_v1',
        position: 1,
      });
    } finally {
      await unmount();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it('persists durable events, counters, CTR, and prevents repeated conversion counts across app restarts', async () => {
    AnalyticsService.setUser({ id: 'learner_42', username: 'learner42', role: 'subscriber' });
    const sessionId = AnalyticsService.setSessionId('sess_home_checkout_1');

    const recId = AnalyticsService.trackRecommendationImpression(['c1', 'c2'], {
      recommendationId: 'rec_home_bm25_001',
      surface: 'home',
      source: 'home_bm25_behavioral_v1',
      timestamp: 1_700_000_000_000,
    });

    const click = AnalyticsService.trackRecommendationClick('c2', {
      recommendationId: recId || undefined,
      source: 'home_bm25_behavioral_v1',
      surface: 'home',
      category: 'excel',
      clickTimestamp: 1_700_000_010_000,
    });
    expect(click?.position).toBe(1);

    await AnalyticsService.whenIdle();
    expect(await AsyncStorage.getItem(STORAGE_KEY_ANALYTICS_STATE)).toBeTruthy();
    expect(await AsyncStorage.getItem(STORAGE_KEY_ANALYTICS_EVENTS)).toBeTruthy();

    // Simulate app process restart before purchase completes
    AnalyticsService.resetInMemoryCacheForTest();
    expect(AnalyticsService.getRecommendationMetrics().impressions).toBe(0);
    await AnalyticsService.hydrate();

    // Metrics & clicks survive restart cleanly
    expect(AnalyticsService.getRecommendationMetrics()).toMatchObject({
      impressions: 2,
      clicks: 1,
      conversions: 0,
      ctr: 0.5,
      conversionRate: 0,
    });

    const credited = AnalyticsService.trackRecommendationConversion('c2', {
      conversionType: 'purchase',
      learnerId: 'learner_42',
      conversionTimestamp: 1_700_000_070_000,
    });
    expect(credited).toBe(true);

    // Same course MUST NOT generate repeated conversion counts (even on repeat sync/click or after restart)
    expect(
      AnalyticsService.trackRecommendationConversion('c2', {
        conversionType: 'purchase',
        learnerId: 'learner_42',
        conversionTimestamp: 1_700_000_080_000,
      })
    ).toBe(false);
    AnalyticsService.trackRecommendationClick('c2', {
      recommendationId: 'rec_home_bm25_002',
      source: 'home_bm25_behavioral_v1',
      position: 0,
      learnerId: 'learner_42',
      clickTimestamp: 1_700_000_090_000,
    });
    expect(
      AnalyticsService.trackRecommendationConversion('c2', {
        conversionType: 'enroll',
        learnerId: 'learner_42',
        conversionTimestamp: 1_700_000_100_000,
      })
    ).toBe(false);

    await AnalyticsService.whenIdle();

    // Simulate a second process restart and confirm all durable metrics + duplicate protection hold
    AnalyticsService.resetInMemoryCacheForTest();
    AnalyticsService.setUser({ id: 'learner_42', username: 'learner42', role: 'subscriber' });
    await AnalyticsService.hydrate();

    expect(
      AnalyticsService.trackRecommendationConversion('c2', {
        conversionType: 'enroll',
        learnerId: 'learner_42',
        conversionTimestamp: 1_700_000_110_000,
      })
    ).toBe(false);

    const attr = AnalyticsService.getLastRecommendationAttribution();
    expect(attr).toEqual({
      clickId: expect.any(String),
      recommendationId: 'rec_home_bm25_001',
      courseId: 'c2',
      source: 'home_bm25_behavioral_v1',
      position: 1,
      learnerId: 'learner_42',
      sessionId,
      clickTimestamp: 1_700_000_010_000,
      conversionTimestamp: 1_700_000_070_000,
      attributionWindowMs: DEFAULT_RECOMMENDATION_ATTRIBUTION_WINDOW_MS,
      conversionType: 'purchase',
      timeToConversionMs: 60_000,
      category: 'excel',
    });

    const summary = AnalyticsService.getRecommendationAttributionSummary();
    expect(summary.impressions).toBe(2);
    expect(summary.clicks).toBe(2);
    expect(summary.conversions).toBe(1);
    expect(summary.duplicateConversions).toBe(3);
    expect(summary.unattributedConversions).toBe(0);
    expect(summary.bySource.home_bm25_behavioral_v1.conversions).toBe(1);
    expect(summary.byPosition['1'].conversions).toBe(1);
    expect(summary.totalEventsStored).toBeGreaterThanOrEqual(4);
    expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
  });

  it('enforces attribution window and scrubs sensitive params from analytics event logs', () => {
    AnalyticsService.setUser({ id: 'learner_7', username: 'learner7' });
    AnalyticsService.setRecommendationAttributionWindowMs(24 * 60 * 60 * 1000);

    AnalyticsService.trackRecommendationClick('c1', {
      recommendationId: 'rec_window_test',
      source: 'skill_assessment_gap_v1',
      position: 0,
      clickTimestamp: 1_700_000_000_000,
    });

    expect(
      AnalyticsService.trackRecommendationConversion('c1', {
        conversionType: 'enroll',
        conversionTimestamp: 1_699_999_999_000,
      })
    ).toBe(false);

    expect(
      AnalyticsService.trackRecommendationConversion('c1', {
        conversionType: 'enroll',
        conversionTimestamp: 1_700_000_000_000 + 24 * 60 * 60 * 1000 + 1,
      })
    ).toBe(false);
    expect(AnalyticsService.getRecommendationAttributions()).toHaveLength(0);

    const evt = AnalyticsService.trackEvent('custom_checkout_return', {
      redirectUrl: 'https://thrivingskill.com/checkout/order-received/99/?key=wc_order_secret123',
      token: 'secret_jwt_abc',
    });
    expect(evt.properties.redirectUrl).not.toContain('wc_order_secret123');
    expect(evt.properties.token).toBe('[REDACTED]');
  });

  it('isolates learners, supports in-session guest login handoff, and compares sources on last-click attribution', async () => {
    AnalyticsService.setUser({ id: 'learner_a', username: 'userA' });
    AnalyticsService.trackRecommendationImpression(['c1', 'c2'], {
      recommendationId: 'rec_algo_v1',
      source: 'algo_bm25_v1',
      surface: 'home',
      timestamp: 1_700_000_000_000,
    });
    AnalyticsService.trackRecommendationClick('c1', {
      recommendationId: 'rec_algo_v1',
      source: 'algo_bm25_v1',
      position: 0,
      clickTimestamp: 1_700_000_010_000,
    });

    // Learner B must NOT inherit Learner A's click
    AnalyticsService.setUser({ id: 'learner_b', username: 'userB' });
    expect(
      AnalyticsService.trackRecommendationConversion('c1', {
        conversionType: 'purchase',
        conversionTimestamp: 1_700_000_020_000,
      })
    ).toBe(false);

    // Learner A returns, clicks second source, and converts -> last-click source wins
    AnalyticsService.setUser({ id: 'learner_a', username: 'userA' });
    AnalyticsService.trackRecommendationImpression(['c2', 'c1'], {
      recommendationId: 'rec_algo_v2',
      source: 'algo_hybrid_v2',
      surface: 'home',
      timestamp: 1_700_000_030_000,
    });
    AnalyticsService.trackRecommendationClick('c1', {
      recommendationId: 'rec_algo_v2',
      source: 'algo_hybrid_v2',
      position: 1,
      clickTimestamp: 1_700_000_050_000,
    });

    expect(
      AnalyticsService.trackRecommendationConversion('c1', {
        conversionType: 'purchase',
        conversionTimestamp: 1_700_000_090_000,
      })
    ).toBe(true);

    const summary = AnalyticsService.getRecommendationAttributionSummary();
    expect(summary.bySource.algo_bm25_v1).toEqual({
      impressions: 2,
      clicks: 1,
      conversions: 0,
      ctr: 0.5,
      conversionRate: 0,
    });
    expect(summary.bySource.algo_hybrid_v2).toEqual({
      impressions: 2,
      clicks: 1,
      conversions: 1,
      ctr: 0.5,
      conversionRate: 1,
    });

    // Anonymous guest clicks c2 and logs in within the same session -> attribution holds once
    AnalyticsService.resetAnalytics();
    await AnalyticsService.whenIdle();
    AnalyticsService.setUser(null);
    const guestSession = AnalyticsService.getSessionId();
    AnalyticsService.trackRecommendationClick('c2', {
      recommendationId: 'rec_guest_1',
      source: 'home_bm25_behavioral_v1',
      position: 2,
      clickTimestamp: 1_700_000_300_000,
    });
    AnalyticsService.setUser({ id: 'learner_c', username: 'userC' });
    expect(AnalyticsService.getSessionId()).toBe(guestSession);
    expect(
      AnalyticsService.trackRecommendationConversion('c2', {
        conversionType: 'enroll',
        conversionTimestamp: 1_700_000_310_000,
      })
    ).toBe(true);
    // Repeat conversion for same c2 in same session is blocked
    expect(
      AnalyticsService.trackRecommendationConversion('c2', {
        conversionType: 'purchase',
        conversionTimestamp: 1_700_000_320_000,
      })
    ).toBe(false);
  });
});
